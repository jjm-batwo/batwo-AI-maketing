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

    const result = await service.confirmAndExecute(id, user.id!)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : '확인 처리 중 오류가 발생했습니다'
    const status = message.includes('not found') ? 404
      : message.includes('expired') ? 410
      : 500
    return NextResponse.json({ success: false, message }, { status })
  }
}
