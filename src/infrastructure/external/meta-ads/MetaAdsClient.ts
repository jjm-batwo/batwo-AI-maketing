import {
  IMetaAdsService,
  MetaCampaignData,
  MetaInsightsData,
  CreateMetaCampaignInput,
  UpdateMetaCampaignInput,
} from '@application/ports/IMetaAdsService'
import { MetaAdsApiError } from '../errors'
import { withRetry } from '@lib/utils/retry'

const META_API_VERSION = 'v18.0'
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`

interface MetaApiError {
  error: {
    message: string
    type?: string
    code?: number
    error_subcode?: number
  }
}

interface MetaApiCampaignResponse {
  id: string
  name: string
  status: string
  objective: string
  daily_budget?: string
  start_time?: string
  end_time?: string
}

interface MetaApiInsightsResponse {
  data: {
    campaign_id: string
    impressions?: string
    clicks?: string
    spend?: string
    actions?: { action_type: string; value: string }[]
    action_values?: { action_type: string; value: string }[]
    date_start: string
    date_stop: string
  }[]
}

export class MetaAdsClient implements IMetaAdsService {
  private async request<T>(
    accessToken: string,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${META_API_BASE}${endpoint}`
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    }

    const response = await fetch(url, { ...options, headers })
    const data = await response.json()

    if (!response.ok || (data as MetaApiError).error) {
      const error = (data as MetaApiError).error
      throw new MetaAdsApiError(
        error?.message || 'Unknown Meta API error',
        error?.code,
        error?.error_subcode,
        response.status
      )
    }

    return data as T
  }

  private async requestWithRetry<T>(
    accessToken: string,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    return withRetry(
      () => this.request<T>(accessToken, endpoint, options),
      {
        maxAttempts: 3,
        initialDelayMs: 100, // Reduced for tests
        shouldRetry: (error) => {
          if (error instanceof MetaAdsApiError) {
            return MetaAdsApiError.isTransientError(error)
          }
          return false
        },
      }
    )
  }

  async createCampaign(
    accessToken: string,
    adAccountId: string,
    input: CreateMetaCampaignInput
  ): Promise<MetaCampaignData> {
    const body = {
      name: input.name,
      objective: input.objective,
      status: 'PAUSED',
      special_ad_categories: [],
      daily_budget: input.dailyBudget,
      start_time: input.startTime.toISOString(),
      ...(input.endTime && { end_time: input.endTime.toISOString() }),
      ...(input.targeting && { targeting: this.formatTargeting(input.targeting) }),
    }

    const response = await this.requestWithRetry<MetaApiCampaignResponse>(
      accessToken,
      `/${adAccountId}/campaigns`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    )

    return this.mapCampaignResponse(response)
  }

  async getCampaign(
    accessToken: string,
    campaignId: string
  ): Promise<MetaCampaignData | null> {
    try {
      const fields = 'id,name,status,objective,daily_budget,start_time,end_time'
      const response = await this.requestWithRetry<MetaApiCampaignResponse>(
        accessToken,
        `/${campaignId}?fields=${fields}`,
        { method: 'GET' }
      )

      return this.mapCampaignResponse(response)
    } catch (error) {
      if (
        error instanceof MetaAdsApiError &&
        (error.statusCode === 404 || error.errorCode === 100)
      ) {
        return null
      }
      throw error
    }
  }

  async getCampaignInsights(
    accessToken: string,
    campaignId: string,
    datePreset: 'today' | 'yesterday' | 'last_7d' | 'last_30d' = 'last_7d'
  ): Promise<MetaInsightsData> {
    const fields =
      'campaign_id,impressions,clicks,spend,actions,action_values,date_start,date_stop'

    const response = await this.requestWithRetry<MetaApiInsightsResponse>(
      accessToken,
      `/${campaignId}/insights?fields=${fields}&date_preset=${datePreset}`,
      { method: 'GET' }
    )

    return this.mapInsightsResponse(campaignId, response)
  }

  async updateCampaignStatus(
    accessToken: string,
    campaignId: string,
    status: 'ACTIVE' | 'PAUSED'
  ): Promise<MetaCampaignData> {
    const response = await this.requestWithRetry<MetaApiCampaignResponse>(
      accessToken,
      `/${campaignId}`,
      {
        method: 'POST',
        body: JSON.stringify({ status }),
      }
    )

    return this.mapCampaignResponse(response)
  }

  async updateCampaign(
    accessToken: string,
    campaignId: string,
    input: UpdateMetaCampaignInput
  ): Promise<MetaCampaignData> {
    const body: Record<string, unknown> = {}

    if (input.name !== undefined) body.name = input.name
    if (input.dailyBudget !== undefined) body.daily_budget = input.dailyBudget
    if (input.status !== undefined) body.status = input.status
    if (input.endTime !== undefined) {
      body.end_time = input.endTime ? input.endTime.toISOString() : null
    }

    const response = await this.requestWithRetry<MetaApiCampaignResponse>(
      accessToken,
      `/${campaignId}`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    )

    return this.mapCampaignResponse(response)
  }

  async deleteCampaign(accessToken: string, campaignId: string): Promise<void> {
    await this.requestWithRetry<{ success: boolean }>(
      accessToken,
      `/${campaignId}`,
      { method: 'DELETE' }
    )
  }

  private mapCampaignResponse(response: MetaApiCampaignResponse): MetaCampaignData {
    return {
      id: response.id,
      name: response.name,
      status: response.status as MetaCampaignData['status'],
      objective: response.objective,
      dailyBudget: parseInt(response.daily_budget || '0', 10),
      currency: 'KRW', // Default, should be fetched from account
      startTime: response.start_time || new Date().toISOString(),
      endTime: response.end_time,
    }
  }

  private mapInsightsResponse(
    campaignId: string,
    response: MetaApiInsightsResponse
  ): MetaInsightsData {
    const data = response.data[0]

    if (!data) {
      return {
        campaignId,
        impressions: 0,
        clicks: 0,
        spend: 0,
        conversions: 0,
        revenue: 0,
        dateStart: new Date().toISOString().split('T')[0],
        dateStop: new Date().toISOString().split('T')[0],
      }
    }

    const conversions =
      data.actions?.find((a) => a.action_type === 'purchase')?.value || '0'
    const revenue =
      data.action_values?.find((a) => a.action_type === 'purchase')?.value || '0'

    return {
      campaignId: data.campaign_id,
      impressions: parseInt(data.impressions || '0', 10),
      clicks: parseInt(data.clicks || '0', 10),
      spend: parseFloat(data.spend || '0'),
      conversions: parseInt(conversions, 10),
      revenue: parseFloat(revenue),
      dateStart: data.date_start,
      dateStop: data.date_stop,
    }
  }

  private formatTargeting(targeting: CreateMetaCampaignInput['targeting']) {
    if (!targeting) return undefined

    return {
      ...(targeting.ageMin && { age_min: targeting.ageMin }),
      ...(targeting.ageMax && { age_max: targeting.ageMax }),
      ...(targeting.genders && { genders: targeting.genders }),
      ...(targeting.geoLocations && {
        geo_locations: {
          ...(targeting.geoLocations.countries && {
            countries: targeting.geoLocations.countries,
          }),
          ...(targeting.geoLocations.regions && {
            regions: targeting.geoLocations.regions.map((r) => ({ key: r })),
          }),
          ...(targeting.geoLocations.cities && {
            cities: targeting.geoLocations.cities.map((c) => ({ key: c })),
          }),
        },
      }),
      ...(targeting.interests && {
        flexible_spec: [
          {
            interests: targeting.interests.map((i) => ({ name: i })),
          },
        ],
      }),
    }
  }
}
