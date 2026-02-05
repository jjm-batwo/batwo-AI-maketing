import {
  IMetaAdsService,
  MetaCampaignData,
  MetaInsightsData,
  MetaDailyInsightsData,
  CreateMetaCampaignInput,
  UpdateMetaCampaignInput,
  ListCampaignsResponse,
  MetaCampaignListItem,
} from '@application/ports/IMetaAdsService'
import { MetaAdsApiError } from '../errors'
import { withRetry } from '@lib/utils/retry'
import { fetchWithTimeout } from '@lib/utils/timeout'
import { MetaApiLogRepository, MetaApiLogEntry } from './MetaApiLogRepository'
import { withSpan } from '@infrastructure/telemetry'

const META_API_VERSION = 'v18.0'
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`
const META_API_TIMEOUT_MS = 30000 // 30 seconds for Meta API calls

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

interface MetaApiCampaignListResponse {
  data: {
    id: string
    name: string
    status: string
    effective_status?: string
    objective: string
    daily_budget?: string
    lifetime_budget?: string
    start_time?: string
    stop_time?: string
    created_time: string
    updated_time: string
  }[]
  paging?: {
    cursors?: {
      before?: string
      after?: string
    }
    next?: string
  }
}

export class MetaAdsClient implements IMetaAdsService {
  private logger?: MetaApiLogRepository
  private accountId?: string

  /**
   * 로거 설정 (옵션)
   * @param logger MetaApiLogRepository 인스턴스
   * @param accountId 로깅에 사용할 계정 ID (batowcompany)
   */
  setLogger(logger: MetaApiLogRepository, accountId?: string): void {
    this.logger = logger
    this.accountId = accountId
  }

  private async logApiCall(entry: Omit<MetaApiLogEntry, 'accountId'>): Promise<void> {
    if (!this.logger) return
    try {
      await this.logger.log({
        ...entry,
        accountId: this.accountId,
      })
    } catch {
      // 로깅 실패는 무시 (API 호출에 영향 주지 않음)
    }
  }

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

    const startTime = Date.now()
    let statusCode = 0
    let success = false
    let errorCode: string | undefined
    let errorMsg: string | undefined

    try {
      const response = await fetchWithTimeout(url, { ...options, headers }, META_API_TIMEOUT_MS)
      statusCode = response.status
      const data = await response.json()

      if (!response.ok || (data as MetaApiError).error) {
        const error = (data as MetaApiError).error
        errorCode = error?.code?.toString()
        errorMsg = error?.message
        throw new MetaAdsApiError(
          error?.message || 'Unknown Meta API error',
          error?.code,
          error?.error_subcode,
          response.status
        )
      }

      success = true
      return data as T
    } finally {
      const latencyMs = Date.now() - startTime
      const endpointPath = endpoint.split('?')[0].replace(/^\//, '')

      await this.logApiCall({
        endpoint: endpointPath,
        method: (options.method || 'GET').toUpperCase(),
        statusCode: statusCode || 0,
        success,
        errorCode,
        errorMsg,
        latencyMs,
      })
    }
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
    return withSpan(
      'meta.createCampaign',
      async () => {
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
      },
      {
        'meta.adAccountId': adAccountId,
        'meta.campaign.name': input.name,
        'meta.campaign.objective': input.objective,
      }
    )
  }

  async getCampaign(
    accessToken: string,
    campaignId: string
  ): Promise<MetaCampaignData | null> {
    return withSpan(
      'meta.getCampaign',
      async () => {
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
      },
      {
        'meta.campaignId': campaignId,
      }
    )
  }

  async getCampaignInsights(
    accessToken: string,
    campaignId: string,
    datePreset: 'today' | 'yesterday' | 'last_7d' | 'last_30d' = 'last_7d'
  ): Promise<MetaInsightsData> {
    return withSpan(
      'meta.getCampaignInsights',
      async () => {
        const fields =
          'campaign_id,impressions,clicks,spend,actions,action_values,date_start,date_stop'

        const response = await this.requestWithRetry<MetaApiInsightsResponse>(
          accessToken,
          `/${campaignId}/insights?fields=${fields}&date_preset=${datePreset}`,
          { method: 'GET' }
        )

        return this.mapInsightsResponse(campaignId, response)
      },
      {
        'meta.campaignId': campaignId,
        'meta.datePreset': datePreset,
      }
    )
  }

  async getCampaignDailyInsights(
    accessToken: string,
    campaignId: string,
    datePreset: 'today' | 'yesterday' | 'last_7d' | 'last_30d' = 'last_7d'
  ): Promise<MetaDailyInsightsData[]> {
    return withSpan(
      'meta.getCampaignDailyInsights',
      async () => {
        const fields =
          'campaign_id,impressions,clicks,spend,actions,action_values,date_start,date_stop'

        // time_increment=1 returns daily breakdown
        const response = await this.requestWithRetry<MetaApiInsightsResponse>(
          accessToken,
          `/${campaignId}/insights?fields=${fields}&date_preset=${datePreset}&time_increment=1`,
          { method: 'GET' }
        )

        return this.mapDailyInsightsResponse(campaignId, response)
      },
      {
        'meta.campaignId': campaignId,
        'meta.datePreset': datePreset,
      }
    )
  }

  private mapDailyInsightsResponse(
    campaignId: string,
    response: MetaApiInsightsResponse
  ): MetaDailyInsightsData[] {
    if (!response.data || response.data.length === 0) {
      return []
    }

    return response.data.map((item) => {
      const conversions =
        item.actions?.find(
          (a) => a.action_type === 'purchase' || a.action_type === 'omni_purchase'
        )?.value ?? '0'

      const revenue =
        item.action_values?.find(
          (a) => a.action_type === 'purchase' || a.action_type === 'omni_purchase'
        )?.value ?? '0'

      return {
        campaignId,
        date: item.date_start,
        impressions: parseInt(item.impressions ?? '0', 10),
        clicks: parseInt(item.clicks ?? '0', 10),
        spend: parseFloat(item.spend ?? '0'),
        conversions: parseInt(conversions, 10),
        revenue: parseFloat(revenue),
      }
    })
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

  async listCampaigns(
    accessToken: string,
    adAccountId: string,
    options?: { limit?: number; after?: string }
  ): Promise<ListCampaignsResponse> {
    return withSpan(
      'meta.listCampaigns',
      async () => {
        const limit = options?.limit || 50
        const params = new URLSearchParams({
          access_token: accessToken,
          fields:
            'id,name,status,effective_status,objective,daily_budget,lifetime_budget,start_time,stop_time,created_time,updated_time',
          limit: limit.toString(),
        })

        if (options?.after) {
          params.append('after', options.after)
        }

        // Include all campaign statuses (default API may filter some out)
        params.append('filtering', JSON.stringify([
          {
            field: 'effective_status',
            operator: 'IN',
            value: ['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED', 'IN_PROCESS', 'WITH_ISSUES', 'CAMPAIGN_PAUSED', 'ADSET_PAUSED', 'PENDING_REVIEW', 'DISAPPROVED', 'PENDING_BILLING_INFO']
          }
        ]))

        const endpoint = `/${adAccountId}/campaigns?${params.toString()}`

        const response = await this.requestWithRetry<MetaApiCampaignListResponse>(
          accessToken,
          endpoint,
          { method: 'GET' }
        )

        const campaigns: MetaCampaignListItem[] = response.data.map((campaign) => ({
          id: campaign.id,
          name: campaign.name,
          status: (campaign.effective_status || campaign.status) as MetaCampaignListItem['status'],
          objective: campaign.objective,
          dailyBudget: campaign.daily_budget ? parseInt(campaign.daily_budget, 10) : undefined,
          lifetimeBudget: campaign.lifetime_budget
            ? parseInt(campaign.lifetime_budget, 10)
            : undefined,
          startTime: campaign.start_time,
          endTime: campaign.stop_time,
          createdTime: campaign.created_time,
          updatedTime: campaign.updated_time,
        }))

        return {
          campaigns,
          paging: response.paging?.cursors?.after
            ? {
                after: response.paging.cursors.after,
                hasNext: !!response.paging.next,
              }
            : undefined,
        }
      },
      {
        'meta.adAccountId': adAccountId,
        'meta.limit': options?.limit ?? 50,
        'meta.after': options?.after ?? '',
      }
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
