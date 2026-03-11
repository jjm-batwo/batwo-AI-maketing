import { ApplyOptimizationDTO, ApplyOptimizationResult } from '../../dto/ai/ApplyOptimizationDTO'
import { PendingAction, ActionDetail } from '@/domain/entities/PendingAction'
import { ICampaignRepository } from '@/domain/repositories/ICampaignRepository'
import { IPendingActionRepository } from '@/domain/repositories/IPendingActionRepository'
import { IConversationRepository } from '@/domain/repositories/IConversationRepository'
import { Campaign } from '@/domain/entities/Campaign'
import { ApplyAction } from '@/domain/value-objects/ApplyAction'

export class ApplyOptimizationUseCase {
  constructor(
    private readonly pendingActionRepository: IPendingActionRepository,
    private readonly campaignRepository: ICampaignRepository,
    private readonly conversationRepository: IConversationRepository
  ) {}

  async execute(dto: ApplyOptimizationDTO): Promise<ApplyOptimizationResult> {
    const campaign = await this.campaignRepository.findById(dto.action.campaignId)
    if (!campaign || campaign.userId !== dto.userId) {
      throw new Error('캠페인을 찾을 수 없습니다')
    }

    const pendingAction = PendingAction.create({
      conversationId: dto.conversationId ?? 'optimization-direct',
      toolName: `apply_${dto.action.type}`,
      toolArgs: {
        campaignId: dto.action.campaignId,
        currentValue: dto.action.currentValue,
        newValue: dto.action.suggestedValue,
      },
      displaySummary: dto.action.description,
      details: this.buildDetails(dto.action, campaign),
      warnings: this.buildWarnings(dto.action),
    })

    await this.pendingActionRepository.save(pendingAction)

    return {
      pendingActionId: pendingAction.id,
      requiresConfirmation: true,
      details: pendingAction.details,
      warnings: pendingAction.warnings,
      expiresAt: pendingAction.expiresAt,
    }
  }

  private buildDetails(action: ApplyAction, campaign: Campaign): ActionDetail[] {
    const details: ActionDetail[] = [
      { label: '캠페인', value: campaign.name },
      { label: '최적화 유형', value: action.type },
      { label: '예상 효과', value: action.expectedImpact },
    ]

    if (action.type === 'budget_change') {
      details.push({
        label: '일일 예산',
        value: `${action.currentValue} → ${action.suggestedValue}`,
        changed: true,
      })
    } else if (action.type === 'status_change') {
      details.push({
        label: '상태 변경',
        value: `${action.currentValue} → ${action.suggestedValue}`,
        changed: true,
      })
    } else if (action.type === 'bid_strategy_change') {
      details.push({
        label: '입찰 전략',
        value: `${action.currentValue} → ${action.suggestedValue}`,
        changed: true,
      })
    }

    return details
  }

  private buildWarnings(action: ApplyAction): string[] {
    const warnings: string[] = []
    if (action.type === 'budget_change') {
      const current = Number(action.currentValue)
      const suggested = Number(action.suggestedValue)
      if (!isNaN(current) && !isNaN(suggested)) {
        if (suggested > current * 1.5) {
          warnings.push('예산이 기존 대비 50% 이상 크게 증가합니다. 신중하게 결정하세요.')
        }
      }
    }
    return warnings
  }
}
