import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import type { IConversationRepository } from '@/domain/repositories/IConversationRepository'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const messageLimit = Math.min(Number(searchParams.get('messageLimit')) || 50, 100)

    const repo = container.resolve<IConversationRepository>(DI_TOKENS.ConversationRepository)
    const conversation = await repo.findById(id)

    if (!conversation) {
      return NextResponse.json({ error: '대화를 찾을 수 없습니다' }, { status: 404 })
    }

    if (conversation.userId !== user.id) {
      return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
    }

    const messages = await repo.getMessages(id, { limit: messageLimit })

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        isArchived: conversation.isArchived,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      },
      messages,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '대화를 불러오는 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params
    const repo = container.resolve<IConversationRepository>(DI_TOKENS.ConversationRepository)
    const conversation = await repo.findById(id)

    if (!conversation) {
      return NextResponse.json({ error: '대화를 찾을 수 없습니다' }, { status: 404 })
    }

    if (conversation.userId !== user.id) {
      return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
    }

    await repo.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '대화 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
