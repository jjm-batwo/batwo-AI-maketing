import type {
  IMetaPixelService,
  MetaPixelData,
  MetaPixelStats,
} from '@application/ports/IMetaPixelService'
import { MetaAdsApiError } from '../errors/ExternalServiceError'
import { fetchWithTimeout } from '@lib/utils/timeout'

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

interface MetaApiPixelResponse {
  id: string
  name: string
  last_fired_time?: string
  is_unavailable?: boolean
  creation_time?: string
}

interface MetaApiPixelListResponse {
  data: MetaApiPixelResponse[]
}

interface MetaApiAdAccountPixelResponse {
  pixel?: MetaApiPixelResponse
}

interface MetaApiPixelStatsResponse {
  data: {
    match_rate_approx?: number
    matched_event_count?: number
    unmatched_event_count?: number
  }[]
}

export class MetaPixelClient implements IMetaPixelService {
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

    const response = await fetchWithTimeout(url, { ...options, headers }, META_API_TIMEOUT_MS)
    const data = await response.json()

    if (!response.ok || (data as MetaApiError).error) {
      const error = (data as MetaApiError).error
      // Return null for 404 errors (not found)
      if (response.status === 404) {
        return null as T
      }
      throw new MetaAdsApiError(
        error?.message || 'Unknown API error',
        error?.code,
        error?.error_subcode,
        response.status
      )
    }

    return data as T
  }

  private mapPixelResponse(pixel: MetaApiPixelResponse): MetaPixelData {
    return {
      id: pixel.id,
      name: pixel.name,
      lastFiredTime: pixel.last_fired_time,
      isActive: !pixel.is_unavailable,
      creationTime: pixel.creation_time || new Date().toISOString(),
    }
  }

  async listPixels(accessToken: string): Promise<MetaPixelData[]> {
    const fields = 'id,name,last_fired_time,is_unavailable,creation_time'
    const response = await this.request<MetaApiPixelListResponse>(
      accessToken,
      `/me/pixels?fields=${fields}`
    )

    return (response?.data || []).map((pixel) => this.mapPixelResponse(pixel))
  }

  async getAdAccountPixel(
    accessToken: string,
    adAccountId: string
  ): Promise<MetaPixelData | null> {
    const fields = 'pixel{id,name,is_unavailable,creation_time}'
    const response = await this.request<MetaApiAdAccountPixelResponse>(
      accessToken,
      `/${adAccountId}?fields=${fields}`
    )

    if (!response?.pixel) {
      return null
    }

    return this.mapPixelResponse(response.pixel)
  }

  async createPixel(
    accessToken: string,
    businessId: string,
    name: string
  ): Promise<MetaPixelData> {
    const response = await this.request<MetaApiPixelResponse>(
      accessToken,
      `/${businessId}/adspixels`,
      {
        method: 'POST',
        body: JSON.stringify({ name }),
      }
    )

    return {
      id: response.id,
      name: response.name || name,
      isActive: true,
      creationTime: response.creation_time || new Date().toISOString(),
    }
  }

  async getPixel(
    accessToken: string,
    pixelId: string
  ): Promise<MetaPixelData | null> {
    const fields = 'id,name,last_fired_time,is_unavailable,creation_time'
    const response = await this.request<MetaApiPixelResponse | null>(
      accessToken,
      `/${pixelId}?fields=${fields}`
    )

    if (!response) {
      return null
    }

    return this.mapPixelResponse(response)
  }

  async getPixelStats(
    accessToken: string,
    pixelId: string
  ): Promise<MetaPixelStats | null> {
    const response = await this.request<MetaApiPixelStatsResponse>(
      accessToken,
      `/${pixelId}/stats`
    )

    if (!response?.data || response.data.length === 0) {
      return null
    }

    const stats = response.data[0]
    return {
      matchRate: stats.match_rate_approx || 0,
      matchedEventCount: stats.matched_event_count || 0,
      unmatchedEventCount: stats.unmatched_event_count || 0,
    }
  }
}
