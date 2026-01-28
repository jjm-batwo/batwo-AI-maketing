import { z } from 'zod'
import { ReportType } from '@domain/entities/Report'

/**
 * Report GET query parameters validation
 */
export const reportQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  type: z.nativeEnum(ReportType).optional(),
})

/**
 * Report POST body validation
 */
export const createReportSchema = z.object({
  campaignIds: z
    .array(z.string().uuid('유효한 UUID 형식이 아닙니다'))
    .min(1, '최소 1개의 캠페인이 필요합니다'),
  startDate: z.string().datetime('유효한 날짜 형식이 아닙니다'),
  endDate: z.string().datetime('유효한 날짜 형식이 아닙니다'),
})

export type ReportQueryParams = z.infer<typeof reportQuerySchema>
export type CreateReportInput = z.infer<typeof createReportSchema>
