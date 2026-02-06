import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import { ActionConfirmationService } from '@/application/services/ActionConfirmationService'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params
    const service = container.resolve<ActionConfirmationService>(
      DI_TOKENS.ActionConfirmationService
    )

    await service.cancelAction(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : '취소 처리 중 오류가 발생했습니다'
    const status = message.includes('not found') ? 404 : 500
    return NextResponse.json({ success: false, message }, { status })
  }
}
