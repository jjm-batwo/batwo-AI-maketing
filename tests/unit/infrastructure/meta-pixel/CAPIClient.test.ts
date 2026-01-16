import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { CAPIClient } from '@infrastructure/external/meta-pixel/CAPIClient'
import type { ICAPIService, CAPIEventInput } from '@application/ports/ICAPIService'
import { StandardEventName } from '@domain/entities/ConversionEvent'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('CAPIClient', () => {
  let client: ICAPIService

  beforeEach(() => {
    vi.clearAllMocks()
    client = new CAPIClient()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  const mockAccessToken = 'mock-access-token'
  const mockPixelId = '123456789012345'

  const mockEvent: CAPIEventInput = {
    eventName: StandardEventName.PAGE_VIEW,
    eventTime: new Date('2025-01-15T10:00:00Z'),
    eventId: 'evt-123',
    eventSourceUrl: 'https://example.com',
    actionSource: 'website',
  }

  const mockPurchaseEvent: CAPIEventInput = {
    eventName: StandardEventName.PURCHASE,
    eventTime: new Date('2025-01-15T10:00:00Z'),
    eventId: 'evt-456',
    eventSourceUrl: 'https://example.com/checkout',
    userData: {
      em: 'test@example.com', // Will be hashed
      ph: '01012345678',
      client_ip_address: '192.168.1.1',
      client_user_agent: 'Mozilla/5.0',
    },
    customData: {
      value: 99000,
      currency: 'KRW',
      content_ids: ['product-123', 'product-456'],
      content_type: 'product',
      num_items: 2,
    },
    actionSource: 'website',
  }

  describe('sendEvent', () => {
    it('should send a single event to Meta CAPI', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          events_received: 1,
          messages: [],
          fbtrace_id: 'trace-123',
        }),
      })

      const response = await client.sendEvent(mockAccessToken, mockPixelId, mockEvent)

      expect(response.eventsReceived).toBe(1)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/${mockPixelId}/events`),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('PageView'),
        })
      )
    })

    it('should include user data when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          events_received: 1,
        }),
      })

      await client.sendEvent(mockAccessToken, mockPixelId, mockPurchaseEvent)

      const [, options] = mockFetch.mock.calls[0]
      const body = JSON.parse(options.body)

      expect(body.data[0].user_data).toBeDefined()
      // Email should be hashed (SHA256)
      expect(body.data[0].user_data.em).not.toBe('test@example.com')
      expect(body.data[0].user_data.em).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should include custom data for purchase events', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          events_received: 1,
        }),
      })

      await client.sendEvent(mockAccessToken, mockPixelId, mockPurchaseEvent)

      const [, options] = mockFetch.mock.calls[0]
      const body = JSON.parse(options.body)

      expect(body.data[0].custom_data).toBeDefined()
      expect(body.data[0].custom_data.value).toBe(99000)
      expect(body.data[0].custom_data.currency).toBe('KRW')
    })

    it('should throw error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            message: 'Invalid event data',
            code: 100,
          },
        }),
      })

      await expect(
        client.sendEvent(mockAccessToken, mockPixelId, mockEvent)
      ).rejects.toThrow('Invalid event data')
    })
  })

  describe('sendEvents', () => {
    it('should send multiple events in batch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          events_received: 2,
          messages: [],
          fbtrace_id: 'trace-123',
        }),
      })

      const events = [mockEvent, mockPurchaseEvent]
      const response = await client.sendEvents(mockAccessToken, mockPixelId, events)

      expect(response.eventsReceived).toBe(2)
      const [, options] = mockFetch.mock.calls[0]
      const body = JSON.parse(options.body)
      expect(body.data).toHaveLength(2)
    })

    it('should enforce maximum batch size of 1000', async () => {
      const largeEventList = Array(1100)
        .fill(null)
        .map((_, i) => ({
          ...mockEvent,
          eventId: `evt-${i}`,
        }))

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          events_received: 1000,
        }),
      })

      await client.sendEvents(mockAccessToken, mockPixelId, largeEventList)

      // Should be called twice (1000 + 100)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should return combined response for batched calls', async () => {
      const largeEventList = Array(1100)
        .fill(null)
        .map((_, i) => ({
          ...mockEvent,
          eventId: `evt-${i}`,
        }))

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ events_received: 1000 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ events_received: 100 }),
        })

      const response = await client.sendEvents(
        mockAccessToken,
        mockPixelId,
        largeEventList
      )

      expect(response.eventsReceived).toBe(1100)
    })
  })

  describe('sendTestEvent', () => {
    it('should send test event with test code', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          events_received: 1,
          messages: [],
        }),
      })

      const response = await client.sendTestEvent(
        mockAccessToken,
        mockPixelId,
        'TEST12345',
        mockEvent
      )

      expect(response.success).toBe(true)
      const [, options] = mockFetch.mock.calls[0]
      const body = JSON.parse(options.body)
      expect(body.test_event_code).toBe('TEST12345')
    })

    it('should return failure for invalid test event', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            message: 'Invalid test event code',
            code: 100,
          },
        }),
      })

      const response = await client.sendTestEvent(
        mockAccessToken,
        mockPixelId,
        'INVALID',
        mockEvent
      )

      expect(response.success).toBe(false)
      expect(response.message).toBe('Invalid test event code')
    })
  })

  describe('formatEvent', () => {
    it('should convert event to CAPI format', () => {
      const formatted = client.formatEvent(mockEvent)

      expect(formatted.event_name).toBe(StandardEventName.PAGE_VIEW)
      expect(formatted.event_id).toBe('evt-123')
      expect(formatted.event_time).toBe(
        Math.floor(new Date('2025-01-15T10:00:00Z').getTime() / 1000)
      )
      expect(formatted.action_source).toBe('website')
    })

    it('should hash PII in user data', () => {
      const formatted = client.formatEvent(mockPurchaseEvent)

      expect(formatted.user_data?.em).not.toBe('test@example.com')
      expect(formatted.user_data?.em).toMatch(/^[a-f0-9]{64}$/)
      expect(formatted.user_data?.ph).not.toBe('01012345678')
      expect(formatted.user_data?.ph).toMatch(/^[a-f0-9]{64}$/)
      // IP and user agent should not be hashed
      expect(formatted.user_data?.client_ip_address).toBe('192.168.1.1')
      expect(formatted.user_data?.client_user_agent).toBe('Mozilla/5.0')
    })

    it('should preserve custom data without modification', () => {
      const formatted = client.formatEvent(mockPurchaseEvent)

      expect(formatted.custom_data?.value).toBe(99000)
      expect(formatted.custom_data?.currency).toBe('KRW')
      expect(formatted.custom_data?.content_ids).toEqual(['product-123', 'product-456'])
    })
  })

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(
        client.sendEvent(mockAccessToken, mockPixelId, mockEvent)
      ).rejects.toThrow('Network error')
    })

    it('should handle rate limiting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: {
            message: 'Too many calls.',
            code: 80000,
          },
        }),
      })

      await expect(
        client.sendEvent(mockAccessToken, mockPixelId, mockEvent)
      ).rejects.toThrow('Too many calls.')
    })
  })
})
