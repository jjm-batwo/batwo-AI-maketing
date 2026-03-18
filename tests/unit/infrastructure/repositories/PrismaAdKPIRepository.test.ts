import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PrismaAdKPIRepository } from '@infrastructure/database/repositories/PrismaAdKPIRepository'

const mockGroupBy = vi.fn()
const mockAggregate = vi.fn()
const mockQueryRaw = vi.fn()
const mockQueryRawUnsafe = vi.fn()
const mockFindMany = vi.fn()
const mockUpsert = vi.fn()
const mockTransaction = vi.fn()

const mockPrisma = {
  adKPISnapshot: {
    groupBy: mockGroupBy,
    aggregate: mockAggregate,
    findMany: mockFindMany,
    upsert: mockUpsert,
  },
  $queryRaw: mockQueryRaw,
  $queryRawUnsafe: mockQueryRawUnsafe,
  $transaction: mockTransaction,
} as any

describe('PrismaAdKPIRepository', () => {
  let repo: PrismaAdKPIRepository

  beforeEach(() => {
    vi.clearAllMocks()
    repo = new PrismaAdKPIRepository(mockPrisma)
  })

  describe('getDailyAggregatesByCampaignIds', () => {
    it('should return empty array for empty campaignIds', async () => {
      const result = await repo.getDailyAggregatesByCampaignIds(
        [], new Date(), new Date()
      )
      expect(result).toEqual([])
      expect(mockGroupBy).not.toHaveBeenCalled()
    })

    it('should group by date and sum metrics', async () => {
      mockGroupBy.mockResolvedValue([
        {
          date: new Date('2026-03-15'),
          _sum: {
            impressions: 5000,
            clicks: 250,
            conversions: 25,
            spend: 100000,
            revenue: 300000,
          },
        },
      ])

      const result = await repo.getDailyAggregatesByCampaignIds(
        ['c-1'], new Date('2026-03-10'), new Date('2026-03-16')
      )

      expect(result).toHaveLength(1)
      expect(result[0].totalImpressions).toBe(5000)
      expect(result[0].totalSpend).toBe(100000)
    })
  })

  describe('aggregateByCampaignIds', () => {
    it('should return empty array for empty campaignIds', async () => {
      const result = await repo.aggregateByCampaignIds(
        [], new Date('2026-03-10'), new Date('2026-03-16')
      )
      expect(result).toEqual([])
    })

    it('should aggregate metrics grouped by campaignId', async () => {
      mockGroupBy.mockResolvedValue([
        {
          campaignId: 'c-1',
          _sum: {
            impressions: 5000,
            clicks: 250,
            conversions: 25,
            spend: 100000,
            revenue: 300000,
          },
        },
        {
          campaignId: 'c-2',
          _sum: {
            impressions: 3000,
            clicks: 150,
            conversions: 10,
            spend: 50000,
            revenue: 80000,
          },
        },
      ])

      const result = await repo.aggregateByCampaignIds(
        ['c-1', 'c-2'], new Date('2026-03-10'), new Date('2026-03-16')
      )

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        campaignId: 'c-1',
        totalImpressions: 5000,
        totalClicks: 250,
        totalConversions: 25,
        totalSpend: 100000,
        totalRevenue: 300000,
      })
    })
  })

  describe('aggregateByCampaignId', () => {
    it('should return zeros when no data exists', async () => {
      mockAggregate.mockResolvedValue({
        _sum: {
          impressions: null, clicks: null, linkClicks: null,
          conversions: null, spend: null, revenue: null,
          reach: null, videoViews: null, thruPlays: null,
        },
        _avg: { frequency: null, cpm: null, cpc: null },
      })

      const result = await repo.aggregateByCampaignId(
        'c-1', new Date('2026-03-10'), new Date('2026-03-16')
      )

      expect(result.totalImpressions).toBe(0)
      expect(result.totalSpend).toBe(0)
      expect(result.avgFrequency).toBe(0)
    })
  })

  describe('aggregateByFormat', () => {
    it('should return empty for empty campaignIds', async () => {
      const result = await repo.aggregateByFormat(
        [], new Date(), new Date()
      )
      expect(result).toEqual([])
    })
  })

  describe('getTopCreatives', () => {
    it('should return empty for empty campaignIds', async () => {
      const result = await repo.getTopCreatives(
        [], new Date(), new Date(), 10, 'roas'
      )
      expect(result).toEqual([])
    })
  })
})
