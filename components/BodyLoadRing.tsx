'use client'

interface BodyLoadRingProps {
  value: number // 1-10
  size?: number // 默认 80
  strokeWidth?: number // 默认 8
  showLabel?: boolean // 默认 true
}

function getLoadInfo(value: number) {
  if (value <= 3) return { label: '轻松', color: '#22c55e', bg: 'bg-green-50', text: 'text-green-700' }
  if (value <= 6) return { label: '适中', color: '#eab308', bg: 'bg-yellow-50', text: 'text-yellow-700' }
  if (value <= 8) return { label: '较重', color: '#f97316', bg: 'bg-orange-50', text: 'text-orange-700' }
  return { label: '过载', color: '#ef4444', bg: 'bg-red-50', text: 'text-red-700' }
}

export default function BodyLoadRing({
  value,
  size = 80,
  strokeWidth = 8,
  showLabel = true,
}: BodyLoadRingProps) {
  const info = getLoadInfo(value)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (Math.min(10, Math.max(0, value)) / 10) * circumference

  return (
    <div className="flex items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* 背景圆环 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          {/* 进度圆环 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={info.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        {/* 中心文字 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold" style={{ color: info.color }}>
            {value}
          </span>
          <span className="text-[10px] text-gray-400">/10</span>
        </div>
      </div>

      {showLabel && (
        <div>
          <div className="text-sm font-medium text-gray-700">身体负荷</div>
          <div className={`text-xs font-medium ${info.text}`}>
            {info.label}
          </div>
        </div>
      )}
    </div>
  )
}
