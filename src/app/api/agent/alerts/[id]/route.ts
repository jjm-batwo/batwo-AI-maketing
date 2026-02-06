import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import type { IAlertRepository } from '@/domain/repositories/IAlertRepository'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body as { status?: string }

    const validStatuses = ['READ', 'DISMISSED', 'ACTED_ON']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: '유효한 상태를 입력해주세요 (READ, DISMISSED, ACTED_ON)' },
        { status: 400 }
      )
    }

    const repo = container.resolve<IAlertRepository>(DI_TOKENS.AlertRepository)
    const alert = await repo.findById(id)

    if (!alert) {
      return NextResponse.json({ error: '알림을 찾을 수 없습니다' }, { status: 404 })
    }

    if (alert.userId !== user.id) {
      return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
    }

    // Alert 엔티티의 상태 변경 메서드 사용
    let updated = alert
    if (status === 'READ') updated = alert.markRead()
    else if (status === 'DISMISSED') updated = alert.dismiss()
    else if (status === 'ACTED_ON') updated = alert.markActedOn()

    await repo.update(updated)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알림 상태 변경 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
