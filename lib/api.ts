import { Capacitor } from '@capacitor/core'
import { getAllMoods, saveMood, deleteMood, MoodEntry, Vitals } from './moodStorage'
import { analyzeMood } from './aiClient'

const IS_NATIVE = Capacitor.isNativePlatform()

/* ─── 获取所有心情记录 ─── */
export async function fetchMoods(): Promise<MoodEntry[]> {
  if (IS_NATIVE) {
    return getAllMoods()
  }
  const res = await fetch('/api/moods')
  if (!res.ok) throw new Error('获取历史记录失败')
  return res.json()
}

/* ─── 提交心情分析 ─── */
export async function submitMood(content: string, vitals?: Vitals): Promise<MoodEntry> {
  if (IS_NATIVE) {
    const result = await analyzeMood(content, vitals)
    const saved = await saveMood({
      content,
      score: result.score,
      comment: result.insight,
      valence: result.valence,
      arousal: result.arousal,
      dominant_need: result.dominant_need,
      cognitive_pattern: result.cognitive_pattern,
      social_connection: result.social_connection,
      suggestion: result.suggestion,
      vitals,
      bodyLoadIndex: result.bodyLoadIndex,
      bodyAdvice: result.bodyAdvice,
    })

    // 计算预警
    const all = await getAllMoods()
    const { calculateAlert } = await import('./healthAlert')
    const alert = calculateAlert(saved, all)
    return { ...saved, alertLevel: alert.level, alertMessage: alert.message }
  }

  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, vitals }),
  })

  let data: Record<string, unknown>
  try {
    data = await res.json()
  } catch {
    throw new Error('服务器返回异常')
  }

  if (!res.ok) {
    throw new Error((data.error as string) || '分析失败')
  }

  return data as unknown as MoodEntry
}

/* ─── 删除心情记录 ─── */
export async function removeMood(id: string): Promise<void> {
  if (IS_NATIVE) {
    const ok = await deleteMood(id)
    if (!ok) throw new Error('记录不存在')
    return
  }

  const res = await fetch(`/api/moods/${id}`, { method: 'DELETE' })
  let data: { error?: string }
  try {
    data = await res.json()
  } catch {
    throw new Error('服务器返回异常')
  }
  if (!res.ok) {
    throw new Error(data.error || '删除失败')
  }
}

/* ─── 获取统计数据 ─── */
export async function fetchStats(): Promise<unknown> {
  if (IS_NATIVE) {
    const moods = await getAllMoods()
    return computeStats(moods)
  }
  const res = await fetch('/api/stats')
  if (!res.ok) throw new Error('获取统计数据失败')
  return res.json()
}

/* ═══════════════════════════════════════════
   本地统计计算（App 环境使用）
   ═══════════════════════════════════════════ */

const TIMEZONE = 'Asia/Shanghai'

function getCNDateString(date: Date): string {
  return date
    .toLocaleDateString('zh-CN', {
      timeZone: TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    .replace(/\//g, '-')
}

function isoToCNDateString(isoString: string): string {
  return getCNDateString(new Date(isoString))
}

function getNowInCN(): Date {
  const now = new Date()
  const cnString = now.toLocaleString('zh-CN', { timeZone: TIMEZONE })
  return new Date(cnString.replace(/\//g, '-').replace(',', ''))
}

function formatDateLabel(dateStr: string): string {
  const today = getNowInCN()
  const todayStr = getCNDateString(today)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = getCNDateString(yesterday)

  if (dateStr === todayStr) return '今天'
  if (dateStr === yesterdayStr) return '昨天'

  const parts = dateStr.split('-')
  return `${Number(parts[1])}/${Number(parts[2])}`
}

function computeStats(moods: MoodEntry[]) {
  if (moods.length === 0) {
    return {
      total: 0,
      weekly: { dates: [], scores: [] },
      weeklyBodyLoad: { values: [], hasData: false },
      monthly: { avgScore: 0, maxScore: 0, minScore: 0, recordDays: 0, totalDays: 30 },
      distribution: { positive: 0, neutral: 0, negative: 0 },
      vitalsSummary: { avgHeartRate: 0, avgSleep: 0, avgFatigue: 0, avgBodyLoad: 0, hasData: false },
      recentMoods: [],
    }
  }

  // 按东八区日期分组
  const dailyMap = new Map<
    string,
    { scores: number[]; bodyLoads: number[]; heartRates: number[]; sleeps: number[]; fatigues: number[] }
  >()

  moods.forEach((mood) => {
    const date = isoToCNDateString(mood.createdAt)
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { scores: [], bodyLoads: [], heartRates: [], sleeps: [], fatigues: [] })
    }
    const day = dailyMap.get(date)!
    day.scores.push(mood.score)
    if (mood.bodyLoadIndex !== undefined && mood.bodyLoadIndex > 0) {
      day.bodyLoads.push(mood.bodyLoadIndex)
    }
    if (mood.vitals) {
      if (mood.vitals.restingHeartRate) day.heartRates.push(mood.vitals.restingHeartRate)
      if (mood.vitals.sleepQuality) day.sleeps.push(mood.vitals.sleepQuality)
      if (mood.vitals.fatigueLevel) day.fatigues.push(mood.vitals.fatigueLevel)
    }
  })

  // 近7天数据
  const today = getNowInCN()
  const weeklyDates: string[] = []
  const weeklyScores: number[] = []
  const weeklyBodyLoads: number[] = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = getCNDateString(date)
    const dayData = dailyMap.get(dateStr)

    weeklyDates.push(formatDateLabel(dateStr))
    weeklyScores.push(
      dayData ? Math.round((dayData.scores.reduce((a, b) => a + b, 0) / dayData.scores.length) * 10) / 10 : 0
    )
    weeklyBodyLoads.push(
      dayData && dayData.bodyLoads.length > 0
        ? Math.round((dayData.bodyLoads.reduce((a, b) => a + b, 0) / dayData.bodyLoads.length) * 10) / 10
        : 0
    )
  }

  const hasBodyLoadData = weeklyBodyLoads.some((v) => v > 0)

  // 近30天统计
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = getCNDateString(thirtyDaysAgo)

  const monthlyMoods = moods.filter((m) => isoToCNDateString(m.createdAt) >= thirtyDaysAgoStr)
  const monthlyScores = monthlyMoods.map((m) => m.score)

  const monthlyStat = {
    avgScore:
      monthlyScores.length > 0
        ? Math.round((monthlyScores.reduce((a, b) => a + b, 0) / monthlyScores.length) * 10) / 10
        : 0,
    maxScore: monthlyScores.length > 0 ? Math.max(...monthlyScores) : 0,
    minScore: monthlyScores.length > 0 ? Math.min(...monthlyScores) : 0,
    recordDays: new Set(monthlyMoods.map((m) => isoToCNDateString(m.createdAt))).size,
    totalDays: 30,
  }

  // 情绪分布
  const distribution = {
    positive: moods.filter((m) => m.score >= 7).length,
    neutral: moods.filter((m) => m.score >= 4 && m.score < 7).length,
    negative: moods.filter((m) => m.score < 4).length,
  }

  // 身体指标汇总
  const vitalsMoods = monthlyMoods.filter((m) => m.vitals)
  const bodyLoadMoods = monthlyMoods.filter((m) => m.bodyLoadIndex !== undefined && m.bodyLoadIndex > 0)

  const hrEntries = vitalsMoods.filter((m) => m.vitals?.restingHeartRate)
  const sleepEntries = vitalsMoods.filter((m) => m.vitals?.sleepQuality)
  const fatigueEntries = vitalsMoods.filter((m) => m.vitals?.fatigueLevel)

  const vitalsSummary = {
    avgHeartRate:
      hrEntries.length > 0
        ? Math.round(hrEntries.reduce((a, m) => a + (m.vitals?.restingHeartRate || 0), 0) / hrEntries.length)
        : 0,
    avgSleep:
      sleepEntries.length > 0
        ? Math.round(sleepEntries.reduce((a, m) => a + (m.vitals?.sleepQuality || 0), 0) / sleepEntries.length * 10) / 10
        : 0,
    avgFatigue:
      fatigueEntries.length > 0
        ? Math.round(fatigueEntries.reduce((a, m) => a + (m.vitals?.fatigueLevel || 0), 0) / fatigueEntries.length * 10) / 10
        : 0,
    avgBodyLoad:
      bodyLoadMoods.length > 0
        ? Math.round(bodyLoadMoods.reduce((a, m) => a + (m.bodyLoadIndex || 0), 0) / bodyLoadMoods.length * 10) / 10
        : 0,
    hasData: vitalsMoods.length > 0 || bodyLoadMoods.length > 0,
  }

  return {
    total: moods.length,
    weekly: { dates: weeklyDates, scores: weeklyScores },
    weeklyBodyLoad: { values: weeklyBodyLoads, hasData: hasBodyLoadData },
    monthly: monthlyStat,
    distribution,
    vitalsSummary,
    recentMoods: moods.slice(0, 5),
  }
}
