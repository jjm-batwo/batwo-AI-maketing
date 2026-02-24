import { describe, it, expect, beforeEach } from 'vitest'
import { CalculateSavingsUseCase } from '@application/use-cases/optimization/CalculateSavingsUseCase'
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

// --- 테스트 픽스처 헬퍼 ---

/** 기본 최적화 규칙 생성 (triggerCount > 0, PAUSE_CAMPAIGN) */
const makeRule = (overrides?: Partial<Parameters<typeof OptimizationRule.restore>[0]>) =>
  OptimizationRule.restore({
    id: 'rule-1',
    campaignId: 'campaign-1',
    userId: 'user-1',
    name: 'CPA 상한 초과 시 일시중지',
    ruleType: 'CPA_THRESHOLD',
    conditions: [RuleCondition.create('cpa', 'gt', 1)],
    actions: [RuleAction.pauseCampaign()],
    isEnabled: true,
    lastTriggeredAt: new Date('2026-01-15T10:00:00Z'),
    triggerCount: 3,
    cooldownMinutes: 60,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-15'),
    ...overrides,
  })

/** 캠페인 생성 */
const makeCampaign = (id = 'campaign-1', name = '테스트 캠페인') =>
  Campaign.restore({
    id,
    userId: 'user-1',
    name,
    objective: CampaignObjective.CONVERSIONS,
    status: CampaignStatus.ACTIVE,
    dailyBudget: Money.create(100000, 'KRW'),
    startDate: new Date('2025-01-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
  })

/** KPI 생성 (지출 50,000 KRW) */
const makeKPI = (campaignId = 'campaign-1', spendAmount = 50000) =>
  KPI.create({
    campaignId,
    impressions: 1000,
    clicks: 50,
    linkClicks: 40,
    conversions: 2,
    spend: Money.create(spendAmount, 'KRW'),
    revenue: Money.create(80000, 'KRW'),
    date: new Date(),
  })

// --- 테스트 스위트 ---

describe('CalculateSavingsUseCase', () => {
  let ruleRepo: MockOptimizationRuleRepository
  let campaignRepo: MockCampaignRepository
  let kpiRepo: MockKPIRepository
  let useCase: CalculateSavingsUseCase

  beforeEach(() => {
    ruleRepo = new MockOptimizationRuleRepository()
    campaignRepo = new MockCampaignRepository()
    kpiRepo = new MockKPIRepository()
    useCase = new CalculateSavingsUseCase(ruleRepo, campaignRepo, kpiRepo)
  })

  it('should_aggregate_monthly_savings_from_optimization_logs', async () => {
    // Given: triggerCount=3, PAUSE_CAMPAIGN, spend=50,000 KRW
    // 예상: 50,000 * 3 = 150,000 KRW 누적 절감
    const rule = makeRule({ triggerCount: 3 })
    await ruleRepo.save(rule)
    await campaignRepo.save(makeCampaign())
    await kpiRepo.save(makeKPI('campaign-1', 50000))

    // When
    const report = await useCase.execute('user-1')

    // Then
    expect(report.totalSavings.amount).toBe(150000)
    expect(report.totalSavings.currency).toBe('KRW')
    expect(report.totalOptimizations).toBe(3)
  })

  it('should_return_zero_when_no_optimizations_performed', async () => {
    // Given: triggerCount=0인 규칙만 존재
    const rule = makeRule({ triggerCount: 0, lastTriggeredAt: null })
    await ruleRepo.save(rule)
    await campaignRepo.save(makeCampaign())
    await kpiRepo.save(makeKPI())

    // When
    const report = await useCase.execute('user-1')

    // Then: 트리거 이력 없으므로 0
    expect(report.totalSavings.amount).toBe(0)
    expect(report.totalOptimizations).toBe(0)
    expect(report.recentOptimizations).toHaveLength(0)
  })

  it('should_calculate_top_saving_event', async () => {
    // Given: 두 규칙 — 첫 번째가 더 큰 절감 이벤트
    const rule1 = makeRule({
      id: 'rule-1',
      campaignId: 'campaign-1',
      name: '대형 절감 규칙',
      triggerCount: 5,
    }) // 50,000 * 5 = 250,000
    const rule2 = makeRule({
      id: 'rule-2',
      campaignId: 'campaign-2',
      name: '소형 절감 규칙',
      triggerCount: 1,
      lastTriggeredAt: new Date('2026-01-10T10:00:00Z'),
    }) // 30,000 * 1 = 30,000

    await ruleRepo.save(rule1)
    await ruleRepo.save(rule2)
    await campaignRepo.save(makeCampaign('campaign-1', '대형 캠페인'))
    await campaignRepo.save(makeCampaign('campaign-2', '소형 캠페인'))
    await kpiRepo.save(makeKPI('campaign-1', 50000))
    await kpiRepo.save(makeKPI('campaign-2', 30000))

    // When
    const report = await useCase.execute('user-1')

    // Then: topSavingEvent는 rule1 (250,000 > 30,000)
    expect(report.topSavingEvent).not.toBeNull()
    expect(report.topSavingEvent!.ruleName).toBe('대형 절감 규칙')
    expect(report.topSavingEvent!.campaignName).toBe('대형 캠페인')
    expect(report.topSavingEvent!.estimatedSavings.amount).toBe(250000)
  })

  it('should_return_empty_report_when_no_rules', async () => {
    // Given: 규칙 없는 사용자
    // When
    const report = await useCase.execute('user-no-rules')

    // Then: 모든 필드 기본값
    expect(report.totalSavings.amount).toBe(0)
    expect(report.totalOptimizations).toBe(0)
    expect(report.topSavingEvent).toBeNull()
    expect(report.recentOptimizations).toHaveLength(0)
  })

  it('should_sort_recent_optimizations_by_triggered_at', async () => {
    // Given: 두 규칙, 서로 다른 lastTriggeredAt
    const olderRule = makeRule({
      id: 'rule-old',
      campaignId: 'campaign-1',
      name: '오래된 규칙',
      triggerCount: 1,
      lastTriggeredAt: new Date('2026-01-01T00:00:00Z'),
    })
    const newerRule = makeRule({
      id: 'rule-new',
      campaignId: 'campaign-1',
      name: '최근 규칙',
      triggerCount: 1,
      lastTriggeredAt: new Date('2026-01-20T00:00:00Z'),
    })

    await ruleRepo.save(olderRule)
    await ruleRepo.save(newerRule)
    await campaignRepo.save(makeCampaign())
    await kpiRepo.save(makeKPI())

    // When
    const report = await useCase.execute('user-1')

    // Then: 최근 규칙이 첫 번째
    expect(report.recentOptimizations[0].ruleName).toBe('최근 규칙')
    expect(report.recentOptimizations[1].ruleName).toBe('오래된 규칙')
  })

  it('should_limit_recent_optimizations_to_10', async () => {
    // Given: 12개의 트리거된 규칙
    await campaignRepo.save(makeCampaign())
    await kpiRepo.save(makeKPI())

    for (let i = 1; i <= 12; i++) {
      await ruleRepo.save(
        makeRule({
          id: `rule-${i}`,
          campaignId: 'campaign-1',
          name: `규칙 ${i}`,
          triggerCount: 1,
          lastTriggeredAt: new Date(`2026-01-${String(i).padStart(2, '0')}T00:00:00Z`),
        })
      )
    }

    // When
    const report = await useCase.execute('user-1')

    // Then: 최대 10건만 반환
    expect(report.recentOptimizations).toHaveLength(10)
    // 가장 최근(12번)이 첫 번째
    expect(report.recentOptimizations[0].ruleName).toBe('규칙 12')
  })

  it('should_skip_rules_without_campaign', async () => {
    // Given: 캠페인이 존재하지 않는 규칙
    const orphanRule = makeRule({ campaignId: 'nonexistent-campaign' })
    await ruleRepo.save(orphanRule)
    // campaignRepo에 캠페인 저장 안 함

    // When
    const report = await useCase.execute('user-1')

    // Then: 건너뛰어서 절감액 0
    expect(report.totalSavings.amount).toBe(0)
    expect(report.totalOptimizations).toBe(0)
  })

  it('should_skip_rules_without_kpi', async () => {
    // Given: 캠페인은 있지만 KPI가 없는 규칙
    const rule = makeRule()
    await ruleRepo.save(rule)
    await campaignRepo.save(makeCampaign())
    // kpiRepo에 KPI 저장 안 함

    // When
    const report = await useCase.execute('user-1')

    // Then: 건너뛰어서 절감액 0
    expect(report.totalSavings.amount).toBe(0)
    expect(report.totalOptimizations).toBe(0)
  })
})
