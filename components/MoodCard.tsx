'use client'

import { useState } from 'react'
import { MoodEntry } from '@/lib/moodStorage'
import BodyLoadRing from './BodyLoadRing'
import { formatTime, getAlertStyles, getAlertIcon, getAlertLabel } from '@/lib/ui-helpers'

interface MoodCardProps {
  mood: MoodEntry
  onDelete?: (id: string) => void
  isDeleting?: boolean
}

function getScoreColor(score: number): string {
  if (score >= 7) return 'bg-green-100 text-green-700 border-green-200'
  if (score >= 4) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
  return 'bg-red-100 text-red-700 border-red-200'
}

function getNeedColor(need: string): string {
  const colors: Record<string, string> = {
    '安全感': 'bg-blue-100 text-blue-700 border-blue-200',
    '归属感': 'bg-purple-100 text-purple-700 border-purple-200',
    '成就感': 'bg-orange-100 text-orange-700 border-orange-200',
    '自主性': 'bg-teal-100 text-teal-700 border-teal-200',
    '愉悦感': 'bg-pink-100 text-pink-700 border-pink-200',
  }
  return colors[need] || 'bg-gray-100 text-gray-700 border-gray-200'
}

function getNeedLabel(need: string): string {
  const labels: Record<string, string> = {
    '安全感': '🛡️ 需要安心',
    '归属感': '🤝 需要陪伴',
    '成就感': '🏆 需要认可',
    '自主性': '🎯 需要自由',
    '愉悦感': '😊 需要快乐',
  }
  return labels[need] || need
}

function getCognitiveColor(pattern: string): string {
  const colors: Record<string, string> = {
    '积极归因': 'text-green-600',
    '消极归因': 'text-red-600',
    '中性描述': 'text-gray-600',
    '混合': 'text-purple-600',
    '僵化': 'text-orange-600',
  }
  return colors[pattern] || 'text-gray-600'
}

function getSocialIcon(connection: string): string {
  const icons: Record<string, string> = {
    '独处': '🧘', '亲密': '💕', '群体': '👥', '疏离': '🌫️',
  }
  return icons[connection] || '😐'
}

function getSocialLabel(connection: string): string {
  const labels: Record<string, string> = {
    '独处': '一个人待着',
    '亲密': '和亲近的人一起',
    '群体': '在人群中',
    '疏离': '感到孤单/隔阂',
  }
  return labels[connection] || connection
}

function getArousalLabel(arousal: number): string {
  if (arousal <= 3) return '平静'
  if (arousal <= 6) return '适中'
  return '亢奋'
}

function getArousalColor(arousal: number): string {
  if (arousal <= 3) return 'bg-blue-500'
  if (arousal <= 6) return 'bg-green-500'
  return 'bg-red-500'
}

export default function MoodCard({ mood, onDelete, isDeleting }: MoodCardProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [showBodyAdvice, setShowBodyAdvice] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const hasDetailedAnalysis = mood.valence !== undefined
  const hasVitals = mood.vitals !== undefined
  const hasAlert = mood.alertLevel && mood.alertLevel !== 'none'

  // 判断是否需要折叠：超过80字或超过3行
  const shouldCollapse = mood.content.length > 80 || mood.content.split('\n').length > 3

  const handleDeleteClick = () => {
    if (showConfirm) {
      onDelete?.(mood.id)
      setShowConfirm(false)
    } else {
      setShowConfirm(true)
    }
  }

  return (
    <div className={`bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${isDeleting ? 'opacity-50' : ''}`}>
      {/* 预警横幅 */}
      {hasAlert && (
        <div className={`mb-3 p-2.5 rounded-lg border ${getAlertStyles(mood.alertLevel)}`}>
          <div className="flex items-center gap-2">
            <span>{getAlertIcon(mood.alertLevel)}</span>
            <div>
              <span className="text-xs font-bold">
                {getAlertLabel(mood.alertLevel)}预警
              </span>
              <p className="text-xs mt-0.5 opacity-90">{mood.alertMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* 头部：内容和时间 */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
        <div className="flex-1 min-w-0 order-2 sm:order-1">
          <p className={`text-gray-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words ${!expanded && shouldCollapse ? 'line-clamp-3' : ''}`}>
            {mood.content}
          </p>
          {shouldCollapse && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium mt-1"
            >
              {expanded ? '收起 ↑' : '展开全文 ↓'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 self-end sm:self-start order-1 sm:order-2">
          <span className="text-xs text-gray-400 whitespace-nowrap">{formatTime(mood.createdAt)}</span>
          {onDelete && (
            <div className="flex items-center">
              {showConfirm ? (
                <div className="flex items-center gap-1">
                  <button onClick={handleDeleteClick} disabled={isDeleting} className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 min-h-[32px] min-w-[48px]">确认</button>
                  <button onClick={() => setShowConfirm(false)} disabled={isDeleting} className="px-3 py-1.5 text-xs bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 min-h-[32px] min-w-[48px]">取消</button>
                </div>
              ) : (
                <button onClick={() => setShowConfirm(true)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="删除">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 身体指标 + 身体负荷圆环 */}
      {(hasVitals || (mood.bodyLoadIndex !== undefined && mood.bodyLoadIndex > 0)) && (
        <div className="mt-3">
          {/* 身体指标标签 */}
          {hasVitals && (
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {mood.vitals?.restingHeartRate && (
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
                  mood.vitals.restingHeartRate > 100 ? 'bg-red-100 text-red-700 border-red-200' :
                  mood.vitals.restingHeartRate > 75 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                  'bg-green-100 text-green-700 border-green-200'
                }`}>
                  🫀 {mood.vitals.restingHeartRate} bpm
                  {mood.vitals.restingHeartRate > 100 ? ' 过快' : mood.vitals.restingHeartRate > 75 ? ' 偏高' : ' 正常'}
                </div>
              )}
              {mood.vitals?.sleepQuality && (
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${
                  mood.vitals.sleepQuality <= 3 ? 'bg-red-50 text-red-600 border-red-200' :
                  mood.vitals.sleepQuality <= 6 ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                  'bg-green-50 text-green-600 border-green-200'
                }`}>
                  😴 睡眠 {mood.vitals.sleepQuality}/10
                </div>
              )}
              {mood.vitals?.fatigueLevel && (
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${
                  mood.vitals.fatigueLevel >= 8 ? 'bg-red-50 text-red-600 border-red-200' :
                  mood.vitals.fatigueLevel >= 5 ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                  'bg-green-50 text-green-600 border-green-200'
                }`}>
                  🔋 疲劳 {mood.vitals.fatigueLevel}/10
                </div>
              )}
            </div>
          )}

          {/* 身体负荷圆环（紧凑版） */}
          {mood.bodyLoadIndex !== undefined && mood.bodyLoadIndex > 0 && (
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2 mb-2">
              <BodyLoadRing value={mood.bodyLoadIndex} size={48} strokeWidth={5} showLabel={false} />
              <div className="flex-1 ml-3">
                <div className="text-xs text-gray-500">
                  {mood.bodyLoadIndex <= 3 ? '身体负担轻，状态良好' :
                   mood.bodyLoadIndex <= 6 ? '身体负担适中，注意休息' :
                   mood.bodyLoadIndex <= 8 ? '身体负担较重，建议减负' :
                   '身体严重过载，务必休息'}
                </div>
              </div>
              {/* 展开/折叠身体建议按钮 */}
              {mood.bodyAdvice && (
                <button
                  onClick={() => setShowBodyAdvice(!showBodyAdvice)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium px-2 py-1 rounded hover:bg-emerald-50 transition-colors"
                >
                  {showBodyAdvice ? '收起' : '身体建议'}
                </button>
              )}
            </div>
          )}

          {/* 可折叠的身体建议 */}
          {showBodyAdvice && mood.bodyAdvice && (
            <div className="mb-3 p-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-100">
              <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
                <span className="font-medium">🫀 身体建议：</span>{mood.bodyAdvice}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 详细分析区域 */}
      {hasDetailedAnalysis ? (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getScoreColor(mood.score)}`}>
              <span>{mood.score >= 7 ? '😊' : mood.score >= 4 ? '😐' : '😔'}</span>
              <span>{mood.score >= 7 ? '心情不错' : mood.score >= 4 ? '心情一般' : '心情低落'}</span>
              <span className="opacity-75 ml-0.5">({mood.score}分)</span>
            </div>
            {mood.dominant_need && (
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-600 border border-blue-200">
                {getNeedLabel(mood.dominant_need)}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-50 border border-gray-200 ${getCognitiveColor(mood.cognitive_pattern || '')}`}>
              <span>🧠</span><span>{mood.cognitive_pattern}</span>
            </div>
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-50 border border-gray-200 text-gray-700">
              <span>{getSocialIcon(mood.social_connection || '')}</span><span>{getSocialLabel(mood.social_connection || '')}</span>
            </div>
          </div>

          {/* 洞察 */}
          <div className="p-2.5 sm:p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
            <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
              <span className="font-medium">💬 洞察：</span>{mood.comment}
            </p>
          </div>

          {/* 贴心建议 */}
          {mood.suggestion && (
            <div className="p-2.5 sm:p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-100">
              <p className="text-xs sm:text-sm text-orange-800 leading-relaxed">
                <span className="font-medium">💡 贴心建议：</span>{mood.suggestion}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium border self-start ${getScoreColor(mood.score)}`}>
            <span className="text-base sm:text-lg font-bold">{mood.score}</span>
            <span className="text-xs opacity-75">/ 10</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 italic">"{mood.comment}"</p>
        </div>
      )}
    </div>
  )
}
