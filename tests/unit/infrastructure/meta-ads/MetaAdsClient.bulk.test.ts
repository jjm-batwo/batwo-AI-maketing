import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { MetaAdsClient } from '@infrastructure/external/meta-ads/MetaAdsClient'
import { MetaAdsApiError } from '@infrastructure/external/errors'

const META_API_BASE = 'https://graph.facebook.com/v25.0'
const ACCESS_TOKEN = 'test-access-token'
const AD_ACCOUNT_ID = 'act_123456789'

// ========== Mock Data ==========

const mockAccountInsightsResponse = {
  data: [
    {
      campaign_id: 'campaign_1',
      adset_id: 'adset_1',
      ad_id: 'ad_1',
      impressions: '10000',
      reach: '8000',
      clicks: '500',
      spend: '150.00',
      actions: [
        { action_type: 'purchase', value: '25' },
        { action_type: 'link_click', value: '400' },
      ],
      action_values: [{ action_type: 'purchase', value: '2500.00' }],
      date_start: '2025-01-01',
      date_stop: '2025-01-07',
    },
    {
      campaign_id: 'campaign_1',
      adset_id: 'adset_2',
      ad_id: 'ad_2',
      impressions: '5000',
      reach: '4000',
      clicks: '200',
      spend: '80.00',
      actions: [
        { action_type: 'purchase', value: '10' },
        { action_type: 'link_click', value: '180' },
      ],
      action_values: [{ action_type: 'purchase', value: '1000.00' }],
      date_start: '2025-01-01',
      date_stop: '2025-01-07',
    },
  ],
}

const mockAdSetsListResponse = {
  data: [
    {
      id: 'adset_1',
      name: 'AdSet Alpha',
      status: 'ACTIVE',
      campaign_id: 'campaign_1',
      daily_budget: '30000',
      billing_event: 'IMPRESSIONS',
      optimization_goal: 'CONVERSIONS',
    },
    {
      id: 'adset_2',
      name: 'AdSet Beta',
      status: 'PAUSED',
      campaign_id: 'campaign_1',
      daily_budget: '20000',
      billing_event: 'IMPRESSIONS',
      optimization_goal: 'LINK_CLICKS',
    },
    {
      id: 'adset_3',
      name: 'AdSet Gamma',
      status: 'ACTIVE',
      campaign_id: 'campaign_2',
      daily_budget: '15000',
      billing_event: 'IMPRESSIONS',
      optimization_goal: 'CONVERSIONS',
    },
  ],
}

const mockAdsListResponse = {
  data: [
    { id: 'ad_1', name: 'Ad One', status: 'ACTIVE', adset_id: 'adset_1' },
    { id: 'ad_2', name: 'Ad Two', status: 'PAUSED', adset_id: 'adset_1' },
    { id: 'ad_3', name: 'Ad Three', status: 'ACTIVE', adset_id: 'adset_2' },
  ],
}

// ========== MSW Handlers ==========

const handlers = [
  // Account-level insights
  http.get(`${META_API_BASE}/${AD_ACCOUNT_ID}/insights`, ({ request }) => {
    const url = new URL(request.url)
    const level = url.searchParams.get('level')
    if (!level) {
      return HttpResponse.json(
        { error: { message: 'level parameter required', code: 100 } },
        { status: 400 }
      )
    }
    return HttpResponse.json(mockAccountInsightsResponse)
  }),

  // Account-level adsets
  http.get(`${META_API_BASE}/${AD_ACCOUNT_ID}/adsets`, () => {
    return HttpResponse.json(mockAdSetsListResponse)
  }),

  // Account-level ads
  http.get(`${META_API_BASE}/${AD_ACCOUNT_ID}/ads`, () => {
    return HttpResponse.json(mockAdsListResponse)
  }),
]

const server = setupServer(...handlers)

// ========== Tests ==========

describe('MetaAdsClient — Bulk Account-Level Methods', () => {
  let client: MetaAdsClient

  beforeEach(() => {
    client = new MetaAdsClient()
    server.listen({ onUnhandledRequest: 'bypass' })
  })

  afterEach(() => {
    server.resetHandlers()
    server.close()
    vi.clearAllMocks()
  })

  // ========== getAccountInsights ==========

  describe('getAccountInsights', () => {
    it('should return insights as Map keyed by entity ID (level=ad)', async () => {
      const result = await client.getAccountInsights(ACCESS_TOKEN, AD_ACCOUNT_ID, {
        level: 'ad',
        datePreset: 'last_7d',
      })

      expect(result).toBeInstanceOf(Map)
      expect(result.size).toBe(2)

      const ad1Insights = result.get('ad_1')
      expect(ad1Insights).toBeDefined()
      expect(ad1Insights!.impressions).toBe(10000)
      expect(ad1Insights!.clicks).toBe(500)
      expect(ad1Insights!.spend).toBe(150)
      expect(ad1Insights!.conversions).toBe(25)
      expect(ad1Insights!.revenue).toBe(2500)

      const ad2Insights = result.get('ad_2')
      expect(ad2Insights).toBeDefined()
      expect(ad2Insights!.impressions).toBe(5000)
      expect(ad2Insights!.spend).toBe(80)
    })

    it('should return insights keyed by adset_id when level=adset', async () => {
      const result = await client.getAccountInsights(ACCESS_TOKEN, AD_ACCOUNT_ID, {
        level: 'adset',
        datePreset: 'last_7d',
      })

      expect(result).toBeInstanceOf(Map)
      // adset_1 and adset_2 from mock data
      expect(result.has('adset_1')).toBe(true)
      expect(result.has('adset_2')).toBe(true)
    })

    it('should return insights keyed by campaign_id when level=campaign', async () => {
      const result = await client.getAccountInsights(ACCESS_TOKEN, AD_ACCOUNT_ID, {
        level: 'campaign',
        datePreset: 'last_30d',
      })

      expect(result).toBeInstanceOf(Map)
      expect(result.has('campaign_1')).toBe(true)
    })

    it('should return empty Map when no insights data', async () => {
      server.use(
        http.get(`${META_API_BASE}/${AD_ACCOUNT_ID}/insights`, () => {
          return HttpResponse.json({ data: [] })
        })
      )

      const result = await client.getAccountInsights(ACCESS_TOKEN, AD_ACCOUNT_ID, {
        level: 'ad',
        datePreset: 'last_7d',
      })

      expect(result).toBeInstanceOf(Map)
      expect(result.size).toBe(0)
    })

    it('should throw MetaAdsApiError on auth error', async () => {
      server.use(
        http.get(`${META_API_BASE}/${AD_ACCOUNT_ID}/insights`, () => {
          return HttpResponse.json(
            { error: { message: 'Invalid access token', type: 'OAuthException', code: 190 } },
            { status: 401 }
          )
        })
      )

      await expect(
        client.getAccountInsights(ACCESS_TOKEN, AD_ACCOUNT_ID, { level: 'ad', datePreset: 'last_7d' })
      ).rejects.toThrow(MetaAdsApiError)
    })

    it('should throw MetaAdsApiError on rate limit', async () => {
      server.use(
        http.get(`${META_API_BASE}/${AD_ACCOUNT_ID}/insights`, () => {
          return HttpResponse.json(
            { error: { message: 'Rate limit exceeded', type: 'OAuthException', code: 17 } },
            { status: 429 }
          )
        })
      )

      try {
        await client.getAccountInsights(ACCESS_TOKEN, AD_ACCOUNT_ID, {
          level: 'ad',
          datePreset: 'last_7d',
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(MetaAdsApiError)
        expect(MetaAdsApiError.isRateLimitError(error as MetaAdsApiError)).toBe(true)
      }
    })

    it('should pass filtering parameter when campaignIds provided', async () => {
      let capturedUrl = ''
      server.use(
        http.get(`${META_API_BASE}/${AD_ACCOUNT_ID}/insights`, ({ request }) => {
          capturedUrl = request.url
          return HttpResponse.json(mockAccountInsightsResponse)
        })
      )

      await client.getAccountInsights(ACCESS_TOKEN, AD_ACCOUNT_ID, {
        level: 'ad',
        datePreset: 'last_7d',
        campaignIds: ['campaign_1', 'campaign_2'],
      })

      expect(capturedUrl).toContain('filtering')
      expect(capturedUrl).toContain('campaign_1')
    })
  })

  // ========== listAllAdSets ==========

  describe('listAllAdSets', () => {
    it('should return all adsets for an account', async () => {
      const result = await client.listAllAdSets(ACCESS_TOKEN, AD_ACCOUNT_ID)

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(3)
      expect(result[0].id).toBe('adset_1')
      expect(result[0].name).toBe('AdSet Alpha')
      expect(result[0].status).toBe('ACTIVE')
      expect(result[0].dailyBudget).toBe(30000)
      expect(result[0].billingEvent).toBe('IMPRESSIONS')
    })

    it('should pass campaignIds filter when provided', async () => {
      let capturedUrl = ''
      server.use(
        http.get(`${META_API_BASE}/${AD_ACCOUNT_ID}/adsets`, ({ request }) => {
          capturedUrl = request.url
          return HttpResponse.json(mockAdSetsListResponse)
        })
      )

      await client.listAllAdSets(ACCESS_TOKEN, AD_ACCOUNT_ID, {
        campaignIds: ['campaign_1'],
      })

      expect(capturedUrl).toContain('filtering')
      expect(capturedUrl).toContain('campaign_1')
    })

    it('should return empty array when no adsets', async () => {
      server.use(
        http.get(`${META_API_BASE}/${AD_ACCOUNT_ID}/adsets`, () => {
          return HttpResponse.json({ data: [] })
        })
      )

      const result = await client.listAllAdSets(ACCESS_TOKEN, AD_ACCOUNT_ID)
      expect(result).toEqual([])
    })

    it('should throw MetaAdsApiError on auth error', async () => {
      server.use(
        http.get(`${META_API_BASE}/${AD_ACCOUNT_ID}/adsets`, () => {
          return HttpResponse.json(
            { error: { message: 'Invalid access token', type: 'OAuthException', code: 190 } },
            { status: 401 }
          )
        })
      )

      await expect(
        client.listAllAdSets(ACCESS_TOKEN, AD_ACCOUNT_ID)
      ).rejects.toThrow(MetaAdsApiError)
    })
  })

  // ========== listAllAds ==========

  describe('listAllAds', () => {
    it('should return all ads for an account', async () => {
      const result = await client.listAllAds(ACCESS_TOKEN, AD_ACCOUNT_ID)

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(3)
      expect(result[0].id).toBe('ad_1')
      expect(result[0].name).toBe('Ad One')
      expect(result[0].status).toBe('ACTIVE')
    })

    it('should pass adSetIds filter when provided', async () => {
      let capturedUrl = ''
      server.use(
        http.get(`${META_API_BASE}/${AD_ACCOUNT_ID}/ads`, ({ request }) => {
          capturedUrl = request.url
          return HttpResponse.json(mockAdsListResponse)
        })
      )

      await client.listAllAds(ACCESS_TOKEN, AD_ACCOUNT_ID, {
        adSetIds: ['adset_1'],
      })

      expect(capturedUrl).toContain('filtering')
      expect(capturedUrl).toContain('adset_1')
    })

    it('should return empty array when no ads', async () => {
      server.use(
        http.get(`${META_API_BASE}/${AD_ACCOUNT_ID}/ads`, () => {
          return HttpResponse.json({ data: [] })
        })
      )

      const result = await client.listAllAds(ACCESS_TOKEN, AD_ACCOUNT_ID)
      expect(result).toEqual([])
    })

    it('should throw MetaAdsApiError on auth error', async () => {
      server.use(
        http.get(`${META_API_BASE}/${AD_ACCOUNT_ID}/ads`, () => {
          return HttpResponse.json(
            { error: { message: 'Invalid access token', type: 'OAuthException', code: 190 } },
            { status: 401 }
          )
        })
      )

      await expect(
        client.listAllAds(ACCESS_TOKEN, AD_ACCOUNT_ID)
      ).rejects.toThrow(MetaAdsApiError)
    })
  })
})
