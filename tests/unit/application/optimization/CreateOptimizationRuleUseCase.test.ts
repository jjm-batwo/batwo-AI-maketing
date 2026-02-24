import { describe, it, expect, beforeEach } from 'vitest'
import { CreateOptimizationRuleUseCase } from '@application/use-cases/optimization/CreateOptimizationRuleUseCase'
import { MockOptimizationRuleRepository } from '@tests/mocks/repositories/MockOptimizationRuleRepository'

describe('CreateOptimizationRuleUseCase', () => {
  let useCase: CreateOptimizationRuleUseCase
  let repository: MockOptimizationRuleRepository

  beforeEach(() => {
    repository = new MockOptimizationRuleRepository()
    useCase = new CreateOptimizationRuleUseCase(repository)
  })

  it('should_create_optimization_rule_when_valid_dto_provided', async () => {
    const result = await useCase.execute({
      campaignId: 'campaign-1',
      userId: 'user-1',
      name: 'CPA 상한 초과 시 일시중지',
      ruleType: 'CPA_THRESHOLD',
      conditions: [{ metric: 'cpa', operator: 'gt', value: 15000 }],
      actions: [{ type: 'PAUSE_CAMPAIGN' }],
      isEnabled: true,
      cooldownMinutes: 60,
    })

    expect(result.id).toBeDefined()
    expect(result.campaignId).toBe('campaign-1')
    expect(result.userId).toBe('user-1')
    expect(result.name).toBe('CPA 상한 초과 시 일시중지')
    expect(result.ruleType).toBe('CPA_THRESHOLD')
    expect(result.conditions).toHaveLength(1)
    expect(result.conditions[0].metric).toBe('cpa')
    expect(result.actions).toHaveLength(1)
    expect(result.actions[0].type).toBe('PAUSE_CAMPAIGN')
    expect(result.isEnabled).toBe(true)
    expect(result.triggerCount).toBe(0)
  })

  it('should_save_rule_to_repository', async () => {
    await useCase.execute({
      campaignId: 'campaign-1',
      userId: 'user-1',
      name: 'ROAS 하한 미달',
      ruleType: 'ROAS_FLOOR',
      conditions: [{ metric: 'roas', operator: 'lt', value: 1.0 }],
      actions: [{ type: 'REDUCE_BUDGET', params: { percentage: 30 } }],
    })

    const saved = repository.getAll()
    expect(saved).toHaveLength(1)
    expect(saved[0].ruleType).toBe('ROAS_FLOOR')
  })

  it('should_use_default_values_when_optional_fields_omitted', async () => {
    const result = await useCase.execute({
      campaignId: 'campaign-1',
      userId: 'user-1',
      name: '기본 규칙',
      ruleType: 'BUDGET_PACE',
      conditions: [{ metric: 'spend_pace', operator: 'gt', value: 120 }],
      actions: [{ type: 'ALERT_ONLY', params: { notifyChannel: 'in_app' } }],
    })

    // isEnabled 기본값 true
    expect(result.isEnabled).toBe(true)
    // cooldownMinutes 기본값 60
    expect(result.cooldownMinutes).toBe(60)
  })
})
