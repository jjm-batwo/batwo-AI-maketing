import { z } from 'zod'

/**
 * Meta Graph API v25.0 - Campaign 응답 스키마
 *
 * 참고: https://developers.facebook.com/docs/marketing-api/reference/ad-campaign-group
 *
 * 이 스키마는 Meta API가 반환하는 실제 JSON 구조를 정의합니다.
 * API 버전 업그레이드 시 스키마 변경을 자동 감지하기 위해 사용됩니다.
 */

// ─── 단일 캠페인 응답 ──────────────────────────────────────────────────────
export const MetaCampaignResponseSchema = z.object({
  id: z.string().describe('Campaign ID'),
  name: z.string().describe('Campaign name'),
  status: z.enum([
    'ACTIVE',
    'PAUSED',
    'DELETED',
    'ARCHIVED',
  ]).describe('Campaign status'),
  objective: z.string().describe('Campaign objective'),
  daily_budget: z.string().optional().describe('Daily budget in cents (string)'),
  lifetime_budget: z.string().optional().describe('Lifetime budget in cents (string)'),
  start_time: z.string().optional().describe('Start time ISO-8601'),
  end_time: z.string().optional().describe('End time ISO-8601'),
  created_time: z.string().optional().describe('Created time ISO-8601'),
  updated_time: z.string().optional().describe('Updated time ISO-8601'),
  effective_status: z.string().optional().describe('Effective status including parent level'),
})

export type MetaCampaignResponse = z.infer<typeof MetaCampaignResponseSchema>

// ─── 캠페인 목록 응답 ──────────────────────────────────────────────────────
export const MetaPagingCursorsSchema = z.object({
  before: z.string().optional(),
  after: z.string().optional(),
})

export const MetaPagingSchema = z.object({
  cursors: MetaPagingCursorsSchema.optional(),
  next: z.string().optional(),
  previous: z.string().optional(),
})

export const MetaCampaignListResponseSchema = z.object({
  data: z.array(MetaCampaignResponseSchema),
  paging: MetaPagingSchema.optional(),
})

export type MetaCampaignListResponse = z.infer<typeof MetaCampaignListResponseSchema>

// ─── 캠페인 생성 응답 ──────────────────────────────────────────────────────
export const MetaCampaignCreateResponseSchema = z.object({
  id: z.string().describe('Newly created campaign ID'),
})

export type MetaCampaignCreateResponse = z.infer<typeof MetaCampaignCreateResponseSchema>

// ─── 캠페인 삭제 응답 ──────────────────────────────────────────────────────
export const MetaCampaignDeleteResponseSchema = z.object({
  success: z.boolean(),
})

export type MetaCampaignDeleteResponse = z.infer<typeof MetaCampaignDeleteResponseSchema>
