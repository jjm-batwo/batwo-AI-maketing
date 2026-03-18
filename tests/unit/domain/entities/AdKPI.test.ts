import { describe, it, expect } from 'vitest'
import { AdKPI } from '@domain/entities/AdKPI'
import { Money } from '@domain/value-objects/Money'

describe('AdKPI', () => {
  const validProps = {
    adId: 'ad-123',
    adSetId: 'adset-456',
    campaignId: 'campaign-789',
    creativeId: 'creative-101',
    impressions: 10000,
    clicks: 500,
    linkClicks: 300,
    conversions: 50,
    spend: Money.create(100000, 'KRW'),
    revenue: Money.create(500000, 'KRW'),
    reach: 8000,
    frequency: 1.25,
    cpm: 10000,    // number, Meta pre-calculated (A5)
    cpc: 200,      // number, Meta pre-calculated (A5)
    videoViews: 3000,
    thruPlays: 1500,
    date: new Date('2026-03-15'),
  }

  describe('create', () => {
    it('should create AdKPI with valid metrics', () => {
      const kpi = AdKPI.create(validProps)

      expect(kpi.adId).toBe('ad-123')
      expect(kpi.adSetId).toBe('adset-456')
      expect(kpi.campaignId).toBe('campaign-789')
      expect(kpi.creativeId).toBe('creative-101')
      expect(kpi.impressions).toBe(10000)
      expect(kpi.clicks).toBe(500)
      expect(kpi.reach).toBe(8000)
      expect(kpi.frequency).toBe(1.25)
      expect(kpi.cpm).toBe(10000)
      expect(kpi.cpc).toBe(200)
      expect(kpi.videoViews).toBe(3000)
      expect(kpi.thruPlays).toBe(1500)
      expect(kpi.id).toBeDefined()
    })

    it('should throw error for negative impressions', () => {
      expect(() =>
        AdKPI.create({ ...validProps, impressions: -100 })
      ).toThrow('Impressions cannot be negative')
    })

    it('should throw error for negative clicks', () => {
      expect(() =>
        AdKPI.create({ ...validProps, clicks: -1 })
      ).toThrow('Clicks cannot be negative')
    })

    it('should throw error for negative conversions', () => {
      expect(() =>
        AdKPI.create({ ...validProps, conversions: -1 })
      ).toThrow('Conversions cannot be negative')
    })
  })

  describe('restore', () => {
    it('should restore AdKPI from persisted data', () => {
      const kpi = AdKPI.restore({
        ...validProps,
        id: 'existing-id-123',
        createdAt: new Date('2026-03-15T10:00:00Z'),
      })

      expect(kpi.id).toBe('existing-id-123')
      expect(kpi.adId).toBe('ad-123')
    })
  })

  describe('calculated metrics', () => {
    it('should calculate CTR correctly', () => {
      const kpi = AdKPI.create(validProps)
      expect(kpi.ctr).toBe(5) // (500 / 10000) * 100
    })

    it('should return 0 CTR for zero impressions', () => {
      const kpi = AdKPI.create({ ...validProps, impressions: 0, clicks: 0 })
      expect(kpi.ctr).toBe(0)
    })

    it('should calculate CVR correctly', () => {
      const kpi = AdKPI.create(validProps)
      expect(kpi.cvr).toBe(10) // (50 / 500) * 100
    })

    it('should return 0 CVR for zero clicks', () => {
      const kpi = AdKPI.create({ ...validProps, clicks: 0 })
      expect(kpi.cvr).toBe(0)
    })

    it('should calculate ROAS correctly', () => {
      const kpi = AdKPI.create(validProps)
      expect(kpi.roas).toBe(5) // 500000 / 100000
    })

    it('should return 0 ROAS for zero spend', () => {
      const kpi = AdKPI.create({
        ...validProps,
        spend: Money.create(0, 'KRW'),
      })
      expect(kpi.roas).toBe(0)
    })

    it('should calculate thruPlayRate correctly', () => {
      const kpi = AdKPI.create(validProps)
      expect(kpi.thruPlayRate).toBe(15) // (1500 / 10000) * 100
    })

    it('should return 0 thruPlayRate for zero impressions', () => {
      const kpi = AdKPI.create({ ...validProps, impressions: 0 })
      expect(kpi.thruPlayRate).toBe(0)
    })
  })

  describe('toJSON', () => {
    it('should serialize AdKPI to JSON', () => {
      const kpi = AdKPI.create(validProps)
      const json = kpi.toJSON()

      expect(json.id).toBe(kpi.id)
      expect(json.adId).toBe('ad-123')
      expect(json.adSetId).toBe('adset-456')
      expect(json.campaignId).toBe('campaign-789')
      expect(json.creativeId).toBe('creative-101')
      expect(json.impressions).toBe(10000)
      expect(json.frequency).toBe(1.25)
      expect(json.cpm).toBe(10000)
      expect(json.cpc).toBe(200)
      expect(json.videoViews).toBe(3000)
      expect(json.thruPlays).toBe(1500)
    })
  })
})
