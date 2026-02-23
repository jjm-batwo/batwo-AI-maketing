import { InvalidConversionEventError } from '../errors/InvalidConversionEventError'

/**
 * Standard Meta Pixel event names
 * @see https://developers.facebook.com/docs/meta-pixel/reference
 */
export const StandardEventName = {
  PAGE_VIEW: 'PageView',
  VIEW_CONTENT: 'ViewContent',
  ADD_TO_CART: 'AddToCart',
  ADD_TO_WISHLIST: 'AddToWishlist',
  INITIATE_CHECKOUT: 'InitiateCheckout',
  ADD_PAYMENT_INFO: 'AddPaymentInfo',
  PURCHASE: 'Purchase',
  LEAD: 'Lead',
  COMPLETE_REGISTRATION: 'CompleteRegistration',
  SEARCH: 'Search',
} as const

export type StandardEventNameType = (typeof StandardEventName)[keyof typeof StandardEventName]

/**
 * User data for CAPI (should be hashed before sending)
 */
export interface UserData {
  em?: string // Hashed email
  ph?: string // Hashed phone
  fn?: string // Hashed first name
  ln?: string // Hashed last name
  ct?: string // Hashed city
  st?: string // Hashed state
  zp?: string // Hashed zip code
  country?: string // Hashed country
  external_id?: string // External user ID
  client_ip_address?: string
  client_user_agent?: string
  fbc?: string // Click ID
  fbp?: string // Browser ID
}

/**
 * Custom data for specific events (Purchase, AddToCart, etc.)
 */
export interface CustomData {
  value?: number
  currency?: string
  content_ids?: string[]
  content_type?: string
  content_name?: string
  content_category?: string
  num_items?: number
  search_string?: string
  status?: string
  order_id?: string
}

/**
 * CAPI event format for Meta Graph API
 */
export interface CAPIEventFormat {
  event_name: string
  event_id: string
  event_time: number
  event_source_url?: string
  user_data?: UserData
  custom_data?: CustomData
  action_source: 'website' | 'app' | 'physical_store' | 'system_generated' | 'other'
}

export interface CreateConversionEventProps {
  pixelId: string
  eventName: string
  eventId: string
  eventTime: Date
  eventSourceUrl?: string
  userData?: UserData
  customData?: CustomData
}

export interface ConversionEventProps extends CreateConversionEventProps {
  id: string
  sentToMeta: boolean
  metaResponseId?: string
  createdAt: Date
}

export class ConversionEvent {
  private constructor(
    private readonly _id: string,
    private readonly _pixelId: string,
    private readonly _eventName: string,
    private readonly _eventId: string,
    private readonly _eventTime: Date,
    private readonly _eventSourceUrl: string | undefined,
    private readonly _userData: UserData | undefined,
    private readonly _customData: CustomData | undefined,
    private readonly _sentToMeta: boolean,
    private readonly _metaResponseId: string | undefined,
    private readonly _createdAt: Date
  ) {}

  static create(props: CreateConversionEventProps): ConversionEvent {
    ConversionEvent.validatePixelId(props.pixelId)
    ConversionEvent.validateEventName(props.eventName)
    ConversionEvent.validateEventId(props.eventId)
    ConversionEvent.validateEventTime(props.eventTime)
    ConversionEvent.validateCustomData(props.eventName, props.customData)

    return new ConversionEvent(
      crypto.randomUUID(),
      props.pixelId,
      props.eventName,
      props.eventId,
      props.eventTime,
      props.eventSourceUrl,
      props.userData,
      props.customData,
      false, // sentToMeta
      undefined, // metaResponseId
      new Date()
    )
  }

  static restore(props: ConversionEventProps): ConversionEvent {
    return new ConversionEvent(
      props.id,
      props.pixelId,
      props.eventName,
      props.eventId,
      props.eventTime,
      props.eventSourceUrl,
      props.userData,
      props.customData,
      props.sentToMeta,
      props.metaResponseId,
      props.createdAt
    )
  }

  private static validatePixelId(pixelId: string): void {
    if (!pixelId || pixelId.trim().length === 0) {
      throw InvalidConversionEventError.emptyPixelId()
    }
  }

  private static validateEventName(eventName: string): void {
    if (!eventName || eventName.trim().length === 0) {
      throw InvalidConversionEventError.emptyEventName()
    }
  }

  private static validateEventId(eventId: string): void {
    if (!eventId || eventId.trim().length === 0) {
      throw InvalidConversionEventError.emptyEventId()
    }
  }

  private static validateEventTime(eventTime: Date): void {
    if (eventTime > new Date()) {
      throw InvalidConversionEventError.futureEventTime()
    }
  }

  /**
   * 이벤트 유형별 customData 필드 검증
   * - Purchase: value, currency 필수 (에러 throw)
   * - AddToCart: content_ids 또는 content_name 권장 (console.warn)
   * - InitiateCheckout: value, currency 권장 (console.warn)
   * - CompleteRegistration: status 권장 (console.warn)
   */
  private static validateCustomData(eventName: string, customData?: CustomData): void {
    if (eventName === StandardEventName.PURCHASE) {
      // Purchase는 value, currency 필수
      if (customData?.value == null) {
        throw InvalidConversionEventError.missingPurchaseValue()
      }
      if (!customData?.currency) {
        throw InvalidConversionEventError.missingPurchaseCurrency()
      }
      return
    }

    // AddToCart, InitiateCheckout, CompleteRegistration:
    // 권장 필드 누락은 에러 없이 허용 (상위 레이어에서 필요시 검증)
  }

  // Getters
  get id(): string {
    return this._id
  }

  get pixelId(): string {
    return this._pixelId
  }

  get eventName(): string {
    return this._eventName
  }

  get eventId(): string {
    return this._eventId
  }

  get eventTime(): Date {
    return new Date(this._eventTime)
  }

  get eventSourceUrl(): string | undefined {
    return this._eventSourceUrl
  }

  get userData(): UserData | undefined {
    return this._userData ? { ...this._userData } : undefined
  }

  get customData(): CustomData | undefined {
    return this._customData ? { ...this._customData } : undefined
  }

  get sentToMeta(): boolean {
    return this._sentToMeta
  }

  get metaResponseId(): string | undefined {
    return this._metaResponseId
  }

  get createdAt(): Date {
    return new Date(this._createdAt)
  }

  // State checks
  isPending(): boolean {
    return !this._sentToMeta
  }

  /**
   * Check if event is stale (older than 7 days)
   * Meta CAPI accepts events up to 7 days old
   */
  isStale(): boolean {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return this._eventTime < sevenDaysAgo
  }

  // Commands (immutable - return new instances)
  markSentToMeta(metaResponseId: string): ConversionEvent {
    if (this._sentToMeta) {
      throw InvalidConversionEventError.alreadySentToMeta()
    }

    return new ConversionEvent(
      this._id,
      this._pixelId,
      this._eventName,
      this._eventId,
      this._eventTime,
      this._eventSourceUrl,
      this._userData,
      this._customData,
      true,
      metaResponseId,
      this._createdAt
    )
  }

  /**
   * Convert to CAPI format for Meta Graph API
   */
  toCAPIFormat(): CAPIEventFormat {
    return {
      event_name: this._eventName,
      event_id: this._eventId,
      event_time: Math.floor(this._eventTime.getTime() / 1000), // Unix timestamp in seconds
      event_source_url: this._eventSourceUrl,
      user_data: this._userData,
      custom_data: this._customData,
      action_source: 'website',
    }
  }

  toJSON(): ConversionEventProps {
    return {
      id: this._id,
      pixelId: this._pixelId,
      eventName: this._eventName,
      eventId: this._eventId,
      eventTime: this._eventTime,
      eventSourceUrl: this._eventSourceUrl,
      userData: this._userData,
      customData: this._customData,
      sentToMeta: this._sentToMeta,
      metaResponseId: this._metaResponseId,
      createdAt: this._createdAt,
    }
  }
}
