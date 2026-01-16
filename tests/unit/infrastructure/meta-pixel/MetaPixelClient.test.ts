import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { MetaPixelClient } from '@infrastructure/external/meta-pixel/MetaPixelClient'
import type { IMetaPixelService } from '@application/ports/IMetaPixelService'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('MetaPixelClient', () => {
  let client: IMetaPixelService

  beforeEach(() => {
    vi.clearAllMocks()
    client = new MetaPixelClient()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  const mockAccessToken = 'mock-access-token'
  const mockPixelId = '123456789012345'
  const mockAdAccountId = 'act_123456789'
  const mockBusinessId = '987654321'

  describe('listPixels', () => {
    it('should return list of pixels for authenticated user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: mockPixelId,
              name: 'My Store Pixel',
              last_fired_time: '2025-01-15T10:00:00Z',
              is_unavailable: false,
              creation_time: '2024-12-01T00:00:00Z',
            },
          ],
        }),
      })

      const pixels = await client.listPixels(mockAccessToken)

      expect(pixels).toHaveLength(1)
      expect(pixels[0].id).toBe(mockPixelId)
      expect(pixels[0].name).toBe('My Store Pixel')
      expect(pixels[0].isActive).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/me/pixels'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockAccessToken}`,
          }),
        })
      )
    })

    it('should return empty array when no pixels found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      })

      const pixels = await client.listPixels(mockAccessToken)

      expect(pixels).toHaveLength(0)
    })

    it('should throw error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: {
            message: 'Invalid OAuth access token.',
            code: 190,
          },
        }),
      })

      await expect(client.listPixels(mockAccessToken)).rejects.toThrow(
        'Invalid OAuth access token.'
      )
    })
  })

  describe('getAdAccountPixel', () => {
    it('should return pixel from ad account', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          pixel: {
            id: mockPixelId,
            name: 'Ad Account Pixel',
            is_unavailable: false,
            creation_time: '2024-12-01T00:00:00Z',
          },
        }),
      })

      const pixel = await client.getAdAccountPixel(mockAccessToken, mockAdAccountId)

      expect(pixel).not.toBeNull()
      expect(pixel?.id).toBe(mockPixelId)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/${mockAdAccountId}`),
        expect.any(Object)
      )
    })

    it('should return null when ad account has no pixel', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      const pixel = await client.getAdAccountPixel(mockAccessToken, mockAdAccountId)

      expect(pixel).toBeNull()
    })
  })

  describe('createPixel', () => {
    it('should create a new pixel in business manager', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockPixelId,
          name: 'New Pixel',
          creation_time: '2025-01-15T10:00:00Z',
        }),
      })

      const pixel = await client.createPixel(
        mockAccessToken,
        mockBusinessId,
        'New Pixel'
      )

      expect(pixel.id).toBe(mockPixelId)
      expect(pixel.name).toBe('New Pixel')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/${mockBusinessId}/adspixels`),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('New Pixel'),
        })
      )
    })

    it('should throw error when pixel creation fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            message: 'You do not have permission to create a pixel.',
            code: 200,
          },
        }),
      })

      await expect(
        client.createPixel(mockAccessToken, mockBusinessId, 'New Pixel')
      ).rejects.toThrow('You do not have permission to create a pixel.')
    })
  })

  describe('getPixel', () => {
    it('should return pixel details by ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockPixelId,
          name: 'My Store Pixel',
          last_fired_time: '2025-01-15T10:00:00Z',
          is_unavailable: false,
          creation_time: '2024-12-01T00:00:00Z',
        }),
      })

      const pixel = await client.getPixel(mockAccessToken, mockPixelId)

      expect(pixel).not.toBeNull()
      expect(pixel?.id).toBe(mockPixelId)
      expect(pixel?.name).toBe('My Store Pixel')
      expect(pixel?.isActive).toBe(true)
    })

    it('should return null for non-existent pixel', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: {
            message: 'Unsupported get request.',
            code: 100,
          },
        }),
      })

      const pixel = await client.getPixel(mockAccessToken, 'nonexistent')

      expect(pixel).toBeNull()
    })
  })

  describe('getPixelStats', () => {
    it('should return pixel match rate statistics', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              match_rate_approx: 0.85,
              matched_event_count: 8500,
              unmatched_event_count: 1500,
            },
          ],
        }),
      })

      const stats = await client.getPixelStats(mockAccessToken, mockPixelId)

      expect(stats).not.toBeNull()
      expect(stats?.matchRate).toBe(0.85)
      expect(stats?.matchedEventCount).toBe(8500)
      expect(stats?.unmatchedEventCount).toBe(1500)
    })

    it('should return null when no stats available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      })

      const stats = await client.getPixelStats(mockAccessToken, mockPixelId)

      expect(stats).toBeNull()
    })
  })

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(client.listPixels(mockAccessToken)).rejects.toThrow(
        'Network error'
      )
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

      await expect(client.listPixels(mockAccessToken)).rejects.toThrow(
        'Too many calls.'
      )
    })
  })
})
