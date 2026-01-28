import { z } from 'zod'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'

/**
 * Campaign GET query parameters validation
 */
export const campaignQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  status: z.nativeEnum(CampaignStatus).optional(),
})

/**
 * Campaign POST body validation
 */
export const createCampaignSchema = z.object({
  name: z.string().min(1, '캠페인 이름은 필수입니다').max(255),
  objective: z.nativeEnum(CampaignObjective),
  dailyBudget: z.number().positive('일일 예산은 0보다 커야 합니다'),
  currency: z.enum(['KRW', 'USD', 'EUR', 'JPY']).default('KRW'),
  startDate: z.string().datetime('유효한 날짜 형식이 아닙니다'),
  endDate: z.string().datetime().optional(),
  targetAudience: z.record(z.string(), z.unknown()).optional(),
  syncToMeta: z.boolean().optional(),
  accessToken: z.string().optional(),
  adAccountId: z.string().optional(),
})

/**
 * Campaign PATCH body validation (partial update)
 */
export const updateCampaignSchema = createCampaignSchema.partial().omit({ objective: true })

export type CampaignQueryParams = z.infer<typeof campaignQuerySchema>
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>
