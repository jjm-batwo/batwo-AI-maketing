// src/domain/value-objects/PromptLabTypes.ts
import type { KnowledgeDomain } from '@domain/value-objects/MarketingScience'
import { ALL_KNOWLEDGE_DOMAINS } from '@domain/value-objects/MarketingScience'
import type { Industry } from '@domain/value-objects/Industry'
import type { GenerateAdCopyInput, AdCopyVariant } from '@domain/value-objects/AdCopyTypes'

export interface PromptVariant {
  id: string
  scienceDomains: KnowledgeDomain[]
  temperature: number
  fewShotStrategy: 'industry' | 'hook' | 'topPerformer'
  systemRole: string
  instructionStyle: 'strict' | 'moderate' | 'loose'
  description: string
}

export type PromptLabSampleInput = GenerateAdCopyInput & { industry: Industry }

export interface PromptLabConfig {
  industry: Industry
  maxDurationMs: number
  maxConsecutiveCrashes: number
  iterationDelayMs: number
  sampleInput: PromptLabSampleInput
}

export interface PromptLabResult {
  id: string
  variantId: string
  industry: Industry
  score: number
  ruleScore: number
  llmScore: number
  status: 'keep' | 'discard' | 'crash'
  description: string
  generatedCopy: AdCopyVariant[]
  tokenUsage: number
  createdAt: Date
}

export interface PromptLabReport {
  bestVariant: PromptVariant
  bestScore: number
  baselineScore: number
  results: PromptLabResult[]
  totalTokensUsed: number
  totalDurationMs: number
  totalIterations: number
  improvementFromBaseline: number
}

export function createDefaultVariant(): PromptVariant {
  return {
    id: `variant-${crypto.randomUUID().slice(0, 8)}`,
    scienceDomains: [...ALL_KNOWLEDGE_DOMAINS],
    temperature: 0.8,
    fewShotStrategy: 'industry',
    systemRole: 'expert_marketer',
    instructionStyle: 'moderate',
    description: 'baseline',
  }
}

export function createPromptLabConfig(
  partial: Pick<PromptLabConfig, 'industry' | 'sampleInput'> &
    Partial<Omit<PromptLabConfig, 'industry' | 'sampleInput'>>,
): PromptLabConfig {
  return {
    maxDurationMs: 3_600_000,
    maxConsecutiveCrashes: 3,
    iterationDelayMs: 36_000,
    ...partial,
  }
}
