'use client'

import { useState, useEffect } from 'react'
import { getCurrentUser, signOut, syncMoodsToCloud, fetchMoodsFromCloud } from '@/lib/supabase'
import { getAllMoods, saveAllMoods, MoodEntry } from '@/lib/moodStorage'
import { sendTestNotification, getPendingNotifications, scheduleDailyReminder } from '@/lib/notifications'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  onLoginClick: () => void
}

export default function SettingsPanel({ isOpen, onClose, onLoginClick }: SettingsPanelProps) {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [localCount, setLocalCount] = useState(0)
  const [pendingNotifications, setPendingNotifications] = useState<string>('')
  const [testMsg, setTestMsg] = useState('')

  useEffect(() => {
    if (!isOpen) return
    checkUser()
    getAllMoods().then((moods) => setLocalCount(moods.length))
    // 获取已调度通知
    getPendingNotifications().then((list) => {
      if (list.length === 0) {
        setPendingNotifications('暂无待发送通知')
      } else {
        setPendingNotifications(
          list.map((n: any) => `ID:${n.id} ${n.title} @ ${n.schedule?.at ? new Date(n.schedule.at).toLocaleString('zh-CN') : '立即'}`).join('；')
        )
      }
    })
  }, [isOpen])

  async function checkUser() {
    const user = await getCurrentUser()
    setUserEmail(user?.email ?? null)
  }

  async function handleSync() {
    setSyncing(true)
    setSyncMessage('')
    try {
      // 1. 上传本地数据到云端
      const localMoods = await getAllMoods()
      if (localMoods.length > 0) {
        await syncMoodsToCloud(localMoods)
      }

      // 2. 从云端拉取数据
      const cloudMoods = await fetchMoodsFromCloud()

      // 3. 合并（以本地为主，云端补充）
      const merged = mergeMoods(localMoods, cloudMoods)
      await saveAllMoods(merged)
      setLocalCount(merged.length)
      setSyncMessage(`同步成功！共 ${merged.length} 条记录`)
    } catch (err: any) {
      setSyncMessage(`同步失败: ${err.message}`)
    } finally {
      setSyncing(false)
    }
  }

  async function handleLogout() {
    await signOut()
    setUserEmail(null)
    setSyncMessage('已退出登录')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-800">设置</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 账号状态 */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${userEmail ? 'bg-green-100' : 'bg-gray-200'}`}>
              {userEmail ? (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">
                {userEmail ? '已登录' : '未登录'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {userEmail ?? '登录后可同步数据到云端'}
              </p>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            {userEmail ? (
              <button
                onClick={handleLogout}
                className="flex-1 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                退出登录
              </button>
            ) : (
              <button
                onClick={onLoginClick}
                className="flex-1 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                登录 / 注册
              </button>
            )}
          </div>
        </div>

        {/* 同步按钮 */}
        <div className="mb-4">
          <button
            onClick={handleSync}
            disabled={syncing || !userEmail}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncing ? '同步中...' : '立即同步'}
          </button>
          {!userEmail && (
            <p className="text-[10px] text-gray-400 text-center mt-1">登录后才能同步</p>
          )}
        </div>

        {syncMessage && (
          <div className={`mb-4 p-2.5 rounded-lg text-xs text-center ${syncMessage.includes('失败') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
            {syncMessage}
          </div>
        )}

        {/* 通知测试 */}
        <div className="border-t border-gray-100 pt-4 mb-4">
          <p className="text-xs font-medium text-gray-700 mb-2">通知诊断</p>
          <button
            onClick={async () => {
              setTestMsg('发送中...')
              const ok = await sendTestNotification()
              setTestMsg(ok ? '测试通知已发送，5秒后查看' : '发送失败，请检查通知权限')
            }}
            className="w-full py-2 text-xs bg-orange-50 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
          >
            📢 发送测试通知（5秒后）
          </button>
          {testMsg && (
            <p className="mt-1 text-[10px] text-gray-500 text-center">{testMsg}</p>
          )}
          <p className="mt-2 text-[10px] text-gray-400 leading-relaxed">
            待发送: {pendingNotifications}
          </p>
        </div>

        {/* 数据统计 */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">本地记录</span>
            <span className="font-medium text-gray-800">{localCount} 条</span>
          </div>
        </div>

        <p className="mt-4 text-[10px] text-gray-400 text-center leading-relaxed">
          数据存储在新加坡服务器，仅用于同步和备份
        </p>
      </div>
    </div>
  )
}

/** 合并本地和云端记录，以 createdAt 去重 */
function mergeMoods(local: MoodEntry[], cloud: MoodEntry[]): MoodEntry[] {
  const map = new Map<string, MoodEntry>()
  for (const m of cloud) map.set(m.id, m)
  for (const m of local) {
    const existing = map.get(m.id)
    if (!existing || new Date(m.createdAt) >= new Date(existing.createdAt)) {
      map.set(m.id, m)
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}
