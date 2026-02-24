import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AutoOptimizeCampaignUseCase } from '@application/use-cases/optimization/AutoOptimizeCampaignUseCase'
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

const makeRule = (actionType: 'PAUSE_CAMPAIGN' | 'REDUCE_BUDGET' | 'ALERT_ONLY', percentage?: number) =>
  OptimizationRule.restore({
    id: 'rule-1',
    campaignId: 'campaign-1',
    userId: 'user-1',
    name: '테스트 규칙',
    ruleType: 'CPA_THRESHOLD',
    conditions: [RuleCondition.create('cpa', 'gt', 1)],
    actions: [
      actionType === 'REDUCE_BUDGET'
        ? RuleAction.reduceBudget(percentage ?? 30)
        : actionType === 'ALERT_ONLY'
        ? RuleAction.alertOnly('in_app')
        : RuleAction.pauseCampaign(),
    ],
    isEnabled: true,
    lastTriggeredAt: null,
    triggerCount: 0,
    cooldownMinutes: 60,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

const makeCampaign = () =>
  Campaign.restore({
    id: 'campaign-1',
    userId: 'user-1',
    name: '테스트 캠페인',
    objective: CampaignObjective.CONVERSIONS,
    status: CampaignStatus.ACTIVE,
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
    spend: Money.create(50000, 'KRW'),
    revenue: Money.create(80000, 'KRW'),
    date: new Date(),
  })

describe('AutoOptimizeCampaignUseCase', () => {
  let campaignRepository: MockCampaignRepository
  let kpiRepository: MockKPIRepository
  let metaAdsService: { updateCampaignStatus: ReturnType<typeof vi.fn> }
  let useCase: AutoOptimizeCampaignUseCase

  beforeEach(() => {
    campaignRepository = new MockCampaignRepository()
    kpiRepository = new MockKPIRepository()
    metaAdsService = { updateCampaignStatus: vi.fn().mockResolvedValue(undefined) }
    useCase = new AutoOptimizeCampaignUseCase(
      campaignRepository,
      metaAdsService as never
    )
  })

  it('should_pause_campaign_when_PAUSE_CAMPAIGN_action', async () => {
    const campaign = makeCampaign()
    await campaignRepository.save(campaign)
    const kpi = makeKPI()

    const result = await useCase.execute({
      rule: makeRule('PAUSE_CAMPAIGN'),
      campaignId: 'campaign-1',
      kpi,
      userId: 'user-1',
    })

    expect(result.actionType).toBe('PAUSE_CAMPAIGN')
    const updated = await campaignRepository.findById('campaign-1')
    expect(updated?.status).toBe(CampaignStatus.PAUSED)
  })

  it('should_reduce_budget_when_REDUCE_BUDGET_action', async () => {
    const campaign = makeCampaign()
    await campaignRepository.save(campaign)
    const kpi = makeKPI()

    const result = await useCase.execute({
      rule: makeRule('REDUCE_BUDGET', 30),
      campaignId: 'campaign-1',
      kpi,
      userId: 'user-1',
    })

    expect(result.actionType).toBe('REDUCE_BUDGET')
    const updated = await campaignRepository.findById('campaign-1')
    // 100000 * (1 - 0.30) = 70000
    expect(updated?.dailyBudget.amount).toBe(70000)
  })

  it('should_skip_campaign_update_when_ALERT_ONLY_action', async () => {
    const campaign = makeCampaign()
    await campaignRepository.save(campaign)
    const kpi = makeKPI()

    const result = await useCase.execute({
      rule: makeRule('ALERT_ONLY'),
      campaignId: 'campaign-1',
      kpi,
      userId: 'user-1',
    })

    expect(result.actionType).toBe('ALERT_ONLY')
    // 캠페인 상태는 변경 없음
    const updated = await campaignRepository.findById('campaign-1')
    expect(updated?.status).toBe(CampaignStatus.ACTIVE)
  })

  it('should_return_estimated_savings', async () => {
    const campaign = makeCampaign()
    await campaignRepository.save(campaign)
    const kpi = makeKPI()

    const result = await useCase.execute({
      rule: makeRule('PAUSE_CAMPAIGN'),
      campaignId: 'campaign-1',
      kpi,
      userId: 'user-1',
    })

    // PAUSE_CAMPAIGN: estimatedSavings = kpi.spend = 50000
    expect(result.estimatedSavings).toBe(50000)
  })
})
