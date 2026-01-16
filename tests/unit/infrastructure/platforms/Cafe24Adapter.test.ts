import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Cafe24Adapter } from '@infrastructure/external/platforms/cafe24/Cafe24Adapter'
import type { IPlatformAdapter } from '@application/ports/IPlatformAdapter'
import { EcommercePlatform } from '@domain/entities/PlatformIntegration'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Cafe24Adapter', () => {
  let adapter: IPlatformAdapter

  const mockClientId = 'test-client-id'
  const mockClientSecret = 'test-client-secret'
  const mockAccessToken = 'mock-access-token'
  const mockRefreshToken = 'mock-refresh-token'
  const mockStoreId = 'test-store'
  const mockPixelId = '123456789012345'
  const mockScriptTagId = 'script-123'
  const mockWebhookId = 'webhook-456'

  beforeEach(() => {
    vi.clearAllMocks()
    adapter = new Cafe24Adapter(mockClientId, mockClientSecret)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('platform property', () => {
    it('should return CAFE24 as platform', () => {
      expect(adapter.platform).toBe(EcommercePlatform.CAFE24)
    })
  })

  describe('getAuthUrl', () => {
    it('should generate correct OAuth URL', () => {
      const redirectUri = 'https://example.com/callback'
      const state = 'random-state-123'

      const authUrl = adapter.getAuthUrl(redirectUri, state)

      expect(authUrl).toContain('https://eclogin.cafe24.com/oauth/authorize')
      expect(authUrl).toContain(`client_id=${mockClientId}`)
      expect(authUrl).toContain(`redirect_uri=${encodeURIComponent(redirectUri)}`)
      expect(authUrl).toContain(`state=${state}`)
      expect(authUrl).toContain('response_type=code')
    })

    it('should include required scopes', () => {
      const authUrl = adapter.getAuthUrl('https://example.com/callback', 'state')

      expect(authUrl).toContain('scope=')
      expect(authUrl).toContain('mall.write_application')
    })
  })

  describe('exchangeToken', () => {
    it('should exchange authorization code for tokens', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: mockAccessToken,
          refresh_token: mockRefreshToken,
          expires_in: 21600,
          token_type: 'Bearer',
        }),
      })

      const tokens = await adapter.exchangeToken('auth-code-123', 'https://example.com/callback')

      expect(tokens.accessToken).toBe(mockAccessToken)
      expect(tokens.refreshToken).toBe(mockRefreshToken)
      expect(tokens.expiresIn).toBe(21600)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/oauth/token'),
        expect.objectContaining({
          method: 'POST',
        })
      )
    })

    it('should throw error on invalid code', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'invalid_grant',
          error_description: 'The authorization code has expired or is invalid.',
        }),
      })

      await expect(
        adapter.exchangeToken('invalid-code', 'https://example.com/callback')
      ).rejects.toThrow('The authorization code has expired or is invalid.')
    })
  })

  describe('refreshToken', () => {
    it('should refresh expired access token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 21600,
        }),
      })

      const tokens = await adapter.refreshToken(mockRefreshToken)

      expect(tokens.accessToken).toBe('new-access-token')
      expect(tokens.refreshToken).toBe('new-refresh-token')
    })

    it('should throw error on invalid refresh token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'invalid_grant',
          error_description: 'The refresh token is invalid.',
        }),
      })

      await expect(adapter.refreshToken('invalid-token')).rejects.toThrow(
        'The refresh token is invalid.'
      )
    })
  })

  describe('injectTrackingScript', () => {
    it('should inject Meta Pixel tracking script', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          scripttag: {
            script_no: mockScriptTagId,
            src: expect.stringContaining(mockPixelId),
          },
        }),
      })

      const result = await adapter.injectTrackingScript(
        mockStoreId,
        mockAccessToken,
        mockPixelId
      )

      expect(result.scriptTagId).toBe(mockScriptTagId)
      expect(result.success).toBe(true)
      expect(result.injectedAt).toBeInstanceOf(Date)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v2/admin/scripttags`),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockAccessToken}`,
          }),
        })
      )
    })

    it('should throw error on script injection failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: {
            code: 403,
            message: 'You do not have permission to create script tags.',
          },
        }),
      })

      await expect(
        adapter.injectTrackingScript(mockStoreId, mockAccessToken, mockPixelId)
      ).rejects.toThrow('You do not have permission to create script tags.')
    })
  })

  describe('removeTrackingScript', () => {
    it('should remove tracking script from store', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      await expect(
        adapter.removeTrackingScript(mockStoreId, mockAccessToken, mockScriptTagId)
      ).resolves.not.toThrow()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v2/admin/scripttags/${mockScriptTagId}`),
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })

    it('should throw error if script tag not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: {
            code: 404,
            message: 'Script tag not found.',
          },
        }),
      })

      await expect(
        adapter.removeTrackingScript(mockStoreId, mockAccessToken, 'nonexistent')
      ).rejects.toThrow('Script tag not found.')
    })
  })

  describe('registerWebhooks', () => {
    it('should register order event webhooks', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          webhook: {
            webhook_no: mockWebhookId,
            event: 'order',
            url: 'https://example.com/webhooks/cafe24',
          },
        }),
      })

      const result = await adapter.registerWebhooks(
        mockStoreId,
        mockAccessToken,
        'https://example.com/webhooks/cafe24'
      )

      expect(result.webhookId).toBe(mockWebhookId)
      expect(result.success).toBe(true)
      expect(result.registeredAt).toBeInstanceOf(Date)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/admin/webhooks'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('order'),
        })
      )
    })

    it('should throw error on webhook registration failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            code: 400,
            message: 'Invalid webhook URL.',
          },
        }),
      })

      await expect(
        adapter.registerWebhooks(mockStoreId, mockAccessToken, 'invalid-url')
      ).rejects.toThrow('Invalid webhook URL.')
    })
  })

  describe('unregisterWebhooks', () => {
    it('should unregister webhooks', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      await expect(
        adapter.unregisterWebhooks(mockStoreId, mockAccessToken, mockWebhookId)
      ).resolves.not.toThrow()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v2/admin/webhooks/${mockWebhookId}`),
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })
  })

  describe('getStoreInfo', () => {
    it('should retrieve store information', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          store: {
            mall_id: mockStoreId,
            shop_name: 'Test Store',
            base_domain: 'test-store.cafe24.com',
            primary_domain: 'www.teststore.com',
            admin_email: 'admin@teststore.com',
            ceo_name: 'Test CEO',
            created_date: '2024-01-15T00:00:00+09:00',
          },
        }),
      })

      const storeInfo = await adapter.getStoreInfo(mockAccessToken)

      expect(storeInfo.storeId).toBe(mockStoreId)
      expect(storeInfo.storeName).toBe('Test Store')
      expect(storeInfo.storeUrl).toBe('www.teststore.com')
      expect(storeInfo.ownerEmail).toBe('admin@teststore.com')
      expect(storeInfo.ownerName).toBe('Test CEO')
    })

    it('should throw error on invalid token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: {
            code: 401,
            message: 'Access token is invalid or expired.',
          },
        }),
      })

      await expect(adapter.getStoreInfo('invalid-token')).rejects.toThrow(
        'Access token is invalid or expired.'
      )
    })
  })

  describe('validateTokens', () => {
    it('should return true for valid tokens', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          store: { mall_id: mockStoreId },
        }),
      })

      const isValid = await adapter.validateTokens(mockAccessToken)

      expect(isValid).toBe(true)
    })

    it('should return false for invalid tokens', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: { code: 401 },
        }),
      })

      const isValid = await adapter.validateTokens('invalid-token')

      expect(isValid).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(adapter.getStoreInfo(mockAccessToken)).rejects.toThrow(
        'Network error'
      )
    })

    it('should handle rate limiting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: {
            code: 429,
            message: 'Too many requests. Please try again later.',
          },
        }),
      })

      await expect(adapter.getStoreInfo(mockAccessToken)).rejects.toThrow(
        'Too many requests. Please try again later.'
      )
    })
  })
})
