import { NextRequest, NextResponse } from 'next/server'
import { deleteMood } from '@/lib/storage.server'
import { generalLimiter } from '@/lib/rateLimiter'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 限流检查
    const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'anonymous'
    try {
      await generalLimiter.consume(ip, 1)
    } catch {
      return NextResponse.json(
        { error: '请求过于频繁，请稍后再试' },
        { status: 429 }
      )
    }

    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: '缺少记录 ID' },
        { status: 400 }
      )
    }

    const success = await deleteMood(id)

    if (!success) {
      return NextResponse.json(
        { error: '记录不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, message: '删除成功' })
  } catch (error) {
    console.error('删除心情记录失败:', error)
    return NextResponse.json(
      { error: '删除失败，请稍后重试' },
      { status: 500 }
    )
  }
}
