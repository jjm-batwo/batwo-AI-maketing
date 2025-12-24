import { describe, it, expect, beforeEach } from 'vitest'
import { GetDashboardKPIUseCase } from '@application/use-cases/kpi/GetDashboardKPIUseCase'
import { MockCampaignRepository } from '@tests/mocks/repositories/MockCampaignRepository'
import { MockKPIRepository } from '@tests/mocks/repositories/MockKPIRepository'
import { Campaign } from '@domain/entities/Campaign'
import { KPI } from '@domain/entities/KPI'
import { Money } from '@domain/value-objects/Money'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'

describe('GetDashboardKPIUseCase', () => {
  let useCase: GetDashboardKPIUseCase
  let campaignRepository: MockCampaignRepository
  let kpiRepository: MockKPIRepository

  beforeEach(() => {
    campaignRepository = new MockCampaignRepository()
    kpiRepository = new MockKPIRepository()
    useCase = new GetDashboardKPIUseCase(campaignRepository, kpiRepository)
  })

  const createTestCampaign = async (
    userId: string,
    name: string,
    status: CampaignStatus = CampaignStatus.DRAFT
  ): Promise<Campaign> => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    let campaign = Campaign.create({
      userId,
      name,
      objective: CampaignObjective.CONVERSIONS,
      dailyBudget: Money.create(50000, 'KRW'),
      startDate: tomorrow,
    })

    if (status !== CampaignStatus.DRAFT) {
      campaign = campaign.changeStatus(status)
    }

    await campaignRepository.save(campaign)
    return campaign
  }

  const createTestKPIs = async (
    campaignId: string,
    daysAgo: number = 7
  ): Promise<void> => {
    const now = new Date()
    for (let i = 0; i < daysAgo; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)

      const kpi = KPI.create({
        campaignId,
        impressions: 1000,
        clicks: 50,
        conversions: 5,
        spend: Money.create(10000, 'KRW'),
        revenue: Money.create(30000, 'KRW'),
        date,
      })

      await kpiRepository.save(kpi)
    }
  }

  describe('execute', () => {
    it('should return dashboard KPIs for user', async () => {
      const campaign = await createTestCampaign('user-123', 'Test Campaign')
      await createTestKPIs(campaign.id)

      const result = await useCase.execute({
        userId: 'user-123',
        dateRange: 'last_7d',
      })

      expect(result).toBeDefined()
      expect(result.totalImpressions).toBeGreaterThan(0)
      expect(result.totalClicks).toBeGreaterThan(0)
    })

    it('should aggregate KPIs across multiple campaigns', async () => {
      const campaign1 = await createTestCampaign('user-123', 'Campaign 1')
      const campaign2 = await createTestCampaign('user-123', 'Campaign 2')
      await createTestKPIs(campaign1.id)
      await createTestKPIs(campaign2.id)

      const result = await useCase.execute({
        userId: 'user-123',
        dateRange: 'last_7d',
      })

      // Should be double since we have 2 campaigns
      expect(result.totalImpressions).toBe(7000 * 2)
    })

    it('should calculate ROAS correctly', async () => {
      const campaign = await createTestCampaign('user-123', 'Test Campaign')
      await createTestKPIs(campaign.id)

      const result = await useCase.execute({
        userId: 'user-123',
        dateRange: 'last_7d',
      })

      // ROAS = revenue / spend = 30000 / 10000 = 3
      expect(result.roas).toBeCloseTo(3, 1)
    })

    it('should calculate CPA correctly', async () => {
      const campaign = await createTestCampaign('user-123', 'Test Campaign')
      await createTestKPIs(campaign.id)

      const result = await useCase.execute({
        userId: 'user-123',
        dateRange: 'last_7d',
      })

      // CPA = spend / conversions = 70000 / 35 = 2000
      expect(result.cpa).toBeCloseTo(2000, 0)
    })

    it('should calculate CTR correctly', async () => {
      const campaign = await createTestCampaign('user-123', 'Test Campaign')
      await createTestKPIs(campaign.id)

      const result = await useCase.execute({
        userId: 'user-123',
        dateRange: 'last_7d',
      })

      // CTR = (clicks / impressions) * 100 = (350 / 7000) * 100 = 5%
      expect(result.ctr).toBeCloseTo(5, 1)
    })

    it('should return zero metrics when no campaigns exist', async () => {
      const result = await useCase.execute({
        userId: 'user-123',
        dateRange: 'last_7d',
      })

      expect(result.totalImpressions).toBe(0)
      expect(result.totalClicks).toBe(0)
      expect(result.roas).toBe(0)
    })

    it('should return zero metrics when no KPIs exist', async () => {
      await createTestCampaign('user-123', 'Test Campaign')

      const result = await useCase.execute({
        userId: 'user-123',
        dateRange: 'last_7d',
      })

      expect(result.totalImpressions).toBe(0)
      expect(result.totalClicks).toBe(0)
    })

    it('should filter by specific campaign ids', async () => {
      const campaign1 = await createTestCampaign('user-123', 'Campaign 1')
      const campaign2 = await createTestCampaign('user-123', 'Campaign 2')
      await createTestKPIs(campaign1.id)
      await createTestKPIs(campaign2.id)

      const result = await useCase.execute({
        userId: 'user-123',
        dateRange: 'last_7d',
        campaignIds: [campaign1.id],
      })

      // Should only include campaign1 KPIs
      expect(result.totalImpressions).toBe(7000)
    })

    it('should support different date ranges', async () => {
      const campaign = await createTestCampaign('user-123', 'Test Campaign')
      await createTestKPIs(campaign.id, 30) // 30 days of data

      const last7d = await useCase.execute({
        userId: 'user-123',
        dateRange: 'last_7d',
      })

      const last30d = await useCase.execute({
        userId: 'user-123',
        dateRange: 'last_30d',
      })

      expect(last30d.totalImpressions).toBeGreaterThan(last7d.totalImpressions)
    })

    it('should return comparison with previous period', async () => {
      const campaign = await createTestCampaign('user-123', 'Test Campaign')
      await createTestKPIs(campaign.id, 14) // 14 days for comparison

      const result = await useCase.execute({
        userId: 'user-123',
        dateRange: 'last_7d',
        includeComparison: true,
      })

      expect(result.comparison).toBeDefined()
      expect(result.comparison?.impressionsChange).toBeDefined()
    })

    it('should include per-campaign breakdown', async () => {
      const campaign1 = await createTestCampaign('user-123', 'Campaign 1')
      const campaign2 = await createTestCampaign('user-123', 'Campaign 2')
      await createTestKPIs(campaign1.id)
      await createTestKPIs(campaign2.id)

      const result = await useCase.execute({
        userId: 'user-123',
        dateRange: 'last_7d',
        includeBreakdown: true,
      })

      expect(result.campaignBreakdown).toBeDefined()
      expect(result.campaignBreakdown?.length).toBe(2)
    })
  })
})
