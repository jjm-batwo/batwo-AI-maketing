import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  UpdateCampaignUseCase,
  CampaignNotFoundError,
  UnauthorizedCampaignAccessError,
} from '@application/use-cases/campaign/UpdateCampaignUseCase'
import { DuplicateCampaignNameError } from '@application/use-cases/campaign/CreateCampaignUseCase'
import { UpdateCampaignDTO } from '@application/dto/campaign/UpdateCampaignDTO'
import { Campaign, CampaignProps } from '@domain/entities/Campaign'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import { Money } from '@domain/value-objects/Money'
import { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import { IMetaAdsService } from '@application/ports/IMetaAdsService'

function createTestCampaign(overrides: Partial<CampaignProps> = {}): Campaign {
  return Campaign.restore({
    id: 'campaign-1',
    userId: 'user-1',
    name: 'Test Campaign',
    objective: CampaignObjective.OUTCOME_SALES,
    status: CampaignStatus.PAUSED,
    dailyBudget: Money.create(50000, 'KRW'),
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31'),
    createdAt: new Date('2025-12-01'),
    updatedAt: new Date('2025-12-01'),
    ...overrides,
  })
}

describe('UpdateCampaignUseCase', () => {
  let useCase: UpdateCampaignUseCase
  let mockCampaignRepo: ICampaignRepository
  let mockMetaAdsService: IMetaAdsService

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-11T10:00:00Z'))

    mockCampaignRepo = {
      findById: vi.fn().mockResolvedValue(createTestCampaign()),
      existsByNameAndUserId: vi.fn().mockResolvedValue(false),
      update: vi.fn().mockImplementation((campaign: Campaign) => Promise.resolve(campaign)),
      save: vi.fn(),
      findByUserId: vi.fn(),
      findByFilters: vi.fn(),
      delete: vi.fn(),
    } as unknown as ICampaignRepository

    mockMetaAdsService = {
      updateCampaign: vi.fn().mockResolvedValue(undefined),
      createCampaign: vi.fn(),
      getCampaigns: vi.fn(),
      getAdAccounts: vi.fn(),
      getCampaignInsights: vi.fn(),
    } as unknown as IMetaAdsService

    useCase = new UpdateCampaignUseCase(mockCampaignRepo, mockMetaAdsService)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // =========================================================================
  // 기본 필드 업데이트 (PAUSED 상태에서 수행 — ACTIVE는 예산만 가능)
  // =========================================================================
  describe('필드 업데이트', () => {
    it('PAUSED 캠페인의 이름을 성공적으로 변경해야 함', async () => {
      const dto: UpdateCampaignDTO = {
        campaignId: 'campaign-1',
        userId: 'user-1',
        name: '새로운 캠페인 이름',
      }

      const result = await useCase.execute(dto)

      expect(result.name).toBe('새로운 캠페인 이름')
      expect(mockCampaignRepo.update).toHaveBeenCalledOnce()
    })

    it('예산을 성공적으로 변경해야 함', async () => {
      const dto: UpdateCampaignDTO = {
        campaignId: 'campaign-1',
        userId: 'user-1',
        dailyBudget: 100000,
        currency: 'KRW',
      }

      const result = await useCase.execute(dto)

      expect(result.dailyBudget).toBe(100000)
      expect(result.currency).toBe('KRW')
    })

    it('ACTIVE 캠페인은 예산만 변경 가능해야 함', async () => {
      vi.mocked(mockCampaignRepo.findById).mockResolvedValue(
        createTestCampaign({ status: CampaignStatus.ACTIVE })
      )

      const dto: UpdateCampaignDTO = {
        campaignId: 'campaign-1',
        userId: 'user-1',
        dailyBudget: 80000,
        currency: 'KRW',
      }

      const result = await useCase.execute(dto)

      expect(result.dailyBudget).toBe(80000)
    })

    it('ACTIVE 캠페인에서 이름 변경은 에러를 던져야 함', async () => {
      vi.mocked(mockCampaignRepo.findById).mockResolvedValue(
        createTestCampaign({ status: CampaignStatus.ACTIVE })
      )

      const dto: UpdateCampaignDTO = {
        campaignId: 'campaign-1',
        userId: 'user-1',
        name: '변경 불가',
      }

      await expect(useCase.execute(dto)).rejects.toThrow('Only budget can be updated')
    })

    it('종료일을 null로 설정하면 제거되어야 함', async () => {
      const dto: UpdateCampaignDTO = {
        campaignId: 'campaign-1',
        userId: 'user-1',
        endDate: null,
      }

      const result = await useCase.execute(dto)

      expect(result.endDate).toBeUndefined()
    })

    it('타겟 오디언스를 업데이트해야 함', async () => {
      const dto: UpdateCampaignDTO = {
        campaignId: 'campaign-1',
        userId: 'user-1',
        targetAudience: {
          ageMin: 25,
          ageMax: 45,
          genders: ['all'],
          locations: ['서울'],
        },
      }

      const result = await useCase.execute(dto)

      expect(result.targetAudience?.ageMin).toBe(25)
      expect(result.targetAudience?.locations).toContain('서울')
    })
  })

  // =========================================================================
  // 상태 변경 (Status Toggle)
  // =========================================================================
  describe('상태 변경', () => {
    it('ACTIVE → PAUSED로 상태를 변경해야 함', async () => {
      vi.mocked(mockCampaignRepo.findById).mockResolvedValue(
        createTestCampaign({ status: CampaignStatus.ACTIVE })
      )

      const dto: UpdateCampaignDTO = {
        campaignId: 'campaign-1',
        userId: 'user-1',
        status: CampaignStatus.PAUSED,
      }

      const result = await useCase.execute(dto)

      expect(result.status).toBe(CampaignStatus.PAUSED)
    })

    it('PAUSED → ACTIVE로 상태를 변경해야 함', async () => {
      const dto: UpdateCampaignDTO = {
        campaignId: 'campaign-1',
        userId: 'user-1',
        status: CampaignStatus.ACTIVE,
      }

      const result = await useCase.execute(dto)

      expect(result.status).toBe(CampaignStatus.ACTIVE)
    })

    it('상태와 예산을 동시에 변경해야 함 (ACTIVE→PAUSED + budget)', async () => {
      vi.mocked(mockCampaignRepo.findById).mockResolvedValue(
        createTestCampaign({ status: CampaignStatus.ACTIVE })
      )

      const dto: UpdateCampaignDTO = {
        campaignId: 'campaign-1',
        userId: 'user-1',
        dailyBudget: 75000,
        currency: 'KRW',
        status: CampaignStatus.PAUSED,
      }

      const result = await useCase.execute(dto)

      expect(result.status).toBe(CampaignStatus.PAUSED)
      expect(result.dailyBudget).toBe(75000)
    })

    it('동일 상태로 변경 요청 시 그대로 유지해야 함', async () => {
      vi.mocked(mockCampaignRepo.findById).mockResolvedValue(
        createTestCampaign({ status: CampaignStatus.ACTIVE })
      )

      const dto: UpdateCampaignDTO = {
        campaignId: 'campaign-1',
        userId: 'user-1',
        status: CampaignStatus.ACTIVE,
      }

      const result = await useCase.execute(dto)

      expect(result.status).toBe(CampaignStatus.ACTIVE)
    })

    it('허용되지 않는 상태 전환은 에러를 던져야 함 (ACTIVE → DRAFT)', async () => {
      vi.mocked(mockCampaignRepo.findById).mockResolvedValue(
        createTestCampaign({ status: CampaignStatus.ACTIVE })
      )

      const dto: UpdateCampaignDTO = {
        campaignId: 'campaign-1',
        userId: 'user-1',
        status: CampaignStatus.DRAFT,
      }

      await expect(useCase.execute(dto)).rejects.toThrow()
    })

    it('COMPLETED 상태에서는 상태 변경이 불가해야 함', async () => {
      vi.mocked(mockCampaignRepo.findById).mockResolvedValue(
        createTestCampaign({ status: CampaignStatus.COMPLETED })
      )

      const dto: UpdateCampaignDTO = {
        campaignId: 'campaign-1',
        userId: 'user-1',
        status: CampaignStatus.ACTIVE,
      }

      await expect(useCase.execute(dto)).rejects.toThrow()
    })

    it('DRAFT → PENDING_REVIEW로 상태를 변경해야 함', async () => {
      vi.mocked(mockCampaignRepo.findById).mockResolvedValue(
        createTestCampaign({ status: CampaignStatus.DRAFT })
      )

      const dto: UpdateCampaignDTO = {
        campaignId: 'campaign-1',
        userId: 'user-1',
        status: CampaignStatus.PENDING_REVIEW,
      }

      const result = await useCase.execute(dto)

      expect(result.status).toBe(CampaignStatus.PENDING_REVIEW)
    })
  })

  // =========================================================================
  // 권한 및 검증
  // =========================================================================
  describe('권한 및 검증', () => {
    it('존재하지 않는 캠페인은 CampaignNotFoundError를 던져야 함', async () => {
      vi.mocked(mockCampaignRepo.findById).mockResolvedValue(null)

      const dto: UpdateCampaignDTO = {
        campaignId: 'nonexistent',
        userId: 'user-1',
        name: 'Test',
      }

      await expect(useCase.execute(dto)).rejects.toThrow(CampaignNotFoundError)
    })

    it('다른 사용자의 캠페인은 UnauthorizedCampaignAccessError를 던져야 함', async () => {
      const dto: UpdateCampaignDTO = {
        campaignId: 'campaign-1',
        userId: 'other-user',
        name: 'Hacked!',
      }

      await expect(useCase.execute(dto)).rejects.toThrow(UnauthorizedCampaignAccessError)
    })

    it('중복된 캠페인 이름은 DuplicateCampaignNameError를 던져야 함', async () => {
      vi.mocked(mockCampaignRepo.existsByNameAndUserId).mockResolvedValue(true)

      const dto: UpdateCampaignDTO = {
        campaignId: 'campaign-1',
        userId: 'user-1',
        name: '이미 존재하는 이름',
      }

      await expect(useCase.execute(dto)).rejects.toThrow(DuplicateCampaignNameError)
    })

    it('같은 이름으로 유지하면 중복 검사를 하지 않아야 함', async () => {
      const dto: UpdateCampaignDTO = {
        campaignId: 'campaign-1',
        userId: 'user-1',
        name: 'Test Campaign', // 기존과 동일
      }

      await useCase.execute(dto)

      expect(mockCampaignRepo.existsByNameAndUserId).not.toHaveBeenCalled()
    })
  })

  // =========================================================================
  // Meta Ads 동기화
  // =========================================================================
  describe('Meta Ads 동기화', () => {
    it('syncToMeta가 true이고 metaCampaignId가 있으면 Meta에 동기화해야 함', async () => {
      vi.mocked(mockCampaignRepo.findById).mockResolvedValue(
        createTestCampaign({ metaCampaignId: 'meta-123' })
      )

      const dto: UpdateCampaignDTO = {
        campaignId: 'campaign-1',
        userId: 'user-1',
        name: 'Updated Name',
        syncToMeta: true,
        accessToken: 'token-abc',
      }

      await useCase.execute(dto)

      expect(mockMetaAdsService.updateCampaign).toHaveBeenCalledWith(
        'token-abc',
        'meta-123',
        expect.objectContaining({ name: 'Updated Name' })
      )
    })

    it('상태 변경 시 ACTIVE/PAUSED만 Meta에 전달해야 함', async () => {
      vi.mocked(mockCampaignRepo.findById).mockResolvedValue(
        createTestCampaign({ metaCampaignId: 'meta-123', status: CampaignStatus.ACTIVE })
      )

      const dto: UpdateCampaignDTO = {
        campaignId: 'campaign-1',
        userId: 'user-1',
        status: CampaignStatus.PAUSED,
        syncToMeta: true,
        accessToken: 'token-abc',
      }

      await useCase.execute(dto)

      expect(mockMetaAdsService.updateCampaign).toHaveBeenCalledWith(
        'token-abc',
        'meta-123',
        expect.objectContaining({ status: 'PAUSED' })
      )
    })

    it('syncToMeta가 false이면 Meta에 동기화하지 않아야 함', async () => {
      const dto: UpdateCampaignDTO = {
        campaignId: 'campaign-1',
        userId: 'user-1',
        name: 'No Sync',
        syncToMeta: false,
      }

      await useCase.execute(dto)

      expect(mockMetaAdsService.updateCampaign).not.toHaveBeenCalled()
    })

    it('metaCampaignId가 없으면 Meta에 동기화하지 않아야 함', async () => {
      vi.mocked(mockCampaignRepo.findById).mockResolvedValue(
        createTestCampaign({ metaCampaignId: undefined })
      )

      const dto: UpdateCampaignDTO = {
        campaignId: 'campaign-1',
        userId: 'user-1',
        name: 'No Meta ID',
        syncToMeta: true,
        accessToken: 'token-abc',
      }

      await useCase.execute(dto)

      expect(mockMetaAdsService.updateCampaign).not.toHaveBeenCalled()
    })
  })

  // =========================================================================
  // 저장 검증
  // =========================================================================
  describe('저장', () => {
    it('업데이트된 캠페인을 리포지토리에 저장해야 함', async () => {
      const dto: UpdateCampaignDTO = {
        campaignId: 'campaign-1',
        userId: 'user-1',
        name: 'Saved Campaign',
      }

      await useCase.execute(dto)

      expect(mockCampaignRepo.update).toHaveBeenCalledOnce()
      const savedCampaign = vi.mocked(mockCampaignRepo.update).mock.calls[0][0]
      expect(savedCampaign.name).toBe('Saved Campaign')
    })

    it('상태만 변경해도 리포지토리에 저장해야 함', async () => {
      vi.mocked(mockCampaignRepo.findById).mockResolvedValue(
        createTestCampaign({ status: CampaignStatus.ACTIVE })
      )

      const dto: UpdateCampaignDTO = {
        campaignId: 'campaign-1',
        userId: 'user-1',
        status: CampaignStatus.PAUSED,
      }

      await useCase.execute(dto)

      expect(mockCampaignRepo.update).toHaveBeenCalledOnce()
      const savedCampaign = vi.mocked(mockCampaignRepo.update).mock.calls[0][0]
      expect(savedCampaign.status).toBe(CampaignStatus.PAUSED)
    })

    it('CampaignDTO 형식으로 결과를 반환해야 함', async () => {
      const dto: UpdateCampaignDTO = {
        campaignId: 'campaign-1',
        userId: 'user-1',
        dailyBudget: 60000,
        currency: 'KRW',
      }

      const result = await useCase.execute(dto)

      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('name')
      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('dailyBudget', 60000)
      expect(result).toHaveProperty('createdAt')
      expect(result).toHaveProperty('updatedAt')
    })
  })
})
