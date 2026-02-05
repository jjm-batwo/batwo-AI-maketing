import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import type { CancelSubscriptionUseCase } from '@application/use-cases/payment/CancelSubscriptionUseCase'

export async function POST(request: Request) {
  try {
    // Authentication
    const user = await getAuthenticatedUser()
    if (!user) {
      return unauthorizedResponse()
    }

    // Parse request body
    const body = await request.json()
    const { reason } = body

    // Execute use case
    const cancelSubscriptionUseCase = container.resolve<CancelSubscriptionUseCase>(
      DI_TOKENS.CancelSubscriptionUseCase
    )

    const result = await cancelSubscriptionUseCase.execute(user.id, reason)

    return NextResponse.json(result)
  } catch (error) {
    // Handle specific error messages
    if (error instanceof Error) {
      const message = error.message

      if (message.includes('구독을 찾을 수 없습니다')) {
        return NextResponse.json(
          { error: message },
          { status: 404 }
        )
      }

      if (message.includes('이미 취소된 구독입니다')) {
        return NextResponse.json(
          { error: message },
          { status: 409 }
        )
      }
    }

    // Log unexpected errors
    console.error('Cancel subscription error:', error)

    // Generic error response
    return NextResponse.json(
      { error: '구독 취소 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
