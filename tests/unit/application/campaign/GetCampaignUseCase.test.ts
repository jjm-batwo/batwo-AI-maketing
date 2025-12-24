import { describe, it, expect, beforeEach } from 'vitest'
import { GetCampaignUseCase } from '@application/use-cases/campaign/GetCampaignUseCase'
import { ListCampaignsUseCase } from '@application/use-cases/campaign/ListCampaignsUseCase'
import { MockCampaignRepository } from '@tests/mocks/repositories/MockCampaignRepository'
import { Campaign } from '@domain/entities/Campaign'
import { Money } from '@domain/value-objects/Money'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'

describe('GetCampaignUseCase', () => {
  let useCase: GetCampaignUseCase
  let campaignRepository: MockCampaignRepository

  beforeEach(() => {
    campaignRepository = new MockCampaignRepository()
    useCase = new GetCampaignUseCase(campaignRepository)
  })

  const createTestCampaign = (userId: string, name: string): Campaign => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    return Campaign.create({
      userId,
      name,
      objective: CampaignObjective.CONVERSIONS,
      dailyBudget: Money.create(50000, 'KRW'),
      startDate: tomorrow,
    })
  }

  describe('execute', () => {
    it('should return campaign by id', async () => {
      const campaign = createTestCampaign('user-123', 'Test Campaign')
      await campaignRepository.save(campaign)

      const result = await useCase.execute({
        campaignId: campaign.id,
        userId: 'user-123',
      })

      expect(result).not.toBeNull()
      expect(result!.id).toBe(campaign.id)
      expect(result!.name).toBe('Test Campaign')
    })

    it('should return null for non-existent campaign', async () => {
      const result = await useCase.execute({
        campaignId: 'non-existent-id',
        userId: 'user-123',
      })

      expect(result).toBeNull()
    })

    it('should return null if campaign belongs to different user', async () => {
      const campaign = createTestCampaign('user-123', 'Test Campaign')
      await campaignRepository.save(campaign)

      const result = await useCase.execute({
        campaignId: campaign.id,
        userId: 'different-user',
      })

      expect(result).toBeNull()
    })
  })
})

describe('ListCampaignsUseCase', () => {
  let useCase: ListCampaignsUseCase
  let campaignRepository: MockCampaignRepository

  beforeEach(() => {
    campaignRepository = new MockCampaignRepository()
    useCase = new ListCampaignsUseCase(campaignRepository)
  })

  const createTestCampaign = (userId: string, name: string): Campaign => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    return Campaign.create({
      userId,
      name,
      objective: CampaignObjective.CONVERSIONS,
      dailyBudget: Money.create(50000, 'KRW'),
      startDate: tomorrow,
    })
  }

  describe('execute', () => {
    it('should return all campaigns for user', async () => {
      const campaign1 = createTestCampaign('user-123', 'Campaign 1')
      const campaign2 = createTestCampaign('user-123', 'Campaign 2')
      const campaign3 = createTestCampaign('other-user', 'Campaign 3')

      await campaignRepository.save(campaign1)
      await campaignRepository.save(campaign2)
      await campaignRepository.save(campaign3)

      const result = await useCase.execute({ userId: 'user-123' })

      expect(result.data.length).toBe(2)
      expect(result.total).toBe(2)
    })

    it('should return empty list for user with no campaigns', async () => {
      const result = await useCase.execute({ userId: 'user-123' })

      expect(result.data).toEqual([])
      expect(result.total).toBe(0)
    })

    it('should filter by status', async () => {
      const campaign1 = createTestCampaign('user-123', 'Campaign 1')
      const campaign2 = createTestCampaign('user-123', 'Campaign 2')
        .changeStatus(CampaignStatus.PENDING_REVIEW)

      await campaignRepository.save(campaign1)
      await campaignRepository.save(campaign2)

      const result = await useCase.execute({
        userId: 'user-123',
        status: CampaignStatus.DRAFT,
      })

      expect(result.data.length).toBe(1)
      expect(result.data[0].name).toBe('Campaign 1')
    })

    it('should paginate results', async () => {
      for (let i = 0; i < 15; i++) {
        const campaign = createTestCampaign('user-123', `Campaign ${i}`)
        await campaignRepository.save(campaign)
      }

      const page1 = await useCase.execute({
        userId: 'user-123',
        page: 1,
        limit: 10,
      })

      expect(page1.data.length).toBe(10)
      expect(page1.total).toBe(15)
      expect(page1.totalPages).toBe(2)

      const page2 = await useCase.execute({
        userId: 'user-123',
        page: 2,
        limit: 10,
      })

      expect(page2.data.length).toBe(5)
    })
  })
})
