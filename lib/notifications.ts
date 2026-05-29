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

export async function scheduleDailyReminder(enabled: boolean): Promise<void> {
  if (!IS_NATIVE) return
  try {
    // 先取消所有现有通知
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] })

    if (!enabled) return

    // 获取明天同一时间
    const now = new Date()
    const reminderTime = new Date(now)
    reminderTime.setHours(21, 0, 0, 0) // 晚上 9 点

    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1)
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1,
          title: '乐心',
          body: '今天的心情如何？花一分钟记录一下吧 🌈',
          schedule: {
            at: reminderTime,
            repeats: true,
            every: 'day',
          },
          sound: 'default',
          smallIcon: 'ic_launcher',
        },
      ],
    })
  } catch (e) {
    console.error('设置通知失败:', e)
  }
}
