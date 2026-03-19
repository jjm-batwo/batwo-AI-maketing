// src/application/ports/IPromptLabLLMJudge.ts
import type { AdCopyVariant } from '@domain/value-objects/AdCopyTypes'

export interface LLMJudgeResult {
  score: number
  dimensions: {
    attention: number
    action: number
    relevance: number
    emotion: number
    clarity: number
  }
  tokenUsage: number
}

export interface IPromptLabLLMJudge {
  evaluate(variant: AdCopyVariant): Promise<LLMJudgeResult>
}
