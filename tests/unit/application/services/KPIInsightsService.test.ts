import { describe, it, expect, beforeEach, vi } from 'vitest'
import { KPIInsightsService } from '@application/services/KPIInsightsService'
import { MockKPIRepository } from '@tests/mocks/repositories/MockKPIRepository'
import { MockCampaignRepository } from '@tests/mocks/repositories/MockCampaignRepository'
import { Campaign } from '@domain/entities/Campaign'
import { Money } from '@domain/value-objects/Money'
import { KPI } from '@domain/entities/KPI'

describe('KPIInsightsService', () => {
  let kpiRepository: MockKPIRepository
  let campaignRepository: MockCampaignRepository

  beforeEach(() => {
    kpiRepository = new MockKPIRepository()
    campaignRepository = new MockCampaignRepository()
  })

  describe('generateInsights - 배치 쿼리 최적화', () => {
    it('should_use_batch_queries_instead_of_individual_queries', async () => {
      // Given: Spy 설정 먼저
      const aggregateByIdSpy = vi.spyOn(kpiRepository, 'aggregateByCampaignId')
      const aggregateByIdsSpy = vi.spyOn(kpiRepository, 'aggregateByCampaignIds')

      // Service 생성 (spy 설정 후)
      const service = new KPIInsightsService(kpiRepository, campaignRepository)

      // Given: 3개 활성 캠페인
      const userId = 'user-1'

      const campaigns = [
        Campaign.restore({
          id: crypto.randomUUID(),
          userId,
          name: 'Campaign A',
          objective: 'CONVERSIONS',
          dailyBudget: Money.create(10000, 'KRW'),
          startDate: new Date(),
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        Campaign.restore({
          id: crypto.randomUUID(),
          userId,
          name: 'Campaign B',
          objective: 'CONVERSIONS',
          dailyBudget: Money.create(20000, 'KRW'),
          startDate: new Date(),
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        Campaign.restore({
          id: crypto.randomUUID(),
          userId,
          name: 'Campaign C',
          objective: 'CONVERSIONS',
          dailyBudget: Money.create(15000, 'KRW'),
          startDate: new Date(),
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ]

      for (const campaign of campaigns) {
        await campaignRepository.save(campaign)
      }

      // Mock KPI 데이터 생성
      const now = new Date()
      const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0))

      for (const campaign of campaigns) {
        const kpi = KPI.create({
          campaignId: campaign.id,
          date: todayStart,
          impressions: 1000,
          clicks: 50,
          linkClicks: 45,
          conversions: 5,
          spend: Money.create(5000, 'KRW'),
          revenue: Money.create(25000, 'KRW'),
        })
        await kpiRepository.save(kpi)
      }

      // When: 인사이트 생성
      await service.generateInsights(userId)

      // Then: aggregateByCampaignIds는 3번 호출 (today, yesterday, last7days)
      expect(aggregateByIdsSpy).toHaveBeenCalledTimes(3)

      // Then: 각 호출은 모든 캠페인 ID를 배치로 받음
      const callArgs = aggregateByIdsSpy.mock.calls
      expect(callArgs[0][0]).toEqual(campaigns.map(c => c.id)) // today
      expect(callArgs[1][0]).toEqual(campaigns.map(c => c.id)) // yesterday
      expect(callArgs[2][0]).toEqual(campaigns.map(c => c.id)) // last7days
    })

    it('should_generate_budget_depleting_insight_when_spend_exceeds_90_percent', async () => {
      const service = new KPIInsightsService(kpiRepository, campaignRepository)

      // Given: 예산 95% 소진한 캠페인
      const userId = 'user-1'
      const dailyBudget = 10000
      const campaign = Campaign.restore({
        id: crypto.randomUUID(),
        userId,
        name: 'High Spend Campaign',
        objective: 'CONVERSIONS',
        dailyBudget: Money.create(dailyBudget, 'KRW'),
        startDate: new Date(),
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      await campaignRepository.save(campaign)

      const now = new Date()
      const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0))

      const kpi = KPI.create({
        campaignId: campaign.id,
        date: todayStart,
        impressions: 10000,
        clicks: 500,
        linkClicks: 450,
        conversions: 50,
        spend: Money.create(9500, 'KRW'), // 95% 소진
        revenue: Money.create(47500, 'KRW'),
      })
      await kpiRepository.save(kpi)

      // When
      const result = await service.generateInsights(userId)

      // Then: critical 인사이트 생성
      const budgetInsight = result.insights.find(i => i.id.includes('budget-depleting'))
      expect(budgetInsight).toBeDefined()
      expect(budgetInsight?.priority).toBe('critical')
      expect(budgetInsight?.category).toBe('budget')
      expect(budgetInsight?.title).toBe('예산 소진 임박')
    })

    it('should_generate_roas_below_breakeven_insight', async () => {
      const service = new KPIInsightsService(kpiRepository, campaignRepository)

      // Given: ROAS 0.8x인 캠페인
      const userId = 'user-1'
      const campaign = Campaign.restore({
        id: crypto.randomUUID(),
        userId,
        name: 'Low ROAS Campaign',
        objective: 'CONVERSIONS',
        dailyBudget: Money.create(20000, 'KRW'),
        startDate: new Date(),
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      await campaignRepository.save(campaign)

      const now = new Date()
      const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0))
      const yesterdayStart = new Date(todayStart)
      yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1)
      const last7DaysStart = new Date(todayStart)
      last7DaysStart.setUTCDate(last7DaysStart.getUTCDate() - 7)

      // 오늘: ROAS 0.8x
      const todayKPI = KPI.create({
        campaignId: campaign.id,
        date: todayStart,
        impressions: 5000,
        clicks: 250,
        linkClicks: 225,
        conversions: 10,
        spend: Money.create(10000, 'KRW'),
        revenue: Money.create(8000, 'KRW'), // ROAS 0.8x
      })
      await kpiRepository.save(todayKPI)

      // 지난 7일: ROAS 2.0x (평균)
      for (let i = 1; i <= 7; i++) {
        const date = new Date(todayStart)
        date.setUTCDate(date.getUTCDate() - i)
        const kpi = KPI.create({
          campaignId: campaign.id,
          date,
          impressions: 5000,
          clicks: 250,
          linkClicks: 225,
          conversions: 20,
          spend: Money.create(5000, 'KRW'),
          revenue: Money.create(10000, 'KRW'), // ROAS 2.0x
        })
        await kpiRepository.save(kpi)
      }

      // When
      const result = await service.generateInsights(userId)

      // Then: ROAS 손익분기점 미달 인사이트
      const roasInsight = result.insights.find(i => i.id.includes('roas-below'))
      expect(roasInsight).toBeDefined()
      expect(roasInsight?.priority).toBe('critical')
      expect(roasInsight?.category).toBe('warning')
      expect(roasInsight?.currentValue).toBeLessThan(1)
    })

    it('should_return_empty_result_when_no_active_campaigns', async () => {
      const service = new KPIInsightsService(kpiRepository, campaignRepository)

      // Given: 활성 캠페인 없음
      const userId = 'user-no-campaigns'

      // When
      const result = await service.generateInsights(userId)

      // Then: 빈 결과 반환
      expect(result.insights).toHaveLength(1)
      expect(result.insights[0].id).toBe('no-data')
      expect(result.summary.total).toBe(1)
    })

    it('should_sort_insights_by_priority', async () => {
      const service = new KPIInsightsService(kpiRepository, campaignRepository)

      // Given: 여러 우선순위의 인사이트를 발생시킬 캠페인들
      const userId = 'user-1'

      // Critical: 예산 95% 소진
      const criticalCampaign = Campaign.restore({
        id: crypto.randomUUID(),
        userId,
        name: 'Critical Campaign',
        objective: 'CONVERSIONS',
        dailyBudget: Money.create(10000, 'KRW'),
        startDate: new Date(),
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      await campaignRepository.save(criticalCampaign)

      // Medium: 정상 캠페인
      const mediumCampaign = Campaign.restore({
        id: crypto.randomUUID(),
        userId,
        name: 'Medium Campaign',
        objective: 'CONVERSIONS',
        dailyBudget: Money.create(20000, 'KRW'),
        startDate: new Date(),
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      await campaignRepository.save(mediumCampaign)

      const now = new Date()
      const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0))

      // Critical 캠페인: 95% 소진
      const criticalKPI = KPI.create({
        campaignId: criticalCampaign.id,
        date: todayStart,
        impressions: 10000,
        clicks: 500,
        linkClicks: 450,
        conversions: 50,
        spend: Money.create(9500, 'KRW'),
        revenue: Money.create(47500, 'KRW'),
      })
      await kpiRepository.save(criticalKPI)

      // Medium 캠페인: 정상
      const mediumKPI = KPI.create({
        campaignId: mediumCampaign.id,
        date: todayStart,
        impressions: 5000,
        clicks: 250,
        linkClicks: 225,
        conversions: 25,
        spend: Money.create(5000, 'KRW'),
        revenue: Money.create(25000, 'KRW'),
      })
      await kpiRepository.save(mediumKPI)

      // When
      const result = await service.generateInsights(userId)

      // Then: critical > high > medium > low 순서
      const priorities = result.insights.map(i => i.priority)
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }

      for (let i = 0; i < priorities.length - 1; i++) {
        expect(priorityOrder[priorities[i]]).toBeLessThanOrEqual(priorityOrder[priorities[i + 1]])
      }
    })
  })
})
