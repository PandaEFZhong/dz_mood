'use client'

import { useState, useEffect, useCallback } from 'react'
import MoodCard from '@/components/MoodCard'
import MoodStats from '@/components/MoodStats'
import BodyLoadRing from '@/components/BodyLoadRing'
import { MoodEntry } from '@/lib/moodStorage'
import { fetchMoods, submitMood, removeMood } from '@/lib/api'
import { requestNotificationPermission, checkNotificationPermission, scheduleDailyReminder } from '@/lib/notifications'

type TabType = 'record' | 'history' | 'stats'

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('record')
  const [content, setContent] = useState('')
  const [moods, setMoods] = useState<MoodEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [lastSubmitted, setLastSubmitted] = useState<MoodEntry | null>(null)
  const [expandContent, setExpandContent] = useState(false)
  const [dailyReminder, setDailyReminder] = useState(false)

  // 身体指标状态
  const [showVitals, setShowVitals] = useState(false)
  const [restingHeartRate, setRestingHeartRate] = useState('')
  const [sleepQuality, setSleepQuality] = useState(5)
  const [fatigueLevel, setFatigueLevel] = useState(5)

  // 获取历史记录
  const loadMoods = useCallback(async () => {
    try {
      const data = await fetchMoods()
      setMoods(data)
    } catch (error) {
      console.error('获取历史记录失败:', error)
    } finally {
      setInitialLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMoods()
  }, [loadMoods])

  // 检查通知权限状态
  useEffect(() => {
    checkNotificationPermission().then((granted) => {
      if (granted) {
        scheduleDailyReminder(true)
        setDailyReminder(true)
      }
    })
  }, [])

  // 提交心情
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedContent = content.trim()
    if (!trimmedContent) {
      setError('请输入心情内容')
      return
    }

    if (trimmedContent.length > 2000) {
      setError('内容过长，请控制在 2000 字以内')
      return
    }

    setLoading(true)
    setError('')
    setLastSubmitted(null)
    setExpandContent(false)

    const vitals = showVitals
      ? {
          restingHeartRate: restingHeartRate ? parseInt(restingHeartRate) : undefined,
          sleepQuality,
          fatigueLevel,
        }
      : undefined

    try {
      const newMood = await submitMood(trimmedContent, vitals)
      setContent('')
      setRestingHeartRate('')
      setSleepQuality(5)
      setFatigueLevel(5)
      setShowVitals(false)
      setMoods((prev) => [newMood, ...prev])
      setLastSubmitted(newMood)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误，请检查连接后重试')
    } finally {
      setLoading(false)
    }
  }

  // 删除
  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await removeMood(id)
      setMoods((prev) => prev.filter((mood) => mood.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    } finally {
      setDeletingId(null)
    }
  }

  // 预警卡片颜色
  const getAlertStyles = (level?: string) => {
    switch (level) {
      case 'danger':
        return 'bg-red-50 border-red-300 text-red-800'
      case 'warning':
        return 'bg-amber-50 border-amber-300 text-amber-800'
      case 'attention':
        return 'bg-blue-50 border-blue-300 text-blue-800'
      default:
        return ''
    }
  }

  const getAlertIcon = (level?: string) => {
    switch (level) {
      case 'danger':
        return '🚨'
      case 'warning':
        return '⚠️'
      case 'attention':
        return '💡'
      default:
        return ''
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 顶部标题栏 - pt-6 避开手机状态栏 */}
      <div className="bg-white shadow-sm pt-6">
        <div className="max-w-2xl mx-auto px-3 sm:px-4 pt-2 pb-2 sm:pt-3 sm:pb-3">
          <div className="text-center mb-2 sm:mb-3">
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">🌈 乐心</h1>
            <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">记录心情，关注身体</p>
          </div>

          {/* Tab 切换 */}
          <div className="flex bg-gray-100 rounded-lg sm:rounded-xl p-0.5 sm:p-1">
            <button
              onClick={() => setActiveTab('record')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 sm:py-2 sm:px-4 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'record' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="hidden sm:inline">记录心情</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 sm:py-2 sm:px-4 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'history' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">历史</span>
              {moods.length > 0 && (
                <span className="ml-0.5 px-1 py-0 text-[10px] bg-primary-100 text-primary-600 rounded-full">{moods.length}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 sm:py-2 sm:px-4 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'stats' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="hidden sm:inline">统计</span>
            </button>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {activeTab === 'record' ? (
          <div className="space-y-4">
            {/* 提交成功提示 */}
            {lastSubmitted && (
              <div className="bg-green-50 border border-green-200 rounded-xl sm:rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-800">已记录！</h3>
                    <p className="text-xs text-green-600">AI 分析完成</p>
                  </div>
                </div>

                {/* 预警卡片 */}
                {lastSubmitted.alertLevel && lastSubmitted.alertLevel !== 'none' && (
                  <div className={`mb-3 p-3 rounded-lg border ${getAlertStyles(lastSubmitted.alertLevel)}`}>
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{getAlertIcon(lastSubmitted.alertLevel)}</span>
                      <div>
                        <p className="text-sm font-medium">
                          {lastSubmitted.alertLevel === 'danger' && '危险预警'}
                          {lastSubmitted.alertLevel === 'warning' && '健康警告'}
                          {lastSubmitted.alertLevel === 'attention' && '健康关注'}
                        </p>
                        <p className="text-xs mt-0.5 opacity-90">{lastSubmitted.alertMessage}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 身体负荷圆环 */}
                {lastSubmitted.bodyLoadIndex !== undefined && lastSubmitted.bodyLoadIndex > 0 && (
                  <div className="bg-white rounded-lg p-3 mb-3">
                    <BodyLoadRing value={lastSubmitted.bodyLoadIndex} size={72} strokeWidth={6} />
                  </div>
                )}

                {/* 分析结果摘要 */}
                <div className="bg-white rounded-lg p-3 mb-3">
                  <p
                    className={`text-sm text-gray-700 mb-2 cursor-pointer transition-all ${expandContent ? '' : 'line-clamp-2'}`}
                    onClick={() => setExpandContent(!expandContent)}
                  >
                    &ldquo;{lastSubmitted.content}&rdquo;
                  </p>
                  {lastSubmitted.content.length > 60 && (
                    <button
                      type="button"
                      onClick={() => setExpandContent(!expandContent)}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      {expandContent ? '收起 ↑' : '展开全文 ↓'}
                    </button>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
                      lastSubmitted.score >= 7 ? 'bg-green-100 text-green-700 border-green-200' :
                      lastSubmitted.score >= 4 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                      'bg-red-100 text-red-700 border-red-200'
                    }`}>
                      {lastSubmitted.score >= 7 ? '😊' : lastSubmitted.score >= 4 ? '😐' : '😔'}
                      {lastSubmitted.score >= 7 ? '心情不错' : lastSubmitted.score >= 4 ? '心情一般' : '心情低落'}
                      {' '}({lastSubmitted.score}分)
                    </span>
                    {lastSubmitted.vitals?.restingHeartRate && (
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${
                        lastSubmitted.vitals.restingHeartRate > 100 ? 'bg-red-100 text-red-700 border-red-200' :
                        lastSubmitted.vitals.restingHeartRate > 75 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        'bg-green-100 text-green-700 border-green-200'
                      }`}>
                        🫀 {lastSubmitted.vitals.restingHeartRate} bpm
                        {lastSubmitted.vitals.restingHeartRate > 100 ? ' 过快' : lastSubmitted.vitals.restingHeartRate > 75 ? ' 偏高' : ' 正常'}
                      </span>
                    )}
                    {lastSubmitted.dominant_need && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-600 border border-blue-200">
                        {lastSubmitted.dominant_need === '安全感' && '🛡️ 需要安心'}
                        {lastSubmitted.dominant_need === '归属感' && '🤝 需要陪伴'}
                        {lastSubmitted.dominant_need === '成就感' && '🏆 需要认可'}
                        {lastSubmitted.dominant_need === '自主性' && '🎯 需要自由'}
                        {lastSubmitted.dominant_need === '愉悦感' && '😊 需要快乐'}
                        {!['安全感','归属感','成就感','自主性','愉悦感'].includes(lastSubmitted.dominant_need || '') && lastSubmitted.dominant_need}
                      </span>
                    )}
                  </div>

                  {/* 洞察 */}
                  <div className="mt-3 p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
                      <span className="font-medium">💬 洞察：</span>{lastSubmitted.comment}
                    </p>
                  </div>

                  {/* 身体建议 */}
                  {lastSubmitted.bodyAdvice && (
                    <div className="mt-2 p-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-100">
                      <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
                        <span className="font-medium">🫀 身体建议：</span>{lastSubmitted.bodyAdvice}
                      </p>
                    </div>
                  )}

                  {/* 贴心建议 */}
                  {lastSubmitted.suggestion && (
                    <div className="mt-2 p-2.5 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-100">
                      <p className="text-xs sm:text-sm text-orange-800 leading-relaxed">
                        <span className="font-medium">💡 贴心建议：</span>{lastSubmitted.suggestion}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setActiveTab('history')} className="flex-1 bg-primary-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    去历史查看
                  </button>
                  <button
                    onClick={() => { setLastSubmitted(null); setExpandContent(false) }}
                    className="px-4 py-2.5 bg-white text-gray-600 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    再记一条
                  </button>
                </div>
              </div>
            )}

            {/* 输入表单 */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-5 lg:p-6">
              <form onSubmit={handleSubmit}>
                {/* 心情内容 */}
                <div className="mb-3 sm:mb-4">
                  <label htmlFor="mood-input" className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    今天心情如何？
                  </label>
                  <textarea
                    id="mood-input"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onFocus={(e) => {
                      setTimeout(() => {
                        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      }, 300)
                    }}
                    placeholder="写下此刻的想法，让 AI 帮你分析情绪..."
                    rows={5}
                    maxLength={2000}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all resize-none text-gray-700 placeholder-gray-400 text-base"
                    style={{ fontSize: '16px' }}
                    disabled={loading}
                  />
                  <div className="mt-1 text-right text-xs text-gray-400">{content.length}/2000</div>
                </div>

                {/* 身体指标 - 折叠面板 */}
                <div className="mb-3 sm:mb-4">
                  <button
                    type="button"
                    onClick={() => setShowVitals(!showVitals)}
                    className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                  >
                    <span className={`transform transition-transform ${showVitals ? 'rotate-90' : ''}`}>▶</span>
                    <span>🫀 记录身体指标（可选，帮助 AI 更准确评估）</span>
                  </button>

                  {showVitals && (
                    <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                      {/* 静息心率 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          静息心率 <span className="text-gray-400 font-normal">（次/分）</span>
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            value={restingHeartRate}
                            onChange={(e) => setRestingHeartRate(e.target.value)}
                            placeholder="如：72"
                            min={40}
                            max={200}
                            className="w-24 px-3 py-2 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm"
                          />
                          <span className="text-xs text-gray-400">正常范围：60-100</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-400">
                          💡 早上醒来静坐 1 分钟后，摸手腕脉搏数 15 秒，乘以 4
                        </p>
                      </div>

                      {/* 睡眠质量 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          昨晚睡眠质量 <span className="text-gray-400 font-normal">（{sleepQuality}/10）</span>
                        </label>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={sleepQuality}
                          onChange={(e) => setSleepQuality(parseInt(e.target.value))}
                          className="w-full accent-primary-600"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>极差 😫</span>
                          <span>一般 😐</span>
                          <span>完美 😴</span>
                        </div>
                      </div>

                      {/* 疲劳感 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          当前疲劳感 <span className="text-gray-400 font-normal">（{fatigueLevel}/10）</span>
                        </label>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={fatigueLevel}
                          onChange={(e) => setFatigueLevel(parseInt(e.target.value))}
                          className="w-full accent-primary-600"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>精力充沛 💪</span>
                          <span>一般 😐</span>
                          <span>精疲力竭 😵</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading || !content.trim()}
                  className="w-full bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 sm:py-3.5 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-colors flex items-center justify-center gap-2 min-h-[48px]"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>分析中...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>记录心情</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : activeTab === 'history' ? (
          <div>
            {initialLoading ? (
              <div className="flex items-center justify-center py-12">
                <svg className="animate-spin h-8 w-8 text-primary-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : moods.length === 0 ? (
              <div className="text-center py-10 sm:py-12 bg-white rounded-xl sm:rounded-2xl border border-dashed border-gray-200">
                <div className="text-3xl sm:text-4xl mb-3">📝</div>
                <p className="text-gray-500 text-sm sm:text-base mb-4">还没有记录</p>
                <button onClick={() => setActiveTab('record')} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors">
                  去记录第一条
                </button>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {moods.map((mood) => (
                  <MoodCard key={mood.id} mood={mood} onDelete={handleDelete} isDeleting={deletingId === mood.id} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <MoodStats />
        )}
      </div>

      {/* 设置区域 */}
      <div className="max-w-2xl mx-auto px-3 sm:px-4 pb-4">
        <div className="bg-white rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">每日提醒</p>
              <p className="text-xs text-gray-400">晚上 9 点提醒记录心情</p>
            </div>
          </div>
          <button
            onClick={async () => {
              if (!dailyReminder) {
                const granted = await requestNotificationPermission()
                if (granted) {
                  await scheduleDailyReminder(true)
                  setDailyReminder(true)
                }
              } else {
                await scheduleDailyReminder(false)
                setDailyReminder(false)
              }
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              dailyReminder ? 'bg-primary-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                dailyReminder ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <footer className="text-center text-xs text-gray-400 pb-6">
        <p>Powered by Kimi AI · 本产品仅供健康参考，不能替代医疗诊断</p>
        <p className="mt-1">
          <a href="https://pandaefzhong.github.io/dz_mood/privacy-policy.html" className="hover:text-gray-500 underline">隐私政策</a>
        </p>
      </footer>
    </main>
  )
}
