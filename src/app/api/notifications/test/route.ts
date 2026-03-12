import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthenticationError, unauthorizedResponse } from '@/lib/auth'
import { getNotificationDispatcherService } from '@/lib/di/container'

/**
 * POST /api/notifications/test - 테스트 알림 발송
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    const body = await request.json()
    const { alertType } = body as { alertType?: string }

    const dispatcher = getNotificationDispatcherService()

    const result = await dispatcher.dispatch({
      userId: user.id,
      alertType: alertType || 'anomaly',
      severity: 'INFO',
      title: '🔔 바투 알림 테스트',
      message: '축하합니다! 알림 설정이 정상적으로 작동합니다.',
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://batwo.ai'}/settings/notifications`,
    })

    return NextResponse.json(
      {
        message: result.sent > 0 ? '테스트 알림이 발송되었습니다' : '발송된 알림이 없습니다',
        sent: result.sent,
        failed: result.failed,
        errors: result.errors,
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof AuthenticationError) return unauthorizedResponse()
    console.error('[API] POST /api/notifications/test error:', error)
    return NextResponse.json({ message: '서버 오류' }, { status: 500 })
  }
}
