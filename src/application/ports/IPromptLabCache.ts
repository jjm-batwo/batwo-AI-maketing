// src/application/ports/IPromptLabCache.ts
import type { PromptVariant } from '@domain/value-objects/PromptLabTypes'
import type { Industry } from '@domain/value-objects/Industry'

export interface IPromptLabCache {
  get(industry: Industry): PromptVariant | undefined
  set(industry: Industry, variant: PromptVariant): void
  clear(): void
  has(industry: Industry): boolean
}
