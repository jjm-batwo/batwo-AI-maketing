// src/application/services/PromptLabService.ts
import type { AdCopyVariant } from '@application/ports/IAIService'
// TODO: create port interfaces in @application/ports/ for PromptLabEvaluator, PromptLabMutator, PromptLabAIAdapter
import type { PromptLabEvaluator } from '@infrastructure/prompt-lab/PromptLabEvaluator'
import type { PromptLabMutator } from '@infrastructure/prompt-lab/PromptLabMutator'
import type { PromptLabAIAdapter } from '@infrastructure/prompt-lab/PromptLabAIAdapter'
import {
  createDefaultVariant,
  type PromptLabConfig,
  type PromptLabResult,
  type PromptLabReport,
  type PromptVariant,
} from '@domain/value-objects/PromptLabTypes'

const BASELINE_FLOOR_RATIO = 0.8

export class PromptLabService {
  constructor(
    private readonly aiAdapter: PromptLabAIAdapter,
    private readonly evaluator: PromptLabEvaluator,
    private readonly mutator: PromptLabMutator,
  ) {}

  async run(config: PromptLabConfig): Promise<PromptLabReport> {
    const results: PromptLabResult[] = []
    let totalTokensUsed = 0
    let consecutiveCrashes = 0

    // 1. Baseline
    const baselineVariant = createDefaultVariant()
    const baselineResult = await this.runExperiment(baselineVariant, config, null)
    results.push(baselineResult)
    totalTokensUsed += baselineResult.tokenUsage

    let bestVariant = baselineVariant
    let bestScore = baselineResult.score
    let bestCopy = baselineResult.generatedCopy
    const baselineScore = baselineResult.score

    // 2. LOOP (시간 소진까지)
    const startTime = Date.now()
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

    while (true) {
      const elapsed = Date.now() - startTime
      if (elapsed >= config.maxDurationMs) break
      if (consecutiveCrashes >= config.maxConsecutiveCrashes) break

      const mutated = this.mutator.mutate(bestVariant)
      const result = await this.runExperiment(mutated, config, bestCopy)
      totalTokensUsed += result.tokenUsage

      if (result.status === 'crash') {
        consecutiveCrashes++
        results.push(result)
        continue
      }

      consecutiveCrashes = 0

      // 품질 하한선
      if (result.score < baselineScore * BASELINE_FLOOR_RATIO) {
        result.status = 'discard'
        results.push(result)
        continue
      }

      // keep/discard 결정
      if (result.score > bestScore) {
        const confirmed = await this.evaluator.evaluateWithConfirmation({
          variants: result.generatedCopy,
          keywords: config.sampleInput.keywords ?? [],
          bestVariantCopy: bestCopy,
          initialLLMScore: result.llmScore,
        })
        totalTokensUsed += confirmed.tokenUsage

        if (confirmed.totalScore > bestScore) {
          result.status = 'keep'
          result.score = confirmed.totalScore
          result.ruleScore = confirmed.ruleScore
          result.llmScore = confirmed.llmScore
          bestVariant = mutated
          bestScore = confirmed.totalScore
          bestCopy = result.generatedCopy
        } else {
          result.status = 'discard'
        }
      } else {
        result.status = 'discard'
      }

      results.push(result)

      if (config.iterationDelayMs > 0) {
        await delay(config.iterationDelayMs)
      }
    }

    return {
      bestVariant,
      bestScore,
      baselineScore,
      results,
      totalTokensUsed,
      totalDurationMs: Date.now() - startTime,
      totalIterations: results.length - 1,
      improvementFromBaseline:
        baselineScore > 0
          ? ((bestScore - baselineScore) / baselineScore) * 100
          : 0,
    }
  }

  private async runExperiment(
    variant: PromptVariant,
    config: PromptLabConfig,
    bestCopy: AdCopyVariant[] | null,
  ): Promise<PromptLabResult> {
    try {
      const { variants: copy, estimatedTokenUsage: genTokens } =
        await this.aiAdapter.generateWithVariant(config.sampleInput, variant)

      const evalResult = await this.evaluator.evaluate({
        variants: copy,
        keywords: config.sampleInput.keywords ?? [],
        bestVariantCopy: bestCopy,
      })

      return {
        id: `result-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        variantId: variant.id,
        industry: config.industry,
        score: evalResult.totalScore,
        ruleScore: evalResult.ruleScore,
        llmScore: evalResult.llmScore,
        status: 'keep',
        description: variant.description,
        generatedCopy: copy,
        tokenUsage: genTokens + evalResult.tokenUsage,
        createdAt: new Date(),
      }
    } catch {
      return {
        id: `result-${Date.now()}-crash`,
        variantId: variant.id,
        industry: config.industry,
        score: 0,
        ruleScore: 0,
        llmScore: 0,
        status: 'crash',
        description: variant.description,
        generatedCopy: [],
        tokenUsage: 0,
        createdAt: new Date(),
      }
    }
  }
}
