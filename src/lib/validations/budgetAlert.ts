import { z } from 'zod'

/**
 * Budget alert POST body validation
 */
export const createBudgetAlertSchema = z.object({
  thresholdPercent: z.number().int().min(1, '임계값은 1 이상이어야 합니다').max(100, '임계값은 100 이하여야 합니다').default(80),
})

/**
 * Budget alert PATCH body validation
 */
export const updateBudgetAlertSchema = z.object({
  thresholdPercent: z.number().int().min(1, '임계값은 1 이상이어야 합니다').max(100, '임계값은 100 이하여야 합니다').optional(),
  isEnabled: z.boolean().optional(),
})

export type CreateBudgetAlertInput = z.infer<typeof createBudgetAlertSchema>
export type UpdateBudgetAlertInput = z.infer<typeof updateBudgetAlertSchema>
