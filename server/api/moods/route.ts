import { NextResponse } from 'next/server'
import { getAllMoods } from '@/lib/storage.server'
import { generalLimiter } from '@/lib/rateLimiter'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // 限流检查
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anonymous'
    try {
      await generalLimiter.consume(ip, 1)
    } catch {
      return NextResponse.json(
        { error: '请求过于频繁，请稍后再试' },
        { status: 429 }
      )
    }

    const moods = await getAllMoods()
    return NextResponse.json(moods)
  } catch (error) {
    console.error('获取心情记录失败:', error)
    return NextResponse.json(
      { error: '获取数据失败，请稍后重试' },
      { status: 500 }
    )
  }
}
