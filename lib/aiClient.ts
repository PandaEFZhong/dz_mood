import { Capacitor } from '@capacitor/core'
import { Vitals } from './moodStorage'

const IS_NATIVE = Capacitor.isNativePlatform()
const API_KEY = process.env.NEXT_PUBLIC_MOONSHOT_API_KEY || ''
const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions'

export interface AiAnalysisResult {
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

/**
 * 分析心情
 * - App 环境：直接调用 Kimi API（Capacitor 无 CORS 限制）
 * - Web 环境：走 Next.js API 路由代理
 */
export async function analyzeMood(content: string, vitals?: Vitals): Promise<AiAnalysisResult> {
  if (IS_NATIVE && API_KEY) {
    return callKimiDirectly(content, vitals)
  }
  return callServerProxy(content, vitals)
}

async function callServerProxy(content: string, vitals?: Vitals): Promise<AiAnalysisResult> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, vitals }),
  })

  let data: Record<string, unknown>
  try {
    data = await response.json()
  } catch {
    throw new Error('服务器返回异常')
  }

  if (!response.ok) {
    throw new Error((data.error as string) || '分析失败')
  }

  return normalizeResult(data)
}

async function callKimiDirectly(content: string, vitals?: Vitals): Promise<AiAnalysisResult> {
  if (!API_KEY) {
    throw new Error('API Key 未配置，请在 .env.local 中设置 NEXT_PUBLIC_MOONSHOT_API_KEY')
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

  const systemPrompt = buildSystemPrompt()
  const userPrompt = vitalsDesc
    ? `${vitalsDesc}\n\n用户的心情记录：${content}`
    : content

  const response = await fetch(KIMI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'moonshot-v1-8k',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Kimi API 错误:', errorText)
    throw new Error('情绪分析失败，请稍后重试')
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>
  }
  const aiContent = data.choices[0]?.message?.content || ''

  return parseAiResponse(aiContent)
}

function parseAiResponse(aiContent: string): AiAnalysisResult {
  const fallback: AiAnalysisResult = {
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
    const codeBlockMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    const jsonStr = codeBlockMatch ? codeBlockMatch[1] : aiContent.match(/\{[\s\S]*\}/)?.[0]

    if (!jsonStr) return fallback

    const parsed = JSON.parse(jsonStr)
    return {
      score: clamp(Math.round(parsed.score * 10) / 10, 1, 10),
      valence: clamp(parsed.valence, -1, 1),
      arousal: clamp(Math.round(parsed.arousal), 1, 10),
      dominant_need: parsed.dominant_need || '愉悦感',
      cognitive_pattern: parsed.cognitive_pattern || '中性描述',
      social_connection: parsed.social_connection || '独处',
      insight: parsed.insight || '情绪分析完成',
      suggestion: parsed.suggestion || '记得好好照顾自己，保持积极心态~',
      bodyLoadIndex: clamp(Math.round(parsed.bodyLoadIndex || 5), 1, 10),
      bodyAdvice: parsed.bodyAdvice || '注意劳逸结合，保持健康的生活方式。',
    }
  } catch (e) {
    console.error('解析 AI 响应失败:', e)
    return fallback
  }
}

function normalizeResult(data: Record<string, unknown>): AiAnalysisResult {
  return {
    score: clamp(Number(data.score) || 5, 1, 10),
    valence: clamp(Number(data.valence) || 0, -1, 1),
    arousal: clamp(Number(data.arousal) || 5, 1, 10),
    dominant_need: String(data.dominant_need || '愉悦感'),
    cognitive_pattern: String(data.cognitive_pattern || '中性描述'),
    social_connection: String(data.social_connection || '独处'),
    insight: String(data.comment || data.insight || '情绪分析完成'),
    suggestion: String(data.suggestion || '记得好好照顾自己，保持积极心态~'),
    bodyLoadIndex: clamp(Number(data.bodyLoadIndex || 5), 1, 10),
    bodyAdvice: String(data.bodyAdvice || '注意劳逸结合，保持健康的生活方式。'),
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function buildSystemPrompt(): string {
  return `你是一位擅长身心整合分析的健康专家。请分析用户的情绪状态和身体指标，评估其当下的身心负荷。

【分析维度】
1. 情绪基调（valence）：-1到+1，负面到正面
2. 激活度（arousal）：1-10，平静到亢奋
3. 主导需求：安全感/归属感/成就感/自主性/愉悦感
4. 认知模式：积极归因/消极归因/中性描述/混合
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
  "insight": "用户在社交场景中获得认可，满足感较强",
  "suggestion": "既然在人群中感到开心，不妨多安排一些社交活动，但也要注意给自己留些独处时间充电哦~",
  "bodyLoadIndex": 4,
  "bodyAdvice": "你的心率和疲劳指标都在正常范围，继续保持良好的作息习惯。"
}

【suggestion 生成规则 - 必须基于循证医学】
你的建议必须基于以下权威来源的循证实践，不能空泛：

1. AHA（美国心脏协会）建议：
   - 规律运动：每周至少150分钟中等强度运动或75分钟高强度运动
   - 充足睡眠：成人每晚7-9小时
   - 维持社交连接：与信任的人倾诉
   - 放松技巧：深呼吸、冥想、正念、听音乐
   - 积极自我对话：将消极想法转为积极想法

2. Mayo Clinic 建议：
   - 识别压力源并寻找减少方法
   - 提前规划可能带来压力的事情
   - 学会说"不"，不要承诺过多
   - 合理安排时间，避免匆忙
   - 保持条理，用待办清单分解大任务

3. WHO 建议：
   - 灵活的工作/休息安排
   - 压力管理技能培训
   - 基于休闲的体育活动机会

建议要求：
- 具体 actionable，不要空泛的"保持乐观"
- 结合用户的具体情况（如提到工作压力大，就给具体的边界设定建议）
- 1-2句话，简洁有力

【bodyAdvice 生成规则 - 必须基于循证医学】
身体建议必须基于以下权威指南：

1. AHA 心血管健康指南：
   - 静息心率持续>100：建议减少咖啡因和酒精摄入，避免剧烈运动，咨询医生
   - 睡眠<5小时：建立固定作息时间，睡前1小时避免屏幕，卧室保持凉爽黑暗
   - 疲劳持续>8分：当天减少体力消耗，优先保证睡眠恢复，避免驾驶等需要高度集中注意力的活动

2. Mayo Clinic 心率管理：
   - 心率影响因素包括：情绪、运动水平、睡眠、咖啡因、酒精、体温、药物
   - 建议：深呼吸放松、轻度散步、充足水分、避免刺激性饮料

3. 睡眠卫生（Sleep Hygiene）最佳实践：
   - 固定就寝和起床时间（包括周末）
   - 睡前避免大餐、咖啡因和酒精
   - 建立睡前放松程序（阅读、温水浴、轻柔音乐）
   - 如果20分钟内无法入睡，起床做些放松的事，有睡意再回床

4. 心率恢复方法（Heart Rate Recovery）：
   - 深呼吸：吸气4秒-屏息4秒-呼气6秒，重复5-10次
   - 冷水洗脸或手腕冲冷水，激活潜水反射降低心率
   - 轻度伸展或散步10-15分钟
   - 避免在心率过快时摄入咖啡因或进行剧烈运动

bodyAdvice 要求：
- 必须具体，给出可立即执行的动作
- 不超过2句话
- 引用具体数字（如"今晚10点前入睡"、"散步15分钟"）
- 如果心率>100，必须建议"减少咖啡因摄入，避免剧烈运动，如持续不适请咨询医生"
- 如果疲劳>8，必须建议"今天减少体力消耗，优先保证睡眠"
- 如果睡眠<4，必须建议"建立固定作息，睡前1小时避免屏幕"

只返回 JSON，不要其他内容。请确保所有字段都包含在输出中。`
}
