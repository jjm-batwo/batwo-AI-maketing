import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { CreateAdvantageCampaignUseCase, InvalidAdvantageConfigError } from '@application/use-cases/campaign/CreateAdvantageCampaignUseCase'
import { DuplicateCampaignNameError } from '@application/use-cases/campaign/CreateCampaignUseCase'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import { CreateCampaignDTO } from '@application/dto/campaign/CreateCampaignDTO'
import { Campaign } from '@domain/entities/Campaign'
import { AdSet } from '@domain/entities/AdSet'
import { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import { IAdSetRepository } from '@domain/repositories/IAdSetRepository'
import { IMetaAdsService } from '@application/ports/IMetaAdsService'
import { IUsageLogRepository } from '@domain/repositories/IUsageLogRepository'

describe('CreateAdvantageCampaignUseCase', () => {
  let useCase: CreateAdvantageCampaignUseCase
  let mockCampaignRepo: ICampaignRepository
  let mockAdSetRepo: IAdSetRepository
  let mockMetaAdsService: IMetaAdsService
  let mockUsageLogRepo: IUsageLogRepository

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-15T10:00:00Z'))

    mockCampaignRepo = {
      save: vi.fn().mockImplementation((campaign: Campaign) => Promise.resolve(campaign)),
      existsByNameAndUserId: vi.fn().mockResolvedValue(false),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findByFilters: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as ICampaignRepository

    mockAdSetRepo = {
      save: vi.fn().mockImplementation((adSet: AdSet) => Promise.resolve(adSet)),
      findById: vi.fn(),
      findByCampaignId: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as IAdSetRepository

    mockMetaAdsService = {
      createCampaign: vi.fn().mockResolvedValue({ id: 'meta-123', name: 'test', status: 'PAUSED', objective: 'OUTCOME_SALES', dailyBudget: 50000, currency: 'KRW', startTime: new Date().toISOString() }),
      getCampaign: vi.fn(),
      getCampaignInsights: vi.fn(),
      getCampaignDailyInsights: vi.fn(),
      updateCampaignStatus: vi.fn(),
      updateCampaign: vi.fn(),
      deleteCampaign: vi.fn(),
      listCampaigns: vi.fn(),
      createAdSet: vi.fn(),
      updateAdSet: vi.fn(),
      deleteAdSet: vi.fn(),
      listAdSets: vi.fn(),
      createAd: vi.fn(),
      createAdCreative: vi.fn(),
      uploadImage: vi.fn(),
      uploadVideo: vi.fn(),
    } as unknown as IMetaAdsService

    mockUsageLogRepo = {
      log: vi.fn().mockResolvedValue(undefined),
      getCount: vi.fn(),
      getByUserId: vi.fn(),
    } as unknown as IUsageLogRepository

    useCase = new CreateAdvantageCampaignUseCase(
      mockCampaignRepo,
      mockAdSetRepo,
      mockMetaAdsService,
      mockUsageLogRepo
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const validDto: CreateCampaignDTO = {
    userId: 'user-123',
    name: 'Advantage+ 캠페인',
    objective: CampaignObjective.CONVERSIONS,
    dailyBudget: 50000,
    currency: 'KRW',
    startDate: new Date('2025-01-20').toISOString(),
    advantageConfig: {
      advantageBudget: true,
      advantageAudience: true,
      advantagePlacement: true,
    },
  }

  describe('성공 케이스', () => {
    it('should create Advantage+ campaign with all levers enabled', async () => {
      const result = await useCase.execute(validDto)

      expect(result.campaign.name).toBe('Advantage+ 캠페인')
      expect(result.campaign.advantageConfig).toEqual({
        advantageBudget: true,
        advantageAudience: true,
        advantagePlacement: true,
      })
      expect(result.adSetId).toBeDefined()
      expect(mockCampaignRepo.save).toHaveBeenCalledTimes(1)
    })

    it('should auto-create a single AdSet for Advantage+ campaign', async () => {
      await useCase.execute(validDto)

      expect(mockAdSetRepo.save).toHaveBeenCalledTimes(1)
      const savedAdSet = (mockAdSetRepo.save as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(savedAdSet.name).toBe('Advantage+ 캠페인 - Advantage+ AdSet')
    })

    it('should log usage after creating campaign', async () => {
      await useCase.execute(validDto)

      expect(mockUsageLogRepo.log).toHaveBeenCalledWith('user-123', 'CAMPAIGN_CREATE')
    })
  })

  describe('검증 실패 케이스', () => {
    it('should throw InvalidAdvantageConfigError when advantageConfig is missing', async () => {
      const dtoWithoutConfig = { ...validDto, advantageConfig: undefined }

      await expect(useCase.execute(dtoWithoutConfig)).rejects.toThrow(InvalidAdvantageConfigError)
    })

    it('should throw InvalidAdvantageConfigError when not all levers are enabled', async () => {
      const dtoPartial = {
        ...validDto,
        advantageConfig: {
          advantageBudget: true,
          advantageAudience: false,
          advantagePlacement: true,
        },
      }

      await expect(useCase.execute(dtoPartial)).rejects.toThrow(InvalidAdvantageConfigError)
    })

    it('should throw DuplicateCampaignNameError when name already exists', async () => {
      vi.mocked(mockCampaignRepo.existsByNameAndUserId).mockResolvedValue(true)

      await expect(useCase.execute(validDto)).rejects.toThrow(DuplicateCampaignNameError)
    })
  })

  describe('Meta API 동기화', () => {
    it('should sync to Meta when syncToMeta is true', async () => {
      const dtoWithMeta = {
        ...validDto,
        syncToMeta: true,
        accessToken: 'token-123',
        adAccountId: 'act_123',
      }

      const result = await useCase.execute(dtoWithMeta)

      expect(mockMetaAdsService.createCampaign).toHaveBeenCalledTimes(1)
      expect(result.campaign.metaCampaignId).toBe('meta-123')
    })

    it('should save campaign without metaCampaignId when Meta API fails', async () => {
      vi.mocked(mockMetaAdsService.createCampaign).mockRejectedValue(new Error('API Error'))

      const dtoWithMeta = {
        ...validDto,
        syncToMeta: true,
        accessToken: 'token-123',
        adAccountId: 'act_123',
      }

      const result = await useCase.execute(dtoWithMeta)

      expect(result.campaign.metaCampaignId).toBeUndefined()
      expect(mockCampaignRepo.save).toHaveBeenCalledTimes(1)
    })
  })
})
