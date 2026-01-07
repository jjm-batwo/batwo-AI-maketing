import {
  IMetaAdsService,
  MetaCampaignData,
  MetaInsightsData,
  CreateMetaCampaignInput,
  UpdateMetaCampaignInput,
} from '@application/ports/IMetaAdsService'

export class MockMetaAdsService implements IMetaAdsService {
  private campaigns: Map<string, MetaCampaignData> = new Map()
  private insights: Map<string, MetaInsightsData> = new Map()
  private shouldFail = false
  private failureError: Error | null = null

  async createCampaign(
    accessToken: string,
    adAccountId: string,
    input: CreateMetaCampaignInput
  ): Promise<MetaCampaignData> {
    if (this.shouldFail && this.failureError) {
      throw this.failureError
    }

    const campaign: MetaCampaignData = {
      id: `meta_${crypto.randomUUID()}`,
      name: input.name,
      status: 'PAUSED',
      objective: input.objective,
      dailyBudget: input.dailyBudget,
      currency: input.currency,
      startTime: input.startTime.toISOString(),
      endTime: input.endTime?.toISOString(),
    }

    this.campaigns.set(campaign.id, campaign)
    return campaign
  }

  async getCampaign(
    accessToken: string,
    campaignId: string
  ): Promise<MetaCampaignData | null> {
    if (this.shouldFail && this.failureError) {
      throw this.failureError
    }
    return this.campaigns.get(campaignId) || null
  }

  async getCampaignInsights(
    accessToken: string,
    campaignId: string,
    datePreset?: 'today' | 'yesterday' | 'last_7d' | 'last_30d'
  ): Promise<MetaInsightsData> {
    if (this.shouldFail && this.failureError) {
      throw this.failureError
    }

    const insights = this.insights.get(campaignId)
    if (insights) {
      return insights
    }

    return {
      campaignId,
      impressions: 0,
      clicks: 0,
      spend: 0,
      conversions: 0,
      revenue: 0,
      dateStart: new Date().toISOString(),
      dateStop: new Date().toISOString(),
    }
  }

  async updateCampaignStatus(
    accessToken: string,
    campaignId: string,
    status: 'ACTIVE' | 'PAUSED'
  ): Promise<MetaCampaignData> {
    if (this.shouldFail && this.failureError) {
      throw this.failureError
    }

    const campaign = this.campaigns.get(campaignId)
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`)
    }

    campaign.status = status
    return campaign
  }

  async updateCampaign(
    accessToken: string,
    campaignId: string,
    input: UpdateMetaCampaignInput
  ): Promise<MetaCampaignData> {
    if (this.shouldFail && this.failureError) {
      throw this.failureError
    }

    const campaign = this.campaigns.get(campaignId)
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`)
    }

    if (input.name !== undefined) campaign.name = input.name
    if (input.dailyBudget !== undefined) campaign.dailyBudget = input.dailyBudget
    if (input.status !== undefined) campaign.status = input.status
    if (input.endTime !== undefined) {
      campaign.endTime = input.endTime ? input.endTime.toISOString() : undefined
    }

    return campaign
  }

  async deleteCampaign(accessToken: string, campaignId: string): Promise<void> {
    if (this.shouldFail && this.failureError) {
      throw this.failureError
    }
    this.campaigns.delete(campaignId)
  }

  // Test helpers
  clear(): void {
    this.campaigns.clear()
    this.insights.clear()
    this.shouldFail = false
    this.failureError = null
  }

  setInsights(campaignId: string, insights: MetaInsightsData): void {
    this.insights.set(campaignId, insights)
  }

  setCampaign(campaign: MetaCampaignData): void {
    this.campaigns.set(campaign.id, campaign)
  }

  setShouldFail(shouldFail: boolean, error?: Error): void {
    this.shouldFail = shouldFail
    this.failureError = error || new Error('Mock service error')
  }
}
