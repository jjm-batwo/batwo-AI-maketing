/**
 * ListOptimizationRulesUseCase
 *
 * 사용자의 자동 최적화 규칙 목록을 조회하는 유스케이스.
 * campaignId가 주어지면 해당 캠페인의 규칙만 반환.
 */
import { IOptimizationRuleRepository } from '@domain/repositories/IOptimizationRuleRepository'
import {
  OptimizationRuleResponseDTO,
  toOptimizationRuleDTO,
} from '@application/dto/optimization/OptimizationRuleDTO'

export interface ListOptimizationRulesDTO {
  userId: string
  campaignId?: string
}

export class ListOptimizationRulesUseCase {
  constructor(
    private readonly ruleRepository: IOptimizationRuleRepository
  ) {}

  async execute(dto: ListOptimizationRulesDTO): Promise<OptimizationRuleResponseDTO[]> {
    let rules
    if (dto.campaignId) {
      rules = await this.ruleRepository.findByCampaignId(dto.campaignId)
      // 요청한 userId의 규칙만 필터링
      rules = rules.filter(r => r.userId === dto.userId)
    } else {
      rules = await this.ruleRepository.findByUserId(dto.userId)
    }

    return rules.map(toOptimizationRuleDTO)
  }
}
