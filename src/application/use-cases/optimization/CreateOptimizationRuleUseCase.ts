/**
 * CreateOptimizationRuleUseCase
 *
 * 자동 최적화 규칙을 생성하고 저장하는 유스케이스.
 * RuleCondition/RuleAction 값 객체로 변환 후 OptimizationRule.create() 호출.
 */
import { OptimizationRule } from '@domain/entities/OptimizationRule'
import { RuleCondition } from '@domain/value-objects/RuleCondition'
import { RuleAction } from '@domain/value-objects/RuleAction'
import { IOptimizationRuleRepository } from '@domain/repositories/IOptimizationRuleRepository'
import type { ConditionMetric, ConditionOperator } from '@domain/value-objects/RuleCondition'
import type { ActionType, NotifyChannel } from '@domain/value-objects/RuleAction'
import {
  CreateOptimizationRuleDTO,
  OptimizationRuleResponseDTO,
  toOptimizationRuleDTO,
} from '@application/dto/optimization/OptimizationRuleDTO'

export type { CreateOptimizationRuleDTO }

export class CreateOptimizationRuleUseCase {
  constructor(
    private readonly ruleRepository: IOptimizationRuleRepository
  ) {}

  async execute(dto: CreateOptimizationRuleDTO): Promise<OptimizationRuleResponseDTO> {
    // 조건 값 객체 변환
    const conditions = dto.conditions.map(c =>
      RuleCondition.create(
        c.metric as ConditionMetric,
        c.operator as ConditionOperator,
        c.value
      )
    )

    // 액션 값 객체 변환
    const actions = dto.actions.map(a =>
      RuleAction.create(a.type as ActionType, {
        percentage: a.params?.percentage,
        notifyChannel: a.params?.notifyChannel as NotifyChannel | undefined,
      })
    )

    // 도메인 엔티티 생성
    const rule = OptimizationRule.create({
      campaignId: dto.campaignId,
      userId: dto.userId,
      name: dto.name,
      ruleType: dto.ruleType,
      conditions,
      actions,
      isEnabled: dto.isEnabled ?? true,
      cooldownMinutes: dto.cooldownMinutes ?? 60,
    })

    // 저장
    const saved = await this.ruleRepository.save(rule)

    return toOptimizationRuleDTO(saved)
  }
}
