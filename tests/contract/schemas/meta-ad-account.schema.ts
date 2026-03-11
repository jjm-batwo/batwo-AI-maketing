import { z } from 'zod'
import { MetaPagingSchema } from './meta-campaign.schema'

/**
 * Meta Graph API v25.0 - Ad Account 응답 스키마
 *
 * 참고: https://developers.facebook.com/docs/marketing-api/reference/ad-account
 */

// ─── Ad Account 응답 ────────────────────────────────────────────────────
export const MetaAdAccountResponseSchema = z.object({
  id: z.string().describe('Ad Account ID (act_XXXXX)'),
  account_id: z.string().describe('Numeric account ID'),
  name: z.string().describe('Account name'),
  account_status: z.number().describe('Account status (1=ACTIVE, 2=DISABLED, etc.)'),
  currency: z.string().describe('Account currency (e.g., KRW, USD)'),
  timezone_name: z.string().optional().describe('Timezone name'),
  timezone_offset_hours_utc: z.number().optional().describe('UTC offset hours'),
  business_name: z.string().optional().describe('Business name'),
  amount_spent: z.string().optional().describe('Total amount spent (string)'),
  balance: z.string().optional().describe('Account balance (string)'),
  spend_cap: z.string().optional().describe('Spend cap (string)'),
})

export type MetaAdAccountResponse = z.infer<typeof MetaAdAccountResponseSchema>

// ─── Ad Account 목록 응답 ──────────────────────────────────────────────
export const MetaAdAccountListResponseSchema = z.object({
  data: z.array(MetaAdAccountResponseSchema),
  paging: MetaPagingSchema.optional(),
})

export type MetaAdAccountListResponse = z.infer<typeof MetaAdAccountListResponseSchema>

// ─── Meta API 에러 응답 ────────────────────────────────────────────────
export const MetaApiErrorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
    type: z.string().optional(),
    code: z.number().optional(),
    error_subcode: z.number().optional(),
    fbtrace_id: z.string().optional(),
  }),
})

export type MetaApiErrorResponse = z.infer<typeof MetaApiErrorResponseSchema>
