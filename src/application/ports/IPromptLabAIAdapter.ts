// src/application/ports/IPromptLabAIAdapter.ts
import type { AdCopyVariant } from '@domain/value-objects/AdCopyTypes'
import type { PromptVariant, PromptLabSampleInput } from '@domain/value-objects/PromptLabTypes'

export interface GenerateWithVariantResult {
  variants: AdCopyVariant[]
  estimatedTokenUsage: number
}

export interface IPromptLabAIAdapter {
  generateWithVariant(
    input: PromptLabSampleInput,
    variant: PromptVariant,
  ): Promise<GenerateWithVariantResult>
}
