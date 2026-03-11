/**
 * Meta Graph API Contract Test Schemas
 *
 * 모든 Meta API 응답 스키마의 공개 진입점입니다.
 */

// Campaign
export {
  MetaCampaignResponseSchema,
  MetaCampaignListResponseSchema,
  MetaCampaignCreateResponseSchema,
  MetaCampaignDeleteResponseSchema,
  MetaPagingCursorsSchema,
  MetaPagingSchema,
  type MetaCampaignResponse,
  type MetaCampaignListResponse,
  type MetaCampaignCreateResponse,
  type MetaCampaignDeleteResponse,
} from './meta-campaign.schema'

// Insights
export {
  MetaActionSchema,
  MetaActionValueSchema,
  MetaInsightsDataItemSchema,
  MetaInsightsResponseSchema,
  type MetaInsightsDataItem,
  type MetaInsightsResponse,
} from './meta-insights.schema'

// Ad Account
export {
  MetaAdAccountResponseSchema,
  MetaAdAccountListResponseSchema,
  MetaApiErrorResponseSchema,
  type MetaAdAccountResponse,
  type MetaAdAccountListResponse,
  type MetaApiErrorResponse,
} from './meta-ad-account.schema'
