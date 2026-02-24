/**
 * EvaluateOptimizationRulesUseCase
 *
 * 활성화된 모든 최적화 규칙을 평가하고, 조건을 충족하는 규칙의 액션을 실행하는 유스케이스.
 * 크론잡에서 주기적으로 호출됨.
 *
 * 실행 순서:
 * 1. 활성화된 규칙 전체 조회
 * 2. 캠페인 조회 (ACTIVE 상태만 평가)
 * 3. 최근 KPI 조회
 * 4. rule.evaluate(kpi) && rule.canTrigger() → AutoOptimizeCampaignUseCase 호출
 * 5. rule.recordTrigger() → 저장
 */
import { IOptimizationRuleRepository } from '@domain/repositories/IOptimizationRuleRepository'
import { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import { IKPIRepository } from '@domain/repositories/IKPIRepository'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'
import { AutoOptimizeCampaignUseCase, AutoOptimizeCampaignResult } from './AutoOptimizeCampaignUseCase'

export interface EvaluateOptimizationRulesResult {
  evaluatedCount: number
  triggeredCount: number
  actions: Array<{
    ruleId: string
    campaignId: string
    actionType: string
    estimatedSavings: number
  }>
}

export class EvaluateOptimizationRulesUseCase {
  constructor(
    private readonly ruleRepository: IOptimizationRuleRepository,
    private readonly campaignRepository: ICampaignRepository,
    private readonly kpiRepository: IKPIRepository,
    private readonly autoOptimizeUseCase: AutoOptimizeCampaignUseCase
  ) {}

  async execute(): Promise<EvaluateOptimizationRulesResult> {
    const rules = await this.ruleRepository.findEnabledRules()

    let evaluatedCount = 0
    let triggeredCount = 0
    const actions: EvaluateOptimizationRulesResult['actions'] = []

    for (const rule of rules) {
      // 캠페인 조회
      const campaign = await this.campaignRepository.findById(rule.campaignId)
      if (!campaign || campaign.status !== CampaignStatus.ACTIVE) continue

      // 최근 KPI 조회
      const kpi = await this.kpiRepository.findLatestByCampaignId(rule.campaignId)
      if (!kpi) continue

      evaluatedCount++

      // 조건 평가
      const conditionMet = rule.evaluate(kpi, campaign.dailyBudget.amount)
      if (!conditionMet) continue

      // 쿨다운 확인
      if (!rule.canTrigger()) continue

      // 액션 실행
      let result: AutoOptimizeCampaignResult
      try {
        result = await this.autoOptimizeUseCase.execute({
          rule,
          campaignId: rule.campaignId,
          kpi,
          userId: rule.userId,
        })
      } catch {
        // 개별 액션 실패는 전체 평가를 중단하지 않음
        continue
      }

      triggeredCount++
      actions.push({
        ruleId: rule.id,
        campaignId: rule.campaignId,
        actionType: result.actionType,
        estimatedSavings: result.estimatedSavings,
      })

      // 트리거 기록 저장
      const triggered = rule.recordTrigger()
      await this.ruleRepository.save(triggered)
    }

    return { evaluatedCount, triggeredCount, actions }
  }
}
