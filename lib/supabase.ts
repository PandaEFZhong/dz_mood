import { createClient } from '@supabase/supabase-js'
import { MoodEntry } from './moodStorage'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseKey

// 用于调试显示（脱敏）
export function getSupabaseHost(): string {
  if (!supabaseUrl) return '未配置'
  try {
    return new URL(supabaseUrl).hostname
  } catch {
    return '格式错误'
  }
}

if (!isSupabaseConfigured) {
  console.error('Supabase 环境变量缺失:', {
    url: !!supabaseUrl,
    key: !!supabaseKey,
  })
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
  auth: {
    // Capacitor 的 URL scheme 不是标准 http/https，关闭 URL session 检测避免异常
    detectSessionInUrl: false,
    persistSession: true,
    autoRefreshToken: true,
  },
})

// ─── Auth ───

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password })
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser()
  return data.user
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

// ─── Sync ───

export function moodToRecord(mood: MoodEntry, userId?: string) {
  const record: any = {
    local_id: mood.id,
    content: mood.content,
    score: Math.round(mood.score),
    comment: mood.comment,
    valence: mood.valence != null ? Math.round(mood.valence) : null,
    arousal: mood.arousal != null ? Math.round(mood.arousal) : null,
    dominant_need: mood.dominant_need,
    cognitive_pattern: mood.cognitive_pattern,
    social_connection: mood.social_connection,
    suggestion: mood.suggestion,
    alert_level: mood.alertLevel,
    alert_message: mood.alertMessage,
    body_load_index: mood.bodyLoadIndex != null ? Math.round(mood.bodyLoadIndex) : null,
    body_advice: mood.bodyAdvice,
    vitals: mood.vitals ?? null,
    created_at: mood.createdAt,
  }
  if (userId) record.user_id = userId
  return record
}

export function recordToMood(record: any): MoodEntry {
  return {
    id: record.local_id,
    content: record.content,
    score: record.score,
    comment: record.comment,
    valence: record.valence,
    arousal: record.arousal,
    dominant_need: record.dominant_need,
    cognitive_pattern: record.cognitive_pattern,
    social_connection: record.social_connection,
    suggestion: record.suggestion,
    alertLevel: record.alert_level,
    alertMessage: record.alert_message,
    bodyLoadIndex: record.body_load_index,
    bodyAdvice: record.body_advice,
    vitals: record.vitals ?? undefined,
    createdAt: record.created_at,
  }
}

/** 将本地记录批量同步到云端 */
export async function syncMoodsToCloud(moods: MoodEntry[]) {
  const user = await getCurrentUser()
  if (!user) return { error: new Error('未登录') }

  const records = moods.map((m) => moodToRecord(m, user.id))
  return supabase.from('moods').upsert(records, { onConflict: 'local_id' })
}

/** 从云端拉取所有记录 */
export async function fetchMoodsFromCloud(): Promise<MoodEntry[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('moods')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('拉取云端数据失败:', error)
    return []
  }

  return (data ?? []).map(recordToMood)
}

/** 删除云端单条记录 */
export async function deleteMoodFromCloud(localId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: new Error('未登录') }

  return supabase.from('moods').delete().eq('local_id', localId).eq('user_id', user.id)
}
