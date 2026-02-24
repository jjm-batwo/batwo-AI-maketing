import { describe, it, expect, beforeEach } from 'vitest'
import { UpdateOptimizationRuleUseCase } from '@application/use-cases/optimization/UpdateOptimizationRuleUseCase'
import { MockOptimizationRuleRepository } from '@tests/mocks/repositories/MockOptimizationRuleRepository'
import { OptimizationRule } from '@domain/entities/OptimizationRule'
import { RuleCondition } from '@domain/value-objects/RuleCondition'
import { RuleAction } from '@domain/value-objects/RuleAction'

const makeRule = (overrides?: Partial<Parameters<typeof OptimizationRule.restore>[0]>) =>
  OptimizationRule.restore({
    id: 'rule-1',
    campaignId: 'campaign-1',
    userId: 'user-1',
    name: '기존 규칙',
    ruleType: 'CPA_THRESHOLD',
    conditions: [RuleCondition.create('cpa', 'gt', 15000)],
    actions: [RuleAction.pauseCampaign()],
    isEnabled: true,
    lastTriggeredAt: null,
    triggerCount: 0,
    cooldownMinutes: 60,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  })

describe('UpdateOptimizationRuleUseCase', () => {
  let useCase: UpdateOptimizationRuleUseCase
  let repository: MockOptimizationRuleRepository

  beforeEach(() => {
    repository = new MockOptimizationRuleRepository()
    useCase = new UpdateOptimizationRuleUseCase(repository)
  })

  it('should_update_rule_name_when_name_provided', async () => {
    await repository.save(makeRule())

    const result = await useCase.execute({
      ruleId: 'rule-1',
      userId: 'user-1',
      name: '수정된 규칙 이름',
    })

    expect(result.name).toBe('수정된 규칙 이름')
  })

  it('should_disable_rule_when_isEnabled_false_provided', async () => {
    await repository.save(makeRule())

    const result = await useCase.execute({
      ruleId: 'rule-1',
      userId: 'user-1',
      isEnabled: false,
    })

    expect(result.isEnabled).toBe(false)
  })

  it('should_throw_when_rule_not_found', async () => {
    await expect(
      useCase.execute({ ruleId: 'nonexistent', userId: 'user-1' })
    ).rejects.toThrow('OptimizationRule not found')
  })

  it('should_throw_when_user_not_authorized', async () => {
    await repository.save(makeRule())

    await expect(
      useCase.execute({ ruleId: 'rule-1', userId: 'other-user' })
    ).rejects.toThrow('Unauthorized')
  })
})
