// src/application/ports/IPromptLabEvaluator.ts
import type { AdCopyVariant } from '@domain/value-objects/AdCopyTypes'

export interface EvaluationInput {
  variants: AdCopyVariant[]
  keywords: string[]
  bestVariantCopy: AdCopyVariant[] | null
}

export interface EvaluationResult {
  ruleScore: number
  llmScore: number
  totalScore: number
  tokenUsage: number
}

export interface IPromptLabEvaluator {
  evaluate(input: EvaluationInput): Promise<EvaluationResult>
  evaluateWithConfirmation(
    input: EvaluationInput & { initialLLMScore: number },
  ): Promise<EvaluationResult>
}
