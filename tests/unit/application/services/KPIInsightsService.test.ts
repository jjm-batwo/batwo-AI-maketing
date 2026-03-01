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
      vi.spyOn(kpiRepository, 'aggregateByCampaignId')
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

  describe('generateInsights - 동적 기준선 및 LLM 강화', () => {
    it('should_use_dynamic_budget_threshold_when_7day_average_available', async () => {
      // Given: 시간 고정 (6시 → expectedUsagePercent = 25%)
      vi.useFakeTimers()
      const fakeNow = new Date(2026, 0, 15, 6, 0, 0)
      vi.setSystemTime(fakeNow)

      try {
        const userId = 'user-dynamic-budget'
        const campaignId = crypto.randomUUID()
        const dailyBudget = 100000

        const campaign = Campaign.restore({
          id: campaignId,
          userId,
          name: 'Dynamic Threshold Campaign',
          objective: 'CONVERSIONS',
          dailyBudget: Money.create(dailyBudget, 'KRW'),
          startDate: new Date(),
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        await campaignRepository.save(campaign)

        // 7일 KPI 데이터: 총 70000 → 평균 10000
        // dynamicThreshold = Math.max(15, (10000/100000)*100*0.3) = Math.max(15, 3) = 15
        const todayStartUTC = new Date(
          Date.UTC(fakeNow.getUTCFullYear(), fakeNow.getUTCMonth(), fakeNow.getUTCDate(), 0, 0, 0)
        )
        for (let i = 1; i <= 7; i++) {
          const date = new Date(todayStartUTC)
          date.setUTCDate(date.getUTCDate() - i)
          await kpiRepository.save(
            KPI.create({
              campaignId,
              date,
              impressions: 1000,
              clicks: 50,
              linkClicks: 40,
              conversions: 5,
              spend: Money.create(10000, 'KRW'),
              revenue: Money.create(20000, 'KRW'),
            })
          )
        }

        // 오늘: budgetUsagePercent = 42%, expectedUsagePercent = 25%
        // budgetPace = 17 → 15 < 17 < 20 (동적 threshold에서만 트리거)
        const todayMap = new Map<string, { totalImpressions: number; totalClicks: number; totalLinkClicks: number; totalConversions: number; totalSpend: number; totalRevenue: number }>()
        todayMap.set(campaignId, {
          totalImpressions: 5000,
          totalClicks: 250,
          totalLinkClicks: 200,
          totalConversions: 10,
          totalSpend: 42000,
          totalRevenue: 84000,
        })
        const yesterdayMap = new Map<string, { totalImpressions: number; totalClicks: number; totalLinkClicks: number; totalConversions: number; totalSpend: number; totalRevenue: number }>()
        yesterdayMap.set(campaignId, {
          totalImpressions: 0,
          totalClicks: 0,
          totalLinkClicks: 0,
          totalConversions: 0,
          totalSpend: 0,
          totalRevenue: 0,
        })

        const service = new KPIInsightsService(kpiRepository, campaignRepository)

        // When
        const result = await service.generateInsights(userId, { todayMap, yesterdayMap })

        // Then: budget-fast 인사이트 생성됨 (동적 threshold 15 < 17)
        const budgetFastInsight = result.insights.find(i => i.id.includes('budget-fast'))
        expect(budgetFastInsight).toBeDefined()
        expect(budgetFastInsight?.priority).toBe('high')
        expect(budgetFastInsight?.category).toBe('budget')
      } finally {
        vi.useRealTimers()
      }
    })

    it('should_use_dynamic_spend_change_threshold_when_7day_average_available', async () => {
      // Given: 시간 고정 (6시)
      vi.useFakeTimers()
      const fakeNow = new Date(2026, 0, 15, 6, 0, 0)
      vi.setSystemTime(fakeNow)

      try {
        const userId = 'user-dynamic-spend'
        const campaignId = crypto.randomUUID()

        const campaign = Campaign.restore({
          id: campaignId,
          userId,
          name: 'Spend Change Campaign',
          objective: 'CONVERSIONS',
          dailyBudget: Money.create(1000000, 'KRW'),
          startDate: new Date(),
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        await campaignRepository.save(campaign)

        // 7일 KPI: 총 spend = 525 → 평균 = 75
        // spendChangeThreshold = Math.min(50, Math.max(20, 75 * 0.3)) = Math.min(50, 22.5) = 22.5
        const todayStartUTC = new Date(
          Date.UTC(fakeNow.getUTCFullYear(), fakeNow.getUTCMonth(), fakeNow.getUTCDate(), 0, 0, 0)
        )
        for (let i = 1; i <= 7; i++) {
          const date = new Date(todayStartUTC)
          date.setUTCDate(date.getUTCDate() - i)
          await kpiRepository.save(
            KPI.create({
              campaignId,
              date,
              impressions: 100,
              clicks: 5,
              linkClicks: 4,
              conversions: 1,
              spend: Money.create(75, 'KRW'),
              revenue: Money.create(150, 'KRW'),
            })
          )
        }

        // 어제 totalSpend = 10000 → 동시간 예상치 = 10000 * (6/24) = 2500
        // 오늘 totalSpend = 3075 → spendChange = ((3075-2500)/2500)*100 = 23%
        // 23% > 22.5 (동적 threshold) → spend-up 생성됨
        const todayMap = new Map<string, { totalImpressions: number; totalClicks: number; totalLinkClicks: number; totalConversions: number; totalSpend: number; totalRevenue: number }>()
        todayMap.set(campaignId, {
          totalImpressions: 1000,
          totalClicks: 50,
          totalLinkClicks: 40,
          totalConversions: 5,
          totalSpend: 3075,
          totalRevenue: 6000,
        })
        const yesterdayMap = new Map<string, { totalImpressions: number; totalClicks: number; totalLinkClicks: number; totalConversions: number; totalSpend: number; totalRevenue: number }>()
        yesterdayMap.set(campaignId, {
          totalImpressions: 5000,
          totalClicks: 250,
          totalLinkClicks: 200,
          totalConversions: 10,
          totalSpend: 10000,
          totalRevenue: 20000,
        })

        const service = new KPIInsightsService(kpiRepository, campaignRepository)

        // When
        const result = await service.generateInsights(userId, { todayMap, yesterdayMap })

        // Then: spend-up 인사이트 생성됨
        const spendUpInsight = result.insights.find(i => i.id.includes('spend-up'))
        expect(spendUpInsight).toBeDefined()
        expect(spendUpInsight?.category).toBe('performance')
      } finally {
        vi.useRealTimers()
      }
    })

    it('should_not_add_aiDescription_when_aiService_not_provided', async () => {
      // Given: aiService 없이 서비스 생성 (2개 파라미터만)
      const service = new KPIInsightsService(kpiRepository, campaignRepository)

      const userId = 'user-no-ai'
      const campaign = Campaign.restore({
        id: crypto.randomUUID(),
        userId,
        name: 'No AI Campaign',
        objective: 'CONVERSIONS',
        dailyBudget: Money.create(10000, 'KRW'),
        startDate: new Date(),
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      await campaignRepository.save(campaign)

      const now = new Date()
      const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0))
      await kpiRepository.save(
        KPI.create({
          campaignId: campaign.id,
          date: todayStart,
          impressions: 10000,
          clicks: 500,
          linkClicks: 450,
          conversions: 50,
          spend: Money.create(9500, 'KRW'),
          revenue: Money.create(47500, 'KRW'),
        })
      )

      // When
      const result = await service.generateInsights(userId)

      // Then: 모든 인사이트에 aiDescription 없음
      expect(result.insights.length).toBeGreaterThan(0)
      result.insights.forEach(insight => {
        expect(insight.aiDescription).toBeUndefined()
      })
    })

    it('should_add_aiDescription_when_llm_call_succeeds', async () => {
      // Given: 캠페인 설정
      const userId = 'user-with-ai'
      const campaignId = crypto.randomUUID()

      const campaign = Campaign.restore({
        id: campaignId,
        userId,
        name: 'AI Campaign',
        objective: 'CONVERSIONS',
        dailyBudget: Money.create(10000, 'KRW'),
        startDate: new Date(),
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      await campaignRepository.save(campaign)

      const now = new Date()
      const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0))
      await kpiRepository.save(
        KPI.create({
          campaignId,
          date: todayStart,
          impressions: 10000,
          clicks: 500,
          linkClicks: 450,
          conversions: 50,
          spend: Money.create(9500, 'KRW'),
          revenue: Money.create(47500, 'KRW'),
        })
      )

      // Mock aiService: chatCompletion이 유효한 JSON 반환
      const mockAiService = {
        generateCampaignOptimization: vi.fn(),
        generateReportInsights: vi.fn(),
        generateAdCopy: vi.fn(),
        generateBudgetRecommendation: vi.fn(),
        generateCreativeVariants: vi.fn(),
        chatCompletion: vi.fn().mockResolvedValue(
          JSON.stringify([{ id: `budget-depleting-${campaignId}`, aiDescription: '예산 부족' }])
        ),
      }

      const service = new KPIInsightsService(
        kpiRepository,
        campaignRepository,
        mockAiService
      )

      // When
      const result = await service.generateInsights(userId)

      // Then: aiDescription이 설정된 인사이트가 존재
      const aiInsight = result.insights.find(i => i.aiDescription !== undefined)
      expect(aiInsight).toBeDefined()
      expect(aiInsight?.aiDescription).toBe('예산 부족')
    })

    it('should_gracefully_fallback_when_llm_times_out', async () => {
      vi.useFakeTimers()
      const fakeNow = new Date(2026, 0, 15, 6, 0, 0)
      vi.setSystemTime(fakeNow)

      try {
        const userId = 'user-timeout'
        const campaignId = crypto.randomUUID()

        const campaign = Campaign.restore({
          id: campaignId,
          userId,
          name: 'Timeout Campaign',
          objective: 'CONVERSIONS',
          dailyBudget: Money.create(10000, 'KRW'),
          startDate: new Date(),
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        await campaignRepository.save(campaign)

        const todayStartUTC = new Date(
          Date.UTC(fakeNow.getUTCFullYear(), fakeNow.getUTCMonth(), fakeNow.getUTCDate(), 0, 0, 0)
        )
        await kpiRepository.save(
          KPI.create({
            campaignId,
            date: todayStartUTC,
            impressions: 10000,
            clicks: 500,
            linkClicks: 450,
            conversions: 50,
            spend: Money.create(9500, 'KRW'),
            revenue: Money.create(47500, 'KRW'),
          })
        )

        // Mock: chatCompletion이 절대 resolve되지 않음 (hang)
        const mockAiService = {
          generateCampaignOptimization: vi.fn(),
          generateReportInsights: vi.fn(),
          generateAdCopy: vi.fn(),
          generateBudgetRecommendation: vi.fn(),
          generateCreativeVariants: vi.fn(),
          chatCompletion: vi.fn().mockReturnValue(new Promise(() => {})),
        }

        const service = new KPIInsightsService(
          kpiRepository,
          campaignRepository,
          mockAiService
        )

        // When: 인���이트 생성 시작 (비동기)
        const resultPromise = service.generateInsights(userId)

        // 11초 진행 → 10초 timeout 트리거
        await vi.advanceTimersByTimeAsync(11000)

        const result = await resultPromise

        // Then: 인사이트는 반환되고, aiDescription 없음 (크래시 없이 graceful fallback)
        expect(result.insights.length).toBeGreaterThan(0)
        result.insights.forEach(insight => {
          expect(insight.aiDescription).toBeUndefined()
        })
      } finally {
        vi.useRealTimers()
      }
    })

    it('should_use_cache_when_cacheService_provided', async () => {
      // Given
      const userId = 'user-cache-test'
      const campaignId = crypto.randomUUID()

      const campaign = Campaign.restore({
        id: campaignId,
        userId,
        name: 'Cache Campaign',
        objective: 'CONVERSIONS',
        dailyBudget: Money.create(10000, 'KRW'),
        startDate: new Date(),
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      await campaignRepository.save(campaign)

      const now = new Date()
      const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0))
      await kpiRepository.save(
        KPI.create({
          campaignId,
          date: todayStart,
          impressions: 10000,
          clicks: 500,
          linkClicks: 450,
          conversions: 50,
          spend: Money.create(9500, 'KRW'),
          revenue: Money.create(47500, 'KRW'),
        })
      )

      // Mock aiService
      const mockAiService = {
        generateCampaignOptimization: vi.fn(),
        generateReportInsights: vi.fn(),
        generateAdCopy: vi.fn(),
        generateBudgetRecommendation: vi.fn(),
        generateCreativeVariants: vi.fn(),
        chatCompletion: vi.fn().mockResolvedValue('[]'),
      }

      // Mock cacheService
      const mockCacheService = {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
        deletePattern: vi.fn(),
        invalidateUserCache: vi.fn(),
        isHealthy: vi.fn(),
        getOrSet: vi.fn().mockImplementation((_key: string, fn: () => Promise<unknown>) => fn()),
      }

      const service = new KPIInsightsService(
        kpiRepository,
        campaignRepository,
        mockAiService,
        mockCacheService
      )

      // When
      await service.generateInsights(userId)

      // Then: getOrSet가 올바른 키와 TTL로 호출됨
      expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
        `kpi-insights-llm:${userId}`,
        expect.any(Function),
        7200
      )
    })
  })
})

