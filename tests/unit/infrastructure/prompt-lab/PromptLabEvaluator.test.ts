// tests/unit/infrastructure/prompt-lab/PromptLabEvaluator.test.ts
import { describe, it, expect, vi } from 'vitest'
import { PromptLabEvaluator } from '@infrastructure/prompt-lab/PromptLabEvaluator'
import { PromptLabRuleScorer } from '@application/services/PromptLabRuleScorer'
import type { PromptLabLLMJudge, LLMJudgeResult } from '@infrastructure/prompt-lab/PromptLabLLMJudge'
import type { AdCopyVariant } from '@application/ports/IAIService'

function makeVariant(): AdCopyVariant {
  return {
    headline: '오늘만 특별 할인',
    primaryText: '지금 구매하면 50% 할인!',
    description: '한정 혜택',
    callToAction: '구매하기',
    targetAudience: '20-30대',
  }
}

function makeMockJudge(score: number): PromptLabLLMJudge {
  return {
    evaluate: vi.fn().mockResolvedValue({
      score,
      dimensions: { attention: score / 5, action: score / 5, relevance: score / 5, emotion: score / 5, clarity: score / 5 },
      tokenUsage: 500,
    } satisfies LLMJudgeResult),
  } as unknown as PromptLabLLMJudge
}

describe('PromptLabEvaluator', () => {
  it('should combine rule score + LLM score', async () => {
    const judge = makeMockJudge(45)
    const evaluator = new PromptLabEvaluator(new PromptLabRuleScorer(), judge)

    const result = await evaluator.evaluate({
      variants: [makeVariant()],
      keywords: [],
      bestVariantCopy: null,
    })

    expect(result.ruleScore).toBeGreaterThan(0)
    expect(result.ruleScore).toBeLessThanOrEqual(40)
    expect(result.llmScore).toBe(45)
    expect(result.totalScore).toBe(result.ruleScore + 45)
    expect(result.tokenUsage).toBe(500)
  })

  it('should skip LLM evaluation when ruleScore < 20', async () => {
    const judge = makeMockJudge(45)
    const scorer = new PromptLabRuleScorer()
    vi.spyOn(scorer, 'score').mockReturnValue(15)
    const evaluator = new PromptLabEvaluator(scorer, judge)

    const result = await evaluator.evaluate({
      variants: [makeVariant()],
      keywords: [],
      bestVariantCopy: null,
    })

    expect(result.llmScore).toBe(0)
    expect(result.totalScore).toBe(15)
    expect(judge.evaluate).not.toHaveBeenCalled()
  })

  it('should confirm with median of 3 (initial + 2 additional)', async () => {
    let callCount = 0
    const judge = {
      evaluate: vi.fn().mockImplementation(async () => {
        callCount++
        const scores = [40, 42]
        const s = scores[(callCount - 1) % 2]
        return { score: s, dimensions: {}, tokenUsage: 500 } as LLMJudgeResult
      }),
    } as unknown as PromptLabLLMJudge

    const evaluator = new PromptLabEvaluator(new PromptLabRuleScorer(), judge)

    const result = await evaluator.evaluateWithConfirmation({
      variants: [makeVariant()],
      keywords: [],
      bestVariantCopy: null,
      initialLLMScore: 45,
    })

    // median of [45(initial), 40, 42] = 42
    expect(result.llmScore).toBe(42)
    expect(judge.evaluate).toHaveBeenCalledTimes(2)
  })
})
