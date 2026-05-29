/**
 * 服务端数据存储（JSON 文件实现）
 * 仅用于 Next.js API 路由（Node.js 环境）
 */
import fs from 'fs'
import path from 'path'
import lockfile from 'proper-lockfile'

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

const LOCK_OPTIONS = {
  retries: {
    retries: 10,
    factor: 2,
    minTimeout: 100,
    maxTimeout: 1000,
  },
}

const DATA_FILE = path.join(process.cwd(), 'data', 'moods.json')

function ensureDataFile(dataFile: string) {
  const dataDir = path.dirname(dataFile)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify([]))
  }
}

function readMoodsFile(dataFile: string): MoodEntry[] {
  try {
    ensureDataFile(dataFile)
    const data = fs.readFileSync(dataFile, 'utf-8')
    const moods = JSON.parse(data) as MoodEntry[]
    return moods.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  } catch (error) {
    console.error('读取心情记录失败:', error)
    return []
  }
}

export async function getAllMoods(): Promise<MoodEntry[]> {
  let release: (() => Promise<void>) | undefined
  try {
    ensureDataFile(DATA_FILE)
    release = await lockfile.lock(DATA_FILE, LOCK_OPTIONS)
    return readMoodsFile(DATA_FILE)
  } catch (error) {
    console.error('读取心情记录失败:', error)
    return []
  } finally {
    if (release) {
      await release().catch((err) => console.error('释放读锁失败:', err))
    }
  }
}

export async function saveMood(
  entry: Omit<MoodEntry, 'id' | 'createdAt'>
): Promise<MoodEntry> {
  let release: (() => Promise<void>) | undefined
  try {
    ensureDataFile(DATA_FILE)
    release = await lockfile.lock(DATA_FILE, LOCK_OPTIONS)

    const moods = readMoodsFile(DATA_FILE)
    const newEntry: MoodEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    }
    moods.unshift(newEntry)
    fs.writeFileSync(DATA_FILE, JSON.stringify(moods, null, 2))
    return newEntry
  } catch (error) {
    console.error('保存心情记录失败:', error)
    throw new Error('保存心情记录失败')
  } finally {
    if (release) {
      await release().catch((err) => console.error('释放写锁失败:', err))
    }
  }
}

export async function deleteMood(id: string): Promise<boolean> {
  let release: (() => Promise<void>) | undefined
  try {
    ensureDataFile(DATA_FILE)
    release = await lockfile.lock(DATA_FILE, LOCK_OPTIONS)

    const moods = readMoodsFile(DATA_FILE)
    const filtered = moods.filter((m) => m.id !== id)
    if (filtered.length === moods.length) return false

    fs.writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2))
    return true
  } catch (error) {
    console.error('删除心情记录失败:', error)
    throw new Error('删除心情记录失败')
  } finally {
    if (release) {
      await release().catch((err) => console.error('释放删除锁失败:', err))
    }
  }
}
