import { describe, it, expect, beforeEach } from 'vitest'
import { setupIntegrationTest, getPrismaClient, createTestUser } from '../setup'
import { PrismaCampaignRepository } from '@infrastructure/database/repositories/PrismaCampaignRepository'
import { Campaign } from '@domain/entities/Campaign'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import { Money } from '@domain/value-objects/Money'

describe('PrismaCampaignRepository', () => {
  setupIntegrationTest()

  let repository: PrismaCampaignRepository
  let testUserId: string

  beforeEach(async () => {
    const prisma = getPrismaClient()
    repository = new PrismaCampaignRepository(prisma)

    const user = await createTestUser()
    testUserId = user.id
  })

  const createTestCampaign = (overrides: Partial<Parameters<typeof Campaign.restore>[0]> = {}) => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    return Campaign.restore({
      id: crypto.randomUUID(),
      userId: testUserId,
      name: 'Test Campaign',
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
  }

  describe('save', () => {
    it('should save and return a campaign', async () => {
      const campaign = createTestCampaign()

      const saved = await repository.save(campaign)

      expect(saved.id).toBe(campaign.id)
      expect(saved.name).toBe(campaign.name)
      expect(saved.status).toBe(CampaignStatus.DRAFT)
      expect(saved.dailyBudget.amount).toBe(100000)
    })
  })

  describe('findById', () => {
    it('should find campaign by id', async () => {
      const campaign = createTestCampaign()
      await repository.save(campaign)

      const found = await repository.findById(campaign.id)

      expect(found).not.toBeNull()
      expect(found!.id).toBe(campaign.id)
      expect(found!.name).toBe(campaign.name)
    })

    it('should return null for non-existent campaign', async () => {
      const found = await repository.findById('non-existent-id')

      expect(found).toBeNull()
    })
  })

  describe('findByUserId', () => {
    it('should find all campaigns for a user', async () => {
      const campaign1 = createTestCampaign({ name: 'Campaign 1' })
      const campaign2 = createTestCampaign({ name: 'Campaign 2' })

      await repository.save(campaign1)
      await repository.save(campaign2)

      const campaigns = await repository.findByUserId(testUserId)

      expect(campaigns).toHaveLength(2)
      expect(campaigns.map(c => c.name)).toContain('Campaign 1')
      expect(campaigns.map(c => c.name)).toContain('Campaign 2')
    })

    it('should return empty array for user with no campaigns', async () => {
      const campaigns = await repository.findByUserId('other-user-id')

      expect(campaigns).toHaveLength(0)
    })
  })

  describe('findByFilters', () => {
    it('should filter campaigns by status', async () => {
      const draftCampaign = createTestCampaign({ name: 'Draft', status: CampaignStatus.DRAFT })
      const activeCampaign = createTestCampaign({
        name: 'Active',
        status: CampaignStatus.ACTIVE,
        id: crypto.randomUUID(),
      })

      await repository.save(draftCampaign)
      await repository.save(activeCampaign)

      const result = await repository.findByFilters({
        userId: testUserId,
        status: CampaignStatus.DRAFT
      })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].name).toBe('Draft')
    })

    it('should paginate results', async () => {
      for (let i = 0; i < 15; i++) {
        const campaign = createTestCampaign({
          name: `Campaign ${i}`,
          id: crypto.randomUUID(),
        })
        await repository.save(campaign)
      }

      const result = await repository.findByFilters(
        { userId: testUserId },
        { page: 1, limit: 10 }
      )

      expect(result.data).toHaveLength(10)
      expect(result.total).toBe(15)
      expect(result.totalPages).toBe(2)
    })
  })

  describe('update', () => {
    it('should update campaign', async () => {
      const campaign = createTestCampaign()
      await repository.save(campaign)

      const updated = campaign.updateBudget(Money.create(200000, 'KRW'))
      const result = await repository.update(updated)

      expect(result.dailyBudget.amount).toBe(200000)

      const found = await repository.findById(campaign.id)
      expect(found!.dailyBudget.amount).toBe(200000)
    })
  })

  describe('delete', () => {
    it('should delete campaign', async () => {
      const campaign = createTestCampaign()
      await repository.save(campaign)

      await repository.delete(campaign.id)

      const found = await repository.findById(campaign.id)
      expect(found).toBeNull()
    })
  })

  describe('existsByNameAndUserId', () => {
    it('should return true if campaign with same name exists for user', async () => {
      const campaign = createTestCampaign({ name: 'Unique Name' })
      await repository.save(campaign)

      const exists = await repository.existsByNameAndUserId('Unique Name', testUserId)

      expect(exists).toBe(true)
    })

    it('should return false if campaign name does not exist', async () => {
      const exists = await repository.existsByNameAndUserId('Non-existent', testUserId)

      expect(exists).toBe(false)
    })

    it('should exclude specific campaign id when checking', async () => {
      const campaign = createTestCampaign({ name: 'Unique Name' })
      await repository.save(campaign)

      const exists = await repository.existsByNameAndUserId('Unique Name', testUserId, campaign.id)

      expect(exists).toBe(false)
    })
  })
})
