import { NextRequest, NextResponse } from 'next/server'
import { saveMood, Vitals } from '@/lib/storage.server'
import { calculateAlert } from '@/lib/healthAlert'
import { analyzeLimiter } from '@/lib/rateLimiter'

const KIMI_API_KEY = process.env.MOONSHOT_API_KEY
const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions'

export const dynamic = 'force-dynamic'

interface AnalyzeRequest {
  content: string
  vitals?: Vitals
}

interface KimiResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

interface AnalysisResult {
  score: number
  valence: number
  arousal: number
  dominant_need: string
  cognitive_pattern: string
  social_connection: string
  insight: string
  suggestion: string
  bodyLoadIndex: number
  bodyAdvice: string
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'anonymous'
    try {
      await analyzeLimiter.consume(ip, 1)
    } catch {
      return NextResponse.json(
        { error: '请求过于频繁，请稍后再试' },
        { status: 429 }
      )
    }

    const body = await request.json() as AnalyzeRequest
    const content = body.content?.trim()
    const vitals = body.vitals

    if (!content || content.length === 0) {
      return NextResponse.json({ error: '请输入心情内容' }, { status: 400 })
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: '内容过长，请控制在 2000 字以内' },
        { status: 400 }
      )
    }

    if (!KIMI_API_KEY) {
      return NextResponse.json({ error: 'API Key 未配置' }, { status: 500 })
    }

    // 构建 vitals 描述
    let vitalsDesc = ''
    if (vitals?.restingHeartRate) {
      vitalsDesc += `静息心率：${vitals.restingHeartRate} bpm（正常范围 60-100）。`
    }
    if (vitals?.sleepQuality) {
      vitalsDesc += `昨晚睡眠质量（1-10）：${vitals.sleepQuality}。`
    }
    if (vitals?.fatigueLevel) {
      vitalsDesc += `当前疲劳感（1-10）：${vitals.fatigueLevel}。`
    }

    const systemPrompt = `你叫「小乐」，是乐心 App 里的 AI 心情伙伴。你不是冷冰冰的专家，而是一个理解用户、陪伴用户的朋友。

每次分析时，请做到：

1. insight（洞察）：用第二人称直接对用户说话，像朋友聊天一样，先看到TA的情绪，再点出背后的原因。
   ✅ 好例子："刚和朋友们聚会完吧？被认可的感觉真好，这种满足感是你应得的 💙"
   ❌ 坏例子："用户在社交场景中获得认可，满足感较强"

2. suggestion（建议）：先给一句情感支持，再给一个小而具体的行动建议。
   ✅ 好例子："抱抱你，这周真的辛苦了 💙 今晚给自己泡杯热茶，把手机静音放一边，什么都不做就发呆10分钟"
   ❌ 坏例子："考虑制定清晰的测试计划，以减少不确定性带来的焦虑"

3. bodyAdvice（身体建议）：同样先温暖提醒，再给具体可执行的动作。
   ✅ 好例子："身体在说它需要休息啦 🌿 今晚11点前躺下，睡前1小时别刷手机，让大脑慢慢静下来"
   ❌ 坏例子："你的心率和疲劳指标都在正常范围，继续保持良好的作息习惯。"

语气风格：
- 温暖、简洁、像好朋友，不是专家写报告
- 适当用 emoji（💙🌿✨💪🫂），但不要堆砌
- 不说"你应该"，说"可以试试"
- 用户难过时先陪伴，用户开心时和TA一起高兴
- 不要空泛的"保持乐观"，要具体的"今晚11点前躺下"
- 不要医学术语堆砌，用日常大白话

【分析维度】
1. 情绪基调（valence）：-1到+1，负面到正面
2. 激活度（arousal）：1-10，平静到亢奋
3. 主导需求：安全感/归属感/成就感/自主性/愉悦感
4. 认知模式：积极归因/消极归因/中性描述/混合/僵化
5. 社会连接：独处/亲密/群体/疏离
6. 身体负荷指数（bodyLoadIndex）：1-10，综合心率、疲劳、睡眠评估身体负担

【评分规则】
- 整体心情指数 = (valence + 1) * 5 + 随机波动修正（±0.5）
- 若提到具体事件，权重+20%
- 若使用绝对化词汇（"总是""永远"），认知模式标记为"僵化"

【身体负荷评估规则】
- 静息心率 >100 → bodyLoadIndex ≥ 8
- 静息心率 85-100 + 疲劳≥8 → bodyLoadIndex ≥ 7
- 睡眠≤3 + 疲劳≥8 → bodyLoadIndex ≥ 6
- 心率正常+睡眠好+疲劳低 → bodyLoadIndex ≤ 3

【输出格式 - 必须严格按此 JSON 返回】
{
  "score": 7.5,
  "valence": 0.5,
  "arousal": 6,
  "dominant_need": "成就感",
  "cognitive_pattern": "积极归因",
  "social_connection": "群体",
  "insight": "刚和朋友们聚会完吧？被认可的感觉真好，这种满足感是你应得的 💙",
  "suggestion": "既然社交让你这么开心，下周可以给自己安排一次轻松的聚会，不过记得提前留点时间独处充电哦~",
  "bodyLoadIndex": 4,
  "bodyAdvice": "身体在说它状态不错呢 🌿 继续保持，今晚也可以早点睡，让身体持续充满活力"
}

【suggestion 生成规则】
建议必须具体、可操作，基于循证医学但不要写成医学报告：

1. AHA（美国心脏协会）建议参考：
   - 规律运动、充足睡眠、放松技巧、积极自我对话
2. Mayo Clinic 建议参考：
   - 识别压力源、学会说"不"、合理安排时间
3. WHO 建议参考：
   - 灵活的工作/休息安排、压力管理技能

语气要求：
- 先共情，再给建议（"抱抱你 💙" 或 "为你开心 ✨"）
- 1-2句话，像朋友发的微信
- 结合用户的具体情况

【bodyAdvice 生成规则】
身体建议基于权威指南，但用大白话表达：

1. AHA 心血管健康指南参考：
   - 心率>100：减少咖啡因，深呼吸放松
   - 睡眠<5小时：固定作息，睡前远离屏幕
   - 疲劳>8分：减少体力消耗，优先睡觉
2. Mayo Clinic 心率管理参考：
   - 深呼吸、轻度散步、充足水分
3. 睡眠卫生最佳实践参考：
   - 固定作息、睡前放松程序

语气要求：
- 不超过2句话
- 像朋友关心你身体："身体在喊累啦 🌿 今晚早点睡"
- 给出具体数字（如"今晚11点前躺下"、"散步15分钟"）
- 如果心率>100："心跳有点快，先深呼吸几次，今天别喝咖啡了"
- 如果疲劳>8："身体快没电了 💤 今晚什么都别安排，优先补觉"
- 如果睡眠<4："睡眠太少了，身体会抗议的 🌙 今晚试试11点前躺下，手机放远点"

只返回 JSON，不要其他内容。请确保所有字段都包含在输出中。`

    const userPrompt = vitalsDesc
      ? `${vitalsDesc}\n\n用户的心情记录：${content}`
      : content

    const response = await fetch(KIMI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIMI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.5,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Kimi API 错误:', errorData)
      return NextResponse.json(
        { error: '情绪分析失败，请稍后重试' },
        { status: 502 }
      )
    }

    const data = await response.json() as KimiResponse
    const aiContent = data.choices[0]?.message?.content || ''

    let analysisResult: AnalysisResult = {
      score: 5,
      valence: 0,
      arousal: 5,
      dominant_need: '愉悦感',
      cognitive_pattern: '中性描述',
      social_connection: '独处',
      insight: '情绪分析完成',
      suggestion: '记得好好照顾自己，保持积极心态~',
      bodyLoadIndex: 5,
      bodyAdvice: '注意劳逸结合，保持健康的生活方式。',
    }

    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        analysisResult = {
          score: Math.max(1, Math.min(10, Math.round(parsed.score * 10) / 10)),
          valence: Math.max(-1, Math.min(1, parsed.valence)),
          arousal: Math.max(1, Math.min(10, Math.round(parsed.arousal))),
          dominant_need: parsed.dominant_need || '愉悦感',
          cognitive_pattern: parsed.cognitive_pattern || '中性描述',
          social_connection: parsed.social_connection || '独处',
          insight: parsed.insight || '情绪分析完成',
          suggestion: parsed.suggestion || '记得好好照顾自己，保持积极心态~',
          bodyLoadIndex: Math.max(1, Math.min(10, Math.round(parsed.bodyLoadIndex || 5))),
          bodyAdvice: parsed.bodyAdvice || '注意劳逸结合，保持健康的生活方式。',
        }
      }
    } catch (e) {
      console.error('解析 AI 响应失败:', e)
    }

    // 获取历史记录用于预警计算
    const { getAllMoods } = await import('@/lib/storage.server')
    const allMoods = await getAllMoods()

    // 保存到本地
    const savedEntry = await saveMood({
      content,
      score: analysisResult.score,
      comment: analysisResult.insight,
      valence: analysisResult.valence,
      arousal: analysisResult.arousal,
      dominant_need: analysisResult.dominant_need,
      cognitive_pattern: analysisResult.cognitive_pattern,
      social_connection: analysisResult.social_connection,
      suggestion: analysisResult.suggestion,
      vitals: vitals || undefined,
      bodyLoadIndex: analysisResult.bodyLoadIndex,
      bodyAdvice: analysisResult.bodyAdvice,
    })

    // 计算预警
    const alert = calculateAlert(savedEntry, allMoods)

    // 更新预警状态
    const entryWithAlert = { ...savedEntry, alertLevel: alert.level, alertMessage: alert.message }

    return NextResponse.json(entryWithAlert)
  } catch (error) {
    console.error('API 错误:', error)
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}
