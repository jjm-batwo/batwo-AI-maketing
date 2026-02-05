import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import { SubscriptionPlan } from '@domain/value-objects/SubscriptionPlan'
import { BillingPeriod } from '@domain/value-objects/BillingPeriod'
import { PaymentError } from '@domain/errors/PaymentError'
import type { SubscribePlanUseCase } from '@application/use-cases/payment/SubscribePlanUseCase'

export async function POST(request: Request) {
  try {
    // Authentication
    const user = await getAuthenticatedUser()
    if (!user) {
      return unauthorizedResponse()
    }

    // Parse request body
    const body = await request.json()
    const { plan, billingPeriod, authKey, customerKey } = body

    // Validate plan
    if (!plan || !Object.values(SubscriptionPlan).includes(plan as SubscriptionPlan)) {
      return NextResponse.json(
        { error: '유효하지 않은 플랜입니다' },
        { status: 400 }
      )
    }

    // Validate billing period
    if (!billingPeriod || !Object.values(BillingPeriod).includes(billingPeriod as BillingPeriod)) {
      return NextResponse.json(
        { error: '유효하지 않은 결제 주기입니다' },
        { status: 400 }
      )
    }

    // Validate authKey and customerKey
    if (!authKey || typeof authKey !== 'string') {
      return NextResponse.json(
        { error: '인증키가 필요합니다' },
        { status: 400 }
      )
    }

    if (!customerKey || typeof customerKey !== 'string') {
      return NextResponse.json(
        { error: '고객키가 필요합니다' },
        { status: 400 }
      )
    }

    // Execute use case
    const subscribePlanUseCase = container.resolve<SubscribePlanUseCase>(
      DI_TOKENS.SubscribePlanUseCase
    )

    const result = await subscribePlanUseCase.execute({
      userId: user.id,
      plan: plan as SubscriptionPlan,
      billingPeriod: billingPeriod as BillingPeriod,
      authKey,
      customerKey,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    // Handle PaymentError specifically
    if (error instanceof PaymentError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      )
    }

    // Log unexpected errors
    console.error('Subscription error:', error)

    // Generic error response
    return NextResponse.json(
      { error: '구독 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
