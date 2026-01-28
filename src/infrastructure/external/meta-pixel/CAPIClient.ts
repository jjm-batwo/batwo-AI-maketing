import type {
  ICAPIService,
  CAPIEventInput,
  CAPIResponse,
  CAPITestEventResponse,
} from '@application/ports/ICAPIService'
import type { CAPIEventFormat } from '@domain/entities/ConversionEvent'
import { createHash } from 'crypto'
import { MetaAdsApiError } from '../errors/ExternalServiceError'
import { fetchWithTimeout } from '@lib/utils/timeout'

const META_API_VERSION = 'v18.0'
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`
const META_API_TIMEOUT_MS = 30000 // 30 seconds for Meta API calls
const MAX_BATCH_SIZE = 1000

interface MetaApiError {
  error: {
    message: string
    type?: string
    code?: number
    error_subcode?: number
  }
}

interface MetaApiCAPIResponse {
  events_received: number
  messages?: string[]
  fbtrace_id?: string
}

export class CAPIClient implements ICAPIService {
  private hashSHA256(value: string): string {
    return createHash('sha256')
      .update(value.toLowerCase().trim())
      .digest('hex')
  }

  private hashUserData(
    userData: CAPIEventInput['userData']
  ): CAPIEventFormat['user_data'] | undefined {
    if (!userData) return undefined

    const result: CAPIEventFormat['user_data'] = {}

    // Hash PII fields
    if (userData.em) {
      result.em = this.hashSHA256(userData.em)
    }
    if (userData.ph) {
      result.ph = this.hashSHA256(userData.ph)
    }
    if (userData.fn) {
      result.fn = this.hashSHA256(userData.fn)
    }
    if (userData.ln) {
      result.ln = this.hashSHA256(userData.ln)
    }
    if (userData.ct) {
      result.ct = this.hashSHA256(userData.ct)
    }
    if (userData.st) {
      result.st = this.hashSHA256(userData.st)
    }
    if (userData.zp) {
      result.zp = this.hashSHA256(userData.zp)
    }
    if (userData.country) {
      result.country = this.hashSHA256(userData.country)
    }
    if (userData.external_id) {
      result.external_id = this.hashSHA256(userData.external_id)
    }

    // Non-hashed fields (already collected on server)
    if (userData.client_ip_address) {
      result.client_ip_address = userData.client_ip_address
    }
    if (userData.client_user_agent) {
      result.client_user_agent = userData.client_user_agent
    }
    if (userData.fbc) {
      result.fbc = userData.fbc
    }
    if (userData.fbp) {
      result.fbp = userData.fbp
    }

    return Object.keys(result).length > 0 ? result : undefined
  }

  formatEvent(event: CAPIEventInput): CAPIEventFormat {
    return {
      event_name: event.eventName,
      event_time: Math.floor(event.eventTime.getTime() / 1000),
      event_id: event.eventId,
      event_source_url: event.eventSourceUrl,
      action_source: event.actionSource || 'website',
      user_data: this.hashUserData(event.userData),
      custom_data: event.customData,
    }
  }

  private async request<T>(
    accessToken: string,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${META_API_BASE}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    const response = await fetchWithTimeout(url, { ...options, headers }, META_API_TIMEOUT_MS)
    const data = await response.json()

    if (!response.ok || (data as MetaApiError).error) {
      const error = (data as MetaApiError).error
      throw new MetaAdsApiError(
        error?.message || 'Unknown API error',
        error?.code,
        error?.error_subcode,
        response.status
      )
    }

    return data as T
  }

  async sendEvent(
    accessToken: string,
    pixelId: string,
    event: CAPIEventInput
  ): Promise<CAPIResponse> {
    return this.sendEvents(accessToken, pixelId, [event])
  }

  async sendEvents(
    accessToken: string,
    pixelId: string,
    events: CAPIEventInput[]
  ): Promise<CAPIResponse> {
    // Split into batches if exceeding max size
    if (events.length > MAX_BATCH_SIZE) {
      let totalEventsReceived = 0
      const allMessages: string[] = []

      for (let i = 0; i < events.length; i += MAX_BATCH_SIZE) {
        const batch = events.slice(i, i + MAX_BATCH_SIZE)
        const batchResponse = await this.sendBatch(accessToken, pixelId, batch)
        totalEventsReceived += batchResponse.eventsReceived
        if (batchResponse.messages) {
          allMessages.push(...batchResponse.messages)
        }
      }

      return {
        eventsReceived: totalEventsReceived,
        messages: allMessages.length > 0 ? allMessages : undefined,
      }
    }

    return this.sendBatch(accessToken, pixelId, events)
  }

  private async sendBatch(
    accessToken: string,
    pixelId: string,
    events: CAPIEventInput[],
    testEventCode?: string
  ): Promise<CAPIResponse> {
    const formattedEvents = events.map((event) => this.formatEvent(event))

    const body: {
      data: CAPIEventFormat[]
      access_token: string
      test_event_code?: string
    } = {
      data: formattedEvents,
      access_token: accessToken,
    }

    if (testEventCode) {
      body.test_event_code = testEventCode
    }

    const response = await this.request<MetaApiCAPIResponse>(
      accessToken,
      `/${pixelId}/events`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    )

    return {
      eventsReceived: response.events_received,
      messages: response.messages,
      fbTraceId: response.fbtrace_id,
    }
  }

  async sendTestEvent(
    accessToken: string,
    pixelId: string,
    testEventCode: string,
    event: CAPIEventInput
  ): Promise<CAPITestEventResponse> {
    try {
      const response = await this.sendBatch(
        accessToken,
        pixelId,
        [event],
        testEventCode
      )

      return {
        success: response.eventsReceived > 0,
      }
    } catch (error) {
      if (error instanceof MetaAdsApiError) {
        return {
          success: false,
          message: error.message,
        }
      }
      throw error
    }
  }
}
