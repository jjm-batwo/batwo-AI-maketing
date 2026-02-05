import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import { SubscriptionPlan } from '@domain/value-objects/SubscriptionPlan'
import { BillingPeriod } from '@domain/value-objects/BillingPeriod'
import { PaymentError } from '@domain/errors/PaymentError'
import type { ChangePlanUseCase } from '@application/use-cases/payment/ChangePlanUseCase'

export async function POST(request: Request) {
  try {
    // Authentication
    const user = await getAuthenticatedUser()
    if (!user) {
      return unauthorizedResponse()
    }

    // Parse request body
    const body = await request.json()
    const { newPlan, newBillingPeriod } = body

    // Validate new plan
    if (!newPlan || !Object.values(SubscriptionPlan).includes(newPlan as SubscriptionPlan)) {
      return NextResponse.json(
        { error: '유효하지 않은 플랜입니다' },
        { status: 400 }
      )
    }

    // Validate new billing period
    if (!newBillingPeriod || !Object.values(BillingPeriod).includes(newBillingPeriod as BillingPeriod)) {
      return NextResponse.json(
        { error: '유효하지 않은 결제 주기입니다' },
        { status: 400 }
      )
    }

    // Execute use case
    const changePlanUseCase = container.resolve<ChangePlanUseCase>(
      DI_TOKENS.ChangePlanUseCase
    )

    const result = await changePlanUseCase.execute({
      userId: user.id,
      newPlan: newPlan as SubscriptionPlan,
      newBillingPeriod: newBillingPeriod as BillingPeriod,
    })

    return NextResponse.json(result)
  } catch (error) {
    // Handle PaymentError specifically
    if (error instanceof PaymentError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      )
    }

    // Log unexpected errors
    console.error('Change plan error:', error)

    // Generic error response
    return NextResponse.json(
      { error: '플랜 변경 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
