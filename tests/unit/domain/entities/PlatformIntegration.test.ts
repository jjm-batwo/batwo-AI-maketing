import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  PlatformIntegration,
  CreatePlatformIntegrationProps,
  PlatformIntegrationProps,
  EcommercePlatform,
  IntegrationStatus,
} from '@domain/entities/PlatformIntegration'

describe('PlatformIntegration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-15T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const validCreateProps: CreatePlatformIntegrationProps = {
    pixelId: 'pixel-123',
    platform: EcommercePlatform.CAFE24,
    platformStoreId: 'store-abc',
    accessToken: 'access-token-xyz',
  }

  describe('create', () => {
    it('should create a PlatformIntegration with valid data', () => {
      const integration = PlatformIntegration.create(validCreateProps)

      expect(integration.id).toBeDefined()
      expect(integration.pixelId).toBe('pixel-123')
      expect(integration.platform).toBe(EcommercePlatform.CAFE24)
      expect(integration.platformStoreId).toBe('store-abc')
      expect(integration.accessToken).toBe('access-token-xyz')
      expect(integration.status).toBe(IntegrationStatus.PENDING)
      expect(integration.scriptTagId).toBeUndefined()
      expect(integration.webhookId).toBeUndefined()
      expect(integration.lastSyncAt).toBeUndefined()
      expect(integration.errorMessage).toBeUndefined()
      expect(integration.createdAt).toBeDefined()
      expect(integration.updatedAt).toBeDefined()
    })

    it('should create a PlatformIntegration with refresh token', () => {
      const integration = PlatformIntegration.create({
        ...validCreateProps,
        refreshToken: 'refresh-token-123',
        tokenExpiry: new Date('2025-02-15'),
      })

      expect(integration.refreshToken).toBe('refresh-token-123')
      expect(integration.tokenExpiry).toEqual(new Date('2025-02-15'))
    })

    it('should throw error for empty pixelId', () => {
      expect(() =>
        PlatformIntegration.create({
          ...validCreateProps,
          pixelId: '',
        })
      ).toThrow('Pixel ID is required')
    })

    it('should throw error for empty platformStoreId', () => {
      expect(() =>
        PlatformIntegration.create({
          ...validCreateProps,
          platformStoreId: '',
        })
      ).toThrow('Platform store ID is required')
    })

    it('should throw error for empty accessToken', () => {
      expect(() =>
        PlatformIntegration.create({
          ...validCreateProps,
          accessToken: '',
        })
      ).toThrow('Access token is required')
    })
  })

  describe('restore', () => {
    it('should restore PlatformIntegration from persisted data', () => {
      const props: PlatformIntegrationProps = {
        id: 'integration-123',
        pixelId: 'pixel-123',
        platform: EcommercePlatform.CAFE24,
        platformStoreId: 'store-abc',
        accessToken: 'access-token-xyz',
        refreshToken: 'refresh-token-123',
        tokenExpiry: new Date('2025-02-15'),
        scriptTagId: 'script-456',
        webhookId: 'webhook-789',
        status: IntegrationStatus.ACTIVE,
        lastSyncAt: new Date('2025-01-10'),
        errorMessage: undefined,
        createdAt: new Date('2024-12-01'),
        updatedAt: new Date('2024-12-15'),
      }

      const integration = PlatformIntegration.restore(props)

      expect(integration.id).toBe('integration-123')
      expect(integration.status).toBe(IntegrationStatus.ACTIVE)
      expect(integration.scriptTagId).toBe('script-456')
      expect(integration.webhookId).toBe('webhook-789')
      expect(integration.lastSyncAt).toEqual(new Date('2025-01-10'))
    })
  })

  describe('status transitions', () => {
    it('should transition from PENDING to CONNECTED', () => {
      const integration = PlatformIntegration.create(validCreateProps)
      const connected = integration.markConnected()

      expect(connected.status).toBe(IntegrationStatus.CONNECTED)
      expect(integration.status).toBe(IntegrationStatus.PENDING) // Immutability
    })

    it('should transition from CONNECTED to SCRIPT_INJECTED', () => {
      const integration = PlatformIntegration.create(validCreateProps)
        .markConnected()
        .markScriptInjected('script-123')

      expect(integration.status).toBe(IntegrationStatus.SCRIPT_INJECTED)
      expect(integration.scriptTagId).toBe('script-123')
    })

    it('should transition from SCRIPT_INJECTED to ACTIVE', () => {
      const integration = PlatformIntegration.create(validCreateProps)
        .markConnected()
        .markScriptInjected('script-123')
        .markActive()

      expect(integration.status).toBe(IntegrationStatus.ACTIVE)
    })

    it('should allow marking as ERROR from any status', () => {
      const integration = PlatformIntegration.create(validCreateProps)
      const errored = integration.markError('Connection failed')

      expect(errored.status).toBe(IntegrationStatus.ERROR)
      expect(errored.errorMessage).toBe('Connection failed')
    })

    it('should allow marking as DISCONNECTED from any status', () => {
      const integration = PlatformIntegration.create(validCreateProps)
        .markConnected()
        .markScriptInjected('script-123')
        .markActive()
        .markDisconnected()

      expect(integration.status).toBe(IntegrationStatus.DISCONNECTED)
    })
  })

  describe('setWebhookId', () => {
    it('should set webhook ID', () => {
      const integration = PlatformIntegration.create(validCreateProps).markConnected()
      const updated = integration.setWebhookId('webhook-123')

      expect(updated.webhookId).toBe('webhook-123')
      expect(integration.webhookId).toBeUndefined() // Immutability
    })
  })

  describe('updateTokens', () => {
    it('should update access and refresh tokens', () => {
      const integration = PlatformIntegration.create(validCreateProps)
      const updated = integration.updateTokens(
        'new-access-token',
        'new-refresh-token',
        new Date('2025-03-15')
      )

      expect(updated.accessToken).toBe('new-access-token')
      expect(updated.refreshToken).toBe('new-refresh-token')
      expect(updated.tokenExpiry).toEqual(new Date('2025-03-15'))
    })

    it('should throw error for empty access token on update', () => {
      const integration = PlatformIntegration.create(validCreateProps)

      expect(() => integration.updateTokens('', 'refresh', new Date())).toThrow(
        'Access token is required'
      )
    })
  })

  describe('recordSync', () => {
    it('should record last sync time', () => {
      const integration = PlatformIntegration.create(validCreateProps).markConnected()
      const synced = integration.recordSync()

      expect(synced.lastSyncAt).toEqual(new Date('2025-01-15T10:00:00Z'))
    })
  })

  describe('clearError', () => {
    it('should clear error message and reset status to CONNECTED', () => {
      const integration = PlatformIntegration.create(validCreateProps)
        .markConnected()
        .markError('Some error')
        .clearError()

      expect(integration.status).toBe(IntegrationStatus.CONNECTED)
      expect(integration.errorMessage).toBeUndefined()
    })
  })

  describe('isActive', () => {
    it('should return true for ACTIVE status', () => {
      const integration = PlatformIntegration.create(validCreateProps)
        .markConnected()
        .markScriptInjected('script-123')
        .markActive()

      expect(integration.isActive()).toBe(true)
    })

    it('should return false for non-ACTIVE status', () => {
      const integration = PlatformIntegration.create(validCreateProps)

      expect(integration.isActive()).toBe(false)
    })
  })

  describe('hasError', () => {
    it('should return true for ERROR status', () => {
      const integration = PlatformIntegration.create(validCreateProps).markError('Error!')

      expect(integration.hasError()).toBe(true)
    })

    it('should return false for non-ERROR status', () => {
      const integration = PlatformIntegration.create(validCreateProps)

      expect(integration.hasError()).toBe(false)
    })
  })

  describe('needsTokenRefresh', () => {
    it('should return true if token expires within 24 hours', () => {
      const integration = PlatformIntegration.create({
        ...validCreateProps,
        tokenExpiry: new Date('2025-01-15T20:00:00Z'), // 10 hours from now
      })

      expect(integration.needsTokenRefresh()).toBe(true)
    })

    it('should return false if token expires after 24 hours', () => {
      const integration = PlatformIntegration.create({
        ...validCreateProps,
        tokenExpiry: new Date('2025-01-17T10:00:00Z'), // 48 hours from now
      })

      expect(integration.needsTokenRefresh()).toBe(false)
    })

    it('should return false if no token expiry set', () => {
      const integration = PlatformIntegration.create(validCreateProps)

      expect(integration.needsTokenRefresh()).toBe(false)
    })
  })

  describe('immutability', () => {
    it('should be immutable after creation', () => {
      const integration = PlatformIntegration.create(validCreateProps)
      const connected = integration.markConnected()

      expect(integration).not.toBe(connected)
      expect(integration.status).toBe(IntegrationStatus.PENDING)
      expect(connected.status).toBe(IntegrationStatus.CONNECTED)
    })
  })

  describe('toJSON', () => {
    it('should serialize PlatformIntegration to JSON', () => {
      const integration = PlatformIntegration.create(validCreateProps)
      const json = integration.toJSON()

      expect(json.id).toBe(integration.id)
      expect(json.pixelId).toBe('pixel-123')
      expect(json.platform).toBe(EcommercePlatform.CAFE24)
      expect(json.platformStoreId).toBe('store-abc')
      expect(json.status).toBe(IntegrationStatus.PENDING)
      expect(json.createdAt).toBeDefined()
      expect(json.updatedAt).toBeDefined()
    })
  })
})
