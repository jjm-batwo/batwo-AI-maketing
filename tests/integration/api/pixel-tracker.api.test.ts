/**
 * 🔴 RED Phase: Pixel Tracker API Integration Tests
 *
 * These tests verify that Pixel Tracker routes work correctly.
 * The tracker.js and event endpoints are public (no auth required).
 */

import { describe, it, expect } from 'vitest'
import { setupIntegrationTest, getPrismaClient, createTestUser } from '../setup'
import { TrackingScriptService } from '@infrastructure/external/tracking/TrackingScriptService'

describe('Pixel Tracker API Integration', () => {
  setupIntegrationTest()

  describe('TrackingScriptService Integration', () => {
    const APP_BASE_URL = 'https://batwo.ai'

    it('should generate JavaScript tracking script for valid pixel ID', () => {
      const service = new TrackingScriptService({ appBaseUrl: APP_BASE_URL })
      const validPixelId = '123456789012345'

      const script = service.generatePixelScript(validPixelId)

      expect(script).toContain('fbq')
      expect(script).toContain(validPixelId)
    })

    it('should include Meta Pixel SDK initialization', () => {
      const service = new TrackingScriptService({ appBaseUrl: APP_BASE_URL })
      const validPixelId = '123456789012345'

      const script = service.generatePixelScript(validPixelId)

      expect(script).toContain('connect.facebook.net')
      expect(script).toContain('fbevents.js')
      expect(script).toContain(`fbq('init', '${validPixelId}')`)
      expect(script).toContain("fbq('track', 'PageView')")
    })

    it('should include batwoPixel enhanced tracking object', () => {
      const service = new TrackingScriptService({ appBaseUrl: APP_BASE_URL })
      const validPixelId = '123456789012345'

      const script = service.generatePixelScript(validPixelId)

      expect(script).toContain('window.batwoPixel')
      expect(script).toContain('trackEvent')
      expect(script).toContain('trackPurchase')
      expect(script).toContain('trackAddToCart')
      expect(script).toContain('trackInitiateCheckout')
      expect(script).toContain('trackLead')
    })

    it('should include event endpoint URL', () => {
      const service = new TrackingScriptService({ appBaseUrl: APP_BASE_URL })
      const validPixelId = '123456789012345'

      const script = service.generatePixelScript(validPixelId)

      expect(script).toContain(`${APP_BASE_URL}/api/pixel/${validPixelId}/event`)
    })

    it('should throw error for invalid pixel ID format', () => {
      const service = new TrackingScriptService({ appBaseUrl: APP_BASE_URL })
      const invalidPixelId = 'invalid-pixel-id'

      expect(() => service.generatePixelScript(invalidPixelId)).toThrow()
    })

    it('should throw error for too short pixel ID', () => {
      const service = new TrackingScriptService({ appBaseUrl: APP_BASE_URL })
      const shortPixelId = '12345'

      expect(() => service.generatePixelScript(shortPixelId)).toThrow()
    })

    it('should return proper cache headers', () => {
      const service = new TrackingScriptService({ appBaseUrl: APP_BASE_URL })

      const headers = service.getCacheHeaders()

      expect(headers['Cache-Control']).toContain('max-age=')
      expect(headers['X-Content-Type-Options']).toBe('nosniff')
      expect(headers['Content-Type']).toContain('application/javascript')
    })
  })

  describe('Event Payload Parsing', () => {
    const APP_BASE_URL = 'https://batwo.ai'

    it('should parse valid event payload', () => {
      const service = new TrackingScriptService({ appBaseUrl: APP_BASE_URL })
      const eventPayload = {
        event: 'PageView',
        eventId: 'evt_123456789',
        timestamp: Date.now(),
        url: 'https://example.com/product/123',
        params: {
          content_type: 'product',
          content_ids: ['123'],
        },
      }

      const parsed = service.parseEventPayload(JSON.stringify(eventPayload))

      expect(parsed.eventName).toBe('PageView')
      expect(parsed.eventId).toBe('evt_123456789')
      expect(parsed.eventSourceUrl).toBe('https://example.com/product/123')
      expect(parsed.customData).toEqual(eventPayload.params)
    })

    it('should parse Purchase event with value', () => {
      const service = new TrackingScriptService({ appBaseUrl: APP_BASE_URL })
      const eventPayload = {
        event: 'Purchase',
        eventId: 'evt_purchase_123',
        timestamp: Date.now(),
        url: 'https://example.com/thank-you',
        params: {
          value: 99000,
          currency: 'KRW',
          content_ids: ['product-1', 'product-2'],
          content_type: 'product',
        },
      }

      const parsed = service.parseEventPayload(JSON.stringify(eventPayload))

      expect(parsed.eventName).toBe('Purchase')
      expect(parsed.eventId).toBe('evt_purchase_123')
      expect(parsed.customData?.value).toBe(99000)
      expect(parsed.customData?.currency).toBe('KRW')
    })

    it('should parse AddToCart event', () => {
      const service = new TrackingScriptService({ appBaseUrl: APP_BASE_URL })
      const eventPayload = {
        event: 'AddToCart',
        eventId: 'evt_cart_456',
        timestamp: Date.now(),
        params: {
          value: 29000,
          currency: 'KRW',
          content_ids: ['product-123'],
          content_name: '테스트 상품',
        },
      }

      const parsed = service.parseEventPayload(JSON.stringify(eventPayload))

      expect(parsed.eventName).toBe('AddToCart')
      expect(parsed.customData?.content_name).toBe('테스트 상품')
    })

    it('should throw error for missing event name', () => {
      const service = new TrackingScriptService({ appBaseUrl: APP_BASE_URL })
      const invalidPayload = {
        eventId: 'evt_123',
        timestamp: Date.now(),
      }

      expect(() => service.parseEventPayload(JSON.stringify(invalidPayload))).toThrow('event')
    })

    it('should throw error for missing eventId', () => {
      const service = new TrackingScriptService({ appBaseUrl: APP_BASE_URL })
      const invalidPayload = {
        event: 'PageView',
        timestamp: Date.now(),
      }

      expect(() => service.parseEventPayload(JSON.stringify(invalidPayload))).toThrow('eventId')
    })

    it('should throw error for empty payload', () => {
      const service = new TrackingScriptService({ appBaseUrl: APP_BASE_URL })

      expect(() => service.parseEventPayload('')).toThrow()
    })

    it('should throw error for invalid JSON', () => {
      const service = new TrackingScriptService({ appBaseUrl: APP_BASE_URL })

      expect(() => service.parseEventPayload('{invalid json}')).toThrow()
    })

    it('should handle optional userData for hashing', () => {
      const service = new TrackingScriptService({ appBaseUrl: APP_BASE_URL })
      const eventPayload = {
        event: 'Lead',
        eventId: 'evt_lead_789',
        timestamp: Date.now(),
        userData: {
          em: 'test@example.com',
          ph: '01012345678',
        },
        params: {
          value: 0,
          currency: 'KRW',
        },
      }

      const parsed = service.parseEventPayload(JSON.stringify(eventPayload))

      expect(parsed.userData?.em).toBe('test@example.com')
      expect(parsed.userData?.ph).toBe('01012345678')
    })
  })

  describe('Script Snippet Generation', () => {
    const APP_BASE_URL = 'https://batwo.ai'

    it('should return script snippet with all components', () => {
      const service = new TrackingScriptService({ appBaseUrl: APP_BASE_URL })
      const validPixelId = '123456789012345'

      const snippet = service.generateScriptSnippet(validPixelId)

      expect(snippet.script).toBeDefined()
      expect(snippet.noscript).toBeDefined()
      expect(snippet.pixelId).toBe(validPixelId)
      expect(snippet.instructions).toBeDefined()
    })

    it('should include proper script tag in snippet', () => {
      const service = new TrackingScriptService({ appBaseUrl: APP_BASE_URL })
      const validPixelId = '123456789012345'

      const snippet = service.generateScriptSnippet(validPixelId)

      expect(snippet.script).toContain('fbq')
      expect(snippet.script).toContain('Meta Pixel Code')
    })

    it('should include noscript fallback', () => {
      const service = new TrackingScriptService({ appBaseUrl: APP_BASE_URL })
      const validPixelId = '123456789012345'

      const snippet = service.generateScriptSnippet(validPixelId)

      expect(snippet.noscript).toContain('<noscript>')
      expect(snippet.noscript).toContain('facebook.com/tr')
      expect(snippet.noscript).toContain(validPixelId)
    })

    it('should include installation instructions in Korean', () => {
      const service = new TrackingScriptService({ appBaseUrl: APP_BASE_URL })
      const validPixelId = '123456789012345'

      const snippet = service.generateScriptSnippet(validPixelId)

      expect(snippet.instructions).toContain('설치 방법')
      expect(snippet.instructions).toContain('<head>')
      expect(snippet.instructions).toContain('카페24')
    })

    it('should throw error for invalid pixel ID', () => {
      const service = new TrackingScriptService({ appBaseUrl: APP_BASE_URL })
      const invalidPixelId = 'abc'

      expect(() => service.generateScriptSnippet(invalidPixelId)).toThrow()
    })
  })

  describe('Database Integration - ConversionEvent Storage', () => {
    it('should store conversion event in database', async () => {
      const prisma = getPrismaClient()
      const user = await createTestUser()

      // Create a test MetaPixel
      const pixel = await prisma.metaPixel.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          metaPixelId: '123456789012345',
          name: 'Test Pixel',
          isActive: true,
        },
      })

      // Create a conversion event
      const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const event = await prisma.conversionEvent.create({
        data: {
          pixelId: pixel.id,
          eventName: 'Purchase',
          eventId: eventId,
          eventTime: new Date(),
          eventSourceUrl: 'https://example.com/thank-you',
          customData: {
            value: 99000,
            currency: 'KRW',
            content_ids: ['product-1'],
          },
          sentToMeta: false,
        },
      })

      // Verify event was stored
      const savedEvent = await prisma.conversionEvent.findUnique({
        where: { id: event.id },
      })

      expect(savedEvent).not.toBeNull()
      expect(savedEvent!.eventName).toBe('Purchase')
      expect(savedEvent!.eventId).toBe(eventId)
      expect(savedEvent!.sentToMeta).toBe(false)
    })

    it('should enforce unique eventId per pixel', async () => {
      const prisma = getPrismaClient()
      const user = await createTestUser()

      const pixel = await prisma.metaPixel.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          metaPixelId: '123456789012345',
          name: 'Test Pixel',
          isActive: true,
        },
      })

      const eventId = 'evt_duplicate_test'

      // Create first event
      await prisma.conversionEvent.create({
        data: {
          pixelId: pixel.id,
          eventName: 'PageView',
          eventId: eventId,
          eventTime: new Date(),
          sentToMeta: false,
        },
      })

      // Try to create duplicate event
      await expect(
        prisma.conversionEvent.create({
          data: {
            pixelId: pixel.id,
            eventName: 'PageView',
            eventId: eventId, // Same eventId
            eventTime: new Date(),
            sentToMeta: false,
          },
        })
      ).rejects.toThrow()
    })

    it('should allow same eventId for different pixels', async () => {
      const prisma = getPrismaClient()
      const user = await createTestUser()

      // Create two pixels
      const pixel1 = await prisma.metaPixel.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          metaPixelId: '111111111111111',
          name: 'Pixel 1',
          isActive: true,
        },
      })

      const pixel2 = await prisma.metaPixel.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          metaPixelId: '222222222222222',
          name: 'Pixel 2',
          isActive: true,
        },
      })

      const eventId = 'evt_shared_id'

      // Create event for pixel1
      const event1 = await prisma.conversionEvent.create({
        data: {
          pixelId: pixel1.id,
          eventName: 'PageView',
          eventId: eventId,
          eventTime: new Date(),
          sentToMeta: false,
        },
      })

      // Create event with same eventId for pixel2 (should succeed)
      const event2 = await prisma.conversionEvent.create({
        data: {
          pixelId: pixel2.id,
          eventName: 'PageView',
          eventId: eventId, // Same eventId, different pixel
          eventTime: new Date(),
          sentToMeta: false,
        },
      })

      expect(event1.eventId).toBe(eventId)
      expect(event2.eventId).toBe(eventId)
      expect(event1.pixelId).not.toBe(event2.pixelId)
    })

    it('should update sentToMeta flag after CAPI transmission', async () => {
      const prisma = getPrismaClient()
      const user = await createTestUser()

      const pixel = await prisma.metaPixel.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          metaPixelId: '123456789012345',
          name: 'Test Pixel',
          isActive: true,
        },
      })

      const event = await prisma.conversionEvent.create({
        data: {
          pixelId: pixel.id,
          eventName: 'Purchase',
          eventId: 'evt_to_send',
          eventTime: new Date(),
          sentToMeta: false,
        },
      })

      // Simulate CAPI transmission
      const updatedEvent = await prisma.conversionEvent.update({
        where: { id: event.id },
        data: {
          sentToMeta: true,
          metaResponseId: 'meta_response_12345',
        },
      })

      expect(updatedEvent.sentToMeta).toBe(true)
      expect(updatedEvent.metaResponseId).toBe('meta_response_12345')
    })
  })
})
