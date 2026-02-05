import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import type { GetPaymentHistoryUseCase } from '@/application/use-cases/payment/GetPaymentHistoryUseCase'

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return unauthorizedResponse()
  }

  const searchParams = request.nextUrl.searchParams
  const limitParam = searchParams.get('limit')

  let limit = 50
  if (limitParam) {
    const parsed = parseInt(limitParam, 10)
    if (!isNaN(parsed) && parsed > 0) {
      limit = Math.min(parsed, 100) // Max 100
    }
  }

  const getPaymentHistoryUseCase = container.resolve<GetPaymentHistoryUseCase>(
    DI_TOKENS.GetPaymentHistoryUseCase
  )

  const history = await getPaymentHistoryUseCase.execute(user.id, limit)

  return NextResponse.json(history)
}
