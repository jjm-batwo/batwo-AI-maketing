import { describe, it, expect, beforeEach } from 'vitest'
import { MockKPIRepository } from '@tests/mocks/repositories/MockKPIRepository'
import { KPI } from '@domain/entities/KPI'
import { Money } from '@domain/value-objects/Money'

describe('IKPIRepository.getDailyAggregates', () => {
  let repository: MockKPIRepository

  beforeEach(() => {
    repository = new MockKPIRepository()
  })

  const createTestKPI = (
    campaignId: string,
    date: Date,
    overrides: Partial<{
      impressions: number
      clicks: number
      conversions: number
      spend: number
      revenue: number
    }> = {}
  ): KPI => {
    return KPI.create({
      campaignId,
      impressions: overrides.impressions ?? 1000,
      clicks: overrides.clicks ?? 100,
      conversions: overrides.conversions ?? 10,
      spend: Money.create(overrides.spend ?? 50000, 'KRW'),
      revenue: Money.create(overrides.revenue ?? 200000, 'KRW'),
      date,
    })
  }

  describe('basic functionality', () => {
    it('should return daily aggregated KPIs for single campaign', async () => {
      // Arrange
      const campaignId = 'campaign-1'
      const kpi1 = createTestKPI(campaignId, new Date('2025-01-01'))
      const kpi2 = createTestKPI(campaignId, new Date('2025-01-02'))
      const kpi3 = createTestKPI(campaignId, new Date('2025-01-03'))

      await repository.save(kpi1)
      await repository.save(kpi2)
      await repository.save(kpi3)

      // Act
      const result = await repository.getDailyAggregates(
        [campaignId],
        new Date('2025-01-01'),
        new Date('2025-01-03')
      )

      // Assert
      expect(result).toHaveLength(3)
      expect(result[0].totalImpressions).toBe(1000)
      expect(result[0].totalClicks).toBe(100)
      expect(result[0].totalConversions).toBe(10)
      expect(result[0].totalSpend).toBe(50000)
      expect(result[0].totalRevenue).toBe(200000)
    })

    it('should aggregate multiple KPIs on the same date', async () => {
      // Arrange
      const campaignId = 'campaign-1'
      const sameDate = new Date('2025-01-01')

      const kpi1 = createTestKPI(campaignId, sameDate, {
        impressions: 1000,
        clicks: 100,
        spend: 50000,
        revenue: 200000,
      })
      const kpi2 = createTestKPI(campaignId, sameDate, {
        impressions: 2000,
        clicks: 200,
        spend: 100000,
        revenue: 400000,
      })

      await repository.save(kpi1)
      await repository.save(kpi2)

      // Act
      const result = await repository.getDailyAggregates(
        [campaignId],
        new Date('2025-01-01'),
        new Date('2025-01-01')
      )

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0].totalImpressions).toBe(3000)
      expect(result[0].totalClicks).toBe(300)
      expect(result[0].totalSpend).toBe(150000)
      expect(result[0].totalRevenue).toBe(600000)
    })

    it('should return results sorted by date ascending', async () => {
      // Arrange
      const campaignId = 'campaign-1'
      const kpi3 = createTestKPI(campaignId, new Date('2025-01-03'))
      const kpi1 = createTestKPI(campaignId, new Date('2025-01-01'))
      const kpi2 = createTestKPI(campaignId, new Date('2025-01-02'))

      // Save in random order
      await repository.save(kpi3)
      await repository.save(kpi1)
      await repository.save(kpi2)

      // Act
      const result = await repository.getDailyAggregates(
        [campaignId],
        new Date('2025-01-01'),
        new Date('2025-01-03')
      )

      // Assert
      expect(result).toHaveLength(3)
      expect(result[0].date.toISOString().split('T')[0]).toBe('2025-01-01')
      expect(result[1].date.toISOString().split('T')[0]).toBe('2025-01-02')
      expect(result[2].date.toISOString().split('T')[0]).toBe('2025-01-03')
    })
  })

  describe('multiple campaigns', () => {
    it('should aggregate data from multiple campaigns', async () => {
      // Arrange
      const sameDate = new Date('2025-01-01')

      const kpi1 = createTestKPI('campaign-1', sameDate, {
        impressions: 1000,
        spend: 50000,
      })
      const kpi2 = createTestKPI('campaign-2', sameDate, {
        impressions: 2000,
        spend: 100000,
      })

      await repository.save(kpi1)
      await repository.save(kpi2)

      // Act
      const result = await repository.getDailyAggregates(
        ['campaign-1', 'campaign-2'],
        new Date('2025-01-01'),
        new Date('2025-01-01')
      )

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0].totalImpressions).toBe(3000)
      expect(result[0].totalSpend).toBe(150000)
    })

    it('should exclude campaigns not in the filter', async () => {
      // Arrange
      const sameDate = new Date('2025-01-01')

      const kpi1 = createTestKPI('campaign-1', sameDate, { impressions: 1000 })
      const kpi2 = createTestKPI('campaign-2', sameDate, { impressions: 2000 })
      const kpi3 = createTestKPI('campaign-3', sameDate, { impressions: 3000 })

      await repository.save(kpi1)
      await repository.save(kpi2)
      await repository.save(kpi3)

      // Act - only campaign-1 and campaign-2
      const result = await repository.getDailyAggregates(
        ['campaign-1', 'campaign-2'],
        new Date('2025-01-01'),
        new Date('2025-01-01')
      )

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0].totalImpressions).toBe(3000) // 1000 + 2000, not 6000
    })
  })

  describe('date range filtering', () => {
    it('should only include KPIs within date range', async () => {
      // Arrange
      const campaignId = 'campaign-1'

      await repository.save(createTestKPI(campaignId, new Date('2024-12-31')))
      await repository.save(createTestKPI(campaignId, new Date('2025-01-01')))
      await repository.save(createTestKPI(campaignId, new Date('2025-01-02')))
      await repository.save(createTestKPI(campaignId, new Date('2025-01-03')))

      // Act
      const result = await repository.getDailyAggregates(
        [campaignId],
        new Date('2025-01-01'),
        new Date('2025-01-02')
      )

      // Assert
      expect(result).toHaveLength(2)
    })
  })

  describe('edge cases', () => {
    it('should return empty array when no campaigns provided', async () => {
      // Arrange
      await repository.save(createTestKPI('campaign-1', new Date('2025-01-01')))

      // Act
      const result = await repository.getDailyAggregates(
        [],
        new Date('2025-01-01'),
        new Date('2025-01-01')
      )

      // Assert
      expect(result).toEqual([])
    })

    it('should return empty array when no data in date range', async () => {
      // Arrange
      await repository.save(createTestKPI('campaign-1', new Date('2025-01-01')))

      // Act
      const result = await repository.getDailyAggregates(
        ['campaign-1'],
        new Date('2025-02-01'),
        new Date('2025-02-28')
      )

      // Assert
      expect(result).toEqual([])
    })

    it('should return empty array for non-existent campaigns', async () => {
      // Act
      const result = await repository.getDailyAggregates(
        ['non-existent'],
        new Date('2025-01-01'),
        new Date('2025-01-31')
      )

      // Assert
      expect(result).toEqual([])
    })
  })
})
