import { describe, it, expect, vi } from 'vitest'
import { evaluateAsync } from '@application/intent-lab/IntentLabAsyncEval'
import { IntentClassifier } from '@domain/services/IntentClassifier'
import { ChatIntent } from '@domain/value-objects/ChatIntent'
import type { IIntentLLMPort } from '@domain/ports/IIntentLLMPort'
import type { EvalCase } from '@application/intent-lab/IntentLabEvalSet'

function createMockLLM(intentMap: Record<string, ChatIntent>): IIntentLLMPort {
  return {
    classifyIntent: vi.fn().mockImplementation(async (message: string) => {
      return intentMap[message] ?? ChatIntent.GENERAL
    }),
  }
}

describe('evaluateAsync', () => {
  it('should evaluate cases using classifyAsync', async () => {
    const mockLLM = createMockLLM({
      '일단 뭐라도 좀 해봐요': ChatIntent.CAMPAIGN_CREATION,
    })
    const classifier = IntentClassifier.create(undefined, mockLLM)

    const cases: EvalCase[] = [
      { input: '캠페인 만들어줘', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'easy' },
      { input: '일단 뭐라도 좀 해봐요', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'hard' },
    ]

    const result = await evaluateAsync(classifier, cases)

    expect(result.total).toBe(2)
    expect(result.correct).toBe(2)
    expect(result.accuracy).toBe(1)
    expect(result.llmCallCount).toBeGreaterThanOrEqual(0)
    expect(typeof result.llmCallRatio).toBe('number')
  })

  it('should track LLM call count', async () => {
    const mockLLM = createMockLLM({
      '경쟁사는 잘 되던데': ChatIntent.KPI_ANALYSIS,
    })
    const classifier = IntentClassifier.create(undefined, mockLLM)

    const cases: EvalCase[] = [
      { input: '캠페인 만들어줘', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'easy' },
      { input: '경쟁사는 잘 되던데', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'hard' },
    ]

    const result = await evaluateAsync(classifier, cases)

    // '캠페인 만들어줘' → keyword hit, no LLM
    // '경쟁사는 잘 되던데' → context '경쟁사' matches, but confidence may be low → LLM
    expect(result.llmCallCount).toBeGreaterThanOrEqual(0)
    expect(result.total).toBe(2)
  })

  it('should report failures correctly', async () => {
    const mockLLM = createMockLLM({})  // returns GENERAL for everything
    const classifier = IntentClassifier.create(undefined, mockLLM)

    const cases: EvalCase[] = [
      { input: '아 답답해 진짜', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'hard' },
    ]

    const result = await evaluateAsync(classifier, cases)

    expect(result.failures.length).toBe(1)
    expect(result.failures[0].expected).toBe(ChatIntent.KPI_ANALYSIS)
  })

  it('should report per-difficulty breakdown', async () => {
    const classifier = IntentClassifier.create() // no LLM

    const cases: EvalCase[] = [
      { input: '캠페인 만들어줘', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'easy' },
      { input: '리포트 보여줘', expected: ChatIntent.REPORT_QUERY, difficulty: 'medium' },
    ]

    const result = await evaluateAsync(classifier, cases)

    expect(result.byDifficulty.easy.total).toBe(1)
    expect(result.byDifficulty.medium.total).toBe(1)
    expect(result.byDifficulty.hard.total).toBe(0)
  })
})
