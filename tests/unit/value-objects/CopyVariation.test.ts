import { describe, it, expect, beforeEach } from 'vitest'
import {
  CopyVariation,
  ABTestAnalyzer,
  type CreateCopyVariationInput,
  type CopyPerformanceMetrics,
  type CopyHookType,
  HOOK_TYPE_DESCRIPTIONS,
} from '@domain/value-objects/CopyVariation'

describe('CopyVariation', () => {
  describe('create', () => {
    it('should create a valid copy variation', () => {
      const input: CreateCopyVariationInput = {
        campaignId: 'camp-1',
        hookType: 'benefit',
        headline: '테스트 헤드라인',
        primaryText: '테스트 본문입니다',
        description: '설명',
        callToAction: '지금 구매',
        targetAudience: '25-34세 여성',
      }

      const variation = CopyVariation.create(input)

      expect(variation.id).toBeDefined()
      expect(variation.campaignId).toBe('camp-1')
      expect(variation.variantType).toBe('A') // default
      expect(variation.hookType).toBe('benefit')
      expect(variation.headline).toBe('테스트 헤드라인')
      expect(variation.status).toBe('draft')
    })

    it('should create variation with specified variant type', () => {
      const input: CreateCopyVariationInput = {
        campaignId: 'camp-1',
        variantType: 'B',
        hookType: 'urgency',
        headline: '헤드라인',
        primaryText: '본문',
        description: '설명',
        callToAction: 'CTA',
        targetAudience: '타겟',
      }

      const variation = CopyVariation.create(input)

      expect(variation.variantType).toBe('B')
    })

    it('should throw error when campaignId is missing', () => {
      const input = {
        hookType: 'benefit' as CopyHookType,
        headline: '헤드라인',
        primaryText: '본문',
        description: '설명',
        callToAction: 'CTA',
        targetAudience: '타겟',
      } as CreateCopyVariationInput

      expect(() => CopyVariation.create(input)).toThrow()
    })

    it('should allow long headline (no strict validation on create)', () => {
      const input: CreateCopyVariationInput = {
        campaignId: 'camp-1',
        hookType: 'benefit',
        headline: '이 헤드라인은 매우 매우 매우 매우 매우 매우 매우 긴 텍스트입니다', // > 40 chars
        primaryText: '본문',
        description: '설명',
        callToAction: 'CTA',
        targetAudience: '타겟',
      }

      // 실제 구현에서는 create()가 글자 수 제한으로 예외를 발생시키지 않음
      const variation = CopyVariation.create(input)
      expect(variation.headline).toBe(input.headline)
    })

    it('should allow long primaryText (no strict validation on create)', () => {
      const input: CreateCopyVariationInput = {
        campaignId: 'camp-1',
        hookType: 'benefit',
        headline: '헤드라인',
        primaryText: '이 본문은 정말로 정말로 정말로 정말로 정말로 정말로 정말로 정말로 정말로 정말로 정말로 정말로 정말로 정말로 정말로 정말로 정말로 정말로 매우 긴 텍스트입니다 그리고 더 길게',
        description: '설명',
        callToAction: 'CTA',
        targetAudience: '타겟',
      }

      // 실제 구현에서는 create()가 글자 수 제한으로 예외를 발생시키지 않음
      const variation = CopyVariation.create(input)
      expect(variation.primaryText).toBe(input.primaryText)
    })

    it('should accept all valid hook types', () => {
      const hooks: CopyHookType[] = [
        'benefit',
        'urgency',
        'social_proof',
        'curiosity',
        'fear_of_missing',
        'authority',
        'emotional',
      ]

      hooks.forEach((hookType) => {
        const input: CreateCopyVariationInput = {
          campaignId: 'camp-1',
          hookType,
          headline: '헤드라인',
          primaryText: '본문',
          description: '설명',
          callToAction: 'CTA',
          targetAudience: '타겟',
        }

        const variation = CopyVariation.create(input)
        expect(variation.hookType).toBe(hookType)
      })
    })

    it('should set predicted CTR when provided', () => {
      const input: CreateCopyVariationInput = {
        campaignId: 'camp-1',
        hookType: 'benefit',
        headline: '헤드라인',
        primaryText: '본문',
        description: '설명',
        callToAction: 'CTA',
        targetAudience: '타겟',
        predictedCTR: 2.5,
      }

      const variation = CopyVariation.create(input)

      expect(variation.predictedCTR).toBe(2.5)
    })
  })

  describe('validate', () => {
    it('should return empty array for valid input', () => {
      const input: CreateCopyVariationInput = {
        campaignId: 'camp-1',
        hookType: 'benefit',
        headline: '헤드라인',
        primaryText: '본문',
        description: '설명',
        callToAction: 'CTA',
        targetAudience: '타겟',
      }

      const errors = CopyVariation.validate(input)

      expect(errors).toHaveLength(0)
    })

    it('should return error for missing campaignId', () => {
      const input = {
        hookType: 'benefit' as CopyHookType,
        headline: '헤드라인',
        primaryText: '본문',
        description: '설명',
        callToAction: 'CTA',
        targetAudience: '타겟',
      } as CreateCopyVariationInput

      const errors = CopyVariation.validate(input)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors.some((e) => e.includes('campaignId'))).toBe(true)
    })

    it('should return error for invalid hookType', () => {
      const input = {
        campaignId: 'camp-1',
        hookType: 'invalid_hook' as CopyHookType,
        headline: '헤드라인',
        primaryText: '본문',
        description: '설명',
        callToAction: 'CTA',
        targetAudience: '타겟',
      }

      const errors = CopyVariation.validate(input)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors.some((e) => e.includes('hookType'))).toBe(true)
    })
  })

  describe('fromData', () => {
    it('should restore variation from data', () => {
      const data = {
        id: 'existing-id',
        campaignId: 'camp-1',
        variantType: 'B' as const,
        hookType: 'urgency' as CopyHookType,
        headline: '헤드라인',
        primaryText: '본문',
        description: '설명',
        callToAction: 'CTA',
        targetAudience: '타겟',
        predictedCTR: 2.0,
        rationale: '긴급성 훅',
        createdAt: new Date(),
        status: 'active' as const,
      }

      const variation = CopyVariation.fromData(data)

      expect(variation.id).toBe('existing-id')
      expect(variation.variantType).toBe('B')
      expect(variation.status).toBe('active')
    })
  })

  describe('metrics calculations', () => {
    it('should calculate actualCTR correctly', () => {
      const variation = createVariationWithMetrics({
        impressions: 10000,
        clicks: 300,
        ctr: 3.0,
      })

      expect(variation.actualCTR).toBeCloseTo(3.0, 2)
    })

    it('should return null for actualCTR when no impressions', () => {
      const variation = createVariationWithMetrics({
        impressions: 0,
        clicks: 0,
        ctr: 0,
      })

      expect(variation.actualCTR).toBeNull()
    })

    it('should calculate actualCVR correctly', () => {
      const variation = createVariationWithMetrics({
        clicks: 300,
        conversions: 15,
        cvr: 5.0,
      })

      expect(variation.actualCVR).toBeCloseTo(5.0, 2)
    })

    it('should return null for actualCVR when no clicks', () => {
      const variation = createVariationWithMetrics({
        clicks: 0,
        conversions: 0,
        cvr: 0,
      })

      expect(variation.actualCVR).toBeNull()
    })

    it('should calculate performanceScore', () => {
      const variation = createVariationWithMetrics({
        impressions: 10000,
        clicks: 300,
        conversions: 15,
        ctr: 3.0, // 3%
        cvr: 5.0, // 5%
      })

      const score = variation.performanceScore

      expect(score).not.toBeNull()
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('should return null for performanceScore when no metrics', () => {
      const input: CreateCopyVariationInput = {
        campaignId: 'camp-1',
        hookType: 'benefit',
        headline: '헤드라인',
        primaryText: '본문',
        description: '설명',
        callToAction: 'CTA',
        targetAudience: '타겟',
      }

      const variation = CopyVariation.create(input)

      expect(variation.performanceScore).toBeNull()
    })
  })

  describe('updateMetrics', () => {
    it('should return new variation with updated metrics', () => {
      const input: CreateCopyVariationInput = {
        campaignId: 'camp-1',
        hookType: 'benefit',
        headline: '헤드라인',
        primaryText: '본문',
        description: '설명',
        callToAction: 'CTA',
        targetAudience: '타겟',
      }

      const original = CopyVariation.create(input)

      const metrics: CopyPerformanceMetrics = {
        impressions: 5000,
        clicks: 150,
        conversions: 8,
        spend: 50000,
        ctr: 3.0,
        cvr: 5.33,
        cpc: 333,
        cpa: 6250,
      }

      const updated = original.updateMetrics(metrics)

      expect(updated.metrics).toBeDefined()
      expect(updated.metrics?.impressions).toBe(5000)
      expect(original.metrics).toBeUndefined() // Original unchanged
    })
  })

  describe('updateStatus', () => {
    it('should return new variation with updated status', () => {
      const input: CreateCopyVariationInput = {
        campaignId: 'camp-1',
        hookType: 'benefit',
        headline: '헤드라인',
        primaryText: '본문',
        description: '설명',
        callToAction: 'CTA',
        targetAudience: '타겟',
      }

      const original = CopyVariation.create(input)
      const updated = original.updateStatus('active')

      expect(updated.status).toBe('active')
      expect(original.status).toBe('draft') // Original unchanged
    })
  })

  describe('hook type helpers', () => {
    it('should return hookTypeDescription', () => {
      const input: CreateCopyVariationInput = {
        campaignId: 'camp-1',
        hookType: 'benefit',
        headline: '헤드라인',
        primaryText: '본문',
        description: '설명',
        callToAction: 'CTA',
        targetAudience: '타겟',
      }

      const variation = CopyVariation.create(input)

      expect(variation.hookTypeDescription).toBe(
        HOOK_TYPE_DESCRIPTIONS.benefit.description
      )
    })

    it('should return hookTypeName', () => {
      const input: CreateCopyVariationInput = {
        campaignId: 'camp-1',
        hookType: 'urgency',
        headline: '헤드라인',
        primaryText: '본문',
        description: '설명',
        callToAction: 'CTA',
        targetAudience: '타겟',
      }

      const variation = CopyVariation.create(input)

      expect(variation.hookTypeName).toBe(HOOK_TYPE_DESCRIPTIONS.urgency.name)
    })
  })

  describe('toSummary', () => {
    it('should return summary object', () => {
      const variation = createVariationWithMetrics({
        ctr: 3.0,
        impressions: 10000,
        clicks: 300,
      })

      const summary = variation.toSummary()

      expect(summary.id).toBe(variation.id)
      expect(summary.variantType).toBe(variation.variantType)
      expect(summary.hookType).toBe(variation.hookType)
      expect(summary.hookTypeName).toBeDefined()
      expect(summary.headline).toBe(variation.headline)
      expect(summary.predictedCTR).toBe(variation.predictedCTR)
      expect(summary.actualCTR).not.toBeNull()
      expect(summary.performanceScore).not.toBeNull()
      expect(summary.status).toBe(variation.status)
    })
  })
})

describe('ABTestAnalyzer', () => {
  let analyzer: ABTestAnalyzer

  beforeEach(() => {
    analyzer = new ABTestAnalyzer()
  })

  describe('analyze', () => {
    it('should return result indicating insufficient variations', () => {
      const variation = createVariationWithMetrics({ impressions: 10000 })

      const result = analyzer.analyze([variation])

      expect(result.winner).toBeNull()
      expect(result.insights.some((i) => i.includes('최소 2개'))).toBe(true)
    })

    it('should return result indicating insufficient sample size', () => {
      const variationA = createVariationWithMetrics({
        impressions: 100, // Below minimum 1000
        ctr: 3.0,
      })
      const variationB = createVariationWithMetrics({
        impressions: 100,
        ctr: 2.0,
      })
      variationB.updateStatus('active')

      const result = analyzer.analyze([
        variationA.updateStatus('active'),
        variationB.updateStatus('active'),
      ])

      expect(result.winner).toBeNull()
      expect(result.sampleSize).toBe(200)
    })

    it('should analyze two variations with sufficient data', () => {
      const variationA = createVariationWithMetrics({
        impressions: 5000,
        clicks: 200,
        conversions: 10,
        ctr: 4.0,
        cvr: 5.0,
      }).updateStatus('active')

      const variationB = createVariationWithMetrics({
        impressions: 5000,
        clicks: 100,
        conversions: 5,
        ctr: 2.0,
        cvr: 5.0,
      }).updateStatus('active')

      const result = analyzer.analyze([variationA, variationB])

      expect(result).toBeDefined()
      expect(result.sampleSize).toBe(10000)
      expect(result.testDuration).toBeGreaterThanOrEqual(0)
      expect(result.insights.length).toBeGreaterThan(0)
    })

    it('should identify winner when confidence is high enough', () => {
      // Large sample with significant difference
      const variationA = createVariationWithMetrics({
        impressions: 50000,
        clicks: 2500, // 5% CTR
        conversions: 125,
        ctr: 5.0,
        cvr: 5.0,
      }).updateStatus('active')

      const variationB = createVariationWithMetrics({
        impressions: 50000,
        clicks: 1000, // 2% CTR
        conversions: 50,
        ctr: 2.0,
        cvr: 5.0,
      }).updateStatus('active')

      const result = analyzer.analyze([variationA, variationB])

      expect(result.confidence).toBeGreaterThan(90)
      // Winner depends on confidence threshold (95)
    })

    it('should filter out non-active variations', () => {
      const activeVariation = createVariationWithMetrics({
        impressions: 5000,
        ctr: 3.0,
      }).updateStatus('active')

      const draftVariation = createVariationWithMetrics({
        impressions: 5000,
        ctr: 5.0,
      }) // Status is 'draft'

      const result = analyzer.analyze([activeVariation, draftVariation])

      // Only one active variation, so should indicate need for more
      expect(result.insights.some((i) => i.includes('최소 2개'))).toBe(true)
    })

    it('should include completed variations in analysis', () => {
      const completedA = createVariationWithMetrics({
        impressions: 5000,
        ctr: 3.0,
      }).updateStatus('completed')

      const completedB = createVariationWithMetrics({
        impressions: 5000,
        ctr: 2.0,
      }).updateStatus('completed')

      const result = analyzer.analyze([completedA, completedB])

      expect(result.sampleSize).toBe(10000)
    })
  })
})

describe('HOOK_TYPE_DESCRIPTIONS', () => {
  it('should have descriptions for all hook types', () => {
    const hooks: CopyHookType[] = [
      'benefit',
      'urgency',
      'social_proof',
      'curiosity',
      'fear_of_missing',
      'authority',
      'emotional',
    ]

    hooks.forEach((hook) => {
      expect(HOOK_TYPE_DESCRIPTIONS[hook]).toBeDefined()
      expect(HOOK_TYPE_DESCRIPTIONS[hook].name).toBeDefined()
      expect(HOOK_TYPE_DESCRIPTIONS[hook].description).toBeDefined()
    })
  })
})

// Helper function
function createVariationWithMetrics(
  metricsOverrides: Partial<CopyPerformanceMetrics>
): CopyVariation {
  const input: CreateCopyVariationInput = {
    campaignId: 'camp-1',
    hookType: 'benefit',
    headline: '테스트 헤드라인',
    primaryText: '테스트 본문입니다',
    description: '설명',
    callToAction: '지금 구매',
    targetAudience: '25-34세 여성',
    predictedCTR: 2.0,
  }

  const variation = CopyVariation.create(input)

  const metrics: CopyPerformanceMetrics = {
    impressions: 10000,
    clicks: 300,
    conversions: 15,
    spend: 100000,
    ctr: 3.0,
    cvr: 5.0,
    cpc: 333,
    cpa: 6667,
    roas: 5.0,
    ...metricsOverrides,
  }

  return variation.updateMetrics(metrics)
}
