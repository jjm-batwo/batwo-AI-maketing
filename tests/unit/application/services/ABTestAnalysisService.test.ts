import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ABTestAnalysisService } from '@application/services/ABTestAnalysisService'
import type { IABTestRepository } from '@domain/repositories/IABTestRepository'
import { ABTest } from '@domain/entities/ABTest'
import { Money } from '@domain/value-objects/Money'

describe('ABTestAnalysisService', () => {
  let service: ABTestAnalysisService
  let mockRepository: IABTestRepository

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findByCampaignId: vi.fn(),
      findByFilters: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findRunningTests: vi.fn(),
    }
    service = new ABTestAnalysisService(mockRepository)
  })

  describe('analyzeTest', () => {
    it('should analyze test with significant result', async () => {
      const test = ABTest.create({
        campaignId: 'campaign-1',
        name: 'Test Campaign',
        status: 'RUNNING',
        confidenceLevel: 95,
        minimumSampleSize: 1000,
        startDate: new Date(),
        variants: [
          {
            id: 'control',
            name: 'Control',
            trafficPercent: 50,
            impressions: 10000,
            clicks: 1000,
            conversions: 100, // 10% conversion
            spend: Money.create(10000),
            revenue: Money.create(50000),
            isControl: true,
          },
          {
            id: 'treatment',
            name: 'Treatment',
            trafficPercent: 50,
            impressions: 10000,
            clicks: 1000,
            conversions: 150, // 15% conversion - 50% uplift
            spend: Money.create(10000),
            revenue: Money.create(75000),
            isControl: false,
          },
        ],
      })

      vi.mocked(mockRepository.findById).mockResolvedValue(test)

      const result = await service.analyzeTest('test-id')

      expect(result.status).toBe('significant')
      expect(result.control.conversions).toBe(100)
      expect(result.treatment.conversions).toBe(150)
      expect(result.significance).not.toBeNull()
      expect(result.significance?.isSignificant).toBe(true)
      expect(result.sampleSizeReached).toBe(true)
      expect(result.recommendation).toContain('wins')
    })

    it('should detect insufficient data', async () => {
      const test = ABTest.create({
        campaignId: 'campaign-1',
        name: 'Test Campaign',
        status: 'RUNNING',
        confidenceLevel: 95,
        minimumSampleSize: 10000,
        startDate: new Date(),
        variants: [
          {
            id: 'control',
            name: 'Control',
            trafficPercent: 50,
            impressions: 100, // Very small sample
            clicks: 100,
            conversions: 10,
            spend: Money.create(1000),
            revenue: Money.create(5000),
            isControl: true,
          },
          {
            id: 'treatment',
            name: 'Treatment',
            trafficPercent: 50,
            impressions: 100,
            clicks: 100,
            conversions: 15,
            spend: Money.create(1000),
            revenue: Money.create(7500),
            isControl: false,
          },
        ],
      })

      vi.mocked(mockRepository.findById).mockResolvedValue(test)

      const result = await service.analyzeTest('test-id')

      expect(result.status).toBe('insufficient_data')
      expect(result.sampleSizeReached).toBe(false)
      expect(result.recommendation).toContain('more samples')
    })

    it('should handle no significant difference', async () => {
      const test = ABTest.create({
        campaignId: 'campaign-1',
        name: 'Test Campaign',
        status: 'RUNNING',
        confidenceLevel: 95,
        minimumSampleSize: 1000,
        startDate: new Date(),
        variants: [
          {
            id: 'control',
            name: 'Control',
            trafficPercent: 50,
            impressions: 10000,
            clicks: 10000,
            conversions: 1000, // 10% conversion
            spend: Money.create(10000),
            revenue: Money.create(50000),
            isControl: true,
          },
          {
            id: 'treatment',
            name: 'Treatment',
            trafficPercent: 50,
            impressions: 10000,
            clicks: 10000,
            conversions: 1020, // 10.2% conversion - minimal difference
            spend: Money.create(10000),
            revenue: Money.create(51000),
            isControl: false,
          },
        ],
      })

      vi.mocked(mockRepository.findById).mockResolvedValue(test)

      const result = await service.analyzeTest('test-id')

      expect(result.status).toBe('not_significant')
      expect(result.sampleSizeReached).toBe(true)
      expect(result.significance?.isSignificant).toBe(false)
    })

    it('should throw error if test not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null)

      await expect(service.analyzeTest('invalid-id')).rejects.toThrow(
        'A/B test not found: invalid-id'
      )
    })
  })

  describe('getWinner', () => {
    it('should return winner for significant test', async () => {
      const test = ABTest.create({
        campaignId: 'campaign-1',
        name: 'Test Campaign',
        status: 'RUNNING',
        confidenceLevel: 95,
        minimumSampleSize: 1000,
        startDate: new Date(),
        variants: [
          {
            id: 'control',
            name: 'Control',
            trafficPercent: 50,
            impressions: 10000,
            clicks: 10000,
            conversions: 100,
            spend: Money.create(10000),
            revenue: Money.create(50000),
            isControl: true,
          },
          {
            id: 'treatment',
            name: 'Treatment',
            trafficPercent: 50,
            impressions: 10000,
            clicks: 10000,
            conversions: 150,
            spend: Money.create(10000),
            revenue: Money.create(75000),
            isControl: false,
          },
        ],
      })

      vi.mocked(mockRepository.findById).mockResolvedValue(test)

      const winner = await service.getWinner('test-id')

      expect(winner).not.toBeNull()
      expect(winner?.variantId).toBe('treatment')
      expect(winner?.uplift).toBeGreaterThan(0)
      expect(winner?.confidence).toBeGreaterThan(95)
    })

    it('should return null for non-significant test', async () => {
      const test = ABTest.create({
        campaignId: 'campaign-1',
        name: 'Test Campaign',
        status: 'RUNNING',
        confidenceLevel: 95,
        minimumSampleSize: 1000,
        startDate: new Date(),
        variants: [
          {
            id: 'control',
            name: 'Control',
            trafficPercent: 50,
            impressions: 10000,
            clicks: 10000,
            conversions: 1000,
            spend: Money.create(10000),
            revenue: Money.create(50000),
            isControl: true,
          },
          {
            id: 'treatment',
            name: 'Treatment',
            trafficPercent: 50,
            impressions: 10000,
            clicks: 10000,
            conversions: 1005,
            spend: Money.create(10000),
            revenue: Money.create(50250),
            isControl: false,
          },
        ],
      })

      vi.mocked(mockRepository.findById).mockResolvedValue(test)

      const winner = await service.getWinner('test-id')

      expect(winner).toBeNull()
    })
  })

  describe('shouldStopTest', () => {
    it('should recommend stopping for significant result', async () => {
      const test = ABTest.create({
        campaignId: 'campaign-1',
        name: 'Test Campaign',
        status: 'RUNNING',
        confidenceLevel: 95,
        minimumSampleSize: 1000,
        startDate: new Date(),
        variants: [
          {
            id: 'control',
            name: 'Control',
            trafficPercent: 50,
            impressions: 10000,
            clicks: 10000,
            conversions: 100,
            spend: Money.create(10000),
            revenue: Money.create(50000),
            isControl: true,
          },
          {
            id: 'treatment',
            name: 'Treatment',
            trafficPercent: 50,
            impressions: 10000,
            clicks: 10000,
            conversions: 150,
            spend: Money.create(10000),
            revenue: Money.create(75000),
            isControl: false,
          },
        ],
      })

      vi.mocked(mockRepository.findById).mockResolvedValue(test)

      const recommendation = await service.shouldStopTest('test-id')

      expect(recommendation.shouldStop).toBe(true)
      expect(recommendation.winner).toBeDefined()
      expect(recommendation.winner?.variantId).toBe('treatment')
    })

    it('should recommend continuing for insufficient data', async () => {
      const test = ABTest.create({
        campaignId: 'campaign-1',
        name: 'Test Campaign',
        status: 'RUNNING',
        confidenceLevel: 95,
        minimumSampleSize: 10000,
        startDate: new Date(),
        variants: [
          {
            id: 'control',
            name: 'Control',
            trafficPercent: 50,
            impressions: 100,
            clicks: 100,
            conversions: 10,
            spend: Money.create(1000),
            revenue: Money.create(5000),
            isControl: true,
          },
          {
            id: 'treatment',
            name: 'Treatment',
            trafficPercent: 50,
            impressions: 100,
            clicks: 100,
            conversions: 12,
            spend: Money.create(1000),
            revenue: Money.create(6000),
            isControl: false,
          },
        ],
      })

      vi.mocked(mockRepository.findById).mockResolvedValue(test)

      const recommendation = await service.shouldStopTest('test-id')

      expect(recommendation.shouldStop).toBe(false)
      expect(recommendation.reason).toContain('more samples')
    })

    it('should recommend stopping when well oversampled with no significance', async () => {
      const test = ABTest.create({
        campaignId: 'campaign-1',
        name: 'Test Campaign',
        status: 'RUNNING',
        confidenceLevel: 95,
        minimumSampleSize: 1000,
        startDate: new Date(),
        variants: [
          {
            id: 'control',
            name: 'Control',
            trafficPercent: 50,
            impressions: 50000, // 2.5x required (total 100k samples > 2x * 1000)
            clicks: 50000,
            conversions: 5000, // 10%
            spend: Money.create(50000),
            revenue: Money.create(250000),
            isControl: true,
          },
          {
            id: 'treatment',
            name: 'Treatment',
            trafficPercent: 50,
            impressions: 50000,
            clicks: 50000,
            conversions: 5050, // 10.1% - minimal difference
            spend: Money.create(50000),
            revenue: Money.create(252500),
            isControl: false,
          },
        ],
      })

      vi.mocked(mockRepository.findById).mockResolvedValue(test)

      const recommendation = await service.shouldStopTest('test-id')

      expect(recommendation.shouldStop).toBe(true)
      expect(recommendation.reason).toContain('2x required')
      expect(recommendation.reason).toContain('equivalent')
    })
  })
})
