import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  CopyLearningService,
  type CopyPerformanceData,
} from '@application/services/CopyLearningService'
import type { CopyHookType } from '@infrastructure/external/openai/prompts/adCopyGeneration'

describe('CopyLearningService', () => {
  let service: CopyLearningService

  beforeEach(() => {
    service = new CopyLearningService()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-12-15'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // Helper function to create performance data
  function createPerformanceData(
    overrides: Partial<CopyPerformanceData> = {}
  ): CopyPerformanceData {
    return {
      id: 'perf-1',
      userId: 'user-1',
      campaignId: 'camp-1',
      industry: 'ecommerce',
      hook: 'benefit',
      headline: '테스트 헤드라인',
      primaryText: '테스트 본문입니다',
      description: '설명',
      cta: '지금 구매하기',
      impressions: 1000,
      clicks: 30,
      conversions: 3,
      spend: 100000,
      revenue: 500000,
      createdAt: new Date('2024-12-01'),
      ...overrides,
    }
  }

  // Helper to generate multiple performance data items
  function generatePerformanceData(
    count: number,
    overrides: Partial<CopyPerformanceData> = {}
  ): CopyPerformanceData[] {
    return Array.from({ length: count }, (_, i) =>
      createPerformanceData({
        id: `perf-${i}`,
        createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        ...overrides,
      })
    )
  }

  describe('getGenerationHints', () => {
    it('should return hints for ecommerce industry', () => {
      const hints = service.getGenerationHints('ecommerce')

      expect(hints).toBeDefined()
      expect(hints.industry).toBe('ecommerce')
      expect(hints.recommendedHooks).toBeDefined()
      expect(hints.keywordSuggestions).toBeDefined()
      expect(hints.characterGuidelines).toBeDefined()
      expect(hints.timingAdvice).toBeDefined()
      expect(hints.ctaRecommendations).toBeDefined()
    })

    it('should return hints for food_beverage industry', () => {
      const hints = service.getGenerationHints('food_beverage')

      expect(hints.industry).toBe('food_beverage')
      expect(hints.keywordSuggestions.length).toBeGreaterThan(0)
    })

    it('should return hints for beauty industry', () => {
      const hints = service.getGenerationHints('beauty')

      expect(hints.industry).toBe('beauty')
    })

    it('should return hints for fashion industry', () => {
      const hints = service.getGenerationHints('fashion')

      expect(hints.industry).toBe('fashion')
    })

    it('should return hints for education industry', () => {
      const hints = service.getGenerationHints('education')

      expect(hints.industry).toBe('education')
    })

    it('should return hints for service industry', () => {
      const hints = service.getGenerationHints('service')

      expect(hints.industry).toBe('service')
    })

    it('should return hints for saas industry', () => {
      const hints = service.getGenerationHints('saas')

      expect(hints.industry).toBe('saas')
    })

    it('should return hints for health industry', () => {
      const hints = service.getGenerationHints('health')

      expect(hints.industry).toBe('health')
    })

    it('should detect winter season in December', () => {
      vi.setSystemTime(new Date('2024-12-15'))
      const hints = service.getGenerationHints('ecommerce')

      expect(hints.currentSeason).toBe('겨울')
    })

    it('should detect spring season in April', () => {
      vi.setSystemTime(new Date('2024-04-15'))
      const hints = service.getGenerationHints('ecommerce')

      expect(hints.currentSeason).toBe('봄')
    })

    it('should detect summer season in July', () => {
      vi.setSystemTime(new Date('2024-07-15'))
      const hints = service.getGenerationHints('ecommerce')

      expect(hints.currentSeason).toBe('여름')
    })

    it('should detect fall season in October', () => {
      vi.setSystemTime(new Date('2024-10-15'))
      const hints = service.getGenerationHints('ecommerce')

      expect(hints.currentSeason).toBe('가을')
    })

    it('should include recommended hooks with confidence scores', () => {
      const hints = service.getGenerationHints('ecommerce')

      expect(hints.recommendedHooks.length).toBeGreaterThan(0)
      hints.recommendedHooks.forEach((hookRec) => {
        expect(hookRec.hook).toBeDefined()
        expect(hookRec.reason).toBeDefined()
        expect(hookRec.expectedCTR).toBeGreaterThanOrEqual(0)
        expect(hookRec.confidence).toBeGreaterThanOrEqual(0)
        expect(hookRec.confidence).toBeLessThanOrEqual(1)
      })
    })

    it('should include character guidelines', () => {
      const hints = service.getGenerationHints('ecommerce')

      expect(hints.characterGuidelines.headline).toBeDefined()
      expect(hints.characterGuidelines.primaryText).toBeDefined()
      expect(hints.characterGuidelines.description).toBeDefined()
    })

    it('should include timing advice', () => {
      const hints = service.getGenerationHints('ecommerce')

      expect(hints.timingAdvice).toContain('시간대')
    })

    it('should include CTA recommendations', () => {
      const hints = service.getGenerationHints('ecommerce')

      expect(hints.ctaRecommendations.length).toBeGreaterThan(0)
    })

    it('should use performance data when provided with sufficient samples', () => {
      const performanceData = generatePerformanceData(15, { industry: 'ecommerce' })

      const hints = service.getGenerationHints('ecommerce', performanceData)

      expect(hints).toBeDefined()
      expect(hints.industry).toBe('ecommerce')
    })
  })

  describe('analyzePerformance', () => {
    it('should analyze performance data and return a learning report', () => {
      const performanceData = generatePerformanceData(15, { industry: 'ecommerce' })
      const report = service.analyzePerformance(performanceData, 'ecommerce')

      expect(report).toBeDefined()
      expect(report.totalSamples).toBe(15)
      expect(report.hookPatterns).toBeDefined()
      expect(report.seasonalPatterns).toBeDefined()
      expect(report.overallInsights).toBeDefined()
      expect(report.recommendations).toBeDefined()
    })

    it('should return empty report for no data', () => {
      const report = service.analyzePerformance([], 'ecommerce')

      expect(report.totalSamples).toBe(0)
      expect(report.hookPatterns.benefit).toBeNull()
    })

    it('should filter data by industry', () => {
      const mixedData = [
        ...generatePerformanceData(10, { industry: 'ecommerce' }),
        ...generatePerformanceData(5, { industry: 'fashion' }),
      ]

      const report = service.analyzePerformance(mixedData, 'ecommerce')

      expect(report.totalSamples).toBe(10)
      expect(report.industry).toBe('ecommerce')
    })

    it('should calculate average metrics correctly', () => {
      const performanceData = [
        createPerformanceData({
          industry: 'ecommerce',
          impressions: 1000,
          clicks: 30, // 3% CTR
          conversions: 3, // 10% CVR
          spend: 100000,
          revenue: 500000, // 5x ROAS
        }),
        createPerformanceData({
          id: 'perf-2',
          industry: 'ecommerce',
          impressions: 1000,
          clicks: 20, // 2% CTR
          conversions: 2, // 10% CVR
          spend: 100000,
          revenue: 400000, // 4x ROAS
        }),
      ]

      const report = service.analyzePerformance(performanceData, 'ecommerce')

      // With only 2 samples, below MIN_SAMPLE_SIZE, but averages should still be computed
      // (2000 impressions, 50 clicks) = 2.5% CTR
      expect(report.overallInsights.avgCTR).toBeCloseTo(2.5, 1)
      // (50 clicks, 5 conversions) = 10% CVR
      expect(report.overallInsights.avgCVR).toBeCloseTo(10, 1)
      // (200000 spend, 900000 revenue) = 4.5 ROAS
      expect(report.overallInsights.avgROAS).toBeCloseTo(4.5, 1)
    })

    it('should identify hook patterns with sufficient data', () => {
      // Generate 15 items per hook to meet MIN_SAMPLE_SIZE (10)
      const benefitData = generatePerformanceData(15, {
        industry: 'ecommerce',
        hook: 'benefit',
        impressions: 1000,
        clicks: 35, // Higher CTR
      })
      const urgencyData = generatePerformanceData(15, {
        industry: 'ecommerce',
        hook: 'urgency',
        impressions: 1000,
        clicks: 20, // Lower CTR
      })

      const report = service.analyzePerformance(
        [...benefitData, ...urgencyData],
        'ecommerce'
      )

      expect(report.hookPatterns.benefit).not.toBeNull()
      expect(report.hookPatterns.urgency).not.toBeNull()

      // Benefit should have higher CTR
      if (report.hookPatterns.benefit && report.hookPatterns.urgency) {
        expect(report.hookPatterns.benefit.avgCTR).toBeGreaterThan(
          report.hookPatterns.urgency.avgCTR
        )
      }
    })

    it('should return null for hooks with insufficient data', () => {
      const performanceData = generatePerformanceData(5, {
        industry: 'ecommerce',
        hook: 'benefit',
      })

      const report = service.analyzePerformance(performanceData, 'ecommerce')

      // With only 5 samples (< MIN_SAMPLE_SIZE of 10), pattern should be null
      expect(report.hookPatterns.benefit).toBeNull()
    })

    it('should include seasonal patterns', () => {
      const report = service.analyzePerformance(
        generatePerformanceData(15, { industry: 'ecommerce' }),
        'ecommerce'
      )

      expect(report.seasonalPatterns).toHaveLength(4)
      const seasons = report.seasonalPatterns.map((p) => p.season)
      expect(seasons).toContain('spring')
      expect(seasons).toContain('summer')
      expect(seasons).toContain('fall')
      expect(seasons).toContain('winter')
    })

    it('should generate recommendations', () => {
      const performanceData = generatePerformanceData(20, { industry: 'ecommerce' })

      const report = service.analyzePerformance(performanceData, 'ecommerce')

      expect(report.recommendations.length).toBeGreaterThan(0)
      report.recommendations.forEach((rec) => {
        expect(rec.type).toBeDefined()
        expect(rec.priority).toBeDefined()
        expect(rec.title).toBeDefined()
        expect(rec.description).toBeDefined()
      })
    })
  })

  describe('cache behavior', () => {
    it('should clear cache when clearCache is called', () => {
      const performanceData = generatePerformanceData(15, { industry: 'ecommerce' })

      // First call - populates cache
      const report1 = service.analyzePerformance(performanceData, 'ecommerce')

      // Clear cache
      service.clearCache()

      // Second call - should still work
      const report2 = service.analyzePerformance(performanceData, 'ecommerce')

      expect(report1.totalSamples).toBe(report2.totalSamples)
    })
  })

  describe('edge cases', () => {
    it('should handle zero impressions gracefully', () => {
      const performanceData = generatePerformanceData(15, {
        industry: 'ecommerce',
        impressions: 0,
        clicks: 0,
      })

      const report = service.analyzePerformance(performanceData, 'ecommerce')

      expect(report.overallInsights.avgCTR).toBe(0)
    })

    it('should handle zero clicks gracefully', () => {
      const performanceData = generatePerformanceData(15, {
        industry: 'ecommerce',
        impressions: 1000,
        clicks: 0,
        conversions: 0,
      })

      const report = service.analyzePerformance(performanceData, 'ecommerce')

      expect(report.overallInsights.avgCVR).toBe(0)
    })

    it('should handle zero spend gracefully', () => {
      const performanceData = generatePerformanceData(15, {
        industry: 'ecommerce',
        spend: 0,
        revenue: 0,
      })

      const report = service.analyzePerformance(performanceData, 'ecommerce')

      expect(report.overallInsights.avgROAS).toBe(0)
    })
  })

  describe('learning report structure', () => {
    it('should have correct hookPatterns structure as Record', () => {
      const performanceData = generatePerformanceData(15, { industry: 'ecommerce' })

      const report = service.analyzePerformance(performanceData, 'ecommerce')

      // Verify hookPatterns is a Record with all hook types
      const expectedHooks: CopyHookType[] = [
        'benefit',
        'urgency',
        'social_proof',
        'curiosity',
        'fear_of_missing',
        'authority',
        'emotional',
      ]

      expectedHooks.forEach((hook) => {
        expect(hook in report.hookPatterns).toBe(true)
      })
    })

    it('should include date range in report', () => {
      const performanceData = generatePerformanceData(15, { industry: 'ecommerce' })

      const report = service.analyzePerformance(performanceData, 'ecommerce')

      expect(report.dateRange).toBeDefined()
      expect(report.dateRange.start).toBeInstanceOf(Date)
      expect(report.dateRange.end).toBeInstanceOf(Date)
    })

    it('should identify best and worst performing hooks', () => {
      // Create data with different performance per hook
      const highPerformanceData = generatePerformanceData(15, {
        industry: 'ecommerce',
        hook: 'benefit',
        revenue: 1000000,
        spend: 100000, // ROAS = 10
      })
      const lowPerformanceData = generatePerformanceData(15, {
        industry: 'ecommerce',
        hook: 'curiosity',
        revenue: 50000,
        spend: 100000, // ROAS = 0.5
      })

      const report = service.analyzePerformance(
        [...highPerformanceData, ...lowPerformanceData],
        'ecommerce'
      )

      // Best should be benefit (higher ROAS)
      expect(report.overallInsights.bestPerformingHook).toBeDefined()
      expect(report.overallInsights.worstPerformingHook).toBeDefined()
    })
  })
})
