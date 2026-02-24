/**
 * CalculateSavingsUseCase
 *
 * 사용자의 최적화 규칙 실행 이력을 기반으로 누적 절감액을 계산한다.
 * triggerCount > 0인 규칙의 KPI를 조회해 SavingsCalculator로 절감액을 추정하고 합산.
 */
import { IOptimizationRuleRepository } from '@domain/repositories/IOptimizationRuleRepository'
import { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import { IKPIRepository } from '@domain/repositories/IKPIRepository'
import { SavingsCalculator } from '@domain/value-objects/SavingsCalculator'
import { SavingsReportDTO } from '@application/dto/optimization/SavingsDTO'

export class CalculateSavingsUseCase {
  constructor(
    private readonly ruleRepo: IOptimizationRuleRepository,
    private readonly campaignRepo: ICampaignRepository,
    private readonly kpiRepo: IKPIRepository,
  ) {}

  async execute(userId: string): Promise<SavingsReportDTO> {
    // 1. 사용자의 모든 규칙 조회
    const rules = await this.ruleRepo.findByUserId(userId)

    // 트리거된 적 있는 규칙만 필터
    const triggeredRules = rules.filter(r => r.triggerCount > 0)

    if (triggeredRules.length === 0) {
      return this.emptyReport()
    }

    // 2. 각 규칙의 캠페인/KPI 조회 → 절감액 계산
    let totalAmount = 0
    let totalOptimizations = 0
    let topEvent: SavingsReportDTO['topSavingEvent'] = null
    let topSavingsAmount = 0
    const recentOptimizations: SavingsReportDTO['recentOptimizations'] = []

    for (const rule of triggeredRules) {
      // 캠페인 조회 (삭제된 캠페인은 건너뜀)
      const campaign = await this.campaignRepo.findById(rule.campaignId)
      if (!campaign) continue

      // 최신 KPI 조회 (KPI 없는 경우 건너뜀)
      const kpi = await this.kpiRepo.findLatestByCampaignId(rule.campaignId)
      if (!kpi) continue

      // 첫 번째 액션 기준으로 절감액 계산
      const primaryAction = rule.actions[0]
      if (!primaryAction) continue

      const savings = SavingsCalculator.calculateProjectedSavings(kpi, primaryAction)
      const savingsPerTrigger = savings.amount
      const totalSavingsForRule = savingsPerTrigger * rule.triggerCount

      totalAmount += totalSavingsForRule
      totalOptimizations += rule.triggerCount

      // 가장 큰 절감 이벤트 추적 (누적 기준)
      if (totalSavingsForRule > topSavingsAmount) {
        topSavingsAmount = totalSavingsForRule
        topEvent = {
          campaignId: rule.campaignId,
          campaignName: campaign.name,
          ruleName: rule.name,
          estimatedSavings: { amount: Math.round(totalSavingsForRule), currency: 'KRW' },
        }
      }

      // 최근 최적화 이력 추가
      recentOptimizations.push({
        ruleId: rule.id,
        ruleName: rule.name,
        campaignId: rule.campaignId,
        campaignName: campaign.name,
        actionType: primaryAction.type,
        estimatedSavings: { amount: Math.round(savingsPerTrigger), currency: 'KRW' },
        triggeredAt: rule.lastTriggeredAt?.toISOString() ?? new Date().toISOString(),
      })
    }

    // lastTriggeredAt 기준 내림차순 정렬, 최근 10건만 반환
    recentOptimizations.sort(
      (a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
    )

    return {
      totalSavings: { amount: Math.round(totalAmount), currency: 'KRW' },
      totalOptimizations,
      topSavingEvent: topEvent,
      recentOptimizations: recentOptimizations.slice(0, 10),
    }
  }

  /** 트리거된 규칙이 없을 때 반환하는 빈 리포트 */
  private emptyReport(): SavingsReportDTO {
    return {
      totalSavings: { amount: 0, currency: 'KRW' },
      totalOptimizations: 0,
      topSavingEvent: null,
      recentOptimizations: [],
    }
  }
}
