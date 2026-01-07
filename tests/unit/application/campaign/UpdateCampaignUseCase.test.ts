import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UpdateCampaignUseCase, CampaignNotFoundError, UnauthorizedCampaignAccessError } from '@application/use-cases/campaign/UpdateCampaignUseCase'
import { MockCampaignRepository } from '@tests/mocks/repositories/MockCampaignRepository'
import { MockMetaAdsService } from '@tests/mocks/services/MockMetaAdsService'
import { Campaign } from '@domain/entities/Campaign'
import { Money } from '@domain/value-objects/Money'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'
import { UpdateCampaignDTO } from '@application/dto/campaign/UpdateCampaignDTO'

describe('UpdateCampaignUseCase', () => {
  let useCase: UpdateCampaignUseCase
  let campaignRepository: MockCampaignRepository
  let metaAdsService: MockMetaAdsService

  beforeEach(() => {
    campaignRepository = new MockCampaignRepository()
    metaAdsService = new MockMetaAdsService()
    useCase = new UpdateCampaignUseCase(campaignRepository, metaAdsService)
  })

  const createTestCampaign = (
    userId: string,
    name: string,
    status: CampaignStatus = CampaignStatus.DRAFT
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

    // Use restore to set specific status
    return Campaign.restore({
      ...campaign.toJSON(),
      status,
    })
  }

  describe('successful updates', () => {
    it('should update campaign name successfully', async () => {
      // Arrange
      const campaign = createTestCampaign('user-123', 'Original Name')
      await campaignRepository.save(campaign)

      const dto: UpdateCampaignDTO = {
        campaignId: campaign.id,
        userId: 'user-123',
        name: 'Updated Name',
      }

      // Act
      const result = await useCase.execute(dto)

      // Assert
      expect(result.name).toBe('Updated Name')
      expect(result.id).toBe(campaign.id)
    })

    it('should update campaign dailyBudget successfully', async () => {
      // Arrange
      const campaign = createTestCampaign('user-123', 'Test Campaign')
      await campaignRepository.save(campaign)

      const dto: UpdateCampaignDTO = {
        campaignId: campaign.id,
        userId: 'user-123',
        dailyBudget: 100000,
        currency: 'KRW',
      }

      // Act
      const result = await useCase.execute(dto)

      // Assert
      expect(result.dailyBudget).toBe(100000)
    })

    it('should update campaign startDate successfully', async () => {
      // Arrange
      const campaign = createTestCampaign('user-123', 'Test Campaign')
      await campaignRepository.save(campaign)

      const newStartDate = new Date()
      newStartDate.setDate(newStartDate.getDate() + 7)

      const dto: UpdateCampaignDTO = {
        campaignId: campaign.id,
        userId: 'user-123',
        startDate: newStartDate.toISOString(),
      }

      // Act
      const result = await useCase.execute(dto)

      // Assert
      expect(new Date(result.startDate).toDateString()).toBe(newStartDate.toDateString())
    })

    it('should update campaign endDate successfully', async () => {
      // Arrange
      const campaign = createTestCampaign('user-123', 'Test Campaign')
      await campaignRepository.save(campaign)

      const newEndDate = new Date()
      newEndDate.setDate(newEndDate.getDate() + 30)

      const dto: UpdateCampaignDTO = {
        campaignId: campaign.id,
        userId: 'user-123',
        endDate: newEndDate.toISOString(),
      }

      // Act
      const result = await useCase.execute(dto)

      // Assert
      expect(result.endDate).toBeDefined()
      expect(new Date(result.endDate!).toDateString()).toBe(newEndDate.toDateString())
    })

    it('should clear endDate when set to null', async () => {
      // Arrange
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 30)

      const campaign = Campaign.restore({
        id: 'campaign-123',
        userId: 'user-123',
        name: 'Test Campaign',
        objective: CampaignObjective.CONVERSIONS,
        status: CampaignStatus.DRAFT,
        dailyBudget: Money.create(50000, 'KRW'),
        startDate: tomorrow,
        endDate: endDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      await campaignRepository.save(campaign)

      const dto: UpdateCampaignDTO = {
        campaignId: campaign.id,
        userId: 'user-123',
        endDate: null,
      }

      // Act
      const result = await useCase.execute(dto)

      // Assert
      expect(result.endDate).toBeUndefined()
    })

    it('should update targetAudience successfully', async () => {
      // Arrange
      const campaign = createTestCampaign('user-123', 'Test Campaign')
      await campaignRepository.save(campaign)

      const dto: UpdateCampaignDTO = {
        campaignId: campaign.id,
        userId: 'user-123',
        targetAudience: {
          ageMin: 25,
          ageMax: 45,
          genders: ['female'],
          locations: ['Seoul', 'Busan'],
          interests: ['Shopping', 'Fashion'],
        },
      }

      // Act
      const result = await useCase.execute(dto)

      // Assert
      expect(result.targetAudience).toBeDefined()
      expect(result.targetAudience?.ageMin).toBe(25)
      expect(result.targetAudience?.ageMax).toBe(45)
    })

    it('should update multiple fields at once', async () => {
      // Arrange
      const campaign = createTestCampaign('user-123', 'Original Name')
      await campaignRepository.save(campaign)

      const newStartDate = new Date()
      newStartDate.setDate(newStartDate.getDate() + 3)

      const dto: UpdateCampaignDTO = {
        campaignId: campaign.id,
        userId: 'user-123',
        name: 'Updated Name',
        dailyBudget: 75000,
        currency: 'KRW',
        startDate: newStartDate.toISOString(),
      }

      // Act
      const result = await useCase.execute(dto)

      // Assert
      expect(result.name).toBe('Updated Name')
      expect(result.dailyBudget).toBe(75000)
    })
  })

  describe('authorization', () => {
    it('should throw UnauthorizedCampaignAccessError when user does not own campaign', async () => {
      // Arrange
      const campaign = createTestCampaign('user-123', 'Test Campaign')
      await campaignRepository.save(campaign)

      const dto: UpdateCampaignDTO = {
        campaignId: campaign.id,
        userId: 'different-user',
        name: 'New Name',
      }

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow(UnauthorizedCampaignAccessError)
    })
  })

  describe('campaign not found', () => {
    it('should throw CampaignNotFoundError when campaign does not exist', async () => {
      // Arrange
      const dto: UpdateCampaignDTO = {
        campaignId: 'non-existent-id',
        userId: 'user-123',
        name: 'New Name',
      }

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow(CampaignNotFoundError)
    })
  })

  describe('status restrictions', () => {
    it('should allow updates on DRAFT campaigns', async () => {
      // Arrange
      const campaign = createTestCampaign('user-123', 'Test Campaign', CampaignStatus.DRAFT)
      await campaignRepository.save(campaign)

      const dto: UpdateCampaignDTO = {
        campaignId: campaign.id,
        userId: 'user-123',
        name: 'Updated Name',
      }

      // Act
      const result = await useCase.execute(dto)

      // Assert
      expect(result.name).toBe('Updated Name')
    })

    it('should allow updates on PAUSED campaigns', async () => {
      // Arrange
      const campaign = createTestCampaign('user-123', 'Test Campaign', CampaignStatus.PAUSED)
      await campaignRepository.save(campaign)

      const dto: UpdateCampaignDTO = {
        campaignId: campaign.id,
        userId: 'user-123',
        name: 'Updated Name',
      }

      // Act
      const result = await useCase.execute(dto)

      // Assert
      expect(result.name).toBe('Updated Name')
    })

    it('should throw error when updating COMPLETED campaign', async () => {
      // Arrange
      const campaign = createTestCampaign('user-123', 'Test Campaign', CampaignStatus.COMPLETED)
      await campaignRepository.save(campaign)

      const dto: UpdateCampaignDTO = {
        campaignId: campaign.id,
        userId: 'user-123',
        name: 'Updated Name',
      }

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow('Cannot update a completed campaign')
    })

    it('should allow limited updates on ACTIVE campaigns (only budget)', async () => {
      // Arrange
      const campaign = createTestCampaign('user-123', 'Test Campaign', CampaignStatus.ACTIVE)
      await campaignRepository.save(campaign)

      const dto: UpdateCampaignDTO = {
        campaignId: campaign.id,
        userId: 'user-123',
        dailyBudget: 100000,
        currency: 'KRW',
      }

      // Act
      const result = await useCase.execute(dto)

      // Assert
      expect(result.dailyBudget).toBe(100000)
    })
  })

  describe('duplicate name check', () => {
    it('should throw error when updating to a name that already exists for user', async () => {
      // Arrange
      const campaign1 = createTestCampaign('user-123', 'Campaign One')
      const campaign2 = createTestCampaign('user-123', 'Campaign Two')
      await campaignRepository.save(campaign1)
      await campaignRepository.save(campaign2)

      const dto: UpdateCampaignDTO = {
        campaignId: campaign2.id,
        userId: 'user-123',
        name: 'Campaign One', // Duplicate name
      }

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow('Campaign with name "Campaign One" already exists')
    })

    it('should allow keeping the same name', async () => {
      // Arrange
      const campaign = createTestCampaign('user-123', 'My Campaign')
      await campaignRepository.save(campaign)

      const dto: UpdateCampaignDTO = {
        campaignId: campaign.id,
        userId: 'user-123',
        name: 'My Campaign', // Same name
        dailyBudget: 100000,
        currency: 'KRW',
      }

      // Act
      const result = await useCase.execute(dto)

      // Assert
      expect(result.name).toBe('My Campaign')
      expect(result.dailyBudget).toBe(100000)
    })
  })

  describe('Meta Ads sync', () => {
    it('should sync to Meta Ads when syncToMeta is true', async () => {
      // Arrange
      const campaign = Campaign.restore({
        id: 'campaign-123',
        userId: 'user-123',
        name: 'Test Campaign',
        objective: CampaignObjective.CONVERSIONS,
        status: CampaignStatus.ACTIVE,
        dailyBudget: Money.create(50000, 'KRW'),
        startDate: new Date(),
        metaCampaignId: 'meta-campaign-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      await campaignRepository.save(campaign)

      // Set up the Meta campaign in the mock service
      metaAdsService.setCampaign({
        id: 'meta-campaign-123',
        name: 'Test Campaign',
        status: 'ACTIVE',
        objective: 'CONVERSIONS',
        dailyBudget: 50000,
        currency: 'KRW',
        startTime: new Date().toISOString(),
      })

      const updateCampaignSpy = vi.spyOn(metaAdsService, 'updateCampaign')

      const dto: UpdateCampaignDTO = {
        campaignId: campaign.id,
        userId: 'user-123',
        dailyBudget: 100000,
        currency: 'KRW',
        syncToMeta: true,
        accessToken: 'test-token',
        adAccountId: 'act_123',
      }

      // Act
      await useCase.execute(dto)

      // Assert
      expect(updateCampaignSpy).toHaveBeenCalledWith(
        'test-token',
        'meta-campaign-123',
        expect.objectContaining({
          dailyBudget: 100000,
        })
      )
    })

    it('should not sync to Meta Ads when metaCampaignId is not set', async () => {
      // Arrange
      const campaign = createTestCampaign('user-123', 'Test Campaign')
      await campaignRepository.save(campaign)

      const updateCampaignSpy = vi.spyOn(metaAdsService, 'updateCampaign')

      const dto: UpdateCampaignDTO = {
        campaignId: campaign.id,
        userId: 'user-123',
        dailyBudget: 100000,
        currency: 'KRW',
        syncToMeta: true,
        accessToken: 'test-token',
        adAccountId: 'act_123',
      }

      // Act
      await useCase.execute(dto)

      // Assert
      expect(updateCampaignSpy).not.toHaveBeenCalled()
    })
  })
})
