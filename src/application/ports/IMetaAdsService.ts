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

  getCampaign(
    accessToken: string,
    campaignId: string
  ): Promise<MetaCampaignData | null>

  getCampaignInsights(
    accessToken: string,
    campaignId: string,
    datePreset?: 'today' | 'yesterday' | 'last_7d' | 'last_30d' | 'last_90d'
  ): Promise<MetaInsightsData>

  getCampaignDailyInsights(
    accessToken: string,
    campaignId: string,
    datePreset?: 'today' | 'yesterday' | 'last_7d' | 'last_30d' | 'last_90d',
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

  updateAdSet(
    accessToken: string,
    adSetId: string,
    input: UpdateMetaAdSetInput
  ): Promise<void>

  deleteAdSet(accessToken: string, adSetId: string): Promise<void>

  listAdSets(
    accessToken: string,
    campaignId: string
  ): Promise<MetaAdSetData[]>

  // Ad
  createAd(
    accessToken: string,
    adAccountId: string,
    input: CreateMetaAdInput
  ): Promise<MetaAdData>

  // Creative
  createAdCreative(
    accessToken: string,
    adAccountId: string,
    input: CreateMetaCreativeInput
  ): Promise<MetaCreativeData>

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
}
