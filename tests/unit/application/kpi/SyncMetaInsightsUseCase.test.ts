import { describe, it, expect, beforeEach } from 'vitest'
import { SyncMetaInsightsUseCase } from '@application/use-cases/kpi/SyncMetaInsightsUseCase'
import { MockCampaignRepository } from '@tests/mocks/repositories/MockCampaignRepository'
import { MockKPIRepository } from '@tests/mocks/repositories/MockKPIRepository'
import { MockMetaAdsService } from '@tests/mocks/services/MockMetaAdsService'
import { Campaign } from '@domain/entities/Campaign'
import { Money } from '@domain/value-objects/Money'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'

describe('SyncMetaInsightsUseCase', () => {
  let useCase: SyncMetaInsightsUseCase
  let campaignRepository: MockCampaignRepository
  let kpiRepository: MockKPIRepository
  let metaAdsService: MockMetaAdsService

  beforeEach(() => {
    campaignRepository = new MockCampaignRepository()
    kpiRepository = new MockKPIRepository()
    metaAdsService = new MockMetaAdsService()
    useCase = new SyncMetaInsightsUseCase(
      campaignRepository,
      kpiRepository,
      metaAdsService
    )
  })

  const createTestCampaign = (
    userId: string,
    name: string,
    metaCampaignId?: string
  ): Campaign => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const campaign = Campaign.create({
      userId,
      name,
      objective: CampaignObjective.CONVERSIONS,
      dailyBudget: Money.create(50000, 'KRW'),
      startDate: tomorrow,
    })

    if (metaCampaignId) {
      return campaign.setMetaCampaignId(metaCampaignId)
    }

    return campaign
  }

  describe('execute - successful sync', () => {
    it('should successfully sync insights from Meta Ads', async () => {
      const campaign = createTestCampaign('user-123', 'Test Campaign', 'meta-123')
      await campaignRepository.save(campaign)

      metaAdsService.setInsights('meta-123', {
        campaignId: 'meta-123',
        impressions: 10000,
        clicks: 500,
        conversions: 50,
        spend: 1000.0, // USD
        revenue: 5000.0, // USD
        dateStart: '2025-01-01',
        dateStop: '2025-01-01',
      })

      const result = await useCase.execute({
        userId: 'user-123',
        campaignId: campaign.id,
        accessToken: 'valid-token',
        datePreset: 'today',
      })

      expect(result.synced).toBe(true)
      expect(result.campaignId).toBe(campaign.id)
      expect(result.kpiId).toBeDefined()
      expect(result.message).toBeUndefined()

      // Verify KPI was saved
      const savedKpi = await kpiRepository.findById(result.kpiId)
      expect(savedKpi).not.toBeNull()
      expect(savedKpi!.impressions).toBe(10000)
      expect(savedKpi!.clicks).toBe(500)
      expect(savedKpi!.conversions).toBe(50)
    })

    it('should use default datePreset when not provided', async () => {
      const campaign = createTestCampaign('user-123', 'Test Campaign', 'meta-456')
      await campaignRepository.save(campaign)

      metaAdsService.setInsights('meta-456', {
        campaignId: 'meta-456',
        impressions: 5000,
        clicks: 250,
        conversions: 25,
        spend: 500.0,
        revenue: 2500.0,
        dateStart: new Date().toISOString(),
        dateStop: new Date().toISOString(),
      })

      const result = await useCase.execute({
        userId: 'user-123',
        campaignId: campaign.id,
        accessToken: 'valid-token',
        // datePreset not provided - should default to 'today'
      })

      expect(result.synced).toBe(true)
    })
  })

  describe('execute - authorization checks', () => {
    it('should fail when campaign not found', async () => {
      const result = await useCase.execute({
        userId: 'user-123',
        campaignId: 'non-existent-id',
        accessToken: 'valid-token',
      })

      expect(result.synced).toBe(false)
      expect(result.message).toBe('Campaign not found or unauthorized')
      expect(result.kpiId).toBe('')
    })

    it('should fail when user does not own the campaign', async () => {
      const campaign = createTestCampaign('other-user', 'Test Campaign', 'meta-123')
      await campaignRepository.save(campaign)

      const result = await useCase.execute({
        userId: 'user-123', // Different user
        campaignId: campaign.id,
        accessToken: 'valid-token',
      })

      expect(result.synced).toBe(false)
      expect(result.message).toBe('Campaign not found or unauthorized')
    })
  })

  describe('execute - Meta campaign validation', () => {
    it('should fail when campaign is not synced with Meta Ads', async () => {
      const campaign = createTestCampaign('user-123', 'Test Campaign')
      // No metaCampaignId set
      await campaignRepository.save(campaign)

      const result = await useCase.execute({
        userId: 'user-123',
        campaignId: campaign.id,
        accessToken: 'valid-token',
      })

      expect(result.synced).toBe(false)
      expect(result.message).toBe('Campaign is not synced with Meta Ads')
    })
  })

  describe('execute - Meta API error handling', () => {
    it('should handle Meta API failure gracefully', async () => {
      const campaign = createTestCampaign('user-123', 'Test Campaign', 'meta-123')
      await campaignRepository.save(campaign)

      metaAdsService.setShouldFail(true, new Error('Meta API rate limit exceeded'))

      const result = await useCase.execute({
        userId: 'user-123',
        campaignId: campaign.id,
        accessToken: 'valid-token',
      })

      expect(result.synced).toBe(false)
      expect(result.message).toBe('Meta API rate limit exceeded')
      expect(result.kpiId).toBe('')
    })

    it('should handle non-Error exceptions', async () => {
      const campaign = createTestCampaign('user-123', 'Test Campaign', 'meta-123')
      await campaignRepository.save(campaign)

      // Simulate a non-Error exception by making the service fail
      metaAdsService.setShouldFail(true, new Error('Network timeout'))

      const result = await useCase.execute({
        userId: 'user-123',
        campaignId: campaign.id,
        accessToken: 'valid-token',
      })

      expect(result.synced).toBe(false)
      expect(result.message).toContain('Network timeout')
    })
  })

  describe('execute - currency conversion', () => {
    it('should convert spend and revenue to KRW cents', async () => {
      const campaign = createTestCampaign('user-123', 'Test Campaign', 'meta-123')
      await campaignRepository.save(campaign)

      metaAdsService.setInsights('meta-123', {
        campaignId: 'meta-123',
        impressions: 1000,
        clicks: 50,
        conversions: 5,
        spend: 123.45, // USD
        revenue: 678.90, // USD
        dateStart: '2025-01-01',
        dateStop: '2025-01-01',
      })

      const result = await useCase.execute({
        userId: 'user-123',
        campaignId: campaign.id,
        accessToken: 'valid-token',
      })

      expect(result.synced).toBe(true)

      const savedKpi = await kpiRepository.findById(result.kpiId)
      expect(savedKpi).not.toBeNull()
      // 123.45 * 100 = 12345 cents (KRW)
      expect(savedKpi!.spend.amount).toBe(12345)
      // 678.90 * 100 = 67890 cents (KRW)
      expect(savedKpi!.revenue.amount).toBe(67890)
      expect(savedKpi!.spend.currency).toBe('KRW')
      expect(savedKpi!.revenue.currency).toBe('KRW')
    })
  })

  describe('execute - KPI date handling', () => {
    it('should set correct date from insights dateStart', async () => {
      const campaign = createTestCampaign('user-123', 'Test Campaign', 'meta-123')
      await campaignRepository.save(campaign)

      const specificDate = '2025-01-15'
      metaAdsService.setInsights('meta-123', {
        campaignId: 'meta-123',
        impressions: 1000,
        clicks: 50,
        conversions: 5,
        spend: 100,
        revenue: 500,
        dateStart: specificDate,
        dateStop: specificDate,
      })

      const result = await useCase.execute({
        userId: 'user-123',
        campaignId: campaign.id,
        accessToken: 'valid-token',
      })

      expect(result.synced).toBe(true)

      const savedKpi = await kpiRepository.findById(result.kpiId)
      expect(savedKpi).not.toBeNull()
      expect(savedKpi!.date.toISOString().startsWith('2025-01-15')).toBe(true)
    })
  })
})
