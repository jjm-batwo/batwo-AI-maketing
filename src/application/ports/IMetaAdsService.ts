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
    datePreset?: 'today' | 'yesterday' | 'last_7d' | 'last_30d' | 'last_90d'
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
}
