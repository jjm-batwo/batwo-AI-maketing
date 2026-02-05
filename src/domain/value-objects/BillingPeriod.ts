/**
 * 결제 주기 값 객체
 * MONTHLY: 월간 결제
 * ANNUAL: 연간 결제
 */
export enum BillingPeriod {
  MONTHLY = 'MONTHLY',
  ANNUAL = 'ANNUAL',
}

/**
 * 결제 주기별 금액 계산 (SubscriptionPlan의 price/annualPrice 기반)
 * @param monthlyPrice - 월간 가격 (원)
 * @param annualPricePerMonth - 연간 결제 시 월 환산 가격 (원)
 * @param period - 결제 주기
 * @returns 결제 금액 (원)
 */
export function getBillingAmount(
  monthlyPrice: number,
  annualPricePerMonth: number,
  period: BillingPeriod
): number {
  switch (period) {
    case BillingPeriod.MONTHLY:
      return monthlyPrice
    case BillingPeriod.ANNUAL:
      return annualPricePerMonth * 12
    default:
      throw new Error(`Unknown billing period: ${period}`)
  }
}

/**
 * 다음 결제일 계산
 * @param currentDate - 현재 날짜
 * @param period - 결제 주기
 * @returns 다음 결제일
 */
export function getNextBillingDate(currentDate: Date, period: BillingPeriod): Date {
  const next = new Date(currentDate)
  switch (period) {
    case BillingPeriod.MONTHLY:
      next.setMonth(next.getMonth() + 1)
      break
    case BillingPeriod.ANNUAL:
      next.setFullYear(next.getFullYear() + 1)
      break
    default:
      throw new Error(`Unknown billing period: ${period}`)
  }
  return next
}

/**
 * 결제 주기 종료일 계산 (구독 기간)
 * @param startDate - 시작일
 * @param period - 결제 주기
 * @returns 종료일
 */
export function getPeriodEndDate(startDate: Date, period: BillingPeriod): Date {
  return getNextBillingDate(startDate, period)
}
