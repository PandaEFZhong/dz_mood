import { MoodEntry } from './moodStorage'

export type AlertLevel = 'none' | 'attention' | 'warning' | 'danger'

export interface AlertResult {
  level: AlertLevel
  message: string
  triggeredBy: string[]
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

/**
 * 计算预警级别
 * 基于循证医学研究的保守阈值设计
 * 宁可误报，不可漏报
 */
export function calculateAlert(entry: MoodEntry, recentMoods: MoodEntry[]): AlertResult {
  const vitals = entry.vitals
  if (!vitals) {
    return { level: 'none', message: '', triggeredBy: [] }
  }

  const triggers: string[] = []
  const { restingHeartRate, sleepQuality, fatigueLevel } = vitals

  // 获取最近7天的记录（按日期分组，每天取最新一条）
  const dailyMap = new Map<string, MoodEntry>()
  recentMoods.forEach((m) => {
    const date = isoToCNDateString(m.createdAt)
    const existing = dailyMap.get(date)
    if (!existing || new Date(m.createdAt) > new Date(existing.createdAt)) {
      dailyMap.set(date, m)
    }
  })
  const dailyEntries = Array.from(dailyMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  // 辅助：获取最近 N 天有身体指标的记录（保留 MoodEntry 类型）
  const getRecentWithVitals = (days: number) => {
    return dailyEntries
      .slice(0, days)
      .filter((m): m is MoodEntry & { vitals: NonNullable<MoodEntry['vitals']> } => !!m.vitals)
  }

  const recent2 = getRecentWithVitals(2)
  const recent3 = getRecentWithVitals(3)

  // ═══════════════════════════════════════
  // 🔴 危险级 (Danger)
  // ═══════════════════════════════════════

  // 1. 静息心率 > 100 bpm（心动过速）
  if (restingHeartRate && restingHeartRate > 100) {
    triggers.push('静息心率超过100次/分')
  }

  // 2. 静息心率 > 90 + 疲劳感 ≥ 9 + 睡眠 ≤ 3 连续 2 天
  if (recent2.length >= 2) {
    const dangerCombo = recent2.every(
      (m) =>
        m.vitals.restingHeartRate && m.vitals.restingHeartRate > 90 &&
        m.vitals.fatigueLevel && m.vitals.fatigueLevel >= 9 &&
        m.vitals.sleepQuality && m.vitals.sleepQuality <= 3
    )
    if (dangerCombo) {
      triggers.push('连续2天高心率+极度疲劳+极差睡眠')
    }
  }

  if (triggers.length > 0) {
    return {
      level: 'danger',
      message: '⚠️ 你的身体正在发出强烈警报。建议暂停高强度工作，尽快就医检查。',
      triggeredBy: triggers,
    }
  }

  // ═══════════════════════════════════════
  // 🟡 警告级 (Warning)
  // ═══════════════════════════════════════

  // 1. 静息心率 > 85 bpm 连续 3 天
  if (recent3.length >= 3) {
    const highHR3Days = recent3.every(
      (m) => m.vitals.restingHeartRate && m.vitals.restingHeartRate > 85
    )
    if (highHR3Days) {
      triggers.push('连续3天静息心率超过85次/分')
    }
  }

  // 2. 静息心率 > 75 + 疲劳感 ≥ 8 + 睡眠 ≤ 4 连续 2 天
  if (recent2.length >= 2) {
    const warningCombo = recent2.every(
      (m) =>
        m.vitals.restingHeartRate && m.vitals.restingHeartRate > 75 &&
        m.vitals.fatigueLevel && m.vitals.fatigueLevel >= 8 &&
        m.vitals.sleepQuality && m.vitals.sleepQuality <= 4
    )
    if (warningCombo) {
      triggers.push('连续2天高心率+高疲劳+睡眠不足')
    }
  }

  // 3. 情绪评分 < 4 + 疲劳感 ≥ 8 连续 3 天
  if (recent3.length >= 3) {
    const moodFatigueCombo = recent3.every(
      (m) => m.score < 4 && m.vitals.fatigueLevel && m.vitals.fatigueLevel >= 8
    )
    if (moodFatigueCombo) {
      triggers.push('连续3天情绪低落+高度疲劳')
    }
  }

  if (triggers.length > 0) {
    return {
      level: 'warning',
      message: '你的身体负荷较重，建议安排体检，减少工作强度，增加休息时间。',
      triggeredBy: triggers,
    }
  }

  // ═══════════════════════════════════════
  // 🟢 关注级 (Attention)
  // ═══════════════════════════════════════

  // 1. 静息心率 > 75 bpm 连续 2 天
  if (recent2.length >= 2) {
    const highHR2Days = recent2.every(
      (m) => m.vitals.restingHeartRate && m.vitals.restingHeartRate > 75
    )
    if (highHR2Days) {
      triggers.push('连续2天静息心率超过75次/分')
    }
  }

  // 2. 疲劳感 ≥ 8 连续 2 天
  if (recent2.length >= 2) {
    const highFatigue2Days = recent2.every(
      (m) => m.vitals.fatigueLevel && m.vitals.fatigueLevel >= 8
    )
    if (highFatigue2Days) {
      triggers.push('连续2天高度疲劳')
    }
  }

  // 3. 睡眠质量 ≤ 3 连续 3 天
  if (recent3.length >= 3) {
    const poorSleep3Days = recent3.every(
      (m) => m.vitals.sleepQuality && m.vitals.sleepQuality <= 3
    )
    if (poorSleep3Days) {
      triggers.push('连续3天睡眠质量极差')
    }
  }

  if (triggers.length > 0) {
    return {
      level: 'attention',
      message: '注意身体信号，建议适当休息、减少工作强度。',
      triggeredBy: triggers,
    }
  }

  return { level: 'none', message: '', triggeredBy: [] }
}
