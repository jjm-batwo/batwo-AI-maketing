import {
  IMetaAdsService,
  MetaCampaignData,
  MetaInsightsData,
  MetaDailyInsightsData,
  CreateMetaCampaignInput,
  UpdateMetaCampaignInput,
  ListCampaignsResponse,
  MetaCampaignListItem,
  CreateMetaAdSetInput,
  MetaAdSetData,
  UpdateMetaAdSetInput,
  CreateMetaAdInput,
  MetaAdData,
  MetaAdDetailData,
  UpdateMetaAdInput,
  MetaPageData,
  MetaInstagramAccountData,
  CreateMetaCreativeInput,
  MetaCreativeData,
} from '@application/ports/IMetaAdsService'
import { MetaAdsApiError } from '../errors'
import { withRetry } from '@lib/utils/retry'
import { fetchWithTimeout } from '@lib/utils/timeout'
import { MetaApiLogRepository, MetaApiLogEntry } from './MetaApiLogRepository'
import { withSpan } from '@infrastructure/telemetry'
import { META_GRAPH_BASE as META_API_BASE } from '../meta-constants'
const META_API_TIMEOUT_MS = 30000 // 30 seconds for Meta API calls

/**
 * 성능 모니터링 임계값 (ms)
 * 이 값을 초과하는 API 호출은 경고 로그를 출력합니다.
 */
const SLOW_API_THRESHOLD_MS = 3000

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
    reach?: string
    clicks?: string
    spend?: string
    actions?: { action_type: string; value: string }[]
    action_values?: { action_type: string; value: string }[]
    date_start: string
    date_stop: string
  }[]
  paging?: {
    cursors?: {
      before?: string
      after?: string
    }
    next?: string
  }
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
  private readonly mockMode = process.env.META_MOCK_MODE === 'true'

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
      const method = (options.method || 'GET').toUpperCase()

      // 구조화된 성능 로그 (Vercel 로그 집계용)
      const perfLog = {
        type: 'meta_api_call',
        endpoint: endpointPath,
        method,
        statusCode: statusCode || 0,
        latencyMs,
        success,
        ...(errorCode && { errorCode }),
        ...(errorMsg && { errorMsg: errorMsg.slice(0, 200) }),
        timestamp: new Date().toISOString(),
      }

      console.log(`[MetaAdsClient:PERF] ${JSON.stringify(perfLog)}`)

      // 느린 호출 경고 (>3초)
      if (latencyMs > SLOW_API_THRESHOLD_MS) {
        console.warn(
          `[MetaAdsClient:SLOW] ${method} ${endpointPath} took ${latencyMs}ms (threshold: ${SLOW_API_THRESHOLD_MS}ms)`,
          { latencyMs, statusCode, success }
        )
      }

      await this.logApiCall({
        endpoint: endpointPath,
        method,
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
    return withRetry(() => this.request<T>(accessToken, endpoint, options), {
      maxAttempts: 3,
      initialDelayMs: process.env.NODE_ENV === 'test' ? 100 : 1000,
      shouldRetry: (error) => {
        if (error instanceof MetaAdsApiError) {
          return MetaAdsApiError.isTransientError(error)
        }
        return false
      },
    })
  }

  async createCampaign(
    accessToken: string,
    adAccountId: string,
    input: CreateMetaCampaignInput
  ): Promise<MetaCampaignData> {
    if (this.mockMode) {
      console.log('[MetaAdsClient:MOCK] createCampaign called with mock mode')
      return {
        id: `mock_campaign_${Date.now()}`,
        name: input.name,
        status: 'PAUSED',
        objective: input.objective,
        dailyBudget: input.dailyBudget,
        currency: 'KRW',
        startTime: input.startTime.toISOString(),
        endTime: input.endTime?.toISOString(),
      }
    }

    return withSpan(
      'meta.createCampaign',
      async () => {
        const body = {
          name: input.name,
          objective: input.objective,
          status: 'PAUSED',
          special_ad_categories: [],
          daily_budget: String(input.dailyBudget),
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

  async getCampaign(accessToken: string, campaignId: string): Promise<MetaCampaignData | null> {
    if (this.mockMode) {
      console.log('[MetaAdsClient:MOCK] getCampaign called with mock mode')
      return {
        id: campaignId,
        name: 'Mock Campaign',
        status: 'PAUSED',
        objective: 'OUTCOME_SALES',
        dailyBudget: 50000,
        currency: 'KRW',
        startTime: new Date().toISOString(),
      }
    }

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
    datePreset: 'today' | 'yesterday' | 'last_3d' | 'last_7d' | 'last_30d' | 'last_90d' = 'last_7d'
  ): Promise<MetaInsightsData> {
    if (this.mockMode) {
      console.log('[MetaAdsClient:MOCK] getCampaignInsights called with mock mode')
      const today = new Date().toISOString().split('T')[0]
      return {
        campaignId,
        impressions: 15000,
        reach: 12000,
        clicks: 450,
        linkClicks: 380,
        spend: 125000,
        conversions: 12,
        revenue: 480000,
        dateStart: today,
        dateStop: today,
      }
    }

    return withSpan(
      'meta.getCampaignInsights',
      async () => {
        const fields =
          'campaign_id,impressions,reach,clicks,spend,actions,action_values,date_start,date_stop'

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
    datePreset: 'today' | 'yesterday' | 'last_3d' | 'last_7d' | 'last_30d' | 'last_90d' = 'last_7d',
    options?: { since?: string; until?: string }
  ): Promise<MetaDailyInsightsData[]> {
    if (this.mockMode) {
      console.log('[MetaAdsClient:MOCK] getCampaignDailyInsights called with mock mode')
      const parsedDays = parseInt(datePreset.match(/\d+/)?.[0] || '7', 10)
      const days =
        datePreset === 'today'
          ? 1
          : datePreset === 'yesterday'
            ? 1
            : Number.isNaN(parsedDays)
              ? 7
              : parsedDays
      const mockData: MetaDailyInsightsData[] = []

      for (let i = 0; i < days; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        mockData.push({
          campaignId,
          date: date.toISOString().split('T')[0],
          impressions: Math.floor(2000 + Math.random() * 500),
          reach: Math.floor(1600 + Math.random() * 400),
          clicks: Math.floor(60 + Math.random() * 20),
          linkClicks: Math.floor(50 + Math.random() * 15),
          spend: Math.floor(15000 + Math.random() * 5000),
          conversions: Math.floor(1 + Math.random() * 3),
          revenue: Math.floor(50000 + Math.random() * 30000),
        })
      }

      return mockData
    }

    return withSpan(
      'meta.getCampaignDailyInsights',
      async () => {
        const fields =
          'campaign_id,impressions,reach,clicks,spend,actions,action_values,date_start,date_stop'

        // time_increment=1 returns daily breakdown
        // since/until을 사용하면 date_preset보다 정확한 날짜 범위 조회 가능
        const dateParams =
          options?.since && options?.until
            ? `time_range=${encodeURIComponent(JSON.stringify({ since: options.since, until: options.until }))}`
            : `date_preset=${datePreset}`
        const response = await this.requestWithRetry<MetaApiInsightsResponse>(
          accessToken,
          `/${campaignId}/insights?fields=${fields}&${dateParams}&time_increment=1`,
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
        item.actions?.find((a) => a.action_type === 'purchase' || a.action_type === 'omni_purchase')
          ?.value ?? '0'

      const revenue =
        item.action_values?.find(
          (a) => a.action_type === 'purchase' || a.action_type === 'omni_purchase'
        )?.value ?? '0'

      const linkClicks = item.actions?.find((a) => a.action_type === 'link_click')?.value ?? '0'

      return {
        campaignId,
        date: item.date_start,
        impressions: parseInt(item.impressions ?? '0', 10),
        reach: parseInt(item.reach ?? '0', 10),
        clicks: parseInt(item.clicks ?? '0', 10),
        linkClicks: parseInt(linkClicks, 10),
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
    if (this.mockMode) {
      console.log('[MetaAdsClient:MOCK] updateCampaignStatus called with mock mode')
      return {
        id: campaignId,
        name: 'Mock Campaign',
        status,
        objective: 'OUTCOME_SALES',
        dailyBudget: 50000,
        currency: 'KRW',
        startTime: new Date().toISOString(),
      }
    }

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
    if (this.mockMode) {
      console.log('[MetaAdsClient:MOCK] updateCampaign called with mock mode')
      return {
        id: campaignId,
        name: input.name || 'Mock Campaign',
        status: input.status || 'PAUSED',
        objective: 'OUTCOME_SALES',
        dailyBudget: input.dailyBudget || 50000,
        currency: 'KRW',
        startTime: new Date().toISOString(),
        endTime: input.endTime?.toISOString(),
      }
    }

    const body: Record<string, unknown> = {}

    if (input.name !== undefined) body.name = input.name
    if (input.dailyBudget !== undefined) body.daily_budget = String(input.dailyBudget)
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
    if (this.mockMode) {
      console.log('[MetaAdsClient:MOCK] deleteCampaign called with mock mode')
      return
    }

    await this.requestWithRetry<{ success: boolean }>(accessToken, `/${campaignId}`, {
      method: 'DELETE',
    })
  }

  async listCampaigns(
    accessToken: string,
    adAccountId: string,
    options?: { limit?: number; after?: string }
  ): Promise<ListCampaignsResponse> {
    if (this.mockMode) {
      console.log('[MetaAdsClient:MOCK] listCampaigns called with mock mode')
      return {
        campaigns: [
          {
            id: '120210000000001',
            name: '신규 고객 확보 캠페인',
            status: 'ACTIVE',
            objective: 'OUTCOME_SALES',
            dailyBudget: 50000,
            startTime: new Date(Date.now() - 7 * 86400000).toISOString(),
            endTime: undefined,
            createdTime: new Date(Date.now() - 7 * 86400000).toISOString(),
            updatedTime: new Date().toISOString(),
          },
          {
            id: '120210000000002',
            name: '브랜드 인지도 캠페인',
            status: 'ACTIVE',
            objective: 'OUTCOME_AWARENESS',
            dailyBudget: 30000,
            startTime: new Date(Date.now() - 14 * 86400000).toISOString(),
            endTime: undefined,
            createdTime: new Date(Date.now() - 14 * 86400000).toISOString(),
            updatedTime: new Date().toISOString(),
          },
          {
            id: '120210000000003',
            name: '리타겟팅 캠페인',
            status: 'PAUSED',
            objective: 'OUTCOME_SALES',
            dailyBudget: 20000,
            startTime: new Date(Date.now() - 30 * 86400000).toISOString(),
            endTime: new Date(Date.now() - 2 * 86400000).toISOString(),
            createdTime: new Date(Date.now() - 30 * 86400000).toISOString(),
            updatedTime: new Date().toISOString(),
          },
        ],
        paging: undefined,
      }
    }

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
        params.append(
          'filtering',
          JSON.stringify([
            {
              field: 'effective_status',
              operator: 'IN',
              value: [
                'ACTIVE',
                'PAUSED',
                'DELETED',
                'ARCHIVED',
                'IN_PROCESS',
                'WITH_ISSUES',
                'CAMPAIGN_PAUSED',
                'ADSET_PAUSED',
                'PENDING_REVIEW',
                'DISAPPROVED',
                'PENDING_BILLING_INFO',
              ],
            },
          ])
        )

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

  // --- AdSet CRUD ---

  async createAdSet(
    accessToken: string,
    adAccountId: string,
    input: CreateMetaAdSetInput
  ): Promise<MetaAdSetData> {
    if (this.mockMode) {
      console.log('[MetaAdsClient:MOCK] createAdSet called with mock mode')
      return {
        id: `mock_adset_${Date.now()}`,
        name: input.name,
        status: input.status || 'PAUSED',
        dailyBudget: input.dailyBudget,
        lifetimeBudget: input.lifetimeBudget,
        billingEvent: input.billingEvent,
        optimizationGoal: input.optimizationGoal,
      }
    }

    return withSpan(
      'meta.createAdSet',
      async () => {
        const body: Record<string, unknown> = {
          campaign_id: input.campaignId,
          name: input.name,
          billing_event: input.billingEvent,
          optimization_goal: input.optimizationGoal,
          status: input.status || 'PAUSED',
          start_time: input.startTime.toISOString(),
        }

        if (input.dailyBudget !== undefined) body.daily_budget = String(input.dailyBudget)
        if (input.lifetimeBudget !== undefined) body.lifetime_budget = String(input.lifetimeBudget)
        if (input.bidStrategy) body.bid_strategy = input.bidStrategy
        if (input.targeting) body.targeting = input.targeting
        if (input.endTime) body.end_time = input.endTime.toISOString()

        const response = await this.requestWithRetry<{ id: string }>(
          accessToken,
          `/${adAccountId}/adsets`,
          { method: 'POST', body: JSON.stringify(body) }
        )

        return {
          id: response.id,
          name: input.name,
          status: input.status || 'PAUSED',
          dailyBudget: input.dailyBudget,
          lifetimeBudget: input.lifetimeBudget,
          billingEvent: input.billingEvent,
          optimizationGoal: input.optimizationGoal,
        }
      },
      { 'meta.adAccountId': adAccountId, 'meta.adSet.name': input.name }
    )
  }

  async updateAdSet(
    accessToken: string,
    adSetId: string,
    input: UpdateMetaAdSetInput
  ): Promise<void> {
    if (this.mockMode) {
      console.log('[MetaAdsClient:MOCK] updateAdSet called with mock mode')
      return
    }

    await withSpan(
      'meta.updateAdSet',
      async () => {
        const body: Record<string, unknown> = {}
        if (input.name !== undefined) body.name = input.name
        if (input.dailyBudget !== undefined) body.daily_budget = String(input.dailyBudget)
        if (input.lifetimeBudget !== undefined) body.lifetime_budget = String(input.lifetimeBudget)
        if (input.status !== undefined) body.status = input.status
        if (input.targeting !== undefined) body.targeting = input.targeting
        if (input.endTime !== undefined) {
          body.end_time = input.endTime ? input.endTime.toISOString() : null
        }

        await this.requestWithRetry<{ success: boolean }>(accessToken, `/${adSetId}`, {
          method: 'POST',
          body: JSON.stringify(body),
        })
      },
      { 'meta.adSetId': adSetId }
    )
  }

  async deleteAdSet(accessToken: string, adSetId: string): Promise<void> {
    if (this.mockMode) {
      console.log('[MetaAdsClient:MOCK] deleteAdSet called with mock mode')
      return
    }

    await this.requestWithRetry<{ success: boolean }>(accessToken, `/${adSetId}`, {
      method: 'DELETE',
    })
  }

  async listAdSets(accessToken: string, campaignId: string): Promise<MetaAdSetData[]> {
    if (this.mockMode) {
      console.log('[MetaAdsClient:MOCK] listAdSets called with mock mode')
      return [
        {
          id: `mock_adset_1`,
          name: 'Mock AdSet',
          status: 'ACTIVE',
          dailyBudget: 30000,
          billingEvent: 'IMPRESSIONS',
          optimizationGoal: 'CONVERSIONS',
        },
      ]
    }

    return withSpan(
      'meta.listAdSets',
      async () => {
        const fields = 'id,name,status,daily_budget,lifetime_budget,billing_event,optimization_goal'
        const response = await this.requestWithRetry<{
          data: {
            id: string
            name: string
            status: string
            daily_budget?: string
            lifetime_budget?: string
            billing_event: string
            optimization_goal: string
          }[]
        }>(accessToken, `/${campaignId}/adsets?fields=${fields}`, { method: 'GET' })

        return response.data.map((item) => ({
          id: item.id,
          name: item.name,
          status: item.status,
          dailyBudget: item.daily_budget ? parseInt(item.daily_budget, 10) : undefined,
          lifetimeBudget: item.lifetime_budget ? parseInt(item.lifetime_budget, 10) : undefined,
          billingEvent: item.billing_event,
          optimizationGoal: item.optimization_goal,
        }))
      },
      { 'meta.campaignId': campaignId }
    )
  }

  // --- Ad ---

  async createAd(
    accessToken: string,
    adAccountId: string,
    input: CreateMetaAdInput
  ): Promise<MetaAdData> {
    if (this.mockMode) {
      console.log('[MetaAdsClient:MOCK] createAd called with mock mode')
      return {
        id: `mock_ad_${Date.now()}`,
        name: input.name,
        status: input.status || 'PAUSED',
      }
    }

    return withSpan(
      'meta.createAd',
      async () => {
        const body = {
          name: input.name,
          adset_id: input.adSetId,
          creative: { creative_id: input.creativeId },
          status: input.status || 'PAUSED',
        }

        const response = await this.requestWithRetry<{ id: string }>(
          accessToken,
          `/${adAccountId}/ads`,
          { method: 'POST', body: JSON.stringify(body) }
        )

        return {
          id: response.id,
          name: input.name,
          status: input.status || 'PAUSED',
        }
      },
      { 'meta.adAccountId': adAccountId, 'meta.ad.name': input.name }
    )
  }

  async getAdDetail(accessToken: string, adId: string): Promise<MetaAdDetailData> {
    if (this.mockMode) {
      console.log('[MetaAdsClient:MOCK] getAdDetail called with mock mode')
      return {
        id: adId,
        name: 'Mock Ad',
        status: 'ACTIVE',
        creative: {
          id: 'mock_creative_1',
          name: 'Mock Creative',
          pageId: 'mock_page_1',
          instagramActorId: 'mock_ig_1',
          linkUrl: 'https://example.com',
          message: '지금 바로 확인하세요!',
          callToAction: 'SHOP_NOW',
          imageUrl: 'https://via.placeholder.com/600x315',
          thumbnailUrl: 'https://via.placeholder.com/150',
        },
      }
    }

    return withSpan(
      'meta.getAdDetail',
      async () => {
        // object_story_spec + top-level readable fields (body, link_url, image_url 등)
        const fields =
          'id,name,status,creative{id,name,body,link_url,image_url,image_hash,call_to_action_type,object_story_spec,thumbnail_url,effective_object_story_id,instagram_actor_id}'
        const response = await this.requestWithRetry<{
          id: string
          name: string
          status: string
          creative: {
            id: string
            name: string
            body?: string
            link_url?: string
            image_url?: string
            image_hash?: string
            call_to_action_type?: string
            thumbnail_url?: string
            instagram_actor_id?: string
            effective_object_story_id?: string
            object_story_spec?: {
              page_id?: string
              instagram_actor_id?: string
              link_data?: {
                link?: string
                message?: string
                call_to_action?: { type: string }
                image_hash?: string
                picture?: string
              }
              video_data?: {
                video_id?: string
                message?: string
                call_to_action?: { type: string }
                image_url?: string
              }
            }
          }
        }>(accessToken, `/${adId}?fields=${fields}`, { method: 'GET' })

        const creative = response.creative
        const spec = creative?.object_story_spec
        const linkData = spec?.link_data
        const videoData = spec?.video_data

        // Fallback: object_story_spec → top-level creative fields
        const message = linkData?.message || videoData?.message || creative?.body || ''
        const linkUrl = linkData?.link || creative?.link_url || ''
        const callToAction =
          linkData?.call_to_action?.type ||
          videoData?.call_to_action?.type ||
          creative?.call_to_action_type ||
          ''
        const imageUrl = linkData?.picture || creative?.image_url || ''
        const pageId = spec?.page_id || ''
        const instagramActorId =
          spec?.instagram_actor_id || creative?.instagram_actor_id || undefined

        return {
          id: response.id,
          name: response.name,
          status: response.status,
          creative: {
            id: creative?.id || '',
            name: creative?.name || '',
            pageId,
            instagramActorId,
            linkUrl,
            message,
            callToAction,
            imageUrl,
            videoUrl: videoData?.video_id
              ? `https://www.facebook.com/${videoData.video_id}`
              : undefined,
            thumbnailUrl: creative?.thumbnail_url || videoData?.image_url || '',
          },
        }
      },
      { 'meta.adId': adId }
    )
  }

  async updateAd(accessToken: string, adId: string, input: UpdateMetaAdInput): Promise<void> {
    if (this.mockMode) {
      console.log('[MetaAdsClient:MOCK] updateAd called with mock mode')
      return
    }

    await withSpan(
      'meta.updateAd',
      async () => {
        const body: Record<string, unknown> = {}
        if (input.name !== undefined) body.name = input.name
        if (input.status !== undefined) body.status = input.status

        // Creative 필드 업데이트는 별도 API 호출 필요
        // Meta API에서는 creative를 직접 수정하는 대신 새로운 creative를 만들어야 함
        // 하지만 ad의 name/status는 직접 수정 가능

        await this.requestWithRetry<{ success: boolean }>(accessToken, `/${adId}`, {
          method: 'POST',
          body: JSON.stringify(body),
        })
      },
      { 'meta.adId': adId }
    )
  }

  // --- AdSet Insights ---

  async getAdSetInsights(
    accessToken: string,
    adSetId: string,
    datePreset: 'today' | 'yesterday' | 'last_3d' | 'last_7d' | 'last_30d' | 'last_90d' = 'last_7d'
  ): Promise<MetaInsightsData> {
    if (this.mockMode) {
      console.log('[MetaAdsClient:MOCK] getAdSetInsights called with mock mode')
      const today = new Date().toISOString().split('T')[0]
      return {
        campaignId: adSetId,
        impressions: 8000,
        reach: 6500,
        clicks: 220,
        linkClicks: 180,
        spend: 65000,
        conversions: 6,
        revenue: 240000,
        dateStart: today,
        dateStop: today,
      }
    }

    return withSpan(
      'meta.getAdSetInsights',
      async () => {
        const fields =
          'campaign_id,impressions,reach,clicks,spend,actions,action_values,date_start,date_stop'

        const response = await this.requestWithRetry<MetaApiInsightsResponse>(
          accessToken,
          `/${adSetId}/insights?fields=${fields}&date_preset=${datePreset}`,
          { method: 'GET' }
        )

        return this.mapInsightsResponse(adSetId, response)
      },
      {
        'meta.adSetId': adSetId,
        'meta.datePreset': datePreset,
      }
    )
  }

  async getAdSetDailyInsights(
    accessToken: string,
    adSetId: string,
    datePreset: 'today' | 'yesterday' | 'last_3d' | 'last_7d' | 'last_30d' | 'last_90d' = 'last_7d',
    options?: { since?: string; until?: string }
  ): Promise<MetaDailyInsightsData[]> {
    if (this.mockMode) {
      console.log('[MetaAdsClient:MOCK] getAdSetDailyInsights called with mock mode')
      const parsedDays = parseInt(datePreset.match(/\d+/)?.[0] || '7', 10)
      const days =
        datePreset === 'today'
          ? 1
          : datePreset === 'yesterday'
            ? 1
            : Number.isNaN(parsedDays)
              ? 7
              : parsedDays
      const mockData: MetaDailyInsightsData[] = []

      for (let i = 0; i < days; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        mockData.push({
          campaignId: adSetId,
          date: date.toISOString().split('T')[0],
          impressions: Math.floor(1000 + Math.random() * 300),
          reach: Math.floor(800 + Math.random() * 200),
          clicks: Math.floor(30 + Math.random() * 10),
          linkClicks: Math.floor(25 + Math.random() * 8),
          spend: Math.floor(8000 + Math.random() * 3000),
          conversions: Math.floor(1 + Math.random() * 2),
          revenue: Math.floor(30000 + Math.random() * 15000),
        })
      }

      return mockData
    }

    return withSpan(
      'meta.getAdSetDailyInsights',
      async () => {
        const fields =
          'campaign_id,impressions,reach,clicks,spend,actions,action_values,date_start,date_stop'

        const dateParams =
          options?.since && options?.until
            ? `time_range=${encodeURIComponent(JSON.stringify({ since: options.since, until: options.until }))}`
            : `date_preset=${datePreset}`
        const response = await this.requestWithRetry<MetaApiInsightsResponse>(
          accessToken,
          `/${adSetId}/insights?fields=${fields}&${dateParams}&time_increment=1`,
          { method: 'GET' }
        )

        return this.mapDailyInsightsResponse(adSetId, response)
      },
      {
        'meta.adSetId': adSetId,
        'meta.datePreset': datePreset,
      }
    )
  }

  // --- Ad listing by adSet ---

  async listAds(accessToken: string, adSetId: string): Promise<MetaAdData[]> {
    if (this.mockMode) {
      console.log('[MetaAdsClient:MOCK] listAds called with mock mode')
      return [
        {
          id: 'mock_ad_1',
          name: 'Mock Ad 1',
          status: 'ACTIVE',
        },
        {
          id: 'mock_ad_2',
          name: 'Mock Ad 2',
          status: 'PAUSED',
        },
      ]
    }

    return withSpan(
      'meta.listAds',
      async () => {
        const fields = 'id,name,status'
        const response = await this.requestWithRetry<{
          data: {
            id: string
            name: string
            status: string
          }[]
        }>(accessToken, `/${adSetId}/ads?fields=${fields}`, { method: 'GET' })

        return response.data.map((item) => ({
          id: item.id,
          name: item.name,
          status: item.status,
        }))
      },
      { 'meta.adSetId': adSetId }
    )
  }

  // --- Ad Insights ---

  async getAdInsights(
    accessToken: string,
    adId: string,
    datePreset: 'today' | 'yesterday' | 'last_3d' | 'last_7d' | 'last_30d' | 'last_90d' = 'last_7d'
  ): Promise<MetaInsightsData> {
    if (this.mockMode) {
      console.log('[MetaAdsClient:MOCK] getAdInsights called with mock mode')
      const today = new Date().toISOString().split('T')[0]
      return {
        campaignId: adId,
        impressions: 4000,
        reach: 3200,
        clicks: 110,
        linkClicks: 90,
        spend: 32000,
        conversions: 3,
        revenue: 120000,
        dateStart: today,
        dateStop: today,
      }
    }

    return withSpan(
      'meta.getAdInsights',
      async () => {
        const fields =
          'campaign_id,impressions,reach,clicks,spend,actions,action_values,date_start,date_stop'

        const response = await this.requestWithRetry<MetaApiInsightsResponse>(
          accessToken,
          `/${adId}/insights?fields=${fields}&date_preset=${datePreset}`,
          { method: 'GET' }
        )

        return this.mapInsightsResponse(adId, response)
      },
      {
        'meta.adId': adId,
        'meta.datePreset': datePreset,
      }
    )
  }

  async getAdDailyInsights(
    accessToken: string,
    adId: string,
    datePreset: 'today' | 'yesterday' | 'last_3d' | 'last_7d' | 'last_30d' | 'last_90d' = 'last_7d',
    options?: { since?: string; until?: string }
  ): Promise<MetaDailyInsightsData[]> {
    if (this.mockMode) {
      console.log('[MetaAdsClient:MOCK] getAdDailyInsights called with mock mode')
      const parsedDays = parseInt(datePreset.match(/\d+/)?.[0] || '7', 10)
      const days =
        datePreset === 'today'
          ? 1
          : datePreset === 'yesterday'
            ? 1
            : Number.isNaN(parsedDays)
              ? 7
              : parsedDays
      const mockData: MetaDailyInsightsData[] = []

      for (let i = 0; i < days; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        mockData.push({
          campaignId: adId,
          date: date.toISOString().split('T')[0],
          impressions: Math.floor(500 + Math.random() * 150),
          reach: Math.floor(400 + Math.random() * 100),
          clicks: Math.floor(15 + Math.random() * 5),
          linkClicks: Math.floor(12 + Math.random() * 4),
          spend: Math.floor(4000 + Math.random() * 1500),
          conversions: Math.floor(Math.random() * 2),
          revenue: Math.floor(15000 + Math.random() * 8000),
        })
      }

      return mockData
    }

    return withSpan(
      'meta.getAdDailyInsights',
      async () => {
        const fields =
          'campaign_id,impressions,reach,clicks,spend,actions,action_values,date_start,date_stop'

        const dateParams =
          options?.since && options?.until
            ? `time_range=${encodeURIComponent(JSON.stringify({ since: options.since, until: options.until }))}`
            : `date_preset=${datePreset}`
        const response = await this.requestWithRetry<MetaApiInsightsResponse>(
          accessToken,
          `/${adId}/insights?fields=${fields}&${dateParams}&time_increment=1`,
          { method: 'GET' }
        )

        return this.mapDailyInsightsResponse(adId, response)
      },
      {
        'meta.adId': adId,
        'meta.datePreset': datePreset,
      }
    )
  }

  // --- Creative ---

  async createAdCreative(
    accessToken: string,
    adAccountId: string,
    input: CreateMetaCreativeInput
  ): Promise<MetaCreativeData> {
    if (this.mockMode) {
      console.log('[MetaAdsClient:MOCK] createAdCreative called with mock mode')
      return {
        id: `mock_creative_${Date.now()}`,
        name: input.name,
      }
    }

    return withSpan(
      'meta.createAdCreative',
      async () => {
        const objectStorySpec: Record<string, unknown> = {
          page_id: input.pageId,
        }

        // 링크 광고
        if (input.link) {
          const linkData: Record<string, unknown> = {
            link: input.link,
            message: input.message || '',
          }
          if (input.imageHash) linkData.image_hash = input.imageHash
          if (input.videoId) linkData.video_id = input.videoId
          if (input.callToAction) {
            linkData.call_to_action = { type: input.callToAction }
          }
          objectStorySpec.link_data = linkData
        }

        const body = {
          name: input.name,
          object_story_spec: objectStorySpec,
        }

        const response = await this.requestWithRetry<{ id: string }>(
          accessToken,
          `/${adAccountId}/adcreatives`,
          { method: 'POST', body: JSON.stringify(body) }
        )

        return {
          id: response.id,
          name: input.name,
        }
      },
      { 'meta.adAccountId': adAccountId, 'meta.creative.name': input.name }
    )
  }

  // --- Pages & Instagram ---

  async listPages(accessToken: string): Promise<MetaPageData[]> {
    if (this.mockMode) {
      console.log('[MetaAdsClient:MOCK] listPages called with mock mode')
      return [
        { id: 'mock_page_1', name: '바투 공식 페이지', picture: 'https://via.placeholder.com/50' },
        { id: 'mock_page_2', name: '바투 브랜드 스토어' },
      ]
    }

    return withSpan(
      'meta.listPages',
      async () => {
        const response = await this.requestWithRetry<{
          data: {
            id: string
            name: string
            picture?: { data?: { url?: string } }
          }[]
        }>(accessToken, `/me/accounts?fields=id,name,picture`, { method: 'GET' })

        return response.data.map((page) => ({
          id: page.id,
          name: page.name,
          picture: page.picture?.data?.url,
        }))
      },
      {}
    )
  }

  async listInstagramAccounts(
    accessToken: string,
    pageId: string
  ): Promise<MetaInstagramAccountData[]> {
    if (this.mockMode) {
      console.log('[MetaAdsClient:MOCK] listInstagramAccounts called with mock mode')
      return [{ id: 'mock_ig_1', username: 'batwo_official' }]
    }

    return withSpan(
      'meta.listInstagramAccounts',
      async () => {
        const response = await this.requestWithRetry<{
          data: {
            id: string
            username: string
          }[]
        }>(accessToken, `/${pageId}/instagram_accounts?fields=id,username`, { method: 'GET' })

        return response.data.map((account) => ({
          id: account.id,
          username: account.username,
        }))
      },
      { 'meta.pageId': pageId }
    )
  }

  // --- Asset 업로드 ---

  async uploadImage(
    accessToken: string,
    adAccountId: string,
    imageData: Buffer
  ): Promise<{ imageHash: string }> {
    if (this.mockMode) {
      console.log('[MetaAdsClient:MOCK] uploadImage called with mock mode')
      return { imageHash: `mock_hash_${Date.now()}` }
    }

    return withSpan(
      'meta.uploadImage',
      async () => {
        const base64 = imageData.toString('base64')
        const body = { bytes: base64 }

        const response = await this.requestWithRetry<{
          images: { bytes: { hash: string } }
        }>(accessToken, `/${adAccountId}/adimages`, { method: 'POST', body: JSON.stringify(body) })

        return { imageHash: response.images.bytes.hash }
      },
      { 'meta.adAccountId': adAccountId }
    )
  }

  async uploadVideo(
    accessToken: string,
    adAccountId: string,
    videoData: Buffer,
    name: string
  ): Promise<{ videoId: string }> {
    if (this.mockMode) {
      console.log('[MetaAdsClient:MOCK] uploadVideo called with mock mode')
      return { videoId: `mock_video_${Date.now()}` }
    }

    return withSpan(
      'meta.uploadVideo',
      async () => {
        const base64 = videoData.toString('base64')
        const body = {
          source: base64,
          title: name,
        }

        const response = await this.requestWithRetry<{ id: string }>(
          accessToken,
          `/${adAccountId}/advideos`,
          { method: 'POST', body: JSON.stringify(body) }
        )

        return { videoId: response.id }
      },
      { 'meta.adAccountId': adAccountId, 'meta.video.name': name }
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
        reach: 0,
        clicks: 0,
        linkClicks: 0,
        spend: 0,
        conversions: 0,
        revenue: 0,
        dateStart: new Date().toISOString().split('T')[0],
        dateStop: new Date().toISOString().split('T')[0],
      }
    }

    const conversions = data.actions?.find((a) => a.action_type === 'purchase')?.value || '0'
    const revenue = data.action_values?.find((a) => a.action_type === 'purchase')?.value || '0'
    const linkClicks = data.actions?.find((a) => a.action_type === 'link_click')?.value || '0'

    return {
      campaignId: data.campaign_id,
      impressions: parseInt(data.impressions || '0', 10),
      reach: parseInt(data.reach || '0', 10),
      clicks: parseInt(data.clicks || '0', 10),
      linkClicks: parseInt(linkClicks, 10),
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

  // ============================================================
  // Account-Level Bulk Methods (N+1 → 1 최적화)
  // ============================================================

  /**
   * 계정 레벨 인사이트 집계
   * GET /act_{id}/insights?level={level}&date_preset={preset}
   * 응답을 Map<entityId, MetaInsightsData>로 반환
   */
  async getAccountInsights(
    accessToken: string,
    adAccountId: string,
    options: {
      level: 'campaign' | 'adset' | 'ad'
      datePreset: string
      campaignIds?: string[]
    }
  ): Promise<Map<string, MetaInsightsData>> {
    if (this.mockMode) {
      console.log(`[MetaAdsClient:MOCK] getAccountInsights called (level=${options.level})`)
      return new Map()
    }

    return withSpan(
      'meta.getAccountInsights',
      async () => {
        const fields =
          'campaign_id,adset_id,ad_id,impressions,reach,clicks,spend,actions,action_values,date_start,date_stop'

        const params = new URLSearchParams({
          fields,
          level: options.level,
          date_preset: options.datePreset,
          limit: '500',
        })

        // campaignIds 필터링
        if (options.campaignIds && options.campaignIds.length > 0) {
          params.append(
            'filtering',
            JSON.stringify([
              {
                field: 'campaign.id',
                operator: 'IN',
                value: options.campaignIds,
              },
            ])
          )
        }

        const response = await this.requestWithRetry<MetaApiInsightsResponse>(
          accessToken,
          `/${adAccountId}/insights?${params.toString()}`,
          { method: 'GET' }
        )

        // level에 따라 적절한 ID 키로 Map 생성
        const result = new Map<string, MetaInsightsData>()

        if (!response.data || response.data.length === 0) {
          return result
        }

        for (const item of response.data) {
          // level에 따라 key ID 결정
          let entityId: string
          const itemAny = item as Record<string, unknown>
          if (options.level === 'ad') {
            entityId = (itemAny.ad_id as string) || item.campaign_id
          } else if (options.level === 'adset') {
            entityId = (itemAny.adset_id as string) || item.campaign_id
          } else {
            entityId = item.campaign_id
          }

          const conversions =
            item.actions?.find((a) => a.action_type === 'purchase')?.value || '0'
          const revenue =
            item.action_values?.find((a) => a.action_type === 'purchase')?.value || '0'
          const linkClicks =
            item.actions?.find((a) => a.action_type === 'link_click')?.value || '0'

          result.set(entityId, {
            campaignId: item.campaign_id,
            impressions: parseInt(item.impressions || '0', 10),
            reach: parseInt(item.reach || '0', 10),
            clicks: parseInt(item.clicks || '0', 10),
            linkClicks: parseInt(linkClicks, 10),
            spend: parseFloat(item.spend || '0'),
            conversions: parseInt(conversions, 10),
            revenue: parseFloat(revenue),
            dateStart: item.date_start,
            dateStop: item.date_stop,
          })
        }

        return result
      },
      {
        'meta.adAccountId': adAccountId,
        'meta.level': options.level,
        'meta.datePreset': options.datePreset,
      }
    )
  }

  /**
   * 계정 레벨 전체 광고세트 조회
   * GET /act_{id}/adsets?fields=...&filtering=[{campaign.id IN [...]}]
   */
  async listAllAdSets(
    accessToken: string,
    adAccountId: string,
    options?: { campaignIds?: string[] }
  ): Promise<MetaAdSetData[]> {
    if (this.mockMode) {
      console.log('[MetaAdsClient:MOCK] listAllAdSets called with mock mode')
      return [
        {
          id: 'mock_adset_1',
          name: 'Mock AdSet',
          status: 'ACTIVE',
          dailyBudget: 30000,
          billingEvent: 'IMPRESSIONS',
          optimizationGoal: 'CONVERSIONS',
        },
      ]
    }

    return withSpan(
      'meta.listAllAdSets',
      async () => {
        const fields = 'id,name,status,daily_budget,lifetime_budget,billing_event,optimization_goal,campaign_id'

        const params = new URLSearchParams({
          fields,
          limit: '500',
        })

        if (options?.campaignIds && options.campaignIds.length > 0) {
          params.append(
            'filtering',
            JSON.stringify([
              {
                field: 'campaign.id',
                operator: 'IN',
                value: options.campaignIds,
              },
            ])
          )
        }

        const response = await this.requestWithRetry<{
          data: {
            id: string
            name: string
            status: string
            daily_budget?: string
            lifetime_budget?: string
            billing_event: string
            optimization_goal: string
            campaign_id?: string
          }[]
        }>(accessToken, `/${adAccountId}/adsets?${params.toString()}`, { method: 'GET' })

        return response.data.map((item) => ({
          id: item.id,
          name: item.name,
          status: item.status,
          dailyBudget: item.daily_budget ? parseInt(item.daily_budget, 10) : undefined,
          lifetimeBudget: item.lifetime_budget ? parseInt(item.lifetime_budget, 10) : undefined,
          billingEvent: item.billing_event,
          optimizationGoal: item.optimization_goal,
        }))
      },
      { 'meta.adAccountId': adAccountId }
    )
  }

  /**
   * 계정 레벨 전체 광고 조회
   * GET /act_{id}/ads?fields=...&filtering=[{adset.id IN [...]}]
   */
  async listAllAds(
    accessToken: string,
    adAccountId: string,
    options?: { adSetIds?: string[] }
  ): Promise<MetaAdData[]> {
    if (this.mockMode) {
      console.log('[MetaAdsClient:MOCK] listAllAds called with mock mode')
      return [
        { id: 'mock_ad_1', name: 'Mock Ad 1', status: 'ACTIVE' },
        { id: 'mock_ad_2', name: 'Mock Ad 2', status: 'PAUSED' },
      ]
    }

    return withSpan(
      'meta.listAllAds',
      async () => {
        const fields = 'id,name,status'

        const params = new URLSearchParams({
          fields,
          limit: '500',
        })

        if (options?.adSetIds && options.adSetIds.length > 0) {
          params.append(
            'filtering',
            JSON.stringify([
              {
                field: 'adset.id',
                operator: 'IN',
                value: options.adSetIds,
              },
            ])
          )
        }

        const response = await this.requestWithRetry<{
          data: {
            id: string
            name: string
            status: string
          }[]
        }>(accessToken, `/${adAccountId}/ads?${params.toString()}`, { method: 'GET' })

        return response.data.map((item) => ({
          id: item.id,
          name: item.name,
          status: item.status,
        }))
      },
      { 'meta.adAccountId': adAccountId }
    )
  }
}
