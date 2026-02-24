/**
 * UpdateOptimizationRuleUseCase
 *
 * 자동 최적화 규칙을 수정하는 유스케이스.
 * 권한 확인 후 name/conditions/actions/isEnabled/cooldownMinutes 업데이트.
 */
import { IOptimizationRuleRepository } from '@domain/repositories/IOptimizationRuleRepository'
import { RuleCondition } from '@domain/value-objects/RuleCondition'
import { RuleAction } from '@domain/value-objects/RuleAction'
import type { ConditionMetric, ConditionOperator } from '@domain/value-objects/RuleCondition'
import type { ActionType, NotifyChannel } from '@domain/value-objects/RuleAction'
import {
  UpdateOptimizationRuleDTO,
  OptimizationRuleResponseDTO,
  toOptimizationRuleDTO,
} from '@application/dto/optimization/OptimizationRuleDTO'
import { OptimizationRule } from '@domain/entities/OptimizationRule'

export type { UpdateOptimizationRuleDTO }

export class OptimizationRuleNotFoundError extends Error {
  constructor(id: string) {
    super(`OptimizationRule not found: ${id}`)
    this.name = 'OptimizationRuleNotFoundError'
  }
}

export class UnauthorizedOptimizationRuleError extends Error {
  constructor(ruleId: string, userId: string) {
    super(`Unauthorized: user "${userId}" cannot access rule "${ruleId}"`)
    this.name = 'UnauthorizedOptimizationRuleError'
  }
}

export class UpdateOptimizationRuleUseCase {
  constructor(
    private readonly ruleRepository: IOptimizationRuleRepository
  ) {}

  async execute(dto: UpdateOptimizationRuleDTO): Promise<OptimizationRuleResponseDTO> {
    const rule = await this.ruleRepository.findById(dto.ruleId)
    if (!rule) throw new OptimizationRuleNotFoundError(dto.ruleId)
    if (rule.userId !== dto.userId) throw new UnauthorizedOptimizationRuleError(dto.ruleId, dto.userId)

    // 변경 가능 필드 순서대로 적용
    let updated: OptimizationRule = rule

    if (dto.name !== undefined) {
      updated = OptimizationRule.restore({
        id: updated.id,
        campaignId: updated.campaignId,
        userId: updated.userId,
        name: dto.name,
        ruleType: updated.ruleType,
        conditions: updated.conditions,
        actions: updated.actions,
        isEnabled: updated.isEnabled,
        lastTriggeredAt: updated.lastTriggeredAt,
        triggerCount: updated.triggerCount,
        cooldownMinutes: updated.cooldownMinutes,
        createdAt: updated.createdAt,
        updatedAt: new Date(),
      })
    }

    if (dto.conditions !== undefined) {
      const conditions = dto.conditions.map(c =>
        RuleCondition.create(c.metric as ConditionMetric, c.operator as ConditionOperator, c.value)
      )
      updated = updated.updateConditions(conditions)
    }

    if (dto.actions !== undefined) {
      const actions = dto.actions.map(a =>
        RuleAction.create(a.type as ActionType, {
          percentage: a.params?.percentage,
          notifyChannel: a.params?.notifyChannel as NotifyChannel | undefined,
        })
      )
      updated = updated.updateActions(actions)
    }

    if (dto.isEnabled !== undefined) {
      updated = dto.isEnabled ? updated.enable() : updated.disable()
    }

    if (dto.cooldownMinutes !== undefined) {
      updated = OptimizationRule.restore({
        id: updated.id,
        campaignId: updated.campaignId,
        userId: updated.userId,
        name: updated.name,
        ruleType: updated.ruleType,
        conditions: updated.conditions,
        actions: updated.actions,
        isEnabled: updated.isEnabled,
        lastTriggeredAt: updated.lastTriggeredAt,
        triggerCount: updated.triggerCount,
        cooldownMinutes: dto.cooldownMinutes,
        createdAt: updated.createdAt,
        updatedAt: new Date(),
      })
    }

    const saved = await this.ruleRepository.save(updated)
    return toOptimizationRuleDTO(saved)
  }
}
