import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  ConversionEvent,
  CreateConversionEventProps,
  ConversionEventProps,
  StandardEventName,
} from '@domain/entities/ConversionEvent'

describe('ConversionEvent', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-15T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const validCreateProps: CreateConversionEventProps = {
    pixelId: 'pixel-123',
    eventName: StandardEventName.PAGE_VIEW,
    eventId: 'evt-abc-123',
    eventTime: new Date('2025-01-15T09:55:00Z'),
  }

  describe('create', () => {
    it('should create a ConversionEvent with valid data', () => {
      const event = ConversionEvent.create(validCreateProps)

      expect(event.id).toBeDefined()
      expect(event.pixelId).toBe('pixel-123')
      expect(event.eventName).toBe(StandardEventName.PAGE_VIEW)
      expect(event.eventId).toBe('evt-abc-123')
      expect(event.eventTime).toEqual(new Date('2025-01-15T09:55:00Z'))
      expect(event.sentToMeta).toBe(false)
      expect(event.metaResponseId).toBeUndefined()
      expect(event.createdAt).toBeDefined()
    })

    it('should create a ConversionEvent with custom event name', () => {
      const event = ConversionEvent.create({
        ...validCreateProps,
        eventName: 'CustomEvent',
      })

      expect(event.eventName).toBe('CustomEvent')
    })

    it('should create a ConversionEvent with event source URL', () => {
      const event = ConversionEvent.create({
        ...validCreateProps,
        eventSourceUrl: 'https://example.com/checkout',
      })

      expect(event.eventSourceUrl).toBe('https://example.com/checkout')
    })

    it('should create a ConversionEvent with user data', () => {
      const userData = {
        em: 'hashed_email',
        ph: 'hashed_phone',
        client_ip_address: '192.168.1.1',
        client_user_agent: 'Mozilla/5.0',
      }

      const event = ConversionEvent.create({
        ...validCreateProps,
        userData,
      })

      expect(event.userData).toEqual(userData)
    })

    it('should create a ConversionEvent with custom data (Purchase)', () => {
      const customData = {
        value: 99.99,
        currency: 'KRW',
        content_ids: ['product-123', 'product-456'],
        content_type: 'product',
        num_items: 2,
      }

      const event = ConversionEvent.create({
        ...validCreateProps,
        eventName: StandardEventName.PURCHASE,
        customData,
      })

      expect(event.customData).toEqual(customData)
    })

    it('should throw error for empty pixelId', () => {
      expect(() =>
        ConversionEvent.create({
          ...validCreateProps,
          pixelId: '',
        })
      ).toThrow('Pixel ID is required')
    })

    it('should throw error for empty eventName', () => {
      expect(() =>
        ConversionEvent.create({
          ...validCreateProps,
          eventName: '',
        })
      ).toThrow('Event name is required')
    })

    it('should throw error for empty eventId', () => {
      expect(() =>
        ConversionEvent.create({
          ...validCreateProps,
          eventId: '',
        })
      ).toThrow('Event ID is required')
    })

    it('should throw error for future eventTime', () => {
      expect(() =>
        ConversionEvent.create({
          ...validCreateProps,
          eventTime: new Date('2025-01-16T10:00:00Z'), // Tomorrow
        })
      ).toThrow('Event time cannot be in the future')
    })
  })

  describe('restore', () => {
    it('should restore ConversionEvent from persisted data', () => {
      const props: ConversionEventProps = {
        id: 'event-123',
        pixelId: 'pixel-123',
        eventName: StandardEventName.PURCHASE,
        eventId: 'evt-abc-123',
        eventTime: new Date('2025-01-15T09:55:00Z'),
        eventSourceUrl: 'https://example.com/checkout',
        userData: { em: 'hashed_email' },
        customData: { value: 99.99, currency: 'KRW' },
        sentToMeta: true,
        metaResponseId: 'meta-response-456',
        createdAt: new Date('2025-01-15T09:55:30Z'),
      }

      const event = ConversionEvent.restore(props)

      expect(event.id).toBe('event-123')
      expect(event.sentToMeta).toBe(true)
      expect(event.metaResponseId).toBe('meta-response-456')
    })
  })

  describe('markSentToMeta', () => {
    it('should mark event as sent to Meta', () => {
      const event = ConversionEvent.create(validCreateProps)
      const sent = event.markSentToMeta('meta-response-123')

      expect(sent.sentToMeta).toBe(true)
      expect(sent.metaResponseId).toBe('meta-response-123')
      expect(event.sentToMeta).toBe(false) // Immutability
    })

    it('should throw error if already sent to Meta', () => {
      const event = ConversionEvent.create(validCreateProps).markSentToMeta('meta-response-123')

      expect(() => event.markSentToMeta('another-response')).toThrow(
        'Event has already been sent to Meta'
      )
    })
  })

  describe('isPending', () => {
    it('should return true for unsent event', () => {
      const event = ConversionEvent.create(validCreateProps)

      expect(event.isPending()).toBe(true)
    })

    it('should return false for sent event', () => {
      const event = ConversionEvent.create(validCreateProps).markSentToMeta('meta-response-123')

      expect(event.isPending()).toBe(false)
    })
  })

  describe('isStale', () => {
    it('should return true for event older than 7 days', () => {
      vi.setSystemTime(new Date('2025-01-23T10:00:00Z')) // 8 days after event

      const props: ConversionEventProps = {
        id: 'event-123',
        pixelId: 'pixel-123',
        eventName: StandardEventName.PAGE_VIEW,
        eventId: 'evt-abc-123',
        eventTime: new Date('2025-01-15T09:55:00Z'),
        sentToMeta: false,
        createdAt: new Date('2025-01-15T09:55:30Z'),
      }

      const event = ConversionEvent.restore(props)

      expect(event.isStale()).toBe(true)
    })

    it('should return false for recent event', () => {
      const event = ConversionEvent.create(validCreateProps)

      expect(event.isStale()).toBe(false)
    })
  })

  describe('immutability', () => {
    it('should be immutable after creation', () => {
      const event = ConversionEvent.create(validCreateProps)
      const sent = event.markSentToMeta('meta-response-123')

      expect(event).not.toBe(sent)
      expect(event.sentToMeta).toBe(false)
      expect(sent.sentToMeta).toBe(true)
    })
  })

  describe('toJSON', () => {
    it('should serialize ConversionEvent to JSON', () => {
      const event = ConversionEvent.create({
        ...validCreateProps,
        eventSourceUrl: 'https://example.com',
        userData: { em: 'hashed' },
        customData: { value: 100 },
      })

      const json = event.toJSON()

      expect(json.id).toBe(event.id)
      expect(json.pixelId).toBe('pixel-123')
      expect(json.eventName).toBe(StandardEventName.PAGE_VIEW)
      expect(json.eventId).toBe('evt-abc-123')
      expect(json.eventSourceUrl).toBe('https://example.com')
      expect(json.userData).toEqual({ em: 'hashed' })
      expect(json.customData).toEqual({ value: 100 })
      expect(json.sentToMeta).toBe(false)
      expect(json.createdAt).toBeDefined()
    })
  })

  describe('toCAPIFormat', () => {
    it('should convert to CAPI format', () => {
      const event = ConversionEvent.create({
        ...validCreateProps,
        eventSourceUrl: 'https://example.com/checkout',
        userData: {
          em: 'hashed_email',
          ph: 'hashed_phone',
          client_ip_address: '192.168.1.1',
          client_user_agent: 'Mozilla/5.0',
        },
        customData: {
          value: 99.99,
          currency: 'KRW',
          content_ids: ['product-123'],
        },
      })

      const capiFormat = event.toCAPIFormat()

      expect(capiFormat.event_name).toBe(StandardEventName.PAGE_VIEW)
      expect(capiFormat.event_id).toBe('evt-abc-123')
      expect(capiFormat.event_time).toBeDefined()
      expect(capiFormat.event_source_url).toBe('https://example.com/checkout')
      expect(capiFormat.user_data).toEqual({
        em: 'hashed_email',
        ph: 'hashed_phone',
        client_ip_address: '192.168.1.1',
        client_user_agent: 'Mozilla/5.0',
      })
      expect(capiFormat.custom_data).toEqual({
        value: 99.99,
        currency: 'KRW',
        content_ids: ['product-123'],
      })
      expect(capiFormat.action_source).toBe('website')
    })

    it('should handle minimal event data for CAPI format', () => {
      const event = ConversionEvent.create(validCreateProps)
      const capiFormat = event.toCAPIFormat()

      expect(capiFormat.event_name).toBe(StandardEventName.PAGE_VIEW)
      expect(capiFormat.event_id).toBe('evt-abc-123')
      expect(capiFormat.event_time).toBeDefined()
      expect(capiFormat.action_source).toBe('website')
      expect(capiFormat.user_data).toBeUndefined()
      expect(capiFormat.custom_data).toBeUndefined()
    })
  })

  describe('StandardEventName constants', () => {
    it('should define all standard Meta events', () => {
      expect(StandardEventName.PAGE_VIEW).toBe('PageView')
      expect(StandardEventName.VIEW_CONTENT).toBe('ViewContent')
      expect(StandardEventName.ADD_TO_CART).toBe('AddToCart')
      expect(StandardEventName.ADD_TO_WISHLIST).toBe('AddToWishlist')
      expect(StandardEventName.INITIATE_CHECKOUT).toBe('InitiateCheckout')
      expect(StandardEventName.ADD_PAYMENT_INFO).toBe('AddPaymentInfo')
      expect(StandardEventName.PURCHASE).toBe('Purchase')
      expect(StandardEventName.LEAD).toBe('Lead')
      expect(StandardEventName.COMPLETE_REGISTRATION).toBe('CompleteRegistration')
      expect(StandardEventName.SEARCH).toBe('Search')
    })
  })
})
