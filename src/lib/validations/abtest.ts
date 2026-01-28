import { z } from 'zod'

/**
 * A/B test PATCH body validation
 */
export const updateABTestSchema = z.object({
  action: z.enum(['start', 'pause', 'complete']).optional(),
  variantMetrics: z.array(z.object({
    variantId: z.string(),
    impressions: z.number().int().nonnegative(),
    clicks: z.number().int().nonnegative(),
    conversions: z.number().int().nonnegative(),
  })).optional(),
})

export type UpdateABTestInput = z.infer<typeof updateABTestSchema>
