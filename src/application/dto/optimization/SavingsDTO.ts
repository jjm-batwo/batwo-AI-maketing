/**
 * SavingsDTO
 *
 * 절감 금액 대시보드 응답 DTO.
 * 누적 절감액, 최적화 건수, 최대 절감 이벤트, 최근 최적화 이력을 포함.
 */

export interface SavingsReportDTO {
  /** 누적 총 절감액 */
  totalSavings: { amount: number; currency: string }
  /** 총 최적화 실행 횟수 */
  totalOptimizations: number
  /** 가장 큰 절감 이벤트 (없으면 null) */
  topSavingEvent: {
    campaignId: string
    campaignName: string
    ruleName: string
    estimatedSavings: { amount: number; currency: string }
  } | null
  /** 최근 최적화 이력 (최대 10건, lastTriggeredAt 내림차순) */
  recentOptimizations: {
    ruleId: string
    ruleName: string
    campaignId: string
    campaignName: string
    actionType: string
    estimatedSavings: { amount: number; currency: string }
    triggeredAt: string
  }[]
}
