/**
 * OpenAPI-extended validation schemas
 *
 * This file re-exports validation schemas with OpenAPI extensions applied.
 */

import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z)

// Re-create the schemas here with OpenAPI support
// This ensures they have the .openapi() method available

export const campaignQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).openapi({ example: 1 }),
  pageSize: z.coerce.number().int().min(1).max(100).default(10).openapi({ example: 10 }),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'DELETED']).optional(),
})

export const createCampaignSchema = z.object({
  name: z.string().min(1, '캠페인 이름은 필수입니다').max(255).openapi({ example: 'Summer Sale Campaign' }),
  objective: z.enum(['AWARENESS', 'TRAFFIC', 'ENGAGEMENT', 'LEADS', 'CONVERSIONS', 'SALES']).openapi({ example: 'CONVERSIONS' }),
  dailyBudget: z.number().positive('일일 예산은 0보다 커야 합니다').openapi({ example: 50000 }),
  currency: z.enum(['KRW', 'USD', 'EUR', 'JPY']).default('KRW').openapi({ example: 'KRW' }),
  startDate: z.string().datetime('유효한 날짜 형식이 아닙니다').openapi({ example: '2026-01-25T00:00:00Z' }),
  endDate: z.string().datetime().optional().openapi({ example: '2026-02-25T23:59:59Z' }),
  targetAudience: z.record(z.string(), z.unknown()).optional(),
  syncToMeta: z.boolean().optional().openapi({ example: true }),
  accessToken: z.string().optional(),
  adAccountId: z.string().optional().openapi({ example: 'act_123456789' }),
})

export const updateCampaignSchema = createCampaignSchema.partial().omit({ objective: true })

export const reportQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).openapi({ example: 1 }),
  pageSize: z.coerce.number().int().min(1).max(100).default(10).openapi({ example: 10 }),
  type: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']).optional(),
})

export const createReportSchema = z.object({
  campaignIds: z
    .array(z.string().uuid('유효한 UUID 형식이 아닙니다'))
    .min(1, '최소 1개의 캠페인이 필요합니다')
    .openapi({ example: ['550e8400-e29b-41d4-a716-446655440000'] }),
  startDate: z.string().datetime('유효한 날짜 형식이 아닙니다').openapi({ example: '2026-01-18T00:00:00Z' }),
  endDate: z.string().datetime('유효한 날짜 형식이 아닙니다').openapi({ example: '2026-01-25T23:59:59Z' }),
})
