/**
 * Meta Ads API Warmup Client
 *
 * Meta 앱 검수를 위한 API 호출량 증가용 클라이언트
 * Non-destructive (읽기 전용) API 호출만 수행
 */

import { MetaAdsApiError } from '../errors'

const META_API_VERSION = 'v18.0'
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`

// 날짜 프리셋 목록 (7개)
const DATE_PRESETS = [
  'today',
  'yesterday',
  'last_7d',
  'last_14d',
  'last_28d',
  'last_30d',
  'this_month',
] as const

export interface WarmupResult {
  endpoint: string
  success: boolean
  latencyMs: number
  errorMessage?: string
  errorCode?: number
}

export interface WarmupSummary {
  totalCalls: number
  successfulCalls: number
  failedCalls: number
  results: WarmupResult[]
  executedAt: Date
  durationMs: number
}

interface MetaApiError {
  error: {
    message: string
    type?: string
    code?: number
    error_subcode?: number
  }
}

interface MetaListResponse<T> {
  data: T[]
  paging?: {
    cursors?: { after?: string }
    next?: string
  }
}

interface MetaCampaign {
  id: string
  name: string
  status: string
}

interface MetaAdSet {
  id: string
  name: string
  status: string
}

interface MetaAd {
  id: string
  name: string
  status: string
}

export class MetaAdsWarmupClient {
  private results: WarmupResult[] = []

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

  private async measureRequest<T>(
    accessToken: string,
    endpoint: string,
    description: string
  ): Promise<{ data: T | null; result: WarmupResult }> {
    const startTime = Date.now()

    try {
      const data = await this.request<T>(accessToken, endpoint)
      const latencyMs = Date.now() - startTime

      const result: WarmupResult = {
        endpoint: description,
        success: true,
        latencyMs,
      }

      this.results.push(result)
      return { data, result }
    } catch (error) {
      const latencyMs = Date.now() - startTime
      const isMetaError = error instanceof MetaAdsApiError

      const result: WarmupResult = {
        endpoint: description,
        success: false,
        latencyMs,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorCode: isMetaError ? error.errorCode : undefined,
      }

      this.results.push(result)
      return { data: null, result }
    }
  }

  /**
   * 사용자 정보 조회
   */
  async getUserInfo(accessToken: string): Promise<WarmupResult> {
    const { result } = await this.measureRequest<{ id: string; name: string }>(
      accessToken,
      '/me?fields=id,name',
      '/me'
    )
    return result
  }

  /**
   * 광고 계정 목록 조회
   */
  async getAdAccounts(accessToken: string): Promise<WarmupResult> {
    const { result } = await this.measureRequest<MetaListResponse<{ id: string }>>(
      accessToken,
      '/me/adaccounts?fields=id,name,account_status&limit=100',
      '/me/adaccounts'
    )
    return result
  }

  /**
   * 캠페인 목록 조회
   */
  async getCampaigns(accessToken: string, adAccountId: string): Promise<{ result: WarmupResult; campaigns: MetaCampaign[] }> {
    const { data, result } = await this.measureRequest<MetaListResponse<MetaCampaign>>(
      accessToken,
      `/${adAccountId}/campaigns?fields=id,name,status,objective&limit=100`,
      `/${adAccountId}/campaigns`
    )
    return { result, campaigns: data?.data || [] }
  }

  /**
   * 광고 세트 목록 조회
   */
  async getAdSets(accessToken: string, adAccountId: string): Promise<{ result: WarmupResult; adsets: MetaAdSet[] }> {
    const { data, result } = await this.measureRequest<MetaListResponse<MetaAdSet>>(
      accessToken,
      `/${adAccountId}/adsets?fields=id,name,status&limit=100`,
      `/${adAccountId}/adsets`
    )
    return { result, adsets: data?.data || [] }
  }

  /**
   * 광고 목록 조회
   */
  async getAds(accessToken: string, adAccountId: string): Promise<{ result: WarmupResult; ads: MetaAd[] }> {
    const { data, result } = await this.measureRequest<MetaListResponse<MetaAd>>(
      accessToken,
      `/${adAccountId}/ads?fields=id,name,status&limit=100`,
      `/${adAccountId}/ads`
    )
    return { result, ads: data?.data || [] }
  }

  /**
   * 맞춤 타겟 목록 조회
   */
  async getCustomAudiences(accessToken: string, adAccountId: string): Promise<WarmupResult> {
    const { result } = await this.measureRequest<MetaListResponse<{ id: string }>>(
      accessToken,
      `/${adAccountId}/customaudiences?fields=id,name&limit=100`,
      `/${adAccountId}/customaudiences`
    )
    return result
  }

  /**
   * 광고 소재 목록 조회
   */
  async getAdCreatives(accessToken: string, adAccountId: string): Promise<WarmupResult> {
    const { result } = await this.measureRequest<MetaListResponse<{ id: string }>>(
      accessToken,
      `/${adAccountId}/adcreatives?fields=id,name&limit=100`,
      `/${adAccountId}/adcreatives`
    )
    return result
  }

  /**
   * 계정 인사이트 조회 (모든 날짜 프리셋)
   */
  async getAccountInsights(accessToken: string, adAccountId: string): Promise<WarmupResult[]> {
    const results: WarmupResult[] = []
    const fields = 'impressions,clicks,spend,actions,reach,frequency'

    for (const preset of DATE_PRESETS) {
      const { result } = await this.measureRequest<{ data: unknown[] }>(
        accessToken,
        `/${adAccountId}/insights?fields=${fields}&date_preset=${preset}`,
        `/${adAccountId}/insights?date_preset=${preset}`
      )
      results.push(result)
    }

    return results
  }

  /**
   * 캠페인 인사이트 조회 (모든 날짜 프리셋)
   */
  async getCampaignInsights(accessToken: string, campaignId: string): Promise<WarmupResult[]> {
    const results: WarmupResult[] = []
    const fields = 'campaign_id,impressions,clicks,spend,actions'

    for (const preset of DATE_PRESETS) {
      const { result } = await this.measureRequest<{ data: unknown[] }>(
        accessToken,
        `/${campaignId}/insights?fields=${fields}&date_preset=${preset}`,
        `/${campaignId}/insights?date_preset=${preset}`
      )
      results.push(result)
    }

    return results
  }

  /**
   * 광고 세트 인사이트 조회 (모든 날짜 프리셋)
   */
  async getAdSetInsights(accessToken: string, adsetId: string): Promise<WarmupResult[]> {
    const results: WarmupResult[] = []
    const fields = 'adset_id,impressions,clicks,spend,actions'

    for (const preset of DATE_PRESETS) {
      const { result } = await this.measureRequest<{ data: unknown[] }>(
        accessToken,
        `/${adsetId}/insights?fields=${fields}&date_preset=${preset}`,
        `/${adsetId}/insights?date_preset=${preset}`
      )
      results.push(result)
    }

    return results
  }

  /**
   * 광고 인사이트 조회 (모든 날짜 프리셋)
   */
  async getAdInsights(accessToken: string, adId: string): Promise<WarmupResult[]> {
    const results: WarmupResult[] = []
    const fields = 'ad_id,impressions,clicks,spend,actions'

    for (const preset of DATE_PRESETS) {
      const { result } = await this.measureRequest<{ data: unknown[] }>(
        accessToken,
        `/${adId}/insights?fields=${fields}&date_preset=${preset}`,
        `/${adId}/insights?date_preset=${preset}`
      )
      results.push(result)
    }

    return results
  }

  /**
   * 전체 웜업 시퀀스 실행
   *
   * @param accessToken Meta API 액세스 토큰
   * @param adAccountId 광고 계정 ID (act_XXXXXX 형식)
   * @param options 옵션 (캠페인/광고세트/광고 인사이트 조회 개수 제한)
   */
  async runWarmupSequence(
    accessToken: string,
    adAccountId: string,
    options: {
      maxCampaigns?: number
      maxAdSets?: number
      maxAds?: number
    } = {}
  ): Promise<WarmupSummary> {
    const { maxCampaigns = 5, maxAdSets = 3, maxAds = 3 } = options
    const startTime = Date.now()
    this.results = []

    console.log(`[Warmup] Starting warmup for account ${adAccountId}`)

    // 1. 기본 조회
    await this.getUserInfo(accessToken)
    await this.getAdAccounts(accessToken)

    // 2. 계정 레벨 데이터
    const { campaigns } = await this.getCampaigns(accessToken, adAccountId)
    const { adsets } = await this.getAdSets(accessToken, adAccountId)
    const { ads } = await this.getAds(accessToken, adAccountId)

    // 3. 추가 계정 레벨 데이터
    await this.getCustomAudiences(accessToken, adAccountId)
    await this.getAdCreatives(accessToken, adAccountId)

    // 4. 계정 인사이트 (7개 날짜 프리셋)
    await this.getAccountInsights(accessToken, adAccountId)

    // 5. 캠페인별 인사이트 (상위 N개)
    const targetCampaigns = campaigns.slice(0, maxCampaigns)
    for (const campaign of targetCampaigns) {
      await this.getCampaignInsights(accessToken, campaign.id)
    }

    // 6. 광고 세트별 인사이트 (상위 N개)
    const targetAdSets = adsets.slice(0, maxAdSets)
    for (const adset of targetAdSets) {
      await this.getAdSetInsights(accessToken, adset.id)
    }

    // 7. 광고별 인사이트 (상위 N개)
    const targetAds = ads.slice(0, maxAds)
    for (const ad of targetAds) {
      await this.getAdInsights(accessToken, ad.id)
    }

    const durationMs = Date.now() - startTime
    const successfulCalls = this.results.filter(r => r.success).length
    const failedCalls = this.results.filter(r => !r.success).length

    console.log(`[Warmup] Completed: ${successfulCalls}/${this.results.length} successful (${durationMs}ms)`)

    return {
      totalCalls: this.results.length,
      successfulCalls,
      failedCalls,
      results: [...this.results],
      executedAt: new Date(),
      durationMs,
    }
  }
}
