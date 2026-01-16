import type {
  IPlatformAdapter,
  PlatformTokens,
  StoreInfo,
  ScriptInjectionResult,
  WebhookRegistrationResult,
} from '@application/ports/IPlatformAdapter'
import { EcommercePlatform } from '@domain/entities/PlatformIntegration'
import { PlatformApiError } from '../../errors/ExternalServiceError'

const CAFE24_AUTH_BASE = 'https://eclogin.cafe24.com'
const CAFE24_API_BASE = 'https://api.cafe24.com'

// Required scopes for Meta Pixel integration
const REQUIRED_SCOPES = [
  'mall.read_application',
  'mall.write_application',
  'mall.read_store',
  'mall.read_order',
]

interface Cafe24ErrorResponse {
  error?: {
    code: number
    message: string
  }
  error_description?: string
}

interface Cafe24TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
}

interface Cafe24ScriptTagResponse {
  scripttag: {
    script_no: string
    src: string
    display_location: string[]
    created_date: string
  }
}

interface Cafe24WebhookResponse {
  webhook: {
    webhook_no: string
    event: string
    url: string
    created_date: string
  }
}

interface Cafe24StoreResponse {
  store: {
    mall_id: string
    shop_name: string
    base_domain?: string
    primary_domain?: string
    admin_email?: string
    ceo_name?: string
    created_date?: string
  }
}

export class Cafe24Adapter implements IPlatformAdapter {
  readonly platform = EcommercePlatform.CAFE24

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string
  ) {}

  getAuthUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: redirectUri,
      state,
      scope: REQUIRED_SCOPES.join(','),
    })

    return `${CAFE24_AUTH_BASE}/oauth/authorize?${params.toString()}`
  }

  async exchangeToken(code: string, redirectUri: string): Promise<PlatformTokens> {
    const url = `${CAFE24_AUTH_BASE}/api/v2/oauth/token`

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    const data = await response.json()

    if (!response.ok) {
      const errorData = data as Cafe24ErrorResponse
      throw new PlatformApiError(
        errorData.error_description || errorData.error?.message || 'Token exchange failed',
        this.platform,
        response.status
      )
    }

    const tokenData = data as Cafe24TokenResponse
    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type,
    }
  }

  async refreshToken(refreshToken: string): Promise<PlatformTokens> {
    const url = `${CAFE24_AUTH_BASE}/api/v2/oauth/token`

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    const data = await response.json()

    if (!response.ok) {
      const errorData = data as Cafe24ErrorResponse
      throw new PlatformApiError(
        errorData.error_description || errorData.error?.message || 'Token refresh failed',
        this.platform,
        response.status
      )
    }

    const tokenData = data as Cafe24TokenResponse
    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type,
    }
  }

  async injectTrackingScript(
    storeId: string,
    accessToken: string,
    pixelId: string
  ): Promise<ScriptInjectionResult> {
    const url = `${CAFE24_API_BASE}/${storeId}/api/v2/admin/scripttags`

    // Generate the tracking script URL
    const scriptSrc = `https://batwo.ai/api/pixel/${pixelId}/tracker.js`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shop_no: 1,
        src: scriptSrc,
        display_location: ['ALL'],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      const errorData = data as Cafe24ErrorResponse
      throw new PlatformApiError(
        errorData.error?.message || 'Script injection failed',
        this.platform,
        response.status
      )
    }

    const scriptData = data as Cafe24ScriptTagResponse
    return {
      scriptTagId: scriptData.scripttag.script_no,
      success: true,
      injectedAt: new Date(),
    }
  }

  async removeTrackingScript(
    storeId: string,
    accessToken: string,
    scriptTagId: string
  ): Promise<void> {
    const url = `${CAFE24_API_BASE}/${storeId}/api/v2/admin/scripttags/${scriptTagId}`

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const data = await response.json()
      const errorData = data as Cafe24ErrorResponse
      throw new PlatformApiError(
        errorData.error?.message || 'Script removal failed',
        this.platform,
        response.status
      )
    }
  }

  async registerWebhooks(
    storeId: string,
    accessToken: string,
    webhookUrl: string
  ): Promise<WebhookRegistrationResult> {
    const url = `${CAFE24_API_BASE}/${storeId}/api/v2/admin/webhooks`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shop_no: 1,
        event: 'order',
        url: webhookUrl,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      const errorData = data as Cafe24ErrorResponse
      throw new PlatformApiError(
        errorData.error?.message || 'Webhook registration failed',
        this.platform,
        response.status
      )
    }

    const webhookData = data as Cafe24WebhookResponse
    return {
      webhookId: webhookData.webhook.webhook_no,
      success: true,
      registeredAt: new Date(),
    }
  }

  async unregisterWebhooks(
    storeId: string,
    accessToken: string,
    webhookId: string
  ): Promise<void> {
    const url = `${CAFE24_API_BASE}/${storeId}/api/v2/admin/webhooks/${webhookId}`

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const data = await response.json()
      const errorData = data as Cafe24ErrorResponse
      throw new PlatformApiError(
        errorData.error?.message || 'Webhook unregistration failed',
        this.platform,
        response.status
      )
    }
  }

  async getStoreInfo(accessToken: string): Promise<StoreInfo> {
    const url = `${CAFE24_API_BASE}/api/v2/admin/store`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      const errorData = data as Cafe24ErrorResponse
      throw new PlatformApiError(
        errorData.error?.message || 'Failed to retrieve store info',
        this.platform,
        response.status
      )
    }

    const storeData = data as Cafe24StoreResponse
    return {
      storeId: storeData.store.mall_id,
      storeName: storeData.store.shop_name,
      storeUrl: storeData.store.primary_domain || storeData.store.base_domain,
      ownerEmail: storeData.store.admin_email,
      ownerName: storeData.store.ceo_name,
      createdAt: storeData.store.created_date,
    }
  }

  async validateTokens(accessToken: string): Promise<boolean> {
    try {
      await this.getStoreInfo(accessToken)
      return true
    } catch {
      return false
    }
  }
}
