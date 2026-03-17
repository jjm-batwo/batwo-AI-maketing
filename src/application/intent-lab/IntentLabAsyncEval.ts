/**
 * Async evaluation for IntentClassifier with LLM fallback.
 *
 * IMPORTANT: This file is intentionally separate from IntentLabEvalSet.ts
 * to prevent accidental use in the sync mutation loop (IntentLabRunner/Mutator).
 * The mutation loop must remain sync and $0 — never import from this file there.
 */
import { ChatIntent } from '@domain/value-objects/ChatIntent'
import { IntentClassifier } from '@domain/services/IntentClassifier'
import type { EvalCase, Difficulty, EvalResult } from './IntentLabEvalSet'

export interface AsyncEvalResult extends EvalResult {
  llmCallCount: number
  llmCallRatio: number
}

/**
 * Evaluate IntentClassifier using classifyAsync() — includes LLM fallback.
 * Use only for measuring LLM-enhanced accuracy, NOT in the mutation loop.
 */
export async function evaluateAsync(
  classifier: IntentClassifier,
  cases: readonly EvalCase[],
): Promise<AsyncEvalResult> {
  const failures: EvalResult['failures'] = []
  let correct = 0
  let llmCallCount = 0

  const byDifficultyAccum: Record<Difficulty, { correct: number; total: number }> = {
    easy: { correct: 0, total: 0 },
    medium: { correct: 0, total: 0 },
    hard: { correct: 0, total: 0 },
  }

  for (const evalCase of cases) {
    const syncResult = classifier.classify(evalCase.input)
    const result = await classifier.classifyAsync(evalCase.input)
    const got = result.intent

    // Track if LLM was actually called (different result from sync)
    if (result.method === 'LLM' && syncResult.confidence <= classifier.getConfig().llmFallbackThreshold) {
      llmCallCount++
    }

    byDifficultyAccum[evalCase.difficulty].total++

    if (got === evalCase.expected) {
      correct++
      byDifficultyAccum[evalCase.difficulty].correct++
    } else {
      failures.push({
        input: evalCase.input,
        expected: evalCase.expected,
        got: got as ChatIntent,
      })
    }
  }

  const total = cases.length

  const byDifficulty: EvalResult['byDifficulty'] = {
    easy: {
      ...byDifficultyAccum.easy,
      accuracy: byDifficultyAccum.easy.total > 0
        ? byDifficultyAccum.easy.correct / byDifficultyAccum.easy.total
        : 0,
    },
    medium: {
      ...byDifficultyAccum.medium,
      accuracy: byDifficultyAccum.medium.total > 0
        ? byDifficultyAccum.medium.correct / byDifficultyAccum.medium.total
        : 0,
    },
    hard: {
      ...byDifficultyAccum.hard,
      accuracy: byDifficultyAccum.hard.total > 0
        ? byDifficultyAccum.hard.correct / byDifficultyAccum.hard.total
        : 0,
    },
  }

  return {
    accuracy: total > 0 ? correct / total : 0,
    correct,
    total,
    failures,
    byDifficulty,
    llmCallCount,
    llmCallRatio: total > 0 ? llmCallCount / total : 0,
  }
}
