export interface MetaCampaignData {
  id: string
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  objective: string
  dailyBudget: number
  currency: string
  startTime: string
  endTime?: string
}

export interface MetaInsightsData {
  campaignId: string
  impressions: number
  reach: number
  clicks: number
  linkClicks: number
  spend: number
  conversions: number
  revenue: number
  dateStart: string
  dateStop: string
}

export interface MetaDailyInsightsData {
  campaignId: string
  date: string
  impressions: number
  reach: number
  clicks: number
  linkClicks: number
  spend: number
  conversions: number
  revenue: number
}

export interface CreateMetaCampaignInput {
  name: string
  objective: string
  dailyBudget: number
  currency: string
  startTime: Date
  endTime?: Date
  targeting?: {
    ageMin?: number
    ageMax?: number
    genders?: number[]
    geoLocations?: {
      countries?: string[]
      regions?: string[]
      cities?: string[]
    }
    interests?: string[]
  }
}

export interface UpdateMetaCampaignInput {
  name?: string
  dailyBudget?: number
  status?: 'ACTIVE' | 'PAUSED'
  endTime?: Date | null
}

export interface MetaCampaignListItem {
  id: string
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  objective: string
  dailyBudget?: number
  lifetimeBudget?: number
  startTime?: string
  endTime?: string
  createdTime: string
  updatedTime: string
}

export interface ListCampaignsResponse {
  campaigns: MetaCampaignListItem[]
  paging?: {
    after?: string
    hasNext: boolean
  }
}

// --- AdSet 관련 ---
export interface CreateMetaAdSetInput {
  campaignId: string
  name: string
  dailyBudget?: number
  lifetimeBudget?: number
  billingEvent: string
  optimizationGoal: string
  bidStrategy?: string
  targeting?: Record<string, unknown>
  status?: string
  startTime: Date
  endTime?: Date
}

export interface MetaAdSetData {
  id: string
  name: string
  status: string
  dailyBudget?: number
  lifetimeBudget?: number
  billingEvent: string
  optimizationGoal: string
}

export interface UpdateMetaAdSetInput {
  name?: string
  dailyBudget?: number
  lifetimeBudget?: number
  status?: string
  targeting?: Record<string, unknown>
  endTime?: Date | null
}

// --- Ad 관련 ---
export interface CreateMetaAdInput {
  adSetId: string
  name: string
  creativeId: string
  status?: string
}

export interface MetaAdData {
  id: string
  name: string
  status: string
}

export interface MetaAdDetailData {
  id: string
  name: string
  status: string
  creative: {
    id: string
    name: string
    pageId: string
    instagramActorId?: string
    linkUrl?: string
    message?: string
    callToAction?: string
    imageUrl?: string
    videoUrl?: string
    thumbnailUrl?: string
  }
}

export interface UpdateMetaAdInput {
  name?: string
  status?: string
  creative?: {
    name?: string
    message?: string
    linkUrl?: string
    callToAction?: string
  }
}

export interface MetaPageData {
  id: string
  name: string
  picture?: string
}

export interface MetaInstagramAccountData {
  id: string
  username: string
}

// --- Creative 관련 ---
export interface CreateMetaCreativeInput {
  name: string
  pageId: string
  message?: string
  link?: string
  imageHash?: string
  videoId?: string
  callToAction?: string
}

export interface MetaCreativeData {
  id: string
  name: string
}

export interface IMetaAdsService {
  createCampaign(
    accessToken: string,
    adAccountId: string,
    input: CreateMetaCampaignInput
  ): Promise<MetaCampaignData>

  getCampaign(accessToken: string, campaignId: string): Promise<MetaCampaignData | null>

  getCampaignInsights(
    accessToken: string,
    campaignId: string,
    datePreset?: 'today' | 'yesterday' | 'last_3d' | 'last_7d' | 'last_30d' | 'last_90d'
  ): Promise<MetaInsightsData>

  getCampaignDailyInsights(
    accessToken: string,
    campaignId: string,
    datePreset?: 'today' | 'yesterday' | 'last_3d' | 'last_7d' | 'last_30d' | 'last_90d',
    options?: { since?: string; until?: string }
  ): Promise<MetaDailyInsightsData[]>

  updateCampaignStatus(
    accessToken: string,
    campaignId: string,
    status: 'ACTIVE' | 'PAUSED'
  ): Promise<MetaCampaignData>

  updateCampaign(
    accessToken: string,
    campaignId: string,
    input: UpdateMetaCampaignInput
  ): Promise<MetaCampaignData>

  deleteCampaign(accessToken: string, campaignId: string): Promise<void>

  listCampaigns(
    accessToken: string,
    adAccountId: string,
    options?: { limit?: number; after?: string }
  ): Promise<ListCampaignsResponse>

  // AdSet CRUD
  createAdSet(
    accessToken: string,
    adAccountId: string,
    input: CreateMetaAdSetInput
  ): Promise<MetaAdSetData>

  updateAdSet(accessToken: string, adSetId: string, input: UpdateMetaAdSetInput): Promise<void>

  deleteAdSet(accessToken: string, adSetId: string): Promise<void>

  listAdSets(accessToken: string, campaignId: string): Promise<MetaAdSetData[]>

  // AdSet Insights
  getAdSetInsights(
    accessToken: string,
    adSetId: string,
    datePreset?: 'today' | 'yesterday' | 'last_3d' | 'last_7d' | 'last_30d' | 'last_90d'
  ): Promise<MetaInsightsData>

  getAdSetDailyInsights(
    accessToken: string,
    adSetId: string,
    datePreset?: 'today' | 'yesterday' | 'last_3d' | 'last_7d' | 'last_30d' | 'last_90d',
    options?: { since?: string; until?: string }
  ): Promise<MetaDailyInsightsData[]>

  // Ad listing by adSet
  listAds(accessToken: string, adSetId: string): Promise<MetaAdData[]>

  // Ad Insights
  getAdInsights(
    accessToken: string,
    adId: string,
    datePreset?: 'today' | 'yesterday' | 'last_3d' | 'last_7d' | 'last_30d' | 'last_90d'
  ): Promise<MetaInsightsData>

  getAdDailyInsights(
    accessToken: string,
    adId: string,
    datePreset?: 'today' | 'yesterday' | 'last_3d' | 'last_7d' | 'last_30d' | 'last_90d',
    options?: { since?: string; until?: string }
  ): Promise<MetaDailyInsightsData[]>

  // Ad
  createAd(accessToken: string, adAccountId: string, input: CreateMetaAdInput): Promise<MetaAdData>

  getAdDetail(accessToken: string, adId: string): Promise<MetaAdDetailData>

  updateAd(accessToken: string, adId: string, input: UpdateMetaAdInput): Promise<void>

  // Creative
  createAdCreative(
    accessToken: string,
    adAccountId: string,
    input: CreateMetaCreativeInput
  ): Promise<MetaCreativeData>

  // Pages & Instagram
  listPages(accessToken: string): Promise<MetaPageData[]>

  listInstagramAccounts(accessToken: string, pageId: string): Promise<MetaInstagramAccountData[]>

  // Asset 업로드
  uploadImage(
    accessToken: string,
    adAccountId: string,
    imageData: Buffer
  ): Promise<{ imageHash: string }>

  uploadVideo(
    accessToken: string,
    adAccountId: string,
    videoData: Buffer,
    name: string
  ): Promise<{ videoId: string }>

  // --- Account-Level Bulk Methods ---

  /**
   * 계정 레벨 인사이트 집계 (level별로 campaign/adset/ad 인사이트를 한 번에 조회)
   * GET /act_{id}/insights?level={level}&date_preset={preset}
   */
  getAccountInsights(
    accessToken: string,
    adAccountId: string,
    options: {
      level: 'campaign' | 'adset' | 'ad'
      datePreset: string
      campaignIds?: string[]
    }
  ): Promise<Map<string, MetaInsightsData>>

  /**
   * 계정 레벨 전체 광고세트 조회 (campaignIds 필터링 가능)
   * GET /act_{id}/adsets?fields=...&filtering=[{campaign.id IN [...]}]
   */
  listAllAdSets(
    accessToken: string,
    adAccountId: string,
    options?: { campaignIds?: string[] }
  ): Promise<MetaAdSetData[]>

  /**
   * 계정 레벨 전체 광고 조회 (adSetIds 필터링 가능)
   * GET /act_{id}/ads?fields=...&filtering=[{adset.id IN [...]}]
   */
  listAllAds(
    accessToken: string,
    adAccountId: string,
    options?: { adSetIds?: string[] }
  ): Promise<MetaAdData[]>
}
