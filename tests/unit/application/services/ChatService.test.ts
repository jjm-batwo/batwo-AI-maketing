import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ChatService } from '@application/services/ChatService'
import { MockCampaignRepository } from '@tests/mocks/repositories/MockCampaignRepository'
import { MockReportRepository } from '@tests/mocks/repositories/MockReportRepository'
import { MockKPIRepository } from '@tests/mocks/repositories/MockKPIRepository'
import { MockCompetitorTrackingRepository } from '@tests/mocks/repositories/MockCompetitorTrackingRepository'
import type { IAIService } from '@application/ports/IAIService'
import { Campaign } from '@domain/entities/Campaign'
import { CompetitorTracking } from '@domain/entities/CompetitorTracking'
import { Money } from '@domain/value-objects/Money'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import { KPI } from '@domain/entities/KPI'
import { PortfolioOptimizationService } from '@application/services/PortfolioOptimizationService'

describe('ChatService - buildContext N+1 최적화', () => {
  let service: ChatService
  let campaignRepo: MockCampaignRepository
  let reportRepo: MockReportRepository
  let kpiRepo: MockKPIRepository
  let mockAIService: IAIService

  beforeEach(() => {
    campaignRepo = new MockCampaignRepository()
    reportRepo = new MockReportRepository()
    kpiRepo = new MockKPIRepository()
    mockAIService = {
      generateAdCopy: vi.fn(),
      generateOptimization: vi.fn(),
      generateCreativeVariants: vi.fn(),
      generateReportInsights: vi.fn(),
      generateChatCompletion: vi.fn(),
    } as unknown as IAIService

    service = new ChatService(campaignRepo, reportRepo, kpiRepo, mockAIService)
  })

  describe('buildContext - 배치 쿼리 최적화', () => {
    it('should_use_batch_query_instead_of_individual_queries', async () => {
      // Given: 3개의 캠페인과 각각의 KPI 데이터
      const userId = 'user-1'
      const now = new Date()

      const campaign1 = Campaign.restore({
        id: crypto.randomUUID(),
        userId,
        name: 'Campaign 1',
        objective: 'CONVERSIONS',
        dailyBudget: Money.create(100000, 'KRW'),
        startDate: new Date(),
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const campaign2 = Campaign.restore({
        id: crypto.randomUUID(),
        userId,
        name: 'Campaign 2',
        objective: 'CONVERSIONS',
        dailyBudget: Money.create(200000, 'KRW'),
        startDate: new Date(),
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const campaign3 = Campaign.restore({
        id: crypto.randomUUID(),
        userId,
        name: 'Campaign 3',
        objective: 'CONVERSIONS',
        dailyBudget: Money.create(150000, 'KRW'),
        startDate: new Date(),
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await campaignRepo.save(campaign1)
      await campaignRepo.save(campaign2)
      await campaignRepo.save(campaign3)

      // KPI 데이터 생성
      const kpi1 = KPI.create({
        campaignId: campaign1.id,
        date: now,
        impressions: 1000,
        clicks: 50,
        linkClicks: 45,
        conversions: 10,
        spend: Money.create(50000, 'KRW'),
        revenue: Money.create(150000, 'KRW'),
      })

      const kpi2 = KPI.create({
        campaignId: campaign2.id,
        date: now,
        impressions: 2000,
        clicks: 100,
        linkClicks: 90,
        conversions: 20,
        spend: Money.create(100000, 'KRW'),
        revenue: Money.create(300000, 'KRW'),
      })

      const kpi3 = KPI.create({
        campaignId: campaign3.id,
        date: now,
        impressions: 1500,
        clicks: 75,
        linkClicks: 70,
        conversions: 15,
        spend: Money.create(75000, 'KRW'),
        revenue: Money.create(200000, 'KRW'),
      })

      await kpiRepo.save(kpi1)
      await kpiRepo.save(kpi2)
      await kpiRepo.save(kpi3)

      // When: buildContext 호출
      // 서비스가 배치 메서드를 사용하는지 검증
      const aggregateByCampaignIdsSpy = vi.spyOn(kpiRepo, 'aggregateByCampaignIds')

      const context = await service.buildContext(userId)

      // Then: aggregateByCampaignIds가 정확히 1번 호출되어야 함 (N개 개별 호출 대신)
      expect(aggregateByCampaignIdsSpy).toHaveBeenCalledTimes(1)
      expect(aggregateByCampaignIdsSpy).toHaveBeenCalledWith(
        expect.arrayContaining([campaign1.id, campaign2.id, campaign3.id]),
        expect.any(Date),
        expect.any(Date)
      )
      // 3개 캠페인 모두 결과에 포함
      expect(context.campaigns).toHaveLength(3)
    })

    it('should_build_correct_campaign_context_with_batch_query', async () => {
      // Given: 2개의 캠페인과 KPI 데이터
      const userId = 'user-2'
      const now = new Date()

      const campaign1 = Campaign.create({
        userId,
        name: 'High Performing Campaign',
        objective: CampaignObjective.CONVERSIONS,
        dailyBudget: Money.create(100000, 'KRW'),
        startDate: now,
        endDate: now,
      })

      const campaign2 = Campaign.create({
        userId,
        name: 'Low Performing Campaign',
        objective: CampaignObjective.CONVERSIONS,
        dailyBudget: Money.create(100000, 'KRW'),
        startDate: now,
        endDate: now,
      })

      await campaignRepo.save(campaign1)
      await campaignRepo.save(campaign2)

      // Campaign 1: 높은 ROAS (3.0x)
      const kpi1 = KPI.create({
        campaignId: campaign1.id,
        date: now,
        impressions: 10000,
        clicks: 500,
        linkClicks: 450,
        conversions: 100,
        spend: Money.create(100000, 'KRW'),
        revenue: Money.create(300000, 'KRW'),
      })

      // Campaign 2: 낮은 ROAS (1.2x)
      const kpi2 = KPI.create({
        campaignId: campaign2.id,
        date: now,
        impressions: 5000,
        clicks: 100,
        linkClicks: 90,
        conversions: 20,
        spend: Money.create(50000, 'KRW'),
        revenue: Money.create(60000, 'KRW'),
      })

      await kpiRepo.save(kpi1)
      await kpiRepo.save(kpi2)

      // When: buildContext 호출
      const context = await service.buildContext(userId)

      // Then: 올바른 메트릭 계산 결과 검증
      expect(context.campaigns).toHaveLength(2)

      const camp1Context = context.campaigns.find((c) => c.id === campaign1.id)
      const camp2Context = context.campaigns.find((c) => c.id === campaign2.id)

      expect(camp1Context).toBeDefined()
      expect(camp1Context!.metrics.impressions).toBe(10000)
      expect(camp1Context!.metrics.clicks).toBe(500)
      expect(camp1Context!.metrics.conversions).toBe(100)
      expect(camp1Context!.metrics.spend).toBe(100000)
      expect(camp1Context!.metrics.revenue).toBe(300000)
      expect(camp1Context!.metrics.roas).toBe(3.0)
      expect(camp1Context!.metrics.ctr).toBe(5.0) // (500/10000)*100
      expect(camp1Context!.metrics.cvr).toBe(20.0) // (100/500)*100
      expect(camp1Context!.metrics.cpa).toBe(1000) // 100000/100

      expect(camp2Context).toBeDefined()
      expect(camp2Context!.metrics.roas).toBe(1.2)
      expect(camp2Context!.metrics.ctr).toBe(2.0) // (100/5000)*100
      expect(camp2Context!.metrics.cvr).toBe(20.0) // (20/100)*100
      expect(camp2Context!.metrics.cpa).toBe(2500) // 50000/20
    })

    it('should_handle_empty_campaigns_gracefully', async () => {
      // Given: 캠페인이 없는 사용자
      const userId = 'user-no-campaigns'

      // When: buildContext 호출
      const context = await service.buildContext(userId)

      // Then: 빈 배열 반환
      expect(context.campaigns).toEqual([])
      expect(context.recentReports).toEqual([])
      expect(context.recentAnomalies).toEqual([])
    })

    it('should_handle_campaigns_with_no_kpi_data', async () => {
      // Given: KPI 데이터가 없는 캠페인
      const userId = 'user-3'

      const campaign = Campaign.create({
        userId,
        name: 'New Campaign',
        objective: CampaignObjective.CONVERSIONS,
        dailyBudget: Money.create(100000, 'KRW'),
        startDate: new Date(),
        endDate: new Date(),
      })

      await campaignRepo.save(campaign)

      // When: buildContext 호출
      const context = await service.buildContext(userId)

      // Then: 기본값(0)으로 메트릭 생성
      expect(context.campaigns).toHaveLength(1)
      expect(context.campaigns[0].metrics.impressions).toBe(0)
      expect(context.campaigns[0].metrics.clicks).toBe(0)
      expect(context.campaigns[0].metrics.conversions).toBe(0)
      expect(context.campaigns[0].metrics.spend).toBe(0)
      expect(context.campaigns[0].metrics.revenue).toBe(0)
      expect(context.campaigns[0].metrics.roas).toBe(0)
      expect(context.campaigns[0].metrics.ctr).toBe(0)
      expect(context.campaigns[0].metrics.cvr).toBe(0)
      expect(context.campaigns[0].metrics.cpa).toBe(0)
    })

    it('should_calculate_metrics_with_division_by_zero_protection', async () => {
      // Given: 지출은 있지만 전환이 없는 캠페인
      const userId = 'user-4'

      const campaign = Campaign.create({
        userId,
        name: 'Campaign No Conversions',
        objective: CampaignObjective.CONVERSIONS,
        dailyBudget: Money.create(100000, 'KRW'),
        startDate: new Date(),
        endDate: new Date(),
      })

      await campaignRepo.save(campaign)

      const kpi = KPI.create({
        campaignId: campaign.id,
        date: new Date(),
        impressions: 1000,
        clicks: 50,
        linkClicks: 45,
        conversions: 0, // 전환 0
        spend: Money.create(50000, 'KRW'),
        revenue: Money.create(0, 'KRW'),
      })

      await kpiRepo.save(kpi)

      // When: buildContext 호출
      const context = await service.buildContext(userId)

      // Then: 0으로 나누기 시 0 반환
      expect(context.campaigns[0].metrics.roas).toBe(0) // revenue=0, spend>0
      expect(context.campaigns[0].metrics.ctr).toBeCloseTo(5.0, 1) // 50/1000*100
      expect(context.campaigns[0].metrics.cvr).toBe(0) // conversions=0
      expect(context.campaigns[0].metrics.cpa).toBe(0) // conversions=0이므로 CPA도 0
    })
  })
})

describe('ChatService - 경쟁사/포트폴리오 컨텍스트 통합', () => {
  let service: ChatService
  let campaignRepo: MockCampaignRepository
  let reportRepo: MockReportRepository
  let kpiRepo: MockKPIRepository
  let competitorTrackingRepo: MockCompetitorTrackingRepository
  let portfolioService: PortfolioOptimizationService
  let mockAIService: IAIService

  beforeEach(() => {
    campaignRepo = new MockCampaignRepository()
    reportRepo = new MockReportRepository()
    kpiRepo = new MockKPIRepository()
    competitorTrackingRepo = new MockCompetitorTrackingRepository()
    portfolioService = new PortfolioOptimizationService(campaignRepo, kpiRepo)
    mockAIService = {
      generateAdCopy: vi.fn(),
      generateOptimization: vi.fn(),
      generateCreativeVariants: vi.fn(),
      generateReportInsights: vi.fn(),
      generateChatCompletion: vi.fn(),
    } as unknown as IAIService

    service = new ChatService(
      campaignRepo,
      reportRepo,
      kpiRepo,
      mockAIService,
      competitorTrackingRepo,
      portfolioService
    )
  })

  describe('buildContext - 경쟁사 추적 데이터 포함', () => {
    it('should_include_tracked_competitors_in_context', async () => {
      // Given: 추적 중인 경쟁사 2개
      const userId = 'user-comp-1'

      const tracking1 = CompetitorTracking.fromPersistence({
        id: 'track-1',
        userId,
        pageId: 'page-123',
        pageName: '경쟁사A',
        industry: 'ecommerce',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      const tracking2 = CompetitorTracking.fromPersistence({
        id: 'track-2',
        userId,
        pageId: 'page-456',
        pageName: '경쟁사B',
        industry: 'fashion',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await competitorTrackingRepo.save(tracking1)
      await competitorTrackingRepo.save(tracking2)

      // When: buildContext 호출
      const context = await service.buildContext(userId)

      // Then: 경쟁사 추적 데이터 포함
      expect(context.trackedCompetitors).toBeDefined()
      expect(context.trackedCompetitors).toHaveLength(2)
      expect(context.trackedCompetitors![0].pageName).toBe('경쟁사A')
      expect(context.trackedCompetitors![1].pageName).toBe('경쟁사B')
    })

    it('should_return_empty_tracked_competitors_when_none_exist', async () => {
      // Given: 추적 중인 경쟁사 없음
      const userId = 'user-no-comp'

      // When
      const context = await service.buildContext(userId)

      // Then
      expect(context.trackedCompetitors).toBeDefined()
      expect(context.trackedCompetitors).toHaveLength(0)
    })
  })

  describe('buildContext - 포트폴리오 분석 포함', () => {
    it('should_include_portfolio_summary_when_active_campaigns_exist', async () => {
      // Given: 활성 캠페인 2개 + KPI 데이터
      const userId = 'user-portfolio-1'
      const now = new Date()

      const campaign1 = Campaign.restore({
        id: 'camp-p1',
        userId,
        name: 'Portfolio Campaign 1',
        objective: 'CONVERSIONS',
        dailyBudget: Money.create(100000, 'KRW'),
        startDate: now,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      })
      const campaign2 = Campaign.restore({
        id: 'camp-p2',
        userId,
        name: 'Portfolio Campaign 2',
        objective: 'TRAFFIC',
        dailyBudget: Money.create(50000, 'KRW'),
        startDate: now,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      })

      await campaignRepo.save(campaign1)
      await campaignRepo.save(campaign2)

      const kpi1 = KPI.create({
        campaignId: 'camp-p1',
        date: now,
        impressions: 10000,
        clicks: 500,
        linkClicks: 450,
        conversions: 50,
        spend: Money.create(100000, 'KRW'),
        revenue: Money.create(300000, 'KRW'),
      })
      const kpi2 = KPI.create({
        campaignId: 'camp-p2',
        date: now,
        impressions: 8000,
        clicks: 400,
        linkClicks: 380,
        conversions: 30,
        spend: Money.create(50000, 'KRW'),
        revenue: Money.create(100000, 'KRW'),
      })

      await kpiRepo.save(kpi1)
      await kpiRepo.save(kpi2)

      // When
      const context = await service.buildContext(userId)

      // Then: 포트폴리오 요약 포함
      expect(context.portfolioSummary).toBeDefined()
      expect(context.portfolioSummary!.totalBudget).toBeGreaterThan(0)
      expect(context.portfolioSummary!.efficiencyScore).toBeGreaterThanOrEqual(0)
      expect(context.portfolioSummary!.recommendations).toBeDefined()
    })

    it('should_handle_portfolio_analysis_failure_gracefully', async () => {
      // Given: 활성 캠페인 없음 (PortfolioService가 에러 발생)
      const userId = 'user-no-portfolio'

      // When
      const context = await service.buildContext(userId)

      // Then: portfolioSummary는 null
      expect(context.portfolioSummary).toBeNull()
    })
  })

  describe('tryQuickResponse - 경쟁사 관련 질문', () => {
    it('should_provide_quick_response_for_competitor_question', async () => {
      // Given: 추적 중인 경쟁사 있음
      const userId = 'user-comp-quick'

      const tracking = CompetitorTracking.fromPersistence({
        id: 'track-q1',
        userId,
        pageId: 'page-789',
        pageName: '스킨케어브랜드',
        industry: 'fashion',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      await competitorTrackingRepo.save(tracking)

      // When: "경쟁사" 키워드 포함 질문
      const response = await service.chat(userId, '경쟁사 현황 알려줘')

      // Then: 경쟁사 추적 정보가 포함된 응답
      expect(response.message).toContain('스킨케어브랜드')
      expect(response.suggestedQuestions).toBeDefined()
    })
  })

  describe('tryQuickResponse - 포트폴리오 최적화 질문', () => {
    it('should_provide_quick_response_for_portfolio_optimization_question', async () => {
      // Given: 활성 캠페인 + KPI
      const userId = 'user-port-quick'
      const now = new Date()

      const campaign = Campaign.restore({
        id: 'camp-pq1',
        userId,
        name: 'Portfolio Quick',
        objective: 'CONVERSIONS',
        dailyBudget: Money.create(100000, 'KRW'),
        startDate: now,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      })
      await campaignRepo.save(campaign)

      const kpi = KPI.create({
        campaignId: 'camp-pq1',
        date: now,
        impressions: 5000,
        clicks: 250,
        linkClicks: 230,
        conversions: 25,
        spend: Money.create(100000, 'KRW'),
        revenue: Money.create(250000, 'KRW'),
      })
      await kpiRepo.save(kpi)

      // When: "포트폴리오 최적화" 질문
      const response = await service.chat(userId, '포트폴리오 최적화 방법 알려줘')

      // Then: 포트폴리오 분석 기반 응답
      expect(response.message).toBeDefined()
      expect(response.message.length).toBeGreaterThan(0)
      expect(response.suggestedQuestions).toBeDefined()
    })
  })
})
