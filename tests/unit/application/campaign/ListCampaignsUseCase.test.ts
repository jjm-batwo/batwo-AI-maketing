import { describe, it, expect, beforeEach } from 'vitest'
import { ListCampaignsUseCase } from '@application/use-cases/campaign/ListCampaignsUseCase'
import { MockCampaignRepository } from '@tests/mocks/repositories/MockCampaignRepository'
import { Campaign } from '@domain/entities/Campaign'
import { Money } from '@domain/value-objects/Money'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'

describe('ListCampaignsUseCase', () => {
  let useCase: ListCampaignsUseCase
  let campaignRepository: MockCampaignRepository

  beforeEach(() => {
    campaignRepository = new MockCampaignRepository()
    useCase = new ListCampaignsUseCase(campaignRepository)
  })

  const createTestCampaign = (
    userId: string,
    name: string,
    status?: CampaignStatus
  ): Campaign => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    let campaign = Campaign.create({
      userId,
      name,
      objective: CampaignObjective.CONVERSIONS,
      dailyBudget: Money.create(50000, 'KRW'),
      startDate: tomorrow,
    })

    // Follow valid status transitions: DRAFT → PENDING_REVIEW → ACTIVE/REJECTED
    if (status && status !== CampaignStatus.DRAFT) {
      campaign = campaign.changeStatus(CampaignStatus.PENDING_REVIEW)

      if (status === CampaignStatus.ACTIVE) {
        campaign = campaign.changeStatus(CampaignStatus.ACTIVE)
      } else if (status === CampaignStatus.PAUSED) {
        campaign = campaign.changeStatus(CampaignStatus.ACTIVE)
        campaign = campaign.changeStatus(CampaignStatus.PAUSED)
      } else if (status === CampaignStatus.REJECTED) {
        campaign = campaign.changeStatus(CampaignStatus.REJECTED)
      } else if (status === CampaignStatus.PENDING_REVIEW) {
        // Already at PENDING_REVIEW
      }
    }

    return campaign
  }

  describe('execute - basic pagination', () => {
    it('should use default pagination (page 1, limit 10)', async () => {
      const campaign = createTestCampaign('user-123', 'Campaign 1')
      await campaignRepository.save(campaign)

      const result = await useCase.execute({ userId: 'user-123' })

      expect(result.page).toBe(1)
      expect(result.limit).toBe(10)
    })

    it('should use custom pagination when provided', async () => {
      for (let i = 0; i < 25; i++) {
        const campaign = createTestCampaign('user-123', `Campaign ${i}`)
        await campaignRepository.save(campaign)
      }

      const result = await useCase.execute({
        userId: 'user-123',
        page: 2,
        limit: 5,
      })

      expect(result.page).toBe(2)
      expect(result.limit).toBe(5)
      expect(result.data.length).toBe(5)
      expect(result.total).toBe(25)
      expect(result.totalPages).toBe(5)
    })
  })

  describe('execute - user filtering', () => {
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
      const campaign = createTestCampaign('other-user', 'Campaign 1')
      await campaignRepository.save(campaign)

      const result = await useCase.execute({ userId: 'user-123' })

      expect(result.data).toEqual([])
      expect(result.total).toBe(0)
      expect(result.totalPages).toBe(0)
    })
  })

  describe('execute - status filtering', () => {
    it('should filter by single status', async () => {
      const draftCampaign = createTestCampaign('user-123', 'Draft Campaign')
      const pendingCampaign = createTestCampaign(
        'user-123',
        'Pending Campaign',
        CampaignStatus.PENDING_REVIEW
      )

      await campaignRepository.save(draftCampaign)
      await campaignRepository.save(pendingCampaign)

      const result = await useCase.execute({
        userId: 'user-123',
        status: CampaignStatus.DRAFT,
      })

      expect(result.data.length).toBe(1)
      expect(result.data[0].name).toBe('Draft Campaign')
      expect(result.data[0].status).toBe(CampaignStatus.DRAFT)
    })

    it('should filter by multiple statuses', async () => {
      const draftCampaign = createTestCampaign('user-123', 'Draft Campaign')
      const pendingCampaign = createTestCampaign(
        'user-123',
        'Pending Campaign',
        CampaignStatus.PENDING_REVIEW
      )
      const activeCampaign = createTestCampaign(
        'user-123',
        'Active Campaign',
        CampaignStatus.ACTIVE
      )

      await campaignRepository.save(draftCampaign)
      await campaignRepository.save(pendingCampaign)
      await campaignRepository.save(activeCampaign)

      const result = await useCase.execute({
        userId: 'user-123',
        status: [CampaignStatus.DRAFT, CampaignStatus.ACTIVE],
      })

      expect(result.data.length).toBe(2)
      expect(result.data.map((c) => c.status).sort()).toEqual(
        [CampaignStatus.ACTIVE, CampaignStatus.DRAFT].sort()
      )
    })

    it('should return empty when no campaigns match status', async () => {
      const draftCampaign = createTestCampaign('user-123', 'Draft Campaign')
      await campaignRepository.save(draftCampaign)

      const result = await useCase.execute({
        userId: 'user-123',
        status: CampaignStatus.ACTIVE,
      })

      expect(result.data).toEqual([])
      expect(result.total).toBe(0)
    })
  })

  describe('execute - pagination', () => {
    it('should paginate results correctly', async () => {
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
      expect(page1.page).toBe(1)

      const page2 = await useCase.execute({
        userId: 'user-123',
        page: 2,
        limit: 10,
      })

      expect(page2.data.length).toBe(5)
      expect(page2.page).toBe(2)
    })

    it('should return empty data for page beyond total pages', async () => {
      for (let i = 0; i < 5; i++) {
        const campaign = createTestCampaign('user-123', `Campaign ${i}`)
        await campaignRepository.save(campaign)
      }

      const result = await useCase.execute({
        userId: 'user-123',
        page: 10,
        limit: 10,
      })

      expect(result.data).toEqual([])
      expect(result.total).toBe(5)
    })
  })

  describe('execute - DTO transformation', () => {
    it('should return properly transformed CampaignDTO', async () => {
      const campaign = createTestCampaign('user-123', 'Test Campaign')
      await campaignRepository.save(campaign)

      const result = await useCase.execute({ userId: 'user-123' })

      expect(result.data[0]).toMatchObject({
        id: campaign.id,
        name: 'Test Campaign',
        objective: CampaignObjective.CONVERSIONS,
        status: CampaignStatus.DRAFT,
        dailyBudget: 50000,
        currency: 'KRW',
      })
    })
  })
})
