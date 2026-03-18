import { describe, it, expect } from 'vitest'
import { CreativeFatigueService } from '@/application/services/CreativeFatigueService'
import { CampaignObjective } from '@/domain/value-objects/CampaignObjective'

describe('CreativeFatigueService', () => {
  const service = new CreativeFatigueService()

  describe('calculateFatigueScore', () => {
    it('should return 0 for fresh creative (freq=1.0, no CTR decay, 7 days)', () => {
      const score = service.calculateFatigueScore({
        frequency: 1.0,
        currentCtr: 3.0,
        initialCtr: 3.0,
        activeDays: 7,
      })
      expect(score).toBe(0)
    })

    it('should return 40 for max frequency (5.0+)', () => {
      const score = service.calculateFatigueScore({
        frequency: 5.0,
        currentCtr: 3.0,
        initialCtr: 3.0,
        activeDays: 7,
      })
      expect(score).toBe(40)
    })

    it('should return 40 for max CTR decay (100% decline)', () => {
      const score = service.calculateFatigueScore({
        frequency: 1.0,
        currentCtr: 0,
        initialCtr: 3.0,
        activeDays: 7,
      })
      expect(score).toBe(40)
    })

    it('should return 20 for max duration (30+ days)', () => {
      const score = service.calculateFatigueScore({
        frequency: 1.0,
        currentCtr: 3.0,
        initialCtr: 3.0,
        activeDays: 30,
      })
      expect(score).toBe(20)
    })

    it('should return 100 for worst case (all factors maxed)', () => {
      const score = service.calculateFatigueScore({
        frequency: 5.0,
        currentCtr: 0,
        initialCtr: 3.0,
        activeDays: 30,
      })
      expect(score).toBe(100)
    })

    it('should handle frequency below 1.0 as 0 factor', () => {
      const score = service.calculateFatigueScore({
        frequency: 0.5,
        currentCtr: 3.0,
        initialCtr: 3.0,
        activeDays: 7,
      })
      expect(score).toBe(0)
    })

    it('should handle initialCtr=0 gracefully', () => {
      const score = service.calculateFatigueScore({
        frequency: 1.0,
        currentCtr: 0,
        initialCtr: 0,
        activeDays: 7,
      })
      expect(score).toBe(0)
    })

    it('should calculate mid-range score correctly', () => {
      const score = service.calculateFatigueScore({
        frequency: 3.0,
        currentCtr: 1.5,
        initialCtr: 3.0,
        activeDays: 14,
      })
      expect(score).toBe(66)
    })
  })

  describe('getFatigueLevel', () => {
    it('should return healthy for score 0-30', () => {
      expect(service.getFatigueLevel(0)).toBe('healthy')
      expect(service.getFatigueLevel(15)).toBe('healthy')
      expect(service.getFatigueLevel(30)).toBe('healthy')
    })

    it('should return warning for score 31-60', () => {
      expect(service.getFatigueLevel(31)).toBe('warning')
      expect(service.getFatigueLevel(45)).toBe('warning')
      expect(service.getFatigueLevel(60)).toBe('warning')
    })

    it('should return critical for score 61-100', () => {
      expect(service.getFatigueLevel(61)).toBe('critical')
      expect(service.getFatigueLevel(78)).toBe('critical')
      expect(service.getFatigueLevel(100)).toBe('critical')
    })
  })

  describe('adjustFatigueForBranding (B3)', () => {
    it('should reduce score by 20 for AWARENESS campaign with <10% CTR decay', () => {
      const result = service.adjustFatigueForBranding(
        50,
        CampaignObjective.AWARENESS,
        2.8,
        3.0
      )
      expect(result.score).toBe(30)
      expect(result.fatigueLevel).toBe('healthy')
      expect(result.note).toContain('브랜딩')
    })

    it('should NOT reduce score for AWARENESS campaign with >=10% CTR decay', () => {
      const result = service.adjustFatigueForBranding(
        50,
        CampaignObjective.AWARENESS,
        2.5,
        3.0
      )
      expect(result.score).toBe(50)
    })

    it('should NOT reduce score for CONVERSIONS campaign', () => {
      const result = service.adjustFatigueForBranding(
        50,
        CampaignObjective.CONVERSIONS,
        2.8,
        3.0
      )
      expect(result.score).toBe(50)
    })

    it('should not go below 0', () => {
      const result = service.adjustFatigueForBranding(
        10,
        CampaignObjective.AWARENESS,
        3.0,
        3.0
      )
      expect(result.score).toBe(0)
    })
  })

  describe('adjustForRecentTrend (B8)', () => {
    it('should downgrade critical to warning if last 3 days CTR is rising', () => {
      const result = service.adjustForRecentTrend(
        65,
        [1.8, 1.7, 1.9, 2.0, 2.1, 2.2, 2.3]
      )
      expect(result.fatigueLevel).toBe('warning')
    })

    it('should NOT downgrade if last 3 days CTR is falling', () => {
      const result = service.adjustForRecentTrend(
        65,
        [2.3, 2.2, 2.1, 2.0, 1.9, 1.8, 1.7]
      )
      expect(result.fatigueLevel).toBe('critical')
    })

    it('should NOT downgrade warning level', () => {
      const result = service.adjustForRecentTrend(
        45,
        [1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.4]
      )
      expect(result.fatigueLevel).toBe('warning')
    })
  })
})
