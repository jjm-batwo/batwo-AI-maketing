// tests/unit/application/services/PromptLabRuleScorer.test.ts
import { describe, it, expect } from 'vitest'
import { PromptLabRuleScorer } from '@application/services/PromptLabRuleScorer'
import type { AdCopyVariant } from '@application/ports/IAIService'

function makeVariant(overrides: Partial<AdCopyVariant> = {}): AdCopyVariant {
  return {
    headline: '지금 바로 시작하세요',
    primaryText: '한정 기간 50% 할인! 지금 구매하면 무료 배송까지.',
    description: '오늘만 특별 혜택',
    callToAction: '지금 구매하기',
    targetAudience: '20-30대 여성',
    ...overrides,
  }
}

describe('PromptLabRuleScorer', () => {
  const scorer = new PromptLabRuleScorer()

  describe('scoreMetaSpec', () => {
    it('should give 10/10 when all lengths within limits', () => {
      const variant = makeVariant()
      expect(scorer.scoreMetaSpec(variant)).toBe(10)
    })

    it('should give 0 for headline when exceeding 40 chars', () => {
      const variant = makeVariant({
        headline: '이것은 40자를 초과하는 매우 길고 길고 길고 길고 길고 긴 헤드라인입니다 정말로요',
      })
      expect(scorer.scoreMetaSpec(variant)).toBeLessThan(10)
    })
  })

  describe('scoreCTA', () => {
    it('should give 5 when CTA exists', () => {
      expect(scorer.scoreCTA(makeVariant())).toBe(5)
    })
    it('should give 0 when CTA is empty', () => {
      expect(scorer.scoreCTA(makeVariant({ callToAction: '' }))).toBe(0)
    })
  })

  describe('scoreKeywordReflection', () => {
    it('should score proportionally to keyword inclusion', () => {
      const variant = makeVariant({ primaryText: '할인 혜택으로 구매하세요' })
      const keywords = ['할인', '혜택', '무료', '배송', '특가']
      expect(scorer.scoreKeywordReflection(variant, keywords)).toBe(4)
    })
    it('should give 10 when no keywords specified', () => {
      expect(scorer.scoreKeywordReflection(makeVariant(), [])).toBe(10)
    })
  })

  describe('scoreHookPresence', () => {
    it('should detect urgency hook patterns', () => {
      const variant = makeVariant({ headline: '오늘만! 한정 수량' })
      expect(scorer.scoreHookPresence(variant)).toBe(5)
    })
    it('should give 0 when no hook pattern found', () => {
      const variant = makeVariant({ headline: '상품 소개', primaryText: '상품입니다', description: '설명' })
      expect(scorer.scoreHookPresence(variant)).toBe(0)
    })
  })

  describe('scoreDiversity', () => {
    it('should give 10 for baseline (no comparison)', () => {
      expect(scorer.scoreDiversity([makeVariant()], null)).toBe(10)
    })
    it('should give 0 for identical copies', () => {
      expect(scorer.scoreDiversity([makeVariant()], [makeVariant()])).toBe(0)
    })
    it('should give 10 for very different copies', () => {
      const current = [makeVariant({ headline: '완전히 새로운 접근', primaryText: '전혀 다른 내용의 카피' })]
      const best = [makeVariant()]
      expect(scorer.scoreDiversity(current, best)).toBe(10)
    })
  })

  describe('score (total)', () => {
    it('should return 0-40 range', () => {
      const result = scorer.score({ variants: [makeVariant()], keywords: ['할인', '혜택'], bestVariantCopy: null })
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThanOrEqual(40)
    })
  })
})
