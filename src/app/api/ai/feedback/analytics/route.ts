import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import type { GetFeedbackAnalyticsUseCase } from '@application/use-cases/ai/GetFeedbackAnalyticsUseCase'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const periodParam = searchParams.get('period') ?? 'week'
    const limitParam = searchParams.get('limit') ?? '5'

    // 허용된 period 값 검증
    const period = (['day', 'week', 'month'] as const).includes(
      periodParam as 'day' | 'week' | 'month'
    )
      ? (periodParam as 'day' | 'week' | 'month')
      : 'week'

    const limit = Math.min(Math.max(parseInt(limitParam, 10) || 5, 1), 20)

    const useCase = container.resolve<GetFeedbackAnalyticsUseCase>(
      DI_TOKENS.GetFeedbackAnalyticsUseCase
    )

    const result = await useCase.execute({ period, limit })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
