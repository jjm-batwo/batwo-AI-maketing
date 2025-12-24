import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CreateCampaignUseCase } from '@application/use-cases/campaign/CreateCampaignUseCase'
import { CreateCampaignDTO } from '@application/dto/campaign/CreateCampaignDTO'
import { MockCampaignRepository } from '@tests/mocks/repositories/MockCampaignRepository'
import { MockMetaAdsService } from '@tests/mocks/services/MockMetaAdsService'
import { MockUsageLogRepository } from '@tests/mocks/repositories/MockUsageLogRepository'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'

describe('CreateCampaignUseCase', () => {
  let useCase: CreateCampaignUseCase
  let campaignRepository: MockCampaignRepository
  let metaAdsService: MockMetaAdsService
  let usageLogRepository: MockUsageLogRepository

  beforeEach(() => {
    campaignRepository = new MockCampaignRepository()
    metaAdsService = new MockMetaAdsService()
    usageLogRepository = new MockUsageLogRepository()

    useCase = new CreateCampaignUseCase(
      campaignRepository,
      metaAdsService,
      usageLogRepository
    )
  })

  const createValidDTO = (): CreateCampaignDTO => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    return {
      userId: 'user-123',
      name: 'Test Campaign',
      objective: CampaignObjective.CONVERSIONS,
      dailyBudget: 50000,
      currency: 'KRW',
      startDate: tomorrow.toISOString(),
      accessToken: 'meta-access-token',
      adAccountId: 'act_123456',
    }
  }

  describe('execute', () => {
    it('should create campaign and save to repository', async () => {
      const dto = createValidDTO()

      const result = await useCase.execute(dto)

      expect(result.id).toBeDefined()
      expect(result.name).toBe(dto.name)
      expect(result.status).toBe(CampaignStatus.DRAFT)

      const saved = await campaignRepository.findById(result.id)
      expect(saved).not.toBeNull()
    })

    it('should sync campaign to Meta Ads when syncToMeta is true', async () => {
      const dto = { ...createValidDTO(), syncToMeta: true }

      const result = await useCase.execute(dto)

      expect(result.metaCampaignId).toBeDefined()
      expect(result.metaCampaignId).toMatch(/^meta_/)
    })

    it('should not sync to Meta Ads when syncToMeta is false', async () => {
      const dto = { ...createValidDTO(), syncToMeta: false }

      const result = await useCase.execute(dto)

      expect(result.metaCampaignId).toBeUndefined()
    })

    it('should log usage after successful campaign creation', async () => {
      const dto = createValidDTO()

      await useCase.execute(dto)

      const logs = usageLogRepository.getAll()
      expect(logs.length).toBe(1)
      expect(logs[0].userId).toBe(dto.userId)
      expect(logs[0].type).toBe('CAMPAIGN_CREATE')
    })

    it('should throw error for invalid budget (negative)', async () => {
      const dto = { ...createValidDTO(), dailyBudget: -1000 }

      await expect(useCase.execute(dto)).rejects.toThrow()
    })

    it('should throw error for zero budget', async () => {
      const dto = { ...createValidDTO(), dailyBudget: 0 }

      await expect(useCase.execute(dto)).rejects.toThrow()
    })

    it('should throw error for past start date', async () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const dto = { ...createValidDTO(), startDate: yesterday.toISOString() }

      await expect(useCase.execute(dto)).rejects.toThrow()
    })

    it('should throw error for duplicate campaign name', async () => {
      const dto = createValidDTO()

      // Create first campaign
      await useCase.execute(dto)

      // Try to create another with same name
      await expect(useCase.execute(dto)).rejects.toThrow(
        /already exists|duplicate/i
      )
    })

    it('should handle Meta Ads API failure gracefully', async () => {
      metaAdsService.setShouldFail(true, new Error('Meta API error'))
      const dto = { ...createValidDTO(), syncToMeta: true }

      await expect(useCase.execute(dto)).rejects.toThrow('Meta API error')

      // Campaign should not be saved on failure
      const campaigns = campaignRepository.getAll()
      expect(campaigns.length).toBe(0)
    })

    it('should create campaign with target audience', async () => {
      const dto = {
        ...createValidDTO(),
        targetAudience: {
          ageMin: 25,
          ageMax: 45,
          genders: ['all' as const],
          locations: ['Seoul', 'Busan'],
          interests: ['Shopping', 'Fashion'],
        },
      }

      const result = await useCase.execute(dto)

      expect(result.targetAudience).toBeDefined()
      expect(result.targetAudience?.ageMin).toBe(25)
      expect(result.targetAudience?.ageMax).toBe(45)
    })

    it('should create campaign with end date', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)

      const dto = {
        ...createValidDTO(),
        startDate: tomorrow.toISOString(),
        endDate: nextWeek.toISOString(),
      }

      const result = await useCase.execute(dto)

      expect(result.endDate).toBeDefined()
    })

    it('should throw error when end date is before start date', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const today = new Date()

      const dto = {
        ...createValidDTO(),
        startDate: tomorrow.toISOString(),
        endDate: today.toISOString(),
      }

      await expect(useCase.execute(dto)).rejects.toThrow()
    })
  })
})
