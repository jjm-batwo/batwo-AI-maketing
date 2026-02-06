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
    const body = await request.json()
    const { args } = body as { args?: Record<string, unknown> }

    if (!args || typeof args !== 'object') {
      return NextResponse.json(
        { success: false, message: '수정할 파라미터를 제공해주세요' },
        { status: 400 }
      )
    }

    const service = container.resolve<ActionConfirmationService>(
      DI_TOKENS.ActionConfirmationService
    )

    await service.modifyAction(id, args)
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : '수정 처리 중 오류가 발생했습니다'
    const status = message.includes('not found') ? 404 : 500
    return NextResponse.json({ success: false, message }, { status })
  }
}
