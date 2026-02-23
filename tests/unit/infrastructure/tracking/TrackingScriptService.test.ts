/**
 * TrackingScriptService Tests
 *
 * Tests for the dynamic tracker.js generation service.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TrackingScriptService } from '@infrastructure/external/tracking/TrackingScriptService'

describe('TrackingScriptService', () => {
  let service: TrackingScriptService

  beforeEach(() => {
    service = new TrackingScriptService({ appBaseUrl: 'https://batwo.ai' })
  })

  describe('validatePixelId', () => {
    it('should return true for valid 15-digit pixel ID', () => {
      expect(service.validatePixelId('123456789012345')).toBe(true)
    })

    it('should return true for valid 16-digit pixel ID', () => {
      expect(service.validatePixelId('1234567890123456')).toBe(true)
    })

    it('should return false for invalid pixel ID', () => {
      expect(service.validatePixelId('invalid')).toBe(false)
      expect(service.validatePixelId('12345')).toBe(false)
      expect(service.validatePixelId('')).toBe(false)
    })

    it('should return false for non-numeric pixel ID', () => {
      expect(service.validatePixelId('12345678901234a')).toBe(false)
    })
  })

  describe('generatePixelScript', () => {
    it('should include Meta Pixel SDK initialization', () => {
      const script = service.generatePixelScript('123456789012345')

      expect(script).toContain("fbq('init'")
      expect(script).toContain('123456789012345')
    })

    it('should include PageView tracking', () => {
      const script = service.generatePixelScript('123456789012345')

      expect(script).toContain("fbq('track', 'PageView')")
    })

    it('should include batwoPixel global object', () => {
      const script = service.generatePixelScript('123456789012345')

      expect(script).toContain('window.batwoPixel')
      expect(script).toContain('trackEvent')
    })

    it('should include CAPI sendBeacon endpoint', () => {
      const script = service.generatePixelScript('123456789012345')

      expect(script).toContain('sendBeacon')
      expect(script).toContain('/api/pixel/')
      expect(script).toContain('/event')
    })

    it('should include eventId generation for deduplication', () => {
      const script = service.generatePixelScript('123456789012345')

      // crypto.randomUUID()로 UUID 기반 eventId 생성
      expect(script).toContain('eventId')
      expect(script).toContain('crypto.randomUUID()')
    })

    it('should include trackCompleteRegistration helper', () => {
      const script = service.generatePixelScript('123456789012345')

      expect(script).toContain('trackCompleteRegistration')
      expect(script).toContain("'CompleteRegistration'")
    })

    it('should embed pixel ID in script', () => {
      const pixelId = '999888777666555'
      const script = service.generatePixelScript(pixelId)

      expect(script).toContain(pixelId)
    })

    it('should handle different pixel IDs', () => {
      const script1 = service.generatePixelScript('111111111111111')
      const script2 = service.generatePixelScript('222222222222222')

      expect(script1).toContain('111111111111111')
      expect(script2).toContain('222222222222222')
      expect(script1).not.toContain('222222222222222')
    })

    it('should throw error for invalid pixel ID', () => {
      expect(() => service.generatePixelScript('invalid')).toThrow('Invalid pixel ID format')
    })

    it('should include event endpoint with appBaseUrl', () => {
      const script = service.generatePixelScript('123456789012345')

      expect(script).toContain('https://batwo.ai/api/pixel/123456789012345/event')
    })
  })

  describe('generateNoscriptTag', () => {
    it('should generate noscript fallback tag', () => {
      const noscript = service.generateNoscriptTag('123456789012345')

      expect(noscript).toContain('<noscript>')
      expect(noscript).toContain('123456789012345')
      expect(noscript).toContain('facebook.com/tr')
    })

    it('should throw error for invalid pixel ID', () => {
      expect(() => service.generateNoscriptTag('invalid')).toThrow('Invalid pixel ID format')
    })
  })

  describe('generateScriptSnippet', () => {
    it('should return complete script snippet', () => {
      const snippet = service.generateScriptSnippet('123456789012345')

      expect(snippet.script).toContain("fbq('init'")
      expect(snippet.noscript).toContain('<noscript>')
      expect(snippet.pixelId).toBe('123456789012345')
      expect(snippet.instructions).toContain('설치 방법')
    })
  })

  describe('getSupportedEvents', () => {
    it('should return list of standard events', () => {
      const events = service.getSupportedEvents()

      expect(events).toContain('PageView')
      expect(events).toContain('Purchase')
      expect(events).toContain('AddToCart')
      expect(events).toContain('InitiateCheckout')
    })
  })

  describe('parseEventPayload', () => {
    it('should parse valid event payload', () => {
      const payload = JSON.stringify({
        event: 'Purchase',
        eventId: 'evt_123',
        timestamp: Date.now(),
        url: 'https://example.com/checkout',
        params: { value: 10000, currency: 'KRW' },
      })

      const parsed = service.parseEventPayload(payload)

      expect(parsed.eventName).toBe('Purchase')
      expect(parsed.eventId).toBe('evt_123')
      expect(parsed.eventSourceUrl).toBe('https://example.com/checkout')
      expect(parsed.customData).toEqual({ value: 10000, currency: 'KRW' })
    })

    it('should throw error for invalid JSON', () => {
      expect(() => service.parseEventPayload('invalid json')).toThrow('failed to parse JSON')
    })

    it('should throw error for missing event name', () => {
      const payload = JSON.stringify({ eventId: 'evt_123' })
      expect(() => service.parseEventPayload(payload)).toThrow('missing required field "event"')
    })

    it('should throw error for missing eventId', () => {
      const payload = JSON.stringify({ event: 'Purchase' })
      expect(() => service.parseEventPayload(payload)).toThrow('missing required field "eventId"')
    })
  })

  describe('getScriptContentType', () => {
    it('should return application/javascript with charset', () => {
      expect(service.getScriptContentType()).toBe('application/javascript; charset=utf-8')
    })
  })

  describe('getCacheHeaders', () => {
    it('should return appropriate cache headers', () => {
      const headers = service.getCacheHeaders()

      expect(headers).toHaveProperty('Cache-Control')
      expect(headers['Cache-Control']).toContain('public')
      expect(headers['Cache-Control']).toContain('max-age')
    })

    it('should include security headers', () => {
      const headers = service.getCacheHeaders()

      expect(headers['X-Content-Type-Options']).toBe('nosniff')
    })
  })
})
