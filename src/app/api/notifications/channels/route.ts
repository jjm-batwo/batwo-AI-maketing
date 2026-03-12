import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthenticationError, unauthorizedResponse } from '@/lib/auth'
import { getNotificationChannelRepository } from '@/lib/di/container'
import { NotificationChannel } from '@domain/entities/NotificationChannel'
import type { NotificationChannelType, ChannelConfig } from '@domain/entities/NotificationChannel'

/**
 * GET /api/notifications/channels - 사용자 알림 채널 목록 조회
 */
export async function GET() {
  try {
    const user = await requireAuth()

    const repo = getNotificationChannelRepository()
    const channels = await repo.findByUserId(user.id)

    return NextResponse.json(
      channels.map((ch) => ch.toJSON()),
      { status: 200 },
    )
  } catch (error) {
    if (error instanceof AuthenticationError) return unauthorizedResponse()
    console.error('[API] GET /api/notifications/channels error:', error)
    return NextResponse.json({ message: '서버 오류' }, { status: 500 })
  }
}

/**
 * POST /api/notifications/channels - 알림 채널 등록
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    const body = await request.json()
    const { type, config } = body as { type: NotificationChannelType; config: ChannelConfig }

    if (!type || !config) {
      return NextResponse.json({ message: 'type과 config는 필수입니다' }, { status: 400 })
    }

    const repo = getNotificationChannelRepository()

    // 이미 존재하는 채널이면 업데이트
    const existing = await repo.findByUserAndType(user.id, type)
    if (existing) {
      const updated = existing.updateConfig(config).activate()
      const saved = await repo.update(updated)
      return NextResponse.json(saved.toJSON(), { status: 200 })
    }

    const channel = NotificationChannel.create({
      userId: user.id,
      type,
      config,
    })

    const saved = await repo.save(channel)
    return NextResponse.json(saved.toJSON(), { status: 201 })
  } catch (error) {
    if (error instanceof AuthenticationError) return unauthorizedResponse()
    const errorMessage = error instanceof Error ? error.message : '서버 오류'
    console.error('[API] POST /api/notifications/channels error:', error)
    return NextResponse.json({ message: errorMessage }, { status: 422 })
  }
}

/**
 * DELETE /api/notifications/channels - 알림 채널 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth()

    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('id')

    if (!channelId) {
      return NextResponse.json({ message: 'id 파라미터가 필요합니다' }, { status: 400 })
    }

    const repo = getNotificationChannelRepository()
    const channel = await repo.findById(channelId)

    if (!channel || channel.userId !== user.id) {
      return NextResponse.json({ message: '채널을 찾을 수 없습니다' }, { status: 404 })
    }

    await repo.delete(channelId)
    return NextResponse.json({ message: '삭제되었습니다' }, { status: 200 })
  } catch (error) {
    if (error instanceof AuthenticationError) return unauthorizedResponse()
    console.error('[API] DELETE /api/notifications/channels error:', error)
    return NextResponse.json({ message: '서버 오류' }, { status: 500 })
  }
}
