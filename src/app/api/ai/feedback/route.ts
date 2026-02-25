import { NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messageId, rating, comment } = body as {
      messageId?: unknown
      rating?: unknown
      comment?: unknown
    }

    // 입력 검증
    if (!messageId || typeof messageId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'messageId는 필수입니다' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (rating !== 'positive' && rating !== 'negative') {
      return new Response(
        JSON.stringify({ error: "rating은 'positive' 또는 'negative'여야 합니다" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (comment !== undefined && typeof comment !== 'string') {
      return new Response(
        JSON.stringify({ error: 'comment는 문자열이어야 합니다' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 세션이 있으면 userId 사용, 없으면 anonymous
    const user = await getAuthenticatedUser()
    const userId = user?.id ?? 'anonymous'

    const isHelpful = rating === 'positive'
    const numericRating = rating === 'positive' ? 5 : 1

    const created = await prisma.aIFeedback.create({
      data: {
        responseId: messageId,
        userId,
        rating: numericRating,
        isHelpful,
        comment: comment ? String(comment) : null,
        feature: 'chat',
        responseType: 'streaming',
      },
      select: {
        id: true,
      },
    })

    return new Response(
      JSON.stringify({ id: created.id, messageId, rating }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : '서버 오류가 발생했습니다',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
