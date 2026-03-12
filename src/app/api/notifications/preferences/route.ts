import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthenticationError, unauthorizedResponse } from '@/lib/auth'
import { getNotificationPreferenceRepository } from '@/lib/di/container'
import { NotificationPreference } from '@domain/value-objects/NotificationPreference'
import type { AlertType, MinSeverity } from '@domain/value-objects/NotificationPreference'
import type { NotificationChannelType } from '@domain/entities/NotificationChannel'

/**
 * GET /api/notifications/preferences - 사용자 알림 선호도 목록 조회
 */
export async function GET() {
  try {
    const user = await requireAuth()

    const repo = getNotificationPreferenceRepository()
    const preferences = await repo.findByUserId(user.id)

    return NextResponse.json(
      preferences.map((p) => p.toJSON()),
      { status: 200 },
    )
  } catch (error) {
    if (error instanceof AuthenticationError) return unauthorizedResponse()
    console.error('[API] GET /api/notifications/preferences error:', error)
    return NextResponse.json({ message: '서버 오류' }, { status: 500 })
  }
}

/**
 * POST /api/notifications/preferences - 알림 선호도 등록/업데이트
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    const body = await request.json()
    const { alertType, channels, minSeverity, isActive } = body as {
      alertType: AlertType
      channels: NotificationChannelType[]
      minSeverity?: MinSeverity
      isActive?: boolean
    }

    if (!alertType || !channels) {
      return NextResponse.json(
        { message: 'alertType과 channels는 필수입니다' },
        { status: 400 },
      )
    }

    const repo = getNotificationPreferenceRepository()

    // 이미 존재하면 업데이트
    const existing = await repo.findByUserAndType(user.id, alertType)
    if (existing) {
      let updated = existing.updateChannels(channels)
      if (minSeverity) {
        updated = updated.updateMinSeverity(minSeverity)
      }
      if (isActive === false) {
        updated = updated.deactivate()
      } else if (isActive === true) {
        updated = updated.activate()
      }
      const saved = await repo.update(updated)
      return NextResponse.json(saved.toJSON(), { status: 200 })
    }

    const preference = NotificationPreference.create({
      userId: user.id,
      alertType,
      channels,
      minSeverity,
    })

    const saved = await repo.save(preference)
    return NextResponse.json(saved.toJSON(), { status: 201 })
  } catch (error) {
    if (error instanceof AuthenticationError) return unauthorizedResponse()
    const errorMessage = error instanceof Error ? error.message : '서버 오류'
    console.error('[API] POST /api/notifications/preferences error:', error)
    return NextResponse.json({ message: errorMessage }, { status: 422 })
  }
}

/**
 * DELETE /api/notifications/preferences - 알림 선호도 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth()

    const { searchParams } = new URL(request.url)
    const preferenceId = searchParams.get('id')

    if (!preferenceId) {
      return NextResponse.json({ message: 'id 파라미터가 필요합니다' }, { status: 400 })
    }

    const repo = getNotificationPreferenceRepository()
    const pref = await repo.findById(preferenceId)

    if (!pref || pref.userId !== user.id) {
      return NextResponse.json({ message: '선호도를 찾을 수 없습니다' }, { status: 404 })
    }

    await repo.delete(preferenceId)
    return NextResponse.json({ message: '삭제되었습니다' }, { status: 200 })
  } catch (error) {
    if (error instanceof AuthenticationError) return unauthorizedResponse()
    console.error('[API] DELETE /api/notifications/preferences error:', error)
    return NextResponse.json({ message: '서버 오류' }, { status: 500 })
  }
}
