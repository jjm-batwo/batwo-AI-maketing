// tests/unit/application/intent-lab/IntentLabEvalSet.test.ts
import { describe, it, expect } from 'vitest'
import {
  TRAIN_EVAL_SET,
  VALIDATION_EVAL_SET,
  FULL_EVAL_SET,
  evaluate,
} from '@application/intent-lab/IntentLabEvalSet'
import { IntentClassifier } from '@domain/services/IntentClassifier'
import { ChatIntent } from '@domain/value-objects/ChatIntent'
import { DEFAULT_INTENT_CLASSIFIER_CONFIG } from '@domain/services/IntentClassifierConfig'

describe('IntentLabEvalSet', () => {
  it('should have 80 train cases', () => {
    expect(TRAIN_EVAL_SET.length).toBe(80)
  })

  it('should have 20 validation cases', () => {
    expect(VALIDATION_EVAL_SET.length).toBe(20)
  })

  it('should have 100 total cases', () => {
    expect(FULL_EVAL_SET.length).toBe(100)
  })

  it('should cover all 11 intents', () => {
    const intents = new Set(FULL_EVAL_SET.map((c) => c.expected))
    expect(intents.size).toBe(11)
  })

  it('should have 3 difficulty levels', () => {
    const difficulties = new Set(FULL_EVAL_SET.map((c) => c.difficulty))
    expect(difficulties).toContain('easy')
    expect(difficulties).toContain('medium')
    expect(difficulties).toContain('hard')
  })

  describe('evaluate()', () => {
    it('should return accuracy between 0 and 1', () => {
      const classifier = IntentClassifier.create()
      const result = evaluate(classifier, TRAIN_EVAL_SET)
      expect(result.accuracy).toBeGreaterThanOrEqual(0)
      expect(result.accuracy).toBeLessThanOrEqual(1)
    })

    it('should return correct + failures = total', () => {
      const classifier = IntentClassifier.create()
      const result = evaluate(classifier, TRAIN_EVAL_SET)
      expect(result.correct + result.failures.length).toBe(result.total)
    })

    it('should report per-difficulty accuracy', () => {
      const classifier = IntentClassifier.create()
      const result = evaluate(classifier, FULL_EVAL_SET)
      expect(result.byDifficulty.easy).toBeDefined()
      expect(result.byDifficulty.medium).toBeDefined()
      expect(result.byDifficulty.hard).toBeDefined()
    })

    it('should return failures with details', () => {
      // Crippled config that misclassifies
      const crippledConfig = {
        ...DEFAULT_INTENT_CLASSIFIER_CONFIG,
        keywordMap: {
          ...DEFAULT_INTENT_CLASSIFIER_CONFIG.keywordMap,
          [ChatIntent.CAMPAIGN_CREATION]: ['없는키워드xyz'],
          [ChatIntent.REPORT_QUERY]: ['없는키워드abc'],
          [ChatIntent.KPI_ANALYSIS]: ['없는키워드def'],
          [ChatIntent.PIXEL_SETUP]: ['없는키워드ghi'],
          [ChatIntent.BUDGET_OPTIMIZATION]: ['없는키워드jkl'],
          [ChatIntent.CREATIVE_FATIGUE]: ['없는키워드mno'],
          [ChatIntent.LEARNING_PHASE]: ['없는키워드pqr'],
          [ChatIntent.STRUCTURE_OPTIMIZATION]: ['없는키워드stu'],
          [ChatIntent.LEAD_QUALITY]: ['없는키워드vwx'],
          [ChatIntent.TRACKING_HEALTH]: ['없는키워드yza'],
        },
      }
      const classifier = IntentClassifier.create(crippledConfig)
      const result = evaluate(classifier, FULL_EVAL_SET)
      expect(result.failures.length).toBeGreaterThan(0)
      expect(result.failures[0]).toHaveProperty('input')
      expect(result.failures[0]).toHaveProperty('expected')
      expect(result.failures[0]).toHaveProperty('got')
    })
  })
})
