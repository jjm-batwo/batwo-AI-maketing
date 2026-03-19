// src/application/ports/IPromptLabRuleScorer.ts
import type { AdCopyVariant } from '@domain/value-objects/AdCopyTypes'

export interface RuleScorerInput {
  variants: AdCopyVariant[]
  keywords: string[]
  bestVariantCopy: AdCopyVariant[] | null
}

export interface IPromptLabRuleScorer {
  score(input: RuleScorerInput): number
}
