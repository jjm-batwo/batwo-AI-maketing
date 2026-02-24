/**
 * AutoOptimizeCampaignUseCase
 *
 * 평가된 최적화 규칙의 액션을 실제로 실행하는 유스케이스.
 * PAUSE_CAMPAIGN: 캠페인 일시중지
 * REDUCE_BUDGET: 일 예산 감소
 * ALERT_ONLY: 액션 없음 (로그만)
 */
import { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import { IMetaAdsService } from '@application/ports/IMetaAdsService'
import { OptimizationRule } from '@domain/entities/OptimizationRule'
import { KPI } from '@domain/entities/KPI'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'
import { Money } from '@domain/value-objects/Money'
import { SavingsCalculator } from '@domain/value-objects/SavingsCalculator'

export interface AutoOptimizeCampaignDTO {
  rule: OptimizationRule
  campaignId: string
  kpi: KPI
  userId: string
  accessToken?: string
}

export interface AutoOptimizeCampaignResult {
  actionType: string
  estimatedSavings: number
}

export class AutoOptimizeCampaignUseCase {
  constructor(
    private readonly campaignRepository: ICampaignRepository,
    private readonly metaAdsService: IMetaAdsService
  ) {}

  async execute(dto: AutoOptimizeCampaignDTO): Promise<AutoOptimizeCampaignResult> {
    const campaign = await this.campaignRepository.findById(dto.campaignId)
    if (!campaign) {
      return { actionType: 'NONE', estimatedSavings: 0 }
    }

    // 첫 번째 액션만 실행 (단일 액션 원칙)
    const action = dto.rule.actions[0]
    if (!action) {
      return { actionType: 'NONE', estimatedSavings: 0 }
    }

    // 절감액 계산
    const savings = SavingsCalculator.calculateProjectedSavings(dto.kpi, action)
    const estimatedSavings = savings.amount

    switch (action.type) {
      case 'PAUSE_CAMPAIGN': {
        if (campaign.status === CampaignStatus.ACTIVE) {
          const paused = campaign.changeStatus(CampaignStatus.PAUSED)

          // Meta Ads 동기화 (accessToken이 있을 경우)
          if (dto.accessToken && campaign.metaCampaignId) {
            await this.metaAdsService.updateCampaignStatus(
              dto.accessToken,
              campaign.metaCampaignId,
              'PAUSED'
            )
          }

          await this.campaignRepository.update(paused)
        }
        return { actionType: 'PAUSE_CAMPAIGN', estimatedSavings }
      }

      case 'REDUCE_BUDGET': {
        const percentage = action.params.percentage
        if (percentage && percentage > 0) {
          const currentAmount = campaign.dailyBudget.amount
          const newAmount = currentAmount * (1 - percentage / 100)
          const newBudget = Money.create(Math.round(newAmount), campaign.dailyBudget.currency)
          const updated = campaign.updateBudget(newBudget)
          await this.campaignRepository.update(updated)
        }
        return { actionType: 'REDUCE_BUDGET', estimatedSavings }
      }

      case 'ALERT_ONLY':
      default:
        // 알림만: 캠페인 변경 없음
        return { actionType: action.type, estimatedSavings }
    }
  }
}
