/**
 * Meta Ad Library API 클라이언트
 *
 * Meta Marketing API의 ads_archive 엔드포인트를 통해
 * 경쟁사 광고 크리에이티브 데이터를 수집합니다.
 *
 * 제한사항:
 * - 크리에이티브만 조회 가능 (성과 지표는 조회 불가)
 * - Rate limit: 200 calls/hour per user
 * - 활성 Meta 연결 필요
 */

import { IAdLibraryClient, type CompetitorAd } from '@application/services/CompetitorAnalysisService'
import { MetaAdsApiError } from '../errors'
import { withRetry } from '@lib/utils/retry'
import { fetchWithTimeout } from '@lib/utils/timeout'

const META_API_VERSION = 'v18.0'
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`
const META_API_TIMEOUT_MS = 30000 // 30 seconds for Meta API calls

interface MetaAdLibraryResponse {
  data: {
    id: string
    ad_snapshot_url: string
    ad_creative_body?: string
    ad_creative_link_title?: string
    ad_creative_link_description?: string
    page_id?: string
    page_name?: string
    impressions?: {
      lower_bound: string
      upper_bound: string
    }
    ad_delivery_start_time?: string
    ad_delivery_stop_time?: string
    publisher_platforms?: string[]
  }[]
  paging?: {
    next?: string
    previous?: string
  }
}

interface MetaApiError {
  error: {
    message: string
    type?: string
    code?: number
    error_subcode?: number
  }
}

export class AdLibraryClient implements IAdLibraryClient {
  /**
   * 키워드로 광고 검색
   */
  async searchAds(
    accessToken: string,
    params: {
      searchTerms: string
      adReachedCountries: string[]
      limit?: number
    }
  ): Promise<CompetitorAd[]> {
    const limit = params.limit || 50
    const fields = [
      'id',
      'ad_snapshot_url',
      'ad_creative_body',
      'ad_creative_link_title',
      'ad_creative_link_description',
      'page_id',
      'page_name',
      'impressions',
      'ad_delivery_start_time',
      'ad_delivery_stop_time',
      'publisher_platforms',
    ].join(',')

    const queryParams = new URLSearchParams({
      search_terms: params.searchTerms,
      ad_reached_countries: JSON.stringify(params.adReachedCountries),
      ad_type: 'ALL',
      ad_active_status: 'ALL',
      fields,
      limit: Math.min(limit, 100).toString(), // Max 100 per request
    })

    const endpoint = `/ads_archive?${queryParams.toString()}`
    const response = await this.requestWithRetry<MetaAdLibraryResponse>(accessToken, endpoint)

    return response.data.map((item) => this.mapAdLibraryItem(item))
  }

  /**
   * 특정 페이지의 광고 조회
   */
  async getPageAds(accessToken: string, pageId: string): Promise<CompetitorAd[]> {
    const fields = [
      'id',
      'ad_snapshot_url',
      'ad_creative_body',
      'ad_creative_link_title',
      'ad_creative_link_description',
      'page_id',
      'page_name',
      'impressions',
      'ad_delivery_start_time',
      'ad_delivery_stop_time',
      'publisher_platforms',
    ].join(',')

    const queryParams = new URLSearchParams({
      search_page_ids: JSON.stringify([pageId]),
      ad_type: 'ALL',
      ad_active_status: 'ALL',
      fields,
      limit: '50',
    })

    const endpoint = `/ads_archive?${queryParams.toString()}`
    const response = await this.requestWithRetry<MetaAdLibraryResponse>(accessToken, endpoint)

    return response.data.map((item) => this.mapAdLibraryItem(item))
  }

  // ============ Private Methods ============

  private async request<T>(accessToken: string, endpoint: string): Promise<T> {
    const url = `${META_API_BASE}${endpoint}`
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }

    const response = await fetchWithTimeout(url, { headers }, META_API_TIMEOUT_MS)
    const data = await response.json()

    if (!response.ok || (data as MetaApiError).error) {
      const error = (data as MetaApiError).error
      throw new MetaAdsApiError(
        error?.message || 'Unknown Meta Ad Library API error',
        error?.code,
        error?.error_subcode,
        response.status
      )
    }

    return data as T
  }

  private async requestWithRetry<T>(accessToken: string, endpoint: string): Promise<T> {
    return withRetry(() => this.request<T>(accessToken, endpoint), {
      maxAttempts: 3,
      initialDelayMs: 100,
      shouldRetry: (error) => {
        if (error instanceof MetaAdsApiError) {
          return MetaAdsApiError.isTransientError(error)
        }
        return false
      },
    })
  }

  private mapAdLibraryItem(
    item: MetaAdLibraryResponse['data'][0]
  ): CompetitorAd {
    return {
      id: item.id,
      pageId: item.page_id || 'unknown',
      pageName: item.page_name || 'Unknown Page',
      adCreativeBody: item.ad_creative_body || '',
      adCreativeLinkTitle: item.ad_creative_link_title,
      adCreativeLinkDescription: item.ad_creative_link_description,
      adSnapshotUrl: item.ad_snapshot_url,
      impressionsRange: item.impressions
        ? {
            lower: parseInt(item.impressions.lower_bound, 10),
            upper: parseInt(item.impressions.upper_bound, 10),
          }
        : undefined,
      startDate: item.ad_delivery_start_time || new Date().toISOString(),
      endDate: item.ad_delivery_stop_time,
      platforms: item.publisher_platforms || [],
    }
  }
}
