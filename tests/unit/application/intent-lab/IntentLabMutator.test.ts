// tests/unit/application/intent-lab/IntentLabMutator.test.ts
import { describe, it, expect } from 'vitest'
import { IntentLabMutator } from '@application/intent-lab/IntentLabMutator'
import { DEFAULT_INTENT_CLASSIFIER_CONFIG } from '@domain/services/IntentClassifierConfig'

describe('IntentLabMutator', () => {
  const mutator = new IntentLabMutator()

  it('should produce a different config from input', () => {
    const result = mutator.mutate(DEFAULT_INTENT_CLASSIFIER_CONFIG)
    expect(JSON.stringify(result.config)).not.toBe(JSON.stringify(DEFAULT_INTENT_CLASSIFIER_CONFIG))
  })

  it('should describe what changed', () => {
    const result = mutator.mutate(DEFAULT_INTENT_CLASSIFIER_CONFIG)
    expect(result.description.length).toBeGreaterThan(0)
  })

  it('should keep minimum 2 keywords per intent', () => {
    for (let i = 0; i < 50; i++) {
      const result = mutator.mutate(DEFAULT_INTENT_CLASSIFIER_CONFIG)
      for (const keywords of Object.values(result.config.keywordMap)) {
        expect(keywords.length).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('should keep minimum 1 context pattern per intent', () => {
    for (let i = 0; i < 50; i++) {
      const result = mutator.mutate(DEFAULT_INTENT_CLASSIFIER_CONFIG)
      for (const patterns of Object.values(result.config.contextMap)) {
        expect(patterns.length).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it('should keep ambiguityThreshold in 1.5-3.0 range', () => {
    for (let i = 0; i < 50; i++) {
      const result = mutator.mutate(DEFAULT_INTENT_CLASSIFIER_CONFIG)
      expect(result.config.ambiguityThreshold).toBeGreaterThanOrEqual(1.5)
      expect(result.config.ambiguityThreshold).toBeLessThanOrEqual(3.0)
    }
  })

  it('should keep singleMatchConfidence in 0.4-0.8 range', () => {
    for (let i = 0; i < 50; i++) {
      const result = mutator.mutate(DEFAULT_INTENT_CLASSIFIER_CONFIG)
      expect(result.config.singleMatchConfidence).toBeGreaterThanOrEqual(0.4)
      expect(result.config.singleMatchConfidence).toBeLessThanOrEqual(0.8)
    }
  })

  it('should generate diverse mutations', () => {
    const descriptions = new Set<string>()
    for (let i = 0; i < 30; i++) {
      const result = mutator.mutate(DEFAULT_INTENT_CLASSIFIER_CONFIG)
      descriptions.add(result.description.split(' ')[0]) // first word = axis name
    }
    expect(descriptions.size).toBeGreaterThan(3)
  })
})
