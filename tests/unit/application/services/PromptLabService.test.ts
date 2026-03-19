// tests/unit/application/services/PromptLabService.test.ts
import { describe, it, expect, vi } from 'vitest'
import { PromptLabService } from '@application/services/PromptLabService'
import type { IPromptLabEvaluator, EvaluationResult } from '@application/ports/IPromptLabEvaluator'
import type { IPromptLabMutator } from '@application/ports/IPromptLabMutator'
import type { IPromptLabAIAdapter, GenerateWithVariantResult } from '@application/ports/IPromptLabAIAdapter'
import type { AdCopyVariant } from '@domain/value-objects/AdCopyTypes'
import { createPromptLabConfig } from '@domain/value-objects/PromptLabTypes'
import type { Industry } from '@domain/value-objects/Industry'

function makeVariant(): AdCopyVariant {
  return {
    headline: '테스트 헤드라인',
    primaryText: '테스트 본문',
    description: '테스트 설명',
    callToAction: '구매하기',
    targetAudience: '20-30대',
  }
}

function makeMockEvaluator(scores: number[]): IPromptLabEvaluator {
  let callIdx = 0
  return {
    evaluate: vi.fn().mockImplementation(async () => {
      const s = scores[callIdx++ % scores.length]
      return {
        ruleScore: Math.min(s, 40),
        llmScore: Math.max(0, s - 40),
        totalScore: s,
        tokenUsage: 3000,
      } satisfies EvaluationResult
    }),
    evaluateWithConfirmation: vi.fn().mockImplementation(async () => {
      const s = scores[callIdx++ % scores.length]
      return {
        ruleScore: Math.min(s, 40),
        llmScore: Math.max(0, s - 40),
        totalScore: s,
        tokenUsage: 5000,
      } satisfies EvaluationResult
    }),
  } as unknown as IPromptLabEvaluator
}

function makeMockAdapter(): IPromptLabAIAdapter {
  return {
    generateWithVariant: vi.fn().mockResolvedValue({
      variants: [makeVariant()],
      estimatedTokenUsage: 1100,
    } satisfies GenerateWithVariantResult),
  } as unknown as IPromptLabAIAdapter
}

function makeMockMutator(): IPromptLabMutator {
  let counter = 0
  return {
    mutate: vi.fn().mockImplementation((base) => ({
      ...base,
      id: `mutated-${++counter}`,
      temperature: 0.6,
      description: `mutation ${counter}`,
    })),
  } as unknown as IPromptLabMutator
}

describe('PromptLabService', () => {
  let service: PromptLabService

  const config = createPromptLabConfig({
    industry: 'ecommerce' as Industry,
    maxDurationMs: 100, // 100ms for tests
    iterationDelayMs: 0, // no delay in tests
    sampleInput: {
      productName: '테스트', productDescription: '설명',
      targetAudience: '20대', tone: 'casual' as const,
      objective: 'conversion' as const, industry: 'ecommerce' as Industry,
    },
  })

  it('should run baseline first then iterate until time runs out', async () => {
    const evaluator = makeMockEvaluator([50, 60, 55, 70, 65, 72])
    service = new PromptLabService(makeMockAdapter(), evaluator, makeMockMutator())

    const report = await service.run(config)

    expect(report.baselineScore).toBe(50)
    expect(report.bestScore).toBeGreaterThanOrEqual(50)
    expect(report.results.length).toBeGreaterThanOrEqual(2)
    expect(report.improvementFromBaseline).toBeGreaterThanOrEqual(0)
  })

  it('should stop when time runs out', async () => {
    const evaluator = makeMockEvaluator([50, 60, 70, 80, 75, 85])
    service = new PromptLabService(makeMockAdapter(), evaluator, makeMockMutator())

    const shortConfig = { ...config, maxDurationMs: 50, iterationDelayMs: 0 }
    const report = await service.run(shortConfig)

    expect(report.totalDurationMs).toBeLessThan(500)
    expect(report.results.length).toBeGreaterThanOrEqual(2)
  })

  it('should stop on 3 consecutive crashes', async () => {
    const adapter = makeMockAdapter()
    const evaluator = makeMockEvaluator([50])
    let firstCall = true
    vi.mocked(adapter.generateWithVariant).mockImplementation(async () => {
      if (firstCall) { firstCall = false; return { variants: [makeVariant()], estimatedTokenUsage: 1100 } }
      throw new Error('API error')
    })

    service = new PromptLabService(adapter, evaluator, makeMockMutator())
    const report = await service.run({ ...config, maxDurationMs: 60_000 })

    const crashes = report.results.filter((r) => r.status === 'crash')
    expect(crashes.length).toBe(3)
  })

  it('should discard variants below baseline * 0.8', async () => {
    const evaluator = makeMockEvaluator([50, 35, 60])
    service = new PromptLabService(makeMockAdapter(), evaluator, makeMockMutator())

    const report = await service.run({ ...config, maxDurationMs: 200 })

    const discarded = report.results.find((r) => r.score === 35)
    expect(discarded?.status).toBe('discard')
  })
})
