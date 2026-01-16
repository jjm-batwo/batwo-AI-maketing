import type {
  CAPIEventFormat,
  UserData,
  CustomData,
} from '@domain/entities/ConversionEvent'

/**
 * Conversions API (CAPI) Service Port
 * Application layer interface for Meta CAPI operations
 */

export interface CAPIEventInput {
  eventName: string
  eventTime: Date
  eventId: string
  eventSourceUrl?: string
  userData?: UserData
  customData?: CustomData
  actionSource?: 'website' | 'app' | 'physical_store' | 'system_generated' | 'other'
}

export interface CAPIResponse {
  eventsReceived: number
  messages?: string[]
  fbTraceId?: string
}

export interface CAPITestEventResponse {
  success: boolean
  message?: string
}

export interface ICAPIService {
  /**
   * Send a single conversion event to Meta CAPI
   */
  sendEvent(
    accessToken: string,
    pixelId: string,
    event: CAPIEventInput
  ): Promise<CAPIResponse>

  /**
   * Send multiple conversion events to Meta CAPI (batch, max 1000)
   */
  sendEvents(
    accessToken: string,
    pixelId: string,
    events: CAPIEventInput[]
  ): Promise<CAPIResponse>

  /**
   * Send a test event to verify CAPI integration
   */
  sendTestEvent(
    accessToken: string,
    pixelId: string,
    testEventCode: string,
    event: CAPIEventInput
  ): Promise<CAPITestEventResponse>

  /**
   * Convert domain event to CAPI format with proper hashing
   */
  formatEvent(event: CAPIEventInput): CAPIEventFormat
}
