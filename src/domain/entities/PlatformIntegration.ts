import { InvalidPlatformIntegrationError } from '../errors/InvalidPlatformIntegrationError'

export enum EcommercePlatform {
  CAFE24 = 'CAFE24',
  CUSTOM = 'CUSTOM',
  NAVER_SMARTSTORE = 'NAVER_SMARTSTORE', // 네이버 스마트스토어 플랫폼
}

export enum IntegrationStatus {
  PENDING = 'PENDING',
  CONNECTED = 'CONNECTED',
  SCRIPT_INJECTED = 'SCRIPT_INJECTED',
  ACTIVE = 'ACTIVE',
  ERROR = 'ERROR',
  DISCONNECTED = 'DISCONNECTED',
}

export interface CreatePlatformIntegrationProps {
  pixelId: string
  platform: EcommercePlatform
  platformStoreId: string
  accessToken: string
  refreshToken?: string
  tokenExpiry?: Date
}

export interface PlatformIntegrationProps extends CreatePlatformIntegrationProps {
  id: string
  scriptTagId?: string
  webhookId?: string
  status: IntegrationStatus
  lastSyncAt?: Date
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
}

export class PlatformIntegration {
  private constructor(
    private readonly _id: string,
    private readonly _pixelId: string,
    private readonly _platform: EcommercePlatform,
    private readonly _platformStoreId: string,
    private readonly _accessToken: string,
    private readonly _refreshToken: string | undefined,
    private readonly _tokenExpiry: Date | undefined,
    private readonly _scriptTagId: string | undefined,
    private readonly _webhookId: string | undefined,
    private readonly _status: IntegrationStatus,
    private readonly _lastSyncAt: Date | undefined,
    private readonly _errorMessage: string | undefined,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date
  ) {}

  static create(props: CreatePlatformIntegrationProps): PlatformIntegration {
    PlatformIntegration.validatePixelId(props.pixelId)
    PlatformIntegration.validatePlatformStoreId(props.platformStoreId)
    PlatformIntegration.validateAccessToken(props.accessToken)

    const now = new Date()

    return new PlatformIntegration(
      crypto.randomUUID(),
      props.pixelId,
      props.platform,
      props.platformStoreId,
      props.accessToken,
      props.refreshToken,
      props.tokenExpiry,
      undefined, // scriptTagId
      undefined, // webhookId
      IntegrationStatus.PENDING,
      undefined, // lastSyncAt
      undefined, // errorMessage
      now,
      now
    )
  }

  static restore(props: PlatformIntegrationProps): PlatformIntegration {
    return new PlatformIntegration(
      props.id,
      props.pixelId,
      props.platform,
      props.platformStoreId,
      props.accessToken,
      props.refreshToken,
      props.tokenExpiry,
      props.scriptTagId,
      props.webhookId,
      props.status,
      props.lastSyncAt,
      props.errorMessage,
      props.createdAt,
      props.updatedAt
    )
  }

  private static validatePixelId(pixelId: string): void {
    if (!pixelId || pixelId.trim().length === 0) {
      throw InvalidPlatformIntegrationError.emptyPixelId()
    }
  }

  private static validatePlatformStoreId(platformStoreId: string): void {
    if (!platformStoreId || platformStoreId.trim().length === 0) {
      throw InvalidPlatformIntegrationError.emptyPlatformStoreId()
    }
  }

  private static validateAccessToken(accessToken: string): void {
    if (!accessToken || accessToken.trim().length === 0) {
      throw InvalidPlatformIntegrationError.emptyAccessToken()
    }
  }

  // Getters
  get id(): string {
    return this._id
  }

  get pixelId(): string {
    return this._pixelId
  }

  get platform(): EcommercePlatform {
    return this._platform
  }

  get platformStoreId(): string {
    return this._platformStoreId
  }

  get accessToken(): string {
    return this._accessToken
  }

  get refreshToken(): string | undefined {
    return this._refreshToken
  }

  get tokenExpiry(): Date | undefined {
    return this._tokenExpiry ? new Date(this._tokenExpiry) : undefined
  }

  get scriptTagId(): string | undefined {
    return this._scriptTagId
  }

  get webhookId(): string | undefined {
    return this._webhookId
  }

  get status(): IntegrationStatus {
    return this._status
  }

  get lastSyncAt(): Date | undefined {
    return this._lastSyncAt ? new Date(this._lastSyncAt) : undefined
  }

  get errorMessage(): string | undefined {
    return this._errorMessage
  }

  get createdAt(): Date {
    return new Date(this._createdAt)
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt)
  }

  // State checks
  isActive(): boolean {
    return this._status === IntegrationStatus.ACTIVE
  }

  hasError(): boolean {
    return this._status === IntegrationStatus.ERROR
  }

  needsTokenRefresh(): boolean {
    if (!this._tokenExpiry) return false

    const now = new Date()
    const hoursUntilExpiry = (this._tokenExpiry.getTime() - now.getTime()) / (1000 * 60 * 60)

    return hoursUntilExpiry <= 24
  }

  // Commands (immutable - return new instances)
  markConnected(): PlatformIntegration {
    return new PlatformIntegration(
      this._id,
      this._pixelId,
      this._platform,
      this._platformStoreId,
      this._accessToken,
      this._refreshToken,
      this._tokenExpiry,
      this._scriptTagId,
      this._webhookId,
      IntegrationStatus.CONNECTED,
      this._lastSyncAt,
      undefined, // Clear error on successful connection
      this._createdAt,
      new Date()
    )
  }

  markScriptInjected(scriptTagId: string): PlatformIntegration {
    return new PlatformIntegration(
      this._id,
      this._pixelId,
      this._platform,
      this._platformStoreId,
      this._accessToken,
      this._refreshToken,
      this._tokenExpiry,
      scriptTagId,
      this._webhookId,
      IntegrationStatus.SCRIPT_INJECTED,
      this._lastSyncAt,
      undefined,
      this._createdAt,
      new Date()
    )
  }

  markActive(): PlatformIntegration {
    return new PlatformIntegration(
      this._id,
      this._pixelId,
      this._platform,
      this._platformStoreId,
      this._accessToken,
      this._refreshToken,
      this._tokenExpiry,
      this._scriptTagId,
      this._webhookId,
      IntegrationStatus.ACTIVE,
      new Date(), // Record sync on activation
      undefined,
      this._createdAt,
      new Date()
    )
  }

  markError(errorMessage: string): PlatformIntegration {
    return new PlatformIntegration(
      this._id,
      this._pixelId,
      this._platform,
      this._platformStoreId,
      this._accessToken,
      this._refreshToken,
      this._tokenExpiry,
      this._scriptTagId,
      this._webhookId,
      IntegrationStatus.ERROR,
      this._lastSyncAt,
      errorMessage,
      this._createdAt,
      new Date()
    )
  }

  markDisconnected(): PlatformIntegration {
    return new PlatformIntegration(
      this._id,
      this._pixelId,
      this._platform,
      this._platformStoreId,
      this._accessToken,
      this._refreshToken,
      this._tokenExpiry,
      this._scriptTagId,
      this._webhookId,
      IntegrationStatus.DISCONNECTED,
      this._lastSyncAt,
      undefined,
      this._createdAt,
      new Date()
    )
  }

  setWebhookId(webhookId: string): PlatformIntegration {
    return new PlatformIntegration(
      this._id,
      this._pixelId,
      this._platform,
      this._platformStoreId,
      this._accessToken,
      this._refreshToken,
      this._tokenExpiry,
      this._scriptTagId,
      webhookId,
      this._status,
      this._lastSyncAt,
      this._errorMessage,
      this._createdAt,
      new Date()
    )
  }

  updateTokens(
    accessToken: string,
    refreshToken?: string,
    tokenExpiry?: Date
  ): PlatformIntegration {
    PlatformIntegration.validateAccessToken(accessToken)

    return new PlatformIntegration(
      this._id,
      this._pixelId,
      this._platform,
      this._platformStoreId,
      accessToken,
      refreshToken,
      tokenExpiry,
      this._scriptTagId,
      this._webhookId,
      this._status,
      this._lastSyncAt,
      this._errorMessage,
      this._createdAt,
      new Date()
    )
  }

  recordSync(): PlatformIntegration {
    return new PlatformIntegration(
      this._id,
      this._pixelId,
      this._platform,
      this._platformStoreId,
      this._accessToken,
      this._refreshToken,
      this._tokenExpiry,
      this._scriptTagId,
      this._webhookId,
      this._status,
      new Date(),
      this._errorMessage,
      this._createdAt,
      new Date()
    )
  }

  clearError(): PlatformIntegration {
    return new PlatformIntegration(
      this._id,
      this._pixelId,
      this._platform,
      this._platformStoreId,
      this._accessToken,
      this._refreshToken,
      this._tokenExpiry,
      this._scriptTagId,
      this._webhookId,
      IntegrationStatus.CONNECTED,
      this._lastSyncAt,
      undefined,
      this._createdAt,
      new Date()
    )
  }

  toJSON(): PlatformIntegrationProps {
    return {
      id: this._id,
      pixelId: this._pixelId,
      platform: this._platform,
      platformStoreId: this._platformStoreId,
      accessToken: this._accessToken,
      refreshToken: this._refreshToken,
      tokenExpiry: this._tokenExpiry,
      scriptTagId: this._scriptTagId,
      webhookId: this._webhookId,
      status: this._status,
      lastSyncAt: this._lastSyncAt,
      errorMessage: this._errorMessage,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    }
  }
}
