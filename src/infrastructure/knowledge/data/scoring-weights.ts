import type { KnowledgeDomain } from '@/domain/value-objects/MarketingScience'
import { DEFAULT_DOMAIN_WEIGHTS } from '@/domain/value-objects/MarketingScience'

// Re-export domain weights (single source of truth is in MarketingScience.ts)
export { DEFAULT_DOMAIN_WEIGHTS }

// Objective-specific weight adjustments (partial overrides)
export const OBJECTIVE_WEIGHT_OVERRIDES: Record<string, Partial<Record<KnowledgeDomain, number>>> = {
  awareness: {
    neuromarketing: 0.25,
    crowd_psychology: 0.20,
    color_psychology: 0.15,
    marketing_psychology: 0.15,
    meta_best_practices: 0.15,
    copywriting_psychology: 0.10,
  },
  consideration: {
    marketing_psychology: 0.25,
    copywriting_psychology: 0.20,
    neuromarketing: 0.15,
    meta_best_practices: 0.20,
    crowd_psychology: 0.10,
    color_psychology: 0.10,
  },
  conversion: {
    meta_best_practices: 0.25,
    marketing_psychology: 0.25,
    copywriting_psychology: 0.20,
    neuromarketing: 0.15,
    crowd_psychology: 0.10,
    color_psychology: 0.05,
  },
}

// Get weights for a given objective, falling back to defaults
export function getWeightsForObjective(
  objective?: 'awareness' | 'consideration' | 'conversion'
): Record<KnowledgeDomain, number> {
  if (!objective || !OBJECTIVE_WEIGHT_OVERRIDES[objective]) {
    return { ...DEFAULT_DOMAIN_WEIGHTS }
  }
  return {
    ...DEFAULT_DOMAIN_WEIGHTS,
    ...OBJECTIVE_WEIGHT_OVERRIDES[objective],
  } as Record<KnowledgeDomain, number>
}
