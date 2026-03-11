import { z } from 'zod'
import { MetaPagingSchema } from './meta-campaign.schema'

/**
 * Meta Graph API v25.0 - Campaign Insights 응답 스키마
 *
 * 참고: https://developers.facebook.com/docs/marketing-api/reference/ad-campaign-group/insights
 *
 * Insights API는 캠페인의 성과 데이터를 반환합니다.
 * actions/action_values는 이벤트 기반으로 다양한 타입이 존재합니다.
 */

// ─── Action 항목 ──────────────────────────────────────────────────────────
export const MetaActionSchema = z.object({
  action_type: z.string().describe('Action type (e.g., link_click, purchase)'),
  value: z.string().describe('Action count as string'),
})

export const MetaActionValueSchema = z.object({
  action_type: z.string().describe('Action type for value'),
  value: z.string().describe('Action monetary value as string'),
})

// ─── 단일 Insights 데이터 항목 ───────────────────────────────────────────
export const MetaInsightsDataItemSchema = z.object({
  campaign_id: z.string().describe('Campaign ID'),
  impressions: z.string().optional().describe('Number of impressions (string)'),
  reach: z.string().optional().describe('Number of unique users reached (string)'),
  clicks: z.string().optional().describe('Total clicks (string)'),
  spend: z.string().optional().describe('Total spend (string)'),
  actions: z.array(MetaActionSchema).optional().describe('Action breakdown'),
  action_values: z.array(MetaActionValueSchema).optional().describe('Action value breakdown'),
  date_start: z.string().describe('Period start date'),
  date_stop: z.string().describe('Period end date'),
  // 일별 분해 시 추가될 수 있는 필드
  cpc: z.string().optional().describe('Cost per click'),
  cpm: z.string().optional().describe('Cost per mille'),
  ctr: z.string().optional().describe('Click-through rate'),
  frequency: z.string().optional().describe('Average frequency'),
})

export type MetaInsightsDataItem = z.infer<typeof MetaInsightsDataItemSchema>

// ─── Insights API 전체 응답 ──────────────────────────────────────────────
export const MetaInsightsResponseSchema = z.object({
  data: z.array(MetaInsightsDataItemSchema),
  paging: MetaPagingSchema.optional(),
})

export type MetaInsightsResponse = z.infer<typeof MetaInsightsResponseSchema>
