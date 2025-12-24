import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { MetaAdsClient } from '@infrastructure/external/meta-ads/MetaAdsClient'
import { MetaAdsApiError } from '@infrastructure/external/errors'

const META_API_BASE = 'https://graph.facebook.com/v18.0'

const mockCampaign = {
  id: '123456789',
  name: 'Test Campaign',
  status: 'ACTIVE',
  objective: 'OUTCOME_SALES',
  daily_budget: '10000',
  start_time: '2025-01-01T00:00:00+0000',
  end_time: '2025-01-31T23:59:59+0000',
}

const mockInsights = {
  data: [
    {
      campaign_id: '123456789',
      impressions: '10000',
      clicks: '500',
      spend: '150.00',
      actions: [
        { action_type: 'purchase', value: '25' },
        { action_type: 'link_click', value: '500' },
      ],
      action_values: [{ action_type: 'purchase', value: '2500.00' }],
      date_start: '2025-01-01',
      date_stop: '2025-01-07',
    },
  ],
}

const handlers = [
  // Create campaign
  http.post(`${META_API_BASE}/act_:adAccountId/campaigns`, () => {
    return HttpResponse.json(mockCampaign)
  }),

  // Get campaign
  http.get(`${META_API_BASE}/:campaignId`, ({ params }) => {
    if (params.campaignId === '123456789') {
      return HttpResponse.json(mockCampaign)
    }
    return HttpResponse.json(
      { error: { message: 'Campaign not found', code: 100 } },
      { status: 404 }
    )
  }),

  // Get insights
  http.get(`${META_API_BASE}/:campaignId/insights`, () => {
    return HttpResponse.json(mockInsights)
  }),

  // Update campaign
  http.post(`${META_API_BASE}/:campaignId`, () => {
    return HttpResponse.json({ ...mockCampaign, status: 'PAUSED' })
  }),

  // Delete campaign
  http.delete(`${META_API_BASE}/:campaignId`, () => {
    return HttpResponse.json({ success: true })
  }),
]

const server = setupServer(...handlers)

describe('MetaAdsClient', () => {
  let client: MetaAdsClient
  const accessToken = 'test-access-token'
  const adAccountId = 'act_123456789'

  beforeEach(() => {
    client = new MetaAdsClient()
    server.listen({ onUnhandledRequest: 'bypass' })
  })

  afterEach(() => {
    server.resetHandlers()
    server.close()
    vi.clearAllMocks()
  })

  describe('createCampaign', () => {
    it('should create campaign on Meta Ads', async () => {
      const result = await client.createCampaign(accessToken, adAccountId, {
        name: 'Test Campaign',
        objective: 'OUTCOME_SALES',
        dailyBudget: 10000,
        currency: 'KRW',
        startTime: new Date('2025-01-01'),
        endTime: new Date('2025-01-31'),
      })

      expect(result).toBeDefined()
      expect(result.id).toBe('123456789')
      expect(result.name).toBe('Test Campaign')
      expect(result.status).toBe('ACTIVE')
    })

    it('should throw MetaAdsApiError on API error', async () => {
      server.use(
        http.post(`${META_API_BASE}/act_:adAccountId/campaigns`, () => {
          return HttpResponse.json(
            {
              error: {
                message: 'Invalid parameter',
                type: 'OAuthException',
                code: 100,
                error_subcode: 1487390,
              },
            },
            { status: 400 }
          )
        })
      )

      await expect(
        client.createCampaign(accessToken, adAccountId, {
          name: 'Test',
          objective: 'INVALID',
          dailyBudget: 100,
          currency: 'KRW',
          startTime: new Date(),
        })
      ).rejects.toThrow(MetaAdsApiError)
    })
  })

  describe('getCampaign', () => {
    it('should get campaign by id', async () => {
      const result = await client.getCampaign(accessToken, '123456789')

      expect(result).toBeDefined()
      expect(result?.id).toBe('123456789')
      expect(result?.name).toBe('Test Campaign')
    })

    it('should return null for non-existent campaign', async () => {
      server.use(
        http.get(`${META_API_BASE}/:campaignId`, () => {
          return HttpResponse.json(
            { error: { message: 'Object does not exist', code: 100 } },
            { status: 404 }
          )
        })
      )

      const result = await client.getCampaign(accessToken, 'non-existent')
      expect(result).toBeNull()
    })
  })

  describe('getCampaignInsights', () => {
    it('should get campaign insights', async () => {
      const result = await client.getCampaignInsights(
        accessToken,
        '123456789',
        'last_7d'
      )

      expect(result).toBeDefined()
      expect(result.campaignId).toBe('123456789')
      expect(result.impressions).toBe(10000)
      expect(result.clicks).toBe(500)
      expect(result.spend).toBe(150)
      expect(result.conversions).toBe(25)
      expect(result.revenue).toBe(2500)
    })

    it('should handle empty insights data', async () => {
      server.use(
        http.get(`${META_API_BASE}/:campaignId/insights`, () => {
          return HttpResponse.json({ data: [] })
        })
      )

      const result = await client.getCampaignInsights(
        accessToken,
        '123456789',
        'today'
      )

      expect(result.impressions).toBe(0)
      expect(result.clicks).toBe(0)
      expect(result.spend).toBe(0)
    })
  })

  describe('updateCampaignStatus', () => {
    it('should update campaign status', async () => {
      const result = await client.updateCampaignStatus(
        accessToken,
        '123456789',
        'PAUSED'
      )

      expect(result).toBeDefined()
      expect(result.status).toBe('PAUSED')
    })
  })

  describe('deleteCampaign', () => {
    it('should delete campaign', async () => {
      await expect(
        client.deleteCampaign(accessToken, '123456789')
      ).resolves.not.toThrow()
    })
  })

  describe('error handling', () => {
    it('should handle rate limit error', async () => {
      server.use(
        http.get(`${META_API_BASE}/:campaignId`, () => {
          return HttpResponse.json(
            {
              error: {
                message: 'Rate limit exceeded',
                type: 'OAuthException',
                code: 17,
              },
            },
            { status: 429 }
          )
        })
      )

      try {
        await client.getCampaign(accessToken, '123456789')
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(MetaAdsApiError)
        expect(MetaAdsApiError.isRateLimitError(error as MetaAdsApiError)).toBe(
          true
        )
      }
    })

    it('should handle auth error', async () => {
      server.use(
        http.get(`${META_API_BASE}/:campaignId`, () => {
          return HttpResponse.json(
            {
              error: {
                message: 'Invalid access token',
                type: 'OAuthException',
                code: 190,
              },
            },
            { status: 401 }
          )
        })
      )

      try {
        await client.getCampaign(accessToken, '123456789')
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(MetaAdsApiError)
        expect(MetaAdsApiError.isAuthError(error as MetaAdsApiError)).toBe(true)
      }
    })

    it('should retry on transient errors', async () => {
      let attempts = 0
      server.use(
        http.get(`${META_API_BASE}/:campaignId`, () => {
          attempts++
          if (attempts < 3) {
            return HttpResponse.json(
              {
                error: {
                  message: 'Unknown error',
                  type: 'OAuthException',
                  code: 1,
                },
              },
              { status: 500 }
            )
          }
          return HttpResponse.json(mockCampaign)
        })
      )

      const result = await client.getCampaign(accessToken, '123456789')

      expect(result).toBeDefined()
      expect(result?.id).toBe('123456789')
      expect(attempts).toBe(3)
    })
  })
})
