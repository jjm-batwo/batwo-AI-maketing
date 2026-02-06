import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import type { IAlertRepository } from '@/domain/repositories/IAlertRepository'
import type { AlertStatus } from '@/domain/entities/Alert'

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const searchParams = request.nextUrl.searchParams
    const statusParam = searchParams.get('status')
    const status = (statusParam as AlertStatus) || undefined
    const limit = Math.min(Number(searchParams.get('limit')) || 10, 50)

    const repo = container.resolve<IAlertRepository>(DI_TOKENS.AlertRepository)
    const alerts = await repo.findByUserId(user.id!, { status, limit })
    const unreadCount = await repo.countUnread(user.id!)

    return NextResponse.json({
      alerts: alerts.map(a => ({
        id: a.id,
        type: a.type,
        severity: a.severity,
        title: a.title,
        message: a.message,
        status: a.status,
        data: a.data,
        createdAt: a.createdAt.toISOString(),
      })),
      unreadCount,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알림을 불러오는 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
