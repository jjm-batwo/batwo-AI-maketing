/**
 * 🔴 RED Phase: Dashboard KPI API Integration Tests
 *
 * These tests verify that Dashboard KPI Use Cases work correctly with the database.
 * The API routes should be connected to these Use Cases (not mock data).
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setupIntegrationTest, getPrismaClient, createTestUser } from '../setup'
import { PrismaCampaignRepository } from '@infrastructure/database/repositories/PrismaCampaignRepository'
import { PrismaKPIRepository } from '@infrastructure/database/repositories/PrismaKPIRepository'
import { GetDashboardKPIUseCase } from '@application/use-cases/kpi/GetDashboardKPIUseCase'
import { Campaign } from '@domain/entities/Campaign'
import { KPI } from '@domain/entities/KPI'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import { Money } from '@domain/value-objects/Money'

describe('Dashboard KPI API Integration', () => {
  setupIntegrationTest()

  let campaignRepository: PrismaCampaignRepository
  let kpiRepository: PrismaKPIRepository
  let testUserId: string

  beforeEach(async () => {
    const prisma = getPrismaClient()
    campaignRepository = new PrismaCampaignRepository(prisma)
    kpiRepository = new PrismaKPIRepository(prisma)

    const user = await createTestUser()
    testUserId = user.id
  })

  const createTestCampaign = async (name: string) => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const campaign = Campaign.restore({
      id: crypto.randomUUID(),
      userId: testUserId,
      name,
      objective: CampaignObjective.SALES,
      status: CampaignStatus.ACTIVE,
      dailyBudget: Money.create(100000, 'KRW'),
      startDate: tomorrow,
      endDate: undefined,
      targetAudience: undefined,
      metaCampaignId: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return campaignRepository.save(campaign)
  }

  const createTestKPI = async (
    campaignId: string,
    daysAgo: number,
    data: { impressions: number; clicks: number; conversions: number; spend: number; revenue: number }
  ) => {
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    date.setHours(0, 0, 0, 0)

    const kpi = KPI.create({
      campaignId,
      impressions: data.impressions,
      clicks: data.clicks,
      conversions: data.conversions,
      spend: Money.create(data.spend, 'KRW'),
      revenue: Money.create(data.revenue, 'KRW'),
      date,
    })

    return kpiRepository.save(kpi)
  }

  describe('GetDashboardKPIUseCase (GET /api/dashboard/kpi)', () => {
    it('사용자의 캠페인 KPI 집계 데이터를 DB에서 반환해야 함', async () => {
      // Given: 테스트 캠페인과 KPI 데이터가 DB에 존재
      const campaign = await createTestCampaign('Test Campaign')

      // 최근 7일간 KPI 데이터 생성
      await createTestKPI(campaign.id, 1, {
        impressions: 1000,
        clicks: 100,
        conversions: 10,
        spend: 50000,
        revenue: 150000,
      })
      await createTestKPI(campaign.id, 2, {
        impressions: 2000,
        clicks: 150,
        conversions: 15,
        spend: 60000,
        revenue: 180000,
      })

      const useCase = new GetDashboardKPIUseCase(campaignRepository, kpiRepository)

      // When: Use Case 실행
      const result = await useCase.execute({
        userId: testUserId,
        dateRange: 'last_7d',
      })

      // Then: 실제 DB 데이터 기반 집계 결과 반환
      expect(result.totalImpressions).toBe(3000)
      expect(result.totalClicks).toBe(250)
      expect(result.totalConversions).toBe(25)
      expect(result.totalSpend).toBe(110000)
      expect(result.totalRevenue).toBe(330000)
      expect(result.roas).toBeCloseTo(3.0, 1) // 330000 / 110000
      expect(result.ctr).toBeCloseTo(8.33, 1) // (250 / 3000) * 100
    })

    it('캠페인이 없을 때 빈 데이터를 반환해야 함', async () => {
      const useCase = new GetDashboardKPIUseCase(campaignRepository, kpiRepository)

      // When: 캠페인이 없는 사용자의 KPI 조회
      const result = await useCase.execute({
        userId: testUserId,
        dateRange: 'last_7d',
      })

      // Then: 빈 결과 반환
      expect(result.totalImpressions).toBe(0)
      expect(result.totalClicks).toBe(0)
      expect(result.totalConversions).toBe(0)
      expect(result.totalSpend).toBe(0)
      expect(result.totalRevenue).toBe(0)
      expect(result.roas).toBe(0)
    })

    it('특정 캠페인만 필터링하여 KPI를 조회해야 함', async () => {
      // Given: 두 개의 캠페인이 있고 각각 KPI 데이터가 있음
      const campaign1 = await createTestCampaign('Campaign 1')
      const campaign2 = await createTestCampaign('Campaign 2')

      await createTestKPI(campaign1.id, 1, {
        impressions: 1000,
        clicks: 100,
        conversions: 10,
        spend: 50000,
        revenue: 150000,
      })
      await createTestKPI(campaign2.id, 1, {
        impressions: 2000,
        clicks: 200,
        conversions: 20,
        spend: 100000,
        revenue: 300000,
      })

      const useCase = new GetDashboardKPIUseCase(campaignRepository, kpiRepository)

      // When: campaign1만 필터링하여 조회
      const result = await useCase.execute({
        userId: testUserId,
        dateRange: 'last_7d',
        campaignIds: [campaign1.id],
      })

      // Then: campaign1의 KPI만 반환
      expect(result.totalImpressions).toBe(1000)
      expect(result.totalClicks).toBe(100)
      expect(result.totalSpend).toBe(50000)
    })

    it('다른 사용자의 캠페인 KPI는 반환하지 않아야 함', async () => {
      // Given: 다른 사용자의 캠페인
      const otherUser = await createTestUser({ email: 'other@example.com' })

      const prisma = getPrismaClient()
      const otherCampaignRepo = new PrismaCampaignRepository(prisma)

      const campaign = Campaign.restore({
        id: crypto.randomUUID(),
        userId: otherUser.id,
        name: 'Other User Campaign',
        objective: CampaignObjective.SALES,
        status: CampaignStatus.ACTIVE,
        dailyBudget: Money.create(100000, 'KRW'),
        startDate: new Date(),
        endDate: undefined,
        targetAudience: undefined,
        metaCampaignId: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      await otherCampaignRepo.save(campaign)

      await createTestKPI(campaign.id, 1, {
        impressions: 5000,
        clicks: 500,
        conversions: 50,
        spend: 200000,
        revenue: 600000,
      })

      const useCase = new GetDashboardKPIUseCase(campaignRepository, kpiRepository)

      // When: 내 KPI 조회
      const result = await useCase.execute({
        userId: testUserId,
        dateRange: 'last_7d',
      })

      // Then: 다른 사용자의 데이터 미포함
      expect(result.totalImpressions).toBe(0)
      expect(result.totalSpend).toBe(0)
    })

    it('기간 비교 데이터를 포함할 수 있어야 함', async () => {
      // Given: 현재 기간과 이전 기간 KPI 데이터
      const campaign = await createTestCampaign('Campaign for Comparison')

      // 최근 7일 데이터
      await createTestKPI(campaign.id, 1, {
        impressions: 2000,
        clicks: 200,
        conversions: 20,
        spend: 80000,
        revenue: 240000,
      })

      // 이전 7일 데이터 (8-14일 전)
      await createTestKPI(campaign.id, 10, {
        impressions: 1000,
        clicks: 100,
        conversions: 10,
        spend: 40000,
        revenue: 120000,
      })

      const useCase = new GetDashboardKPIUseCase(campaignRepository, kpiRepository)

      // When: 비교 데이터 포함하여 조회
      const result = await useCase.execute({
        userId: testUserId,
        dateRange: 'last_7d',
        includeComparison: true,
      })

      // Then: 비교 데이터 포함됨
      expect(result.comparison).toBeDefined()
      expect(result.comparison?.impressionsChange).toBeDefined()
      expect(result.comparison?.spendChange).toBeDefined()
    })

    it('캠페인별 브레이크다운을 포함할 수 있어야 함', async () => {
      // Given: 여러 캠페인의 KPI 데이터
      const campaign1 = await createTestCampaign('Campaign A')
      const campaign2 = await createTestCampaign('Campaign B')

      await createTestKPI(campaign1.id, 1, {
        impressions: 1000,
        clicks: 100,
        conversions: 10,
        spend: 50000,
        revenue: 150000,
      })
      await createTestKPI(campaign2.id, 1, {
        impressions: 2000,
        clicks: 200,
        conversions: 20,
        spend: 100000,
        revenue: 300000,
      })

      const useCase = new GetDashboardKPIUseCase(campaignRepository, kpiRepository)

      // When: 브레이크다운 포함하여 조회
      const result = await useCase.execute({
        userId: testUserId,
        dateRange: 'last_7d',
        includeBreakdown: true,
      })

      // Then: 캠페인별 브레이크다운 포함됨
      expect(result.campaignBreakdown).toBeDefined()
      expect(result.campaignBreakdown).toHaveLength(2)
      expect(result.campaignBreakdown?.map((b) => b.campaignName)).toContain('Campaign A')
      expect(result.campaignBreakdown?.map((b) => b.campaignName)).toContain('Campaign B')
    })
  })
})
