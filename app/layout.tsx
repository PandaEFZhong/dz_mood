import type { Metadata, Viewport } from 'next'
import './globals.css'
import DeviceSimulator from '@/components/DeviceSimulator'

export const metadata: Metadata = {
  title: '心迹',
  description: '记录心情，关注身体，AI 守护你的心脏健康',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {isDev ? (
          <DeviceSimulator>
            {children}
          </DeviceSimulator>
        ) : (
          children
        )}
      </body>
    </html>
  )
}
