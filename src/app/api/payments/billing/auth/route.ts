import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { SubscriptionPlan, PLAN_CONFIGS, isFreePlan } from '@domain/value-objects/SubscriptionPlan'
import { BillingPeriod, getBillingAmount } from '@domain/value-objects/BillingPeriod'
import type { CheckoutInfoDTO } from '@application/dto/payment/PaymentDTOs'

/**
 * POST /api/payments/billing/auth
 * 결제 인증 요청 정보 생성 (체크아웃 페이지용)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인
    const user = await getAuthenticatedUser()
    if (!user) {
      return unauthorizedResponse()
    }

    // 2. 요청 바디 파싱
    const body = await request.json()
    const { plan, billingPeriod } = body

    // 3. 플랜 검증
    if (!plan || !Object.values(SubscriptionPlan).includes(plan as SubscriptionPlan)) {
      return NextResponse.json(
        { error: '유효하지 않은 플랜입니다' },
        { status: 400 }
      )
    }

    if (isFreePlan(plan as SubscriptionPlan)) {
      return NextResponse.json(
        { error: '무료 플랜은 결제가 필요하지 않습니다' },
        { status: 400 }
      )
    }

    // 4. 결제 주기 검증
    if (!billingPeriod || !Object.values(BillingPeriod).includes(billingPeriod as BillingPeriod)) {
      return NextResponse.json(
        { error: '유효하지 않은 결제 주기입니다' },
        { status: 400 }
      )
    }

    const planEnum = plan as SubscriptionPlan
    const periodEnum = billingPeriod as BillingPeriod

    // 5. 플랜 설정 조회
    const planConfig = PLAN_CONFIGS[planEnum]

    // 6. 금액 계산
    const amount = getBillingAmount(planConfig.price, planConfig.annualPrice, periodEnum)

    // 7. 고객 키 생성
    const customerKey = `customer_${user.id}`

    // 8. 주문명 생성
    const periodLabel = periodEnum === BillingPeriod.MONTHLY ? '월간' : '연간'
    const orderName = `바투 AI ${planConfig.label} 플랜 (${periodLabel})`

    // 9. 응답 생성
    const response: CheckoutInfoDTO = {
      plan: planEnum,
      planLabel: planConfig.label,
      billingPeriod: periodEnum,
      amount,
      orderName,
      customerKey,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('결제 인증 요청 생성 실패:', error)
    return NextResponse.json(
      { error: '결제 인증 요청을 생성하는 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
