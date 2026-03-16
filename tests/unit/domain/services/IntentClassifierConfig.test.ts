// tests/unit/domain/services/IntentClassifierConfig.test.ts
import { describe, it, expect } from 'vitest'
import {
  DEFAULT_INTENT_CLASSIFIER_CONFIG,
} from '@domain/services/IntentClassifierConfig'
import { ChatIntent } from '@domain/value-objects/ChatIntent'

describe('IntentClassifierConfig', () => {
  it('should have keyword entries for all non-GENERAL intents', () => {
    const config = DEFAULT_INTENT_CLASSIFIER_CONFIG
    const intents = Object.values(ChatIntent).filter((i) => i !== ChatIntent.GENERAL)
    for (const intent of intents) {
      expect(config.keywordMap[intent as Exclude<ChatIntent, ChatIntent.GENERAL>]).toBeDefined()
      expect(config.keywordMap[intent as Exclude<ChatIntent, ChatIntent.GENERAL>].length).toBeGreaterThanOrEqual(2)
    }
  })

  it('should have context entries for all non-GENERAL intents', () => {
    const config = DEFAULT_INTENT_CLASSIFIER_CONFIG
    const intents = Object.values(ChatIntent).filter((i) => i !== ChatIntent.GENERAL)
    for (const intent of intents) {
      expect(config.contextMap[intent as Exclude<ChatIntent, ChatIntent.GENERAL>]).toBeDefined()
      expect(config.contextMap[intent as Exclude<ChatIntent, ChatIntent.GENERAL>].length).toBeGreaterThanOrEqual(1)
    }
  })

  it('should have reasonable threshold defaults', () => {
    const config = DEFAULT_INTENT_CLASSIFIER_CONFIG
    expect(config.ambiguityThreshold).toBe(2.0)
    expect(config.singleMatchConfidence).toBe(0.6)
    expect(config.llmConfidenceCoeff).toBe(0.05)
  })

  it('should have negation patterns', () => {
    const config = DEFAULT_INTENT_CLASSIFIER_CONFIG
    expect(config.negationPatterns.length).toBeGreaterThan(0)
    expect(config.negationPatterns).toContain('지 마')
  })
})
