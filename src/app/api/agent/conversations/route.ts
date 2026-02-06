import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import type { IConversationRepository } from '@/domain/repositories/IConversationRepository'

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const searchParams = request.nextUrl.searchParams
    const archived = searchParams.get('archived') === 'true'
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50)
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0)

    const repo = container.resolve<IConversationRepository>(DI_TOKENS.ConversationRepository)
    const conversations = await repo.findByUserId(user.id!, { includeArchived: archived, limit, offset })

    return NextResponse.json({
      conversations: conversations.map(c => ({
        id: c.id,
        title: c.title,
        updatedAt: c.updatedAt.toISOString(),
        isArchived: c.isArchived,
        createdAt: c.createdAt.toISOString(),
      })),
      total: conversations.length,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '대화 목록을 불러오는 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
