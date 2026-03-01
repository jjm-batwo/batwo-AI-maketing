import { describe, it, expect, beforeEach } from 'vitest'
import { setupIntegrationTest, getPrismaClient, createTestUser } from '../setup'
import { PrismaKPIRepository } from '@infrastructure/database/repositories/PrismaKPIRepository'
import { PrismaCampaignRepository } from '@infrastructure/database/repositories/PrismaCampaignRepository'
import { KPI } from '@domain/entities/KPI'
import { Campaign } from '@domain/entities/Campaign'
import { Money } from '@domain/value-objects/Money'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'

describe('PrismaKPIRepository', () => {
  setupIntegrationTest()

  let repository: PrismaKPIRepository
  let campaignRepository: PrismaCampaignRepository
  let testUserId: string
  let testCampaignId: string

  beforeEach(async () => {
    const prisma = getPrismaClient()
    repository = new PrismaKPIRepository(prisma)
    campaignRepository = new PrismaCampaignRepository(prisma)

    const user = await createTestUser()
    testUserId = user.id

    // Create a test campaign
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const campaign = Campaign.restore({
      id: crypto.randomUUID(),
      userId: testUserId,
      name: 'Test Campaign',
      objective: CampaignObjective.SALES,
      status: CampaignStatus.ACTIVE,
      dailyBudget: Money.create(100000, 'KRW'),
      startDate: tomorrow,
      endDate: undefined,
      targetAudience: undefined,
      metaCampaignId: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await campaignRepository.save(campaign)
    testCampaignId = campaign.id
  })

  const createTestKPI = (overrides: Partial<Parameters<typeof KPI.restore>[0]> = {}) => {
    return KPI.restore({
      id: crypto.randomUUID(),
      campaignId: testCampaignId,
      impressions: 10000,
      clicks: 500,
      conversions: 50,
      spend: Money.create(50000, 'KRW'),
      revenue: Money.create(250000, 'KRW'),
      date: new Date(),
      createdAt: new Date(),
      ...overrides,
    })
  }

  describe('save', () => {
    it('should save and return a KPI', async () => {
      const kpi = createTestKPI()

      const saved = await repository.save(kpi)

      expect(saved.id).toBe(kpi.id)
      expect(saved.impressions).toBe(10000)
      expect(saved.clicks).toBe(500)
    })
  })

  describe('saveMany', () => {
    it('should save multiple KPIs', async () => {
      const kpi1 = createTestKPI({ id: crypto.randomUUID() })
      const kpi2 = createTestKPI({ id: crypto.randomUUID() })

      const saved = await repository.saveMany([kpi1, kpi2])

      expect(saved).toHaveLength(2)
    })
  })

  describe('findById', () => {
    it('should find KPI by id', async () => {
      const kpi = createTestKPI()
      await repository.save(kpi)

      const found = await repository.findById(kpi.id)

      expect(found).not.toBeNull()
      expect(found!.id).toBe(kpi.id)
    })

    it('should return null for non-existent KPI', async () => {
      const found = await repository.findById('non-existent-id')

      expect(found).toBeNull()
    })
  })

  describe('findByCampaignId', () => {
    it('should find all KPIs for a campaign', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const kpi1 = createTestKPI({ id: crypto.randomUUID() })
      const kpi2 = createTestKPI({ id: crypto.randomUUID(), date: tomorrow })

      await repository.save(kpi1)
      await repository.save(kpi2)

      const kpis = await repository.findByCampaignId(testCampaignId)

      expect(kpis).toHaveLength(2)
    })
  })

  describe('findByCampaignIdAndDateRange', () => {
    it('should find KPIs within date range', async () => {
      const today = new Date()
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)
      const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)

      const kpiInRange = createTestKPI({ date: yesterday })
      const kpiOutOfRange = createTestKPI({
        id: crypto.randomUUID(),
        date: threeDaysAgo,
      })

      await repository.save(kpiInRange)
      await repository.save(kpiOutOfRange)

      const kpis = await repository.findByCampaignIdAndDateRange(testCampaignId, twoDaysAgo, today)

      expect(kpis).toHaveLength(1)
      expect(kpis[0].id).toBe(kpiInRange.id)
    })
  })

  describe('findLatestByCampaignId', () => {
    it('should find the latest KPI for a campaign', async () => {
      const today = new Date()
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

      const olderKPI = createTestKPI({
        id: crypto.randomUUID(),
        date: yesterday,
        createdAt: yesterday,
      })
      const newerKPI = createTestKPI({
        id: crypto.randomUUID(),
        date: today,
        createdAt: today,
      })

      await repository.save(olderKPI)
      await repository.save(newerKPI)

      const latest = await repository.findLatestByCampaignId(testCampaignId)

      expect(latest).not.toBeNull()
      expect(latest!.id).toBe(newerKPI.id)
    })
  })

  describe('aggregateByCampaignId', () => {
    it('should aggregate KPIs for a campaign within date range', async () => {
      const today = new Date()
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

      const kpi1 = createTestKPI({
        id: crypto.randomUUID(),
        date: yesterday,
        impressions: 1000,
        clicks: 100,
        conversions: 10,
        spend: Money.create(10000, 'KRW'),
        revenue: Money.create(50000, 'KRW'),
      })
      const kpi2 = createTestKPI({
        id: crypto.randomUUID(),
        date: today,
        impressions: 2000,
        clicks: 200,
        conversions: 20,
        spend: Money.create(20000, 'KRW'),
        revenue: Money.create(100000, 'KRW'),
      })

      await repository.save(kpi1)
      await repository.save(kpi2)

      const aggregate = await repository.aggregateByCampaignId(testCampaignId, weekAgo, today)

      expect(aggregate.totalImpressions).toBe(3000)
      expect(aggregate.totalClicks).toBe(300)
      expect(aggregate.totalConversions).toBe(30)
      expect(aggregate.totalSpend).toBe(30000)
      expect(aggregate.totalRevenue).toBe(150000)
    })
  })

  describe('delete', () => {
    it('should delete KPI', async () => {
      const kpi = createTestKPI()
      await repository.save(kpi)

      await repository.delete(kpi.id)

      const found = await repository.findById(kpi.id)
      expect(found).toBeNull()
    })
  })

  describe('deleteByCampaignId', () => {
    it('should delete all KPIs for a campaign', async () => {
      const kpi1 = createTestKPI({ id: crypto.randomUUID() })
      const kpi2 = createTestKPI({ id: crypto.randomUUID() })

      await repository.save(kpi1)
      await repository.save(kpi2)

      await repository.deleteByCampaignId(testCampaignId)

      const kpis = await repository.findByCampaignId(testCampaignId)
      expect(kpis).toHaveLength(0)
    })
  })
})
