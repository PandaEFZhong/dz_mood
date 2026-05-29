import { NextResponse } from 'next/server'
import { getAllMoods, MoodEntry } from '@/lib/storage.server'
import { generalLimiter } from '@/lib/rateLimiter'

export const dynamic = 'force-dynamic'

interface StatsResult {
  total: number
  weekly: {
    dates: string[]
    scores: number[]
  }
  weeklyBodyLoad: {
    values: number[]
    hasData: boolean
  }
  monthly: {
    avgScore: number
    maxScore: number
    minScore: number
    recordDays: number
    totalDays: number
  }
  distribution: {
    positive: number
    neutral: number
    negative: number
  }
  vitalsSummary: {
    avgHeartRate: number
    avgSleep: number
    avgFatigue: number
    avgBodyLoad: number
    hasData: boolean
  }
  recentMoods: MoodEntry[]
}

const TIMEZONE = 'Asia/Shanghai'

function getCNDateString(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\//g, '-')
}

function isoToCNDateString(isoString: string): string {
  return getCNDateString(new Date(isoString))
}

function getNowInCN(): Date {
  const now = new Date()
  const cnString = now.toLocaleString('zh-CN', { timeZone: TIMEZONE })
  return new Date(cnString.replace(/\//g, '-').replace(',', ''))
}

export async function GET(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anonymous'
    try {
      await generalLimiter.consume(ip, 1)
    } catch {
      return NextResponse.json(
        { error: '请求过于频繁，请稍后再试' },
        { status: 429 }
      )
    }

    const moods = await getAllMoods()

    if (moods.length === 0) {
      return NextResponse.json({
        total: 0,
        weekly: { dates: [], scores: [] },
        weeklyBodyLoad: { values: [], hasData: false },
        monthly: { avgScore: 0, maxScore: 0, minScore: 0, recordDays: 0, totalDays: 30 },
        distribution: { positive: 0, neutral: 0, negative: 0 },
        vitalsSummary: { avgHeartRate: 0, avgSleep: 0, avgFatigue: 0, avgBodyLoad: 0, hasData: false },
        recentMoods: [],
      })
    }

    // 按东八区日期分组
    const dailyMap = new Map<string, { scores: number[]; bodyLoads: number[]; heartRates: number[]; sleeps: number[]; fatigues: number[] }>()

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

    // 计算近7天数据
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
      weeklyScores.push(dayData
        ? Math.round(dayData.scores.reduce((a, b) => a + b, 0) / dayData.scores.length * 10) / 10
        : 0
      )
      weeklyBodyLoads.push(dayData && dayData.bodyLoads.length > 0
        ? Math.round(dayData.bodyLoads.reduce((a, b) => a + b, 0) / dayData.bodyLoads.length * 10) / 10
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
      avgScore: monthlyScores.length > 0
        ? Math.round(monthlyScores.reduce((a, b) => a + b, 0) / monthlyScores.length * 10) / 10
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

    // 身体指标汇总（近30天有身体指标的记录）
    const vitalsMoods = monthlyMoods.filter((m) => m.vitals)
    const bodyLoadMoods = monthlyMoods.filter((m) => m.bodyLoadIndex !== undefined && m.bodyLoadIndex > 0)

    const vitalsSummary = {
      avgHeartRate: vitalsMoods.length > 0 && vitalsMoods.some((m) => m.vitals?.restingHeartRate)
        ? Math.round(vitalsMoods.filter((m) => m.vitals?.restingHeartRate).reduce((a, m) => a + (m.vitals?.restingHeartRate || 0), 0) / vitalsMoods.filter((m) => m.vitals?.restingHeartRate).length)
        : 0,
      avgSleep: vitalsMoods.length > 0 && vitalsMoods.some((m) => m.vitals?.sleepQuality)
        ? Math.round(vitalsMoods.filter((m) => m.vitals?.sleepQuality).reduce((a, m) => a + (m.vitals?.sleepQuality || 0), 0) / vitalsMoods.filter((m) => m.vitals?.sleepQuality).length * 10) / 10
        : 0,
      avgFatigue: vitalsMoods.length > 0 && vitalsMoods.some((m) => m.vitals?.fatigueLevel)
        ? Math.round(vitalsMoods.filter((m) => m.vitals?.fatigueLevel).reduce((a, m) => a + (m.vitals?.fatigueLevel || 0), 0) / vitalsMoods.filter((m) => m.vitals?.fatigueLevel).length * 10) / 10
        : 0,
      avgBodyLoad: bodyLoadMoods.length > 0
        ? Math.round(bodyLoadMoods.reduce((a, m) => a + (m.bodyLoadIndex || 0), 0) / bodyLoadMoods.length * 10) / 10
        : 0,
      hasData: vitalsMoods.length > 0 || bodyLoadMoods.length > 0,
    }

    const result: StatsResult = {
      total: moods.length,
      weekly: { dates: weeklyDates, scores: weeklyScores },
      weeklyBodyLoad: { values: weeklyBodyLoads, hasData: hasBodyLoadData },
      monthly: monthlyStat,
      distribution,
      vitalsSummary,
      recentMoods: moods.slice(0, 5),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('获取统计数据失败:', error)
    return NextResponse.json(
      { error: '获取统计数据失败' },
      { status: 500 }
    )
  }
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
