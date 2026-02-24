import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EvaluateOptimizationRulesUseCase } from '@application/use-cases/optimization/EvaluateOptimizationRulesUseCase'
import { AutoOptimizeCampaignUseCase } from '@application/use-cases/optimization/AutoOptimizeCampaignUseCase'
import { MockOptimizationRuleRepository } from '@tests/mocks/repositories/MockOptimizationRuleRepository'
import { MockCampaignRepository } from '@tests/mocks/repositories/MockCampaignRepository'
import { MockKPIRepository } from '@tests/mocks/repositories/MockKPIRepository'
import { OptimizationRule } from '@domain/entities/OptimizationRule'
import { RuleCondition } from '@domain/value-objects/RuleCondition'
import { RuleAction } from '@domain/value-objects/RuleAction'
import { Campaign } from '@domain/entities/Campaign'
import { KPI } from '@domain/entities/KPI'
import { Money } from '@domain/value-objects/Money'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'

// 테스트 픽스처 헬퍼
const makeRule = (overrides?: Partial<Parameters<typeof OptimizationRule.restore>[0]>) =>
  OptimizationRule.restore({
    id: 'rule-1',
    campaignId: 'campaign-1',
    userId: 'user-1',
    name: 'CPA 상한',
    ruleType: 'CPA_THRESHOLD',
    // CPA > 1원 → 항상 트리거
    conditions: [RuleCondition.create('cpa', 'gt', 1)],
    actions: [RuleAction.pauseCampaign()],
    isEnabled: true,
    lastTriggeredAt: null,
    triggerCount: 0,
    cooldownMinutes: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  })

const makeCampaign = (status = CampaignStatus.ACTIVE) =>
  Campaign.restore({
    id: 'campaign-1',
    userId: 'user-1',
    name: '테스트 캠페인',
    objective: CampaignObjective.CONVERSIONS,
    status,
    dailyBudget: Money.create(100000, 'KRW'),
    startDate: new Date('2025-01-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
  })

const makeKPI = () =>
  KPI.create({
    campaignId: 'campaign-1',
    impressions: 1000,
    clicks: 50,
    linkClicks: 40,
    conversions: 2,
    spend: Money.create(50000, 'KRW'), // CPA = 25000 > 1 → 조건 충족
    revenue: Money.create(80000, 'KRW'),
    date: new Date(),
  })

describe('EvaluateOptimizationRulesUseCase', () => {
  let ruleRepository: MockOptimizationRuleRepository
  let campaignRepository: MockCampaignRepository
  let kpiRepository: MockKPIRepository
  let autoOptimizeUseCase: AutoOptimizeCampaignUseCase
  let useCase: EvaluateOptimizationRulesUseCase

  beforeEach(() => {
    ruleRepository = new MockOptimizationRuleRepository()
    campaignRepository = new MockCampaignRepository()
    kpiRepository = new MockKPIRepository()
    autoOptimizeUseCase = {
      execute: vi.fn().mockResolvedValue({ actionType: 'PAUSE_CAMPAIGN', estimatedSavings: 50000 }),
    } as unknown as AutoOptimizeCampaignUseCase

    useCase = new EvaluateOptimizationRulesUseCase(
      ruleRepository,
      campaignRepository,
      kpiRepository,
      autoOptimizeUseCase
    )
  })

  it('should_trigger_action_when_condition_is_met', async () => {
    await ruleRepository.save(makeRule())
    await campaignRepository.save(makeCampaign())
    await kpiRepository.save(makeKPI())

    const result = await useCase.execute()

    expect(result.evaluatedCount).toBe(1)
    expect(result.triggeredCount).toBe(1)
    expect(autoOptimizeUseCase.execute).toHaveBeenCalledOnce()
  })

  it('should_not_trigger_when_no_active_campaigns', async () => {
    // PAUSED 캠페인 → 평가 대상 아님
    await ruleRepository.save(makeRule())
    await campaignRepository.save(makeCampaign(CampaignStatus.PAUSED))
    await kpiRepository.save(makeKPI())

    const result = await useCase.execute()

    expect(result.triggeredCount).toBe(0)
    expect(autoOptimizeUseCase.execute).not.toHaveBeenCalled()
  })

  it('should_not_trigger_when_cooldown_not_elapsed', async () => {
    // lastTriggeredAt을 방금 전으로 설정, cooldownMinutes=60 → 아직 쿨다운 중
    const recentlyTriggered = makeRule({
      lastTriggeredAt: new Date(),
      cooldownMinutes: 60,
    })
    await ruleRepository.save(recentlyTriggered)
    await campaignRepository.save(makeCampaign())
    await kpiRepository.save(makeKPI())

    const result = await useCase.execute()

    expect(result.triggeredCount).toBe(0)
    expect(autoOptimizeUseCase.execute).not.toHaveBeenCalled()
  })

  it('should_not_trigger_when_kpi_not_found', async () => {
    await ruleRepository.save(makeRule())
    await campaignRepository.save(makeCampaign())
    // KPI 저장 안 함

    const result = await useCase.execute()

    expect(result.triggeredCount).toBe(0)
  })

  it('should_record_trigger_after_execution', async () => {
    await ruleRepository.save(makeRule())
    await campaignRepository.save(makeCampaign())
    await kpiRepository.save(makeKPI())

    await useCase.execute()

    const updatedRule = await ruleRepository.findById('rule-1')
    expect(updatedRule?.triggerCount).toBe(1)
    expect(updatedRule?.lastTriggeredAt).not.toBeNull()
  })
})
