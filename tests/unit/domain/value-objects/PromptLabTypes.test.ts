// tests/unit/domain/value-objects/PromptLabTypes.test.ts
import { describe, it, expect } from 'vitest'
import {
  createDefaultVariant,
  createPromptLabConfig,
  type PromptVariant,
  type PromptLabConfig,
  type PromptLabResult,
  type PromptLabReport,
} from '@domain/value-objects/PromptLabTypes'
import type { Industry } from '@domain/value-objects/Industry'

describe('PromptLabTypes', () => {
  describe('createDefaultVariant', () => {
    it('should create baseline variant with all 9 domains', () => {
      const variant = createDefaultVariant()
      expect(variant.scienceDomains).toHaveLength(9)
      expect(variant.temperature).toBe(0.8)
      expect(variant.fewShotStrategy).toBe('industry')
      expect(variant.systemRole).toBe('expert_marketer')
      expect(variant.instructionStyle).toBe('moderate')
      expect(variant.description).toBe('baseline')
    })
  })

  describe('createPromptLabConfig', () => {
    it('should apply defaults for optional fields', () => {
      const config = createPromptLabConfig({
        industry: 'ecommerce' as Industry,
        sampleInput: {
          productName: '테스트 상품',
          productDescription: '테스트 설명',
          targetAudience: '20-30대 여성',
          tone: 'professional' as const,
          objective: 'conversion' as const,
          industry: 'ecommerce' as Industry,
        },
      })
      expect(config.maxDurationMs).toBe(3_600_000)
      expect(config.maxConsecutiveCrashes).toBe(3)
      expect(config.iterationDelayMs).toBe(36_000)
    })

    it('should allow overriding defaults', () => {
      const config = createPromptLabConfig({
        industry: 'beauty' as Industry,
        maxDurationMs: 1_800_000,
        iterationDelayMs: 18_000,
        sampleInput: {
          productName: '뷰티 상품',
          productDescription: '뷰티 설명',
          targetAudience: '20대 여성',
          tone: 'casual' as const,
          objective: 'awareness' as const,
          industry: 'beauty' as Industry,
        },
      })
      expect(config.maxDurationMs).toBe(1_800_000)
      expect(config.iterationDelayMs).toBe(18_000)
    })
  })
})
