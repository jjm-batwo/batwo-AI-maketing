import type { EcommercePlatform } from '@domain/entities/PlatformIntegration'

/**
 * Platform Adapter Port
 * Application layer interface for e-commerce platform integrations (Cafe24, etc.)
 */

export interface PlatformTokens {
  accessToken: string
  refreshToken?: string
  expiresIn?: number // seconds
  tokenType?: string
}

export interface StoreInfo {
  storeId: string
  storeName: string
  storeUrl?: string
  ownerEmail?: string
  ownerName?: string
  createdAt?: string
}

export interface ScriptInjectionResult {
  scriptTagId: string
  success: boolean
  injectedAt: Date
}

export interface WebhookRegistrationResult {
  webhookId: string
  success: boolean
  registeredAt: Date
}

export interface IPlatformAdapter {
  /**
   * Platform identifier
   */
  readonly platform: EcommercePlatform

  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl(redirectUri: string, state: string): string

  /**
   * Exchange authorization code for access tokens
   */
  exchangeToken(code: string, redirectUri: string): Promise<PlatformTokens>

  /**
   * Refresh expired access token
   */
  refreshToken(refreshToken: string): Promise<PlatformTokens>

  /**
   * Inject Meta Pixel tracking script into store
   */
  injectTrackingScript(
    storeId: string,
    accessToken: string,
    pixelId: string
  ): Promise<ScriptInjectionResult>

  /**
   * Remove tracking script from store
   */
  removeTrackingScript(
    storeId: string,
    accessToken: string,
    scriptTagId: string
  ): Promise<void>

  /**
   * Register webhooks for order events (for CAPI)
   */
  registerWebhooks(
    storeId: string,
    accessToken: string,
    webhookUrl: string
  ): Promise<WebhookRegistrationResult>

  /**
   * Unregister webhooks
   */
  unregisterWebhooks(
    storeId: string,
    accessToken: string,
    webhookId: string
  ): Promise<void>

  /**
   * Get store information
   */
  getStoreInfo(accessToken: string): Promise<StoreInfo>

  /**
   * Validate if tokens are still valid
   */
  validateTokens(accessToken: string): Promise<boolean>
}
