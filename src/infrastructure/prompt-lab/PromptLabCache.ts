import type { PromptVariant } from '@domain/value-objects/PromptLabTypes'
import type { Industry } from '@domain/value-objects/Industry'

const cache = new Map<Industry, PromptVariant>()

export const PromptLabCache = {
  get(industry: Industry): PromptVariant | undefined {
    return cache.get(industry)
  },
  set(industry: Industry, variant: PromptVariant): void {
    cache.set(industry, variant)
  },
  clear(): void {
    cache.clear()
  },
  has(industry: Industry): boolean {
    return cache.has(industry)
  },
}
