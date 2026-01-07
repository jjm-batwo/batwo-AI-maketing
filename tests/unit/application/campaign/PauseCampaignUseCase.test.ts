import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PauseCampaignUseCase, PauseCampaignError } from '@application/use-cases/campaign/PauseCampaignUseCase'
import { MockCampaignRepository } from '@tests/mocks/repositories/MockCampaignRepository'
import { MockMetaAdsService } from '@tests/mocks/services/MockMetaAdsService'
import { Campaign } from '@domain/entities/Campaign'
import { Money } from '@domain/value-objects/Money'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'
import { CampaignNotFoundError, UnauthorizedCampaignAccessError } from '@application/use-cases/campaign/UpdateCampaignUseCase'

describe('PauseCampaignUseCase', () => {
  let useCase: PauseCampaignUseCase
  let campaignRepository: MockCampaignRepository
  let metaAdsService: MockMetaAdsService

  beforeEach(() => {
    campaignRepository = new MockCampaignRepository()
    metaAdsService = new MockMetaAdsService()
    useCase = new PauseCampaignUseCase(campaignRepository, metaAdsService)
  })

  const createTestCampaign = (
    userId: string,
    status: CampaignStatus,
    metaCampaignId?: string
  ): Campaign => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    return Campaign.restore({
      id: `campaign-${crypto.randomUUID()}`,
      userId,
      name: 'Test Campaign',
      objective: CampaignObjective.CONVERSIONS,
      status,
      dailyBudget: Money.create(50000, 'KRW'),
      startDate: tomorrow,
      metaCampaignId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  describe('successful pause', () => {
    it('should pause an ACTIVE campaign', async () => {
      // Arrange
      const campaign = createTestCampaign('user-123', CampaignStatus.ACTIVE)
      await campaignRepository.save(campaign)

      // Act
      const result = await useCase.execute({
        campaignId: campaign.id,
        userId: 'user-123',
      })

      // Assert
      expect(result.status).toBe(CampaignStatus.PAUSED)
      expect(result.id).toBe(campaign.id)
    })

    it('should return paused campaign when already paused', async () => {
      // Arrange
      const campaign = createTestCampaign('user-123', CampaignStatus.PAUSED)
      await campaignRepository.save(campaign)

      // Act
      const result = await useCase.execute({
        campaignId: campaign.id,
        userId: 'user-123',
      })

      // Assert
      expect(result.status).toBe(CampaignStatus.PAUSED)
    })
  })

  describe('authorization', () => {
    it('should throw UnauthorizedCampaignAccessError when user does not own campaign', async () => {
      // Arrange
      const campaign = createTestCampaign('user-123', CampaignStatus.ACTIVE)
      await campaignRepository.save(campaign)

      // Act & Assert
      await expect(
        useCase.execute({
          campaignId: campaign.id,
          userId: 'different-user',
        })
      ).rejects.toThrow(UnauthorizedCampaignAccessError)
    })
  })

  describe('campaign not found', () => {
    it('should throw CampaignNotFoundError when campaign does not exist', async () => {
      // Act & Assert
      await expect(
        useCase.execute({
          campaignId: 'non-existent-id',
          userId: 'user-123',
        })
      ).rejects.toThrow(CampaignNotFoundError)
    })
  })

  describe('invalid status transitions', () => {
    it('should throw PauseCampaignError for DRAFT campaign', async () => {
      // Arrange
      const campaign = createTestCampaign('user-123', CampaignStatus.DRAFT)
      await campaignRepository.save(campaign)

      // Act & Assert
      await expect(
        useCase.execute({
          campaignId: campaign.id,
          userId: 'user-123',
        })
      ).rejects.toThrow(PauseCampaignError)
    })

    it('should throw PauseCampaignError for COMPLETED campaign', async () => {
      // Arrange
      const campaign = createTestCampaign('user-123', CampaignStatus.COMPLETED)
      await campaignRepository.save(campaign)

      // Act & Assert
      await expect(
        useCase.execute({
          campaignId: campaign.id,
          userId: 'user-123',
        })
      ).rejects.toThrow(PauseCampaignError)
    })

    it('should throw PauseCampaignError for PENDING_REVIEW campaign', async () => {
      // Arrange
      const campaign = createTestCampaign('user-123', CampaignStatus.PENDING_REVIEW)
      await campaignRepository.save(campaign)

      // Act & Assert
      await expect(
        useCase.execute({
          campaignId: campaign.id,
          userId: 'user-123',
        })
      ).rejects.toThrow(PauseCampaignError)
    })
  })

  describe('Meta Ads sync', () => {
    it('should sync pause status to Meta Ads when campaign has metaCampaignId', async () => {
      // Arrange
      const campaign = createTestCampaign('user-123', CampaignStatus.ACTIVE, 'meta-campaign-123')
      await campaignRepository.save(campaign)

      metaAdsService.setCampaign({
        id: 'meta-campaign-123',
        name: 'Test Campaign',
        status: 'ACTIVE',
        objective: 'CONVERSIONS',
        dailyBudget: 50000,
        currency: 'KRW',
        startTime: new Date().toISOString(),
      })

      const updateStatusSpy = vi.spyOn(metaAdsService, 'updateCampaignStatus')

      // Act
      await useCase.execute({
        campaignId: campaign.id,
        userId: 'user-123',
        syncToMeta: true,
        accessToken: 'test-token',
      })

      // Assert
      expect(updateStatusSpy).toHaveBeenCalledWith('test-token', 'meta-campaign-123', 'PAUSED')
    })

    it('should not sync to Meta Ads when metaCampaignId is not set', async () => {
      // Arrange
      const campaign = createTestCampaign('user-123', CampaignStatus.ACTIVE)
      await campaignRepository.save(campaign)

      const updateStatusSpy = vi.spyOn(metaAdsService, 'updateCampaignStatus')

      // Act
      await useCase.execute({
        campaignId: campaign.id,
        userId: 'user-123',
        syncToMeta: true,
        accessToken: 'test-token',
      })

      // Assert
      expect(updateStatusSpy).not.toHaveBeenCalled()
    })

    it('should not sync to Meta Ads when syncToMeta is false', async () => {
      // Arrange
      const campaign = createTestCampaign('user-123', CampaignStatus.ACTIVE, 'meta-campaign-123')
      await campaignRepository.save(campaign)

      const updateStatusSpy = vi.spyOn(metaAdsService, 'updateCampaignStatus')

      // Act
      await useCase.execute({
        campaignId: campaign.id,
        userId: 'user-123',
        syncToMeta: false,
      })

      // Assert
      expect(updateStatusSpy).not.toHaveBeenCalled()
    })
  })
})
