// tests/unit/infrastructure/prompt-lab/PromptLabLLMJudge.test.ts
import { describe, it, expect, vi } from 'vitest'
import { PromptLabLLMJudge } from '@infrastructure/prompt-lab/PromptLabLLMJudge'
import type { IAIService } from '@application/ports/IAIService'

function makeMockAIService(response: string): IAIService {
  return {
    chatCompletion: vi.fn().mockResolvedValue(response),
    generateAdCopy: vi.fn(),
    generateCampaignOptimization: vi.fn(),
    generateReportInsights: vi.fn(),
    generateBudgetRecommendation: vi.fn(),
    generateCreativeVariants: vi.fn(),
    analyzeCompetitorTrends: vi.fn(),
    generateCompetitorInsights: vi.fn(),
  } as unknown as IAIService
}

describe('PromptLabLLMJudge', () => {
  it('should parse valid JSON scores', async () => {
    const mockResponse = JSON.stringify({
      attention: 10, action: 8, relevance: 9, emotion: 7, clarity: 11,
    })
    const ai = makeMockAIService(mockResponse)
    const judge = new PromptLabLLMJudge(ai)

    const result = await judge.evaluate({
      headline: '오늘만 50% 할인',
      primaryText: '지금 구매하면 무료 배송!',
      description: '한정 혜택',
      callToAction: '구매하기',
      targetAudience: '20-30대',
    })

    expect(result.score).toBe(45)
    expect(result.dimensions.attention).toBe(10)
    expect(result.tokenUsage).toBeGreaterThan(0)
  })

  it('should clamp scores to 1-12 range', async () => {
    const mockResponse = JSON.stringify({
      attention: 15, action: -1, relevance: 12, emotion: 0, clarity: 12,
    })
    const ai = makeMockAIService(mockResponse)
    const judge = new PromptLabLLMJudge(ai)

    const result = await judge.evaluate({
      headline: 'test', primaryText: 'test',
      description: 'test', callToAction: 'test', targetAudience: 'test',
    })

    expect(result.dimensions.attention).toBe(12)
    expect(result.dimensions.action).toBe(1)
  })

  it('should return 0 score on parse failure', async () => {
    const ai = makeMockAIService('invalid json')
    const judge = new PromptLabLLMJudge(ai)

    const result = await judge.evaluate({
      headline: 'test', primaryText: 'test',
      description: 'test', callToAction: 'test', targetAudience: 'test',
    })

    expect(result.score).toBe(0)
  })
})
