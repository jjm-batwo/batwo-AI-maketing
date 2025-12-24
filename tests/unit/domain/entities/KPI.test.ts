import { describe, it, expect } from 'vitest'
import { KPI, KPISnapshot } from '@domain/entities/KPI'
import { Money } from '@domain/value-objects/Money'

describe('KPI', () => {
  describe('create', () => {
    it('should create KPI with valid metrics', () => {
      const kpi = KPI.create({
        campaignId: 'campaign-123',
        impressions: 10000,
        clicks: 500,
        conversions: 50,
        spend: Money.create(100000, 'KRW'),
        revenue: Money.create(500000, 'KRW'),
        date: new Date('2025-01-15'),
      })

      expect(kpi.campaignId).toBe('campaign-123')
      expect(kpi.impressions).toBe(10000)
      expect(kpi.clicks).toBe(500)
      expect(kpi.conversions).toBe(50)
    })

    it('should throw error for negative impressions', () => {
      expect(() =>
        KPI.create({
          campaignId: 'campaign-123',
          impressions: -100,
          clicks: 50,
          conversions: 5,
          spend: Money.create(10000, 'KRW'),
          revenue: Money.create(50000, 'KRW'),
          date: new Date('2025-01-15'),
        })
      ).toThrow('Impressions cannot be negative')
    })
  })

  describe('calculateROAS', () => {
    it('should calculate ROAS correctly', () => {
      const kpi = KPI.create({
        campaignId: 'campaign-123',
        impressions: 10000,
        clicks: 500,
        conversions: 50,
        spend: Money.create(100000, 'KRW'),
        revenue: Money.create(500000, 'KRW'),
        date: new Date('2025-01-15'),
      })

      const roas = kpi.calculateROAS()

      expect(roas).toBe(5) // 500000 / 100000 = 5
    })

    it('should return 0 ROAS for zero spend', () => {
      const kpi = KPI.create({
        campaignId: 'campaign-123',
        impressions: 1000,
        clicks: 50,
        conversions: 5,
        spend: Money.create(0, 'KRW'),
        revenue: Money.create(50000, 'KRW'),
        date: new Date('2025-01-15'),
      })

      const roas = kpi.calculateROAS()

      expect(roas).toBe(0)
    })
  })

  describe('calculateCPA', () => {
    it('should calculate CPA correctly', () => {
      const kpi = KPI.create({
        campaignId: 'campaign-123',
        impressions: 10000,
        clicks: 500,
        conversions: 50,
        spend: Money.create(100000, 'KRW'),
        revenue: Money.create(500000, 'KRW'),
        date: new Date('2025-01-15'),
      })

      const cpa = kpi.calculateCPA()

      expect(cpa.amount).toBe(2000) // 100000 / 50 = 2000
    })

    it('should handle zero conversions for CPA', () => {
      const kpi = KPI.create({
        campaignId: 'campaign-123',
        impressions: 10000,
        clicks: 500,
        conversions: 0,
        spend: Money.create(100000, 'KRW'),
        revenue: Money.create(0, 'KRW'),
        date: new Date('2025-01-15'),
      })

      const cpa = kpi.calculateCPA()

      expect(cpa.amount).toBe(0) // No conversions, CPA is 0
    })
  })

  describe('calculateCTR', () => {
    it('should calculate CTR correctly', () => {
      const kpi = KPI.create({
        campaignId: 'campaign-123',
        impressions: 10000,
        clicks: 500,
        conversions: 50,
        spend: Money.create(100000, 'KRW'),
        revenue: Money.create(500000, 'KRW'),
        date: new Date('2025-01-15'),
      })

      const ctr = kpi.calculateCTR()

      expect(ctr.value).toBe(5) // (500 / 10000) * 100 = 5%
    })

    it('should handle zero impressions for CTR', () => {
      const kpi = KPI.create({
        campaignId: 'campaign-123',
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: Money.create(0, 'KRW'),
        revenue: Money.create(0, 'KRW'),
        date: new Date('2025-01-15'),
      })

      const ctr = kpi.calculateCTR()

      expect(ctr.value).toBe(0)
    })
  })

  describe('calculateCVR', () => {
    it('should calculate conversion rate correctly', () => {
      const kpi = KPI.create({
        campaignId: 'campaign-123',
        impressions: 10000,
        clicks: 500,
        conversions: 50,
        spend: Money.create(100000, 'KRW'),
        revenue: Money.create(500000, 'KRW'),
        date: new Date('2025-01-15'),
      })

      const cvr = kpi.calculateCVR()

      expect(cvr.value).toBe(10) // (50 / 500) * 100 = 10%
    })

    it('should handle zero clicks for CVR', () => {
      const kpi = KPI.create({
        campaignId: 'campaign-123',
        impressions: 10000,
        clicks: 0,
        conversions: 0,
        spend: Money.create(100000, 'KRW'),
        revenue: Money.create(0, 'KRW'),
        date: new Date('2025-01-15'),
      })

      const cvr = kpi.calculateCVR()

      expect(cvr.value).toBe(0)
    })
  })

  describe('calculateCPC', () => {
    it('should calculate cost per click correctly', () => {
      const kpi = KPI.create({
        campaignId: 'campaign-123',
        impressions: 10000,
        clicks: 500,
        conversions: 50,
        spend: Money.create(100000, 'KRW'),
        revenue: Money.create(500000, 'KRW'),
        date: new Date('2025-01-15'),
      })

      const cpc = kpi.calculateCPC()

      expect(cpc.amount).toBe(200) // 100000 / 500 = 200
    })

    it('should return 0 for zero clicks', () => {
      const kpi = KPI.create({
        campaignId: 'campaign-123',
        impressions: 10000,
        clicks: 0,
        conversions: 0,
        spend: Money.create(100000, 'KRW'),
        revenue: Money.create(0, 'KRW'),
        date: new Date('2025-01-15'),
      })

      const cpc = kpi.calculateCPC()

      expect(cpc.amount).toBe(0)
    })
  })

  describe('calculateCPM', () => {
    it('should calculate cost per mille correctly', () => {
      const kpi = KPI.create({
        campaignId: 'campaign-123',
        impressions: 10000,
        clicks: 500,
        conversions: 50,
        spend: Money.create(100000, 'KRW'),
        revenue: Money.create(500000, 'KRW'),
        date: new Date('2025-01-15'),
      })

      const cpm = kpi.calculateCPM()

      expect(cpm.amount).toBe(10000) // (100000 / 10000) * 1000 = 10000
    })

    it('should return 0 for zero impressions', () => {
      const kpi = KPI.create({
        campaignId: 'campaign-123',
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: Money.create(100000, 'KRW'),
        revenue: Money.create(0, 'KRW'),
        date: new Date('2025-01-15'),
      })

      const cpm = kpi.calculateCPM()

      expect(cpm.amount).toBe(0)
    })
  })

  describe('toJSON', () => {
    it('should serialize KPI to JSON', () => {
      const kpi = KPI.create({
        campaignId: 'campaign-123',
        impressions: 10000,
        clicks: 500,
        conversions: 50,
        spend: Money.create(100000, 'KRW'),
        revenue: Money.create(500000, 'KRW'),
        date: new Date('2025-01-15'),
      })

      const json = kpi.toJSON()

      expect(json.id).toBe(kpi.id)
      expect(json.campaignId).toBe('campaign-123')
      expect(json.impressions).toBe(10000)
      expect(json.clicks).toBe(500)
      expect(json.conversions).toBe(50)
      expect(json.spend.amount).toBe(100000)
      expect(json.revenue.amount).toBe(500000)
      expect(json.date).toEqual(new Date('2025-01-15'))
      expect(json.createdAt).toBeDefined()
    })
  })
})

describe('KPISnapshot', () => {
  describe('aggregate', () => {
    it('should aggregate multiple snapshots', () => {
      const snapshot1 = KPI.create({
        campaignId: 'campaign-123',
        impressions: 5000,
        clicks: 250,
        conversions: 25,
        spend: Money.create(50000, 'KRW'),
        revenue: Money.create(250000, 'KRW'),
        date: new Date('2025-01-15'),
      })

      const snapshot2 = KPI.create({
        campaignId: 'campaign-123',
        impressions: 5000,
        clicks: 250,
        conversions: 25,
        spend: Money.create(50000, 'KRW'),
        revenue: Money.create(250000, 'KRW'),
        date: new Date('2025-01-16'),
      })

      const aggregated = KPISnapshot.aggregate([snapshot1, snapshot2])

      expect(aggregated.impressions).toBe(10000)
      expect(aggregated.clicks).toBe(500)
      expect(aggregated.conversions).toBe(50)
      expect(aggregated.spend.amount).toBe(100000)
      expect(aggregated.revenue.amount).toBe(500000)
    })

    it('should return zero KPI for empty array', () => {
      const aggregated = KPISnapshot.aggregate([])

      expect(aggregated.impressions).toBe(0)
      expect(aggregated.clicks).toBe(0)
      expect(aggregated.conversions).toBe(0)
    })
  })

  describe('compare', () => {
    it('should compare two KPI snapshots', () => {
      const current = KPI.create({
        campaignId: 'campaign-123',
        impressions: 10000,
        clicks: 500,
        conversions: 50,
        spend: Money.create(100000, 'KRW'),
        revenue: Money.create(500000, 'KRW'),
        date: new Date('2025-01-16'),
      })

      const previous = KPI.create({
        campaignId: 'campaign-123',
        impressions: 8000,
        clicks: 400,
        conversions: 40,
        spend: Money.create(80000, 'KRW'),
        revenue: Money.create(400000, 'KRW'),
        date: new Date('2025-01-15'),
      })

      const comparison = KPISnapshot.compare(current, previous)

      expect(comparison.impressionsChange.value).toBe(25) // (10000 - 8000) / 8000 * 100
      expect(comparison.clicksChange.value).toBe(25)
      expect(comparison.conversionsChange.value).toBe(25)
      expect(comparison.roasChange).toBeCloseTo(0) // ROAS stayed at 5
    })
  })
})
