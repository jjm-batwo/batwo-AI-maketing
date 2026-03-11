import { describe, it, expect } from 'vitest'
import { isHighConfidenceAction, ApplyAction } from '@/domain/value-objects/ApplyAction'

describe('ApplyAction', () => {
  it('should return true for confidence >= 0.7', () => {
    const action: ApplyAction = {
      type: 'budget_change',
      campaignId: 'camp-123',
      description: '예산 20% 증액',
      currentValue: 10000,
      suggestedValue: 12000,
      expectedImpact: 'ROAS +15% 예상',
      confidence: 0.8,
    }
    expect(isHighConfidenceAction(action)).toBe(true)
  })

  it('should return false for confidence < 0.7', () => {
    const action: ApplyAction = {
      type: 'budget_change',
      campaignId: 'camp-123',
      description: '예산 10% 증액',
      currentValue: 10000,
      suggestedValue: 11000,
      expectedImpact: 'ROAS +5% 예상',
      confidence: 0.65,
    }
    expect(isHighConfidenceAction(action)).toBe(false)
  })
})
