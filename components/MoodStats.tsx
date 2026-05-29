'use client'

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { fetchStats } from '@/lib/api'

interface VitalsSummary {
  avgHeartRate: number
  avgSleep: number
  avgFatigue: number
  avgBodyLoad: number
  hasData: boolean
}

interface StatsData {
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
  vitalsSummary: VitalsSummary
}

const COLORS = {
  positive: '#22c55e', // green-500
  neutral: '#eab308',  // yellow-500
  negative: '#ef4444', // red-500
}

export default function MoodStats() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await fetchStats()
      setStats(data as StatsData)
    } catch (error) {
      console.error('获取统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="animate-spin h-8 w-8 text-primary-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="text-center py-10 sm:py-12 bg-white rounded-xl sm:rounded-2xl border border-dashed border-gray-200">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-gray-500 text-sm sm:text-base">还没有足够的数据</p>
        <p className="text-gray-400 text-xs mt-1">记录几条心情后再来看统计吧</p>
      </div>
    )
  }

  // 准备周趋势图数据
  const weeklyData = stats.weekly.dates.map((date, index) => ({
    date,
    score: stats.weekly.scores[index] > 0 ? stats.weekly.scores[index] : null,
    bodyLoad: stats.weeklyBodyLoad.values[index] > 0 ? stats.weeklyBodyLoad.values[index] : null,
    hasData: stats.weekly.scores[index] > 0,
  }))

  // 准备情绪分布数据
  const distributionData = [
    { name: '积极', value: stats.distribution.positive, color: COLORS.positive },
    { name: '中性', value: stats.distribution.neutral, color: COLORS.neutral },
    { name: '消极', value: stats.distribution.negative, color: COLORS.negative },
  ].filter(d => d.value > 0)

  const vitals = stats.vitalsSummary

  // 心率颜色
  const hrColor = vitals.avgHeartRate > 100 ? 'text-red-600' : vitals.avgHeartRate > 80 ? 'text-yellow-600' : 'text-emerald-600'
  const hrBg = vitals.avgHeartRate > 100 ? 'bg-red-50' : vitals.avgHeartRate > 80 ? 'bg-yellow-50' : 'bg-emerald-50'
  const hrLabelColor = vitals.avgHeartRate > 100 ? 'text-red-500' : vitals.avgHeartRate > 80 ? 'text-yellow-500' : 'text-emerald-500'

  // 身体负荷颜色
  const blColor = vitals.avgBodyLoad > 7 ? 'text-red-600' : vitals.avgBodyLoad > 5 ? 'text-orange-600' : vitals.avgBodyLoad > 3 ? 'text-yellow-600' : 'text-emerald-600'
  const blBg = vitals.avgBodyLoad > 7 ? 'bg-red-50' : vitals.avgBodyLoad > 5 ? 'bg-orange-50' : vitals.avgBodyLoad > 3 ? 'bg-yellow-50' : 'bg-emerald-50'
  const blLabelColor = vitals.avgBodyLoad > 7 ? 'text-red-500' : vitals.avgBodyLoad > 5 ? 'text-orange-500' : vitals.avgBodyLoad > 3 ? 'text-yellow-500' : 'text-emerald-500'

  return (
    <div className="space-y-4">
      {/* 月度统计卡片 */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-5">
        <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          近30天统计
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.monthly.avgScore || '-'}</div>
            <div className="text-xs text-blue-500">平均心情</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.monthly.maxScore || '-'}</div>
            <div className="text-xs text-green-500">最高分</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.monthly.minScore || '-'}</div>
            <div className="text-xs text-red-500">最低分</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.monthly.recordDays}</div>
            <div className="text-xs text-purple-500">记录天数</div>
          </div>
        </div>
      </div>

      {/* 身体指标统计 - 仅在有时展示 */}
      {vitals.hasData && (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-5">
          <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            身体指标（近30天）
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`${hrBg} rounded-lg p-3 text-center`}>
              <div className={`text-2xl font-bold ${hrColor}`}>{vitals.avgHeartRate || '-'}</div>
              <div className={`text-xs ${hrLabelColor}`}>平均静息心率 (bpm)</div>
            </div>
            <div className="bg-indigo-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-indigo-600">{vitals.avgSleep || '-'}</div>
              <div className="text-xs text-indigo-500">平均睡眠质量</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-amber-600">{vitals.avgFatigue || '-'}</div>
              <div className="text-xs text-amber-500">平均疲劳程度</div>
            </div>
            <div className={`${blBg} rounded-lg p-3 text-center`}>
              <div className={`text-2xl font-bold ${blColor}`}>{vitals.avgBodyLoad || '-'}</div>
              <div className={`text-xs ${blLabelColor}`}>平均身体负荷</div>
            </div>
          </div>
        </div>
      )}

      {/* 近7天趋势 */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-5">
        <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          近7天趋势
        </h3>
        <div className="h-52 sm:h-60">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
              />
              <YAxis
                yAxisId="left"
                domain={[0, 10]}
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
                label={{ value: '心情', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 11, fill: '#9ca3af' } }}
              />
              {stats.weeklyBodyLoad.hasData && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 10]}
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                  label={{ value: '负荷', angle: 90, position: 'insideRight', offset: 10, style: { fontSize: 11, fill: '#9ca3af' } }}
                />
              )}
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  fontSize: '12px',
                }}
                formatter={(value, name) => {
                  const v = value as number | undefined
                  if (name === 'bodyLoad') return [v ? `${v}` : '-', '身体负荷']
                  return [v ? `${v}分` : '-', '心情指数']
                }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="score"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ fill: '#2563eb', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
              {stats.weeklyBodyLoad.hasData && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="bodyLoad"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  dot={{ fill: '#f43f5e', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        {stats.weeklyBodyLoad.hasData && (
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-6 h-0.5 bg-blue-600 rounded" />
              <span>心情指数</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-0.5 border-t-2 border-dashed border-rose-500 rounded" />
              <span>身体负荷</span>
            </div>
          </div>
        )}
      </div>

      {/* 情绪分布 */}
      {distributionData.length > 0 && (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-5">
          <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            情绪分布
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="h-40 w-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-2 sm:gap-4 w-full">
              <div className="text-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-gray-800">{stats.distribution.positive}</div>
                <div className="text-xs text-gray-500">积极</div>
              </div>
              <div className="text-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-gray-800">{stats.distribution.neutral}</div>
                <div className="text-xs text-gray-500">中性</div>
              </div>
              <div className="text-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-gray-800">{stats.distribution.negative}</div>
                <div className="text-xs text-gray-500">消极</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 总计 */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-4 text-white text-center">
        <div className="text-3xl font-bold">{stats.total}</div>
        <div className="text-sm opacity-90">累计记录心情次数</div>
      </div>
    </div>
  )
}
