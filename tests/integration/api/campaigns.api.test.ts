/**
 * 🔴 RED Phase: Campaigns API Integration Tests
 *
 * These tests verify that Campaign Use Cases work correctly with the database.
 * The API routes should be connected to these Use Cases (not mock data).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setupIntegrationTest, getPrismaClient, createTestUser } from '../setup'
import { PrismaCampaignRepository } from '@infrastructure/database/repositories/PrismaCampaignRepository'
import { PrismaUsageLogRepository } from '@infrastructure/database/repositories/PrismaUsageLogRepository'
import { ListCampaignsUseCase } from '@application/use-cases/campaign/ListCampaignsUseCase'
import { CreateCampaignUseCase } from '@application/use-cases/campaign/CreateCampaignUseCase'
import { GetCampaignUseCase } from '@application/use-cases/campaign/GetCampaignUseCase'
import { Campaign } from '@domain/entities/Campaign'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import { Money } from '@domain/value-objects/Money'
import type { IMetaAdsService } from '@application/ports/IMetaAdsService'

describe('Campaigns API Integration', () => {
  setupIntegrationTest()

  let campaignRepository: PrismaCampaignRepository
  let usageLogRepository: PrismaUsageLogRepository
  let mockMetaAdsService: IMetaAdsService
  let testUserId: string

  beforeEach(async () => {
    const prisma = getPrismaClient()
    campaignRepository = new PrismaCampaignRepository(prisma)
    usageLogRepository = new PrismaUsageLogRepository(prisma)

    // Mock Meta Ads service (not used in basic operations)
    mockMetaAdsService = {
      createCampaign: vi.fn(),
      getCampaign: vi.fn(),
      getCampaignInsights: vi.fn(),
      updateCampaign: vi.fn(),
      updateCampaignStatus: vi.fn(),
      deleteCampaign: vi.fn(),
    }

    const user = await createTestUser()
    testUserId = user.id
  })

  const createTestCampaignInDB = async (overrides: Partial<Parameters<typeof Campaign.restore>[0]> = {}) => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const campaign = Campaign.restore({
      id: crypto.randomUUID(),
      userId: testUserId,
      name: `Test Campaign ${Date.now()}`,
      objective: CampaignObjective.SALES,
      status: CampaignStatus.DRAFT,
      dailyBudget: Money.create(100000, 'KRW'),
      startDate: tomorrow,
      endDate: undefined,
      targetAudience: undefined,
      metaCampaignId: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    })

    return campaignRepository.save(campaign)
  }

  describe('ListCampaignsUseCase (GET /api/campaigns)', () => {
    it('인증된 사용자의 캠페인 목록을 DB에서 반환해야 함', async () => {
      // Given: 테스트 사용자의 캠페인이 DB에 존재
      const _campaign1 = await createTestCampaignInDB({ name: 'Campaign A' })
      const _campaign2 = await createTestCampaignInDB({ name: 'Campaign B' })

      const useCase = new ListCampaignsUseCase(campaignRepository)

      // When: Use Case 실행
      const result = await useCase.execute({
        userId: testUserId,
        page: 1,
        limit: 10,
      })

      // Then: DB에 있는 캠페인만 반환 (Mock 데이터가 아님)
      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.data.map(c => c.name)).toContain('Campaign A')
      expect(result.data.map(c => c.name)).toContain('Campaign B')
      // Mock 데이터가 포함되어 있으면 안 됨
      expect(result.data.map(c => c.name)).not.toContain('여름 시즌 프로모션')
    })

    it('다른 사용자의 캠페인은 반환하지 않아야 함', async () => {
      // Given: 다른 사용자의 캠페인 생성
      const otherUser = await createTestUser({ email: 'other@example.com' })
      await createTestCampaignInDB({
        userId: otherUser.id,
        name: 'Other User Campaign',
      })
      await createTestCampaignInDB({ name: 'My Campaign' })

      const useCase = new ListCampaignsUseCase(campaignRepository)

      // When: 내 캠페인만 조회
      const result = await useCase.execute({
        userId: testUserId,
        page: 1,
        limit: 10,
      })

      // Then: 내 캠페인만 반환
      expect(result.data).toHaveLength(1)
      expect(result.data[0].name).toBe('My Campaign')
    })

    it('페이지네이션이 정상 동작해야 함', async () => {
      // Given: 5개 캠페인 생성
      for (let i = 1; i <= 5; i++) {
        await createTestCampaignInDB({ name: `Campaign ${i}` })
      }

      const useCase = new ListCampaignsUseCase(campaignRepository)

      // When: 페이지 1, 사이즈 2로 조회
      const result = await useCase.execute({
        userId: testUserId,
        page: 1,
        limit: 2,
      })

      // Then: 2개만 반환, 총 5개
      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(5)
      expect(result.totalPages).toBe(3)
    })

    it('상태별 필터링이 동작해야 함', async () => {
      // Given: 다양한 상태의 캠페인 생성
      await createTestCampaignInDB({ name: 'Draft', status: CampaignStatus.DRAFT })
      await createTestCampaignInDB({ name: 'Active', status: CampaignStatus.ACTIVE })
      await createTestCampaignInDB({ name: 'Paused', status: CampaignStatus.PAUSED })

      const useCase = new ListCampaignsUseCase(campaignRepository)

      // When: ACTIVE 상태만 조회
      const result = await useCase.execute({
        userId: testUserId,
        status: CampaignStatus.ACTIVE,
      })

      // Then: ACTIVE 캠페인만 반환
      expect(result.data).toHaveLength(1)
      expect(result.data[0].name).toBe('Active')
    })
  })

  describe('CreateCampaignUseCase (POST /api/campaigns)', () => {
    it('유효한 요청으로 캠페인을 생성하고 DB에 저장해야 함', async () => {
      const useCase = new CreateCampaignUseCase(
        campaignRepository,
        mockMetaAdsService,
        usageLogRepository
      )

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      // When: 캠페인 생성
      const result = await useCase.execute({
        userId: testUserId,
        name: 'New Campaign',
        objective: CampaignObjective.TRAFFIC,
        dailyBudget: 50000,
        currency: 'KRW',
        startDate: tomorrow.toISOString(),
      })

      // Then: 생성된 캠페인 반환
      expect(result.id).toBeDefined()
      expect(result.name).toBe('New Campaign')
      expect(result.objective).toBe(CampaignObjective.TRAFFIC)
      expect(result.status).toBe(CampaignStatus.DRAFT)

      // And: DB에 실제로 저장됨
      const savedCampaign = await campaignRepository.findById(result.id)
      expect(savedCampaign).not.toBeNull()
      expect(savedCampaign!.name).toBe('New Campaign')
    })

    it('사용량 로그가 기록되어야 함', async () => {
      const useCase = new CreateCampaignUseCase(
        campaignRepository,
        mockMetaAdsService,
        usageLogRepository
      )

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      // When: 캠페인 생성
      await useCase.execute({
        userId: testUserId,
        name: 'Campaign With Log',
        objective: CampaignObjective.SALES,
        dailyBudget: 30000,
        currency: 'KRW',
        startDate: tomorrow.toISOString(),
      })

      // Then: 사용량 로그 기록됨
      const logCount = await usageLogRepository.countByPeriod(testUserId, 'CAMPAIGN_CREATE', 'day')
      expect(logCount).toBeGreaterThan(0)
    })

    it('중복 이름으로 캠페인 생성 시 에러 발생해야 함', async () => {
      // Given: 동일 이름의 캠페인이 이미 존재
      await createTestCampaignInDB({ name: 'Duplicate Name' })

      const useCase = new CreateCampaignUseCase(
        campaignRepository,
        mockMetaAdsService,
        usageLogRepository
      )

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      // When/Then: 중복 이름으로 생성 시 에러
      await expect(
        useCase.execute({
          userId: testUserId,
          name: 'Duplicate Name',
          objective: CampaignObjective.SALES,
          dailyBudget: 50000,
          currency: 'KRW',
          startDate: tomorrow.toISOString(),
        })
      ).rejects.toThrow('Campaign with name "Duplicate Name" already exists')
    })
  })

  describe('GetCampaignUseCase (GET /api/campaigns/[id])', () => {
    it('존재하는 캠페인을 DB에서 조회해야 함', async () => {
      // Given: DB에 캠페인 존재
      const campaign = await createTestCampaignInDB({ name: 'Specific Campaign' })

      const useCase = new GetCampaignUseCase(campaignRepository)

      // When: ID로 조회
      const result = await useCase.execute({
        campaignId: campaign.id,
        userId: testUserId,
      })

      // Then: DB 데이터 반환
      expect(result).not.toBeNull()
      expect(result!.name).toBe('Specific Campaign')
    })

    it('다른 사용자의 캠페인은 조회할 수 없어야 함', async () => {
      // Given: 다른 사용자의 캠페인
      const otherUser = await createTestUser({ email: 'another@example.com' })
      const otherCampaign = await createTestCampaignInDB({
        userId: otherUser.id,
        name: 'Other Campaign',
      })

      const useCase = new GetCampaignUseCase(campaignRepository)

      // When: 다른 사용자의 캠페인 조회 시도
      const result = await useCase.execute({
        campaignId: otherCampaign.id,
        userId: testUserId,
      })

      // Then: null 반환 (권한 없음)
      expect(result).toBeNull()
    })

    it('존재하지 않는 캠페인 조회 시 null 반환해야 함', async () => {
      const useCase = new GetCampaignUseCase(campaignRepository)

      // When: 없는 ID로 조회
      const result = await useCase.execute({
        campaignId: 'non-existent-id',
        userId: testUserId,
      })

      // Then: null 반환
      expect(result).toBeNull()
    })
  })
})
