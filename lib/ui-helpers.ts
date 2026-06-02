/**
 * UI 辅助函数 —— 预警样式、时间格式化等
 * 供 page.tsx、MoodCard 等组件共享使用
 */

export function getAlertStyles(level?: string): string {
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

export function getAlertIcon(level?: string): string {
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

export function getAlertLabel(level?: string): string {
  switch (level) {
    case 'danger':
      return '危险'
    case 'warning':
      return '警告'
    case 'attention':
      return '关注'
    default:
      return ''
  }
}

export function formatTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return date.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
