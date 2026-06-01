import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'

const IS_NATIVE = Capacitor.isNativePlatform()

export async function requestNotificationPermission(): Promise<boolean> {
  if (!IS_NATIVE) return false
  try {
    const result = await LocalNotifications.requestPermissions()
    return result.display === 'granted'
  } catch {
    return false
  }
}

export async function checkNotificationPermission(): Promise<boolean> {
  if (!IS_NATIVE) return false
  try {
    const result = await LocalNotifications.checkPermissions()
    return result.display === 'granted'
  } catch {
    return false
  }
}

/** 获取已调度的通知列表（用于调试） */
export async function getPendingNotifications() {
  if (!IS_NATIVE) return []
  try {
    const { notifications } = await LocalNotifications.getPending()
    return notifications
  } catch {
    return []
  }
}

/** 发送一条测试通知（5秒后） */
export async function sendTestNotification(): Promise<boolean> {
  if (!IS_NATIVE) return false
  try {
    const testTime = new Date()
    testTime.setSeconds(testTime.getSeconds() + 5)

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 999,
          title: '乐心 · 测试通知',
          body: '如果你看到这条通知，说明通知功能正常 ✅',
          schedule: { at: testTime },
          sound: 'default',
          smallIcon: 'ic_launcher',
        },
      ],
    })
    return true
  } catch (e) {
    console.error('测试通知失败:', e)
    return false
  }
}

export async function scheduleDailyReminder(enabled: boolean): Promise<string> {
  if (!IS_NATIVE) return '非原生平台，跳过'
  try {
    // 先取消所有现有通知
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] })

    if (!enabled) return '已取消每日提醒'

    // 计算下一个 21:00
    const now = new Date()
    const reminderTime = new Date(now)
    reminderTime.setHours(21, 0, 0, 0)

    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1)
    }

    // Capacitor 在 Android 上的重复通知不稳定，改用每天单独调度
    // 先调度第一条
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1,
          title: '乐心',
          body: '今天的心情如何？花一分钟记录一下吧 🌈',
          schedule: { at: reminderTime },
          sound: 'default',
          smallIcon: 'ic_launcher',
        },
      ],
    })

    const formatted = reminderTime.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    return `已设置，下次提醒：${formatted}`
  } catch (e: any) {
    console.error('设置通知失败:', e)
    return `设置失败: ${e.message || '未知错误'}`
  }
}
