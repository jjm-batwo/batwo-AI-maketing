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
  spend: number
  conversions: number
  revenue: number
  dateStart: string
  dateStop: string
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
    datePreset?: 'today' | 'yesterday' | 'last_7d' | 'last_30d'
  ): Promise<MetaInsightsData>

  updateCampaignStatus(
    accessToken: string,
    campaignId: string,
    status: 'ACTIVE' | 'PAUSED'
  ): Promise<MetaCampaignData>

  deleteCampaign(accessToken: string, campaignId: string): Promise<void>
}
