import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PrismaAdKPIRepository } from '@infrastructure/database/repositories/PrismaAdKPIRepository'
import { AdKPI } from '@domain/entities/AdKPI'
import { Money } from '@domain/value-objects/Money'

describe('PrismaAdKPIRepository', () => {
  let repository: PrismaAdKPIRepository
  let mockPrisma: {
    adKPISnapshot: {
      upsert: ReturnType<typeof vi.fn>
      findMany: ReturnType<typeof vi.fn>
      aggregate: ReturnType<typeof vi.fn>
      groupBy: ReturnType<typeof vi.fn>
    }
    $transaction: ReturnType<typeof vi.fn>
    $queryRaw: ReturnType<typeof vi.fn>
    $queryRawUnsafe: ReturnType<typeof vi.fn>
  }

  const createTestKPI = () =>
    AdKPI.create({
      adId: 'ad-1',
      adSetId: 'adset-1',
      campaignId: 'campaign-1',
      creativeId: 'creative-1',
      impressions: 5000,
      clicks: 200,
      linkClicks: 150,
      conversions: 20,
      spend: Money.create(50000, 'KRW'),
      revenue: Money.create(200000, 'KRW'),
      reach: 4000,
      frequency: 1.25,
      cpm: 10000,
      cpc: 250,
      videoViews: 1000,
      thruPlays: 500,
      date: new Date('2026-03-15'),
    })

  beforeEach(() => {
    mockPrisma = {
      adKPISnapshot: {
        upsert: vi.fn(),
        findMany: vi.fn(),
        aggregate: vi.fn(),
        groupBy: vi.fn(),
      },
      $transaction: vi.fn(),
      $queryRaw: vi.fn(),
      $queryRawUnsafe: vi.fn(),
    }
    repository = new PrismaAdKPIRepository(mockPrisma as never)
  })

  describe('save', () => {
    it('should upsert AdKPI record', async () => {
      const kpi = createTestKPI()
      mockPrisma.adKPISnapshot.upsert.mockResolvedValue({
        id: kpi.id,
        adId: 'ad-1',
        adSetId: 'adset-1',
        campaignId: 'campaign-1',
        creativeId: 'creative-1',
        impressions: 5000,
        clicks: 200,
        linkClicks: 150,
        conversions: 20,
        spend: { toNumber: () => 50000 },
        currency: 'KRW',
        revenue: { toNumber: () => 200000 },
        reach: 4000,
        frequency: { toNumber: () => 1.25 },
        cpm: { toNumber: () => 10000 },
        cpc: { toNumber: () => 250 },
        videoViews: 1000,
        thruPlays: 500,
        date: new Date('2026-03-15'),
        createdAt: new Date(),
      })

      const saved = await repository.save(kpi)
      expect(saved.adId).toBe('ad-1')
      expect(mockPrisma.adKPISnapshot.upsert).toHaveBeenCalledOnce()
    })
  })

  describe('findByCampaignId', () => {
    it('should return AdKPIs for campaign within date range', async () => {
      mockPrisma.adKPISnapshot.findMany.mockResolvedValue([])

      const results = await repository.findByCampaignId(
        'campaign-1',
        new Date('2026-03-01'),
        new Date('2026-03-31')
      )

      expect(results).toEqual([])
      expect(mockPrisma.adKPISnapshot.findMany).toHaveBeenCalledWith({
        where: {
          campaignId: 'campaign-1',
          date: {
            gte: new Date('2026-03-01'),
            lte: new Date('2026-03-31'),
          },
        },
        orderBy: { date: 'asc' },
      })
    })
  })

  describe('upsertMany', () => {
    it('should return 0 for empty array', async () => {
      const count = await repository.upsertMany([])
      expect(count).toBe(0)
    })
  })
})
