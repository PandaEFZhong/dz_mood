/**
 * 统一数据存储接口（Capacitor Preferences 实现）
 * 适用于：Capacitor App、Web 前端
 * 不包含任何 Node.js 内置模块（fs/path 等）
 */
import { Preferences } from '@capacitor/preferences'

export interface Vitals {
  restingHeartRate?: number
  sleepQuality?: number
  fatigueLevel?: number
}

export interface MoodEntry {
  id: string
  content: string
  score: number
  comment: string
  createdAt: string
  valence?: number
  arousal?: number
  dominant_need?: string
  cognitive_pattern?: string
  social_connection?: string
  suggestion?: string
  vitals?: Vitals
  alertLevel?: 'none' | 'attention' | 'warning' | 'danger'
  alertMessage?: string
  bodyLoadIndex?: number
  bodyAdvice?: string
}

const STORAGE_KEY = 'moods'

export async function getAllMoods(): Promise<MoodEntry[]> {
  try {
    const { value } = await Preferences.get({ key: STORAGE_KEY })
    if (!value) return []
    const moods = JSON.parse(value) as MoodEntry[]
    return moods.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  } catch (error) {
    console.error('读取心情记录失败:', error)
    return []
  }
}

export async function saveMood(
  entry: Omit<MoodEntry, 'id' | 'createdAt'>
): Promise<MoodEntry> {
  try {
    const moods = await getAllMoods()
    const newEntry: MoodEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    }
    moods.unshift(newEntry)
    await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(moods) })
    return newEntry
  } catch (error) {
    console.error('保存心情记录失败:', error)
    throw new Error('保存心情记录失败')
  }
}

export async function deleteMood(id: string): Promise<boolean> {
  try {
    const moods = await getAllMoods()
    const filtered = moods.filter((m) => m.id !== id)
    if (filtered.length === moods.length) return false
    await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(filtered) })
    return true
  } catch (error) {
    console.error('删除心情记录失败:', error)
    throw new Error('删除心情记录失败')
  }
}
