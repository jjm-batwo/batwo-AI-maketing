/**
 * TEST-10: MSW 핸들러 - Meta API
 *
 * Meta Graph API v25.0 HTTP 모킹을 MSW로 전환
 */

import { http, HttpResponse } from 'msw'

const META_API_BASE = 'https://graph.facebook.com/v25.0'

export const metaApiHandlers = [
  // Get Ad Accounts
  http.get(`${META_API_BASE}/me/adaccounts`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 'act_123456789',
          name: 'Test Ad Account 1',
          account_id: '123456789',
          account_status: 1,
          currency: 'KRW',
          timezone_name: 'Asia/Seoul',
        },
        {
          id: 'act_987654321',
          name: 'Test Ad Account 2',
          account_id: '987654321',
          account_status: 1,
          currency: 'USD',
          timezone_name: 'America/Los_Angeles',
        },
      ],
      paging: {
        cursors: { before: 'cursor_before', after: 'cursor_after' },
      },
    })
  }),

  // Get Campaigns
  http.get(`${META_API_BASE}/act_:accountId/campaigns`, ({ params: _params }) => {
    return HttpResponse.json({
      data: [
        {
          id: '120210000000001',
          name: '신규 고객 확보 캠페인',
          status: 'ACTIVE',
          objective: 'OUTCOME_SALES',
          daily_budget: '50000',
          created_time: new Date(Date.now() - 86400000).toISOString(),
          updated_time: new Date().toISOString(),
        },
        {
          id: '120210000000002',
          name: '브랜드 인지도 캠페인',
          status: 'PAUSED',
          objective: 'OUTCOME_AWARENESS',
          daily_budget: '30000',
          created_time: new Date(Date.now() - 86400000).toISOString(),
          updated_time: new Date().toISOString(),
        },
      ],
      paging: {
        cursors: { before: 'cursor_before', after: 'cursor_after' },
      },
    })
  }),

  // Get Campaign Insights
  http.get(`${META_API_BASE}/:campaignId/insights`, ({ params }) => {
    return HttpResponse.json({
      data: [
        {
          campaign_id: params.campaignId,
          date_start: '2026-02-01',
          date_stop: '2026-02-07',
          impressions: '42000',
          reach: '35000',
          clicks: '1152',
          spend: '29833.33',
          ctr: '2.74',
          cpc: '25.90',
          cpm: '710.32',
          actions: [
            { action_type: 'purchase', value: '41' },
            { action_type: 'add_to_cart', value: '87' },
            { action_type: 'view_content', value: '312' },
          ],
          action_values: [
            { action_type: 'purchase', value: '1230000' },
          ],
        },
      ],
      paging: {
        cursors: { before: 'cursor_before', after: 'cursor_after' },
      },
    })
  }),

  // Create Campaign
  http.post(`${META_API_BASE}/act_:accountId/campaigns`, async ({ request }) => {
    const body = await request.json() as Record<string, string>
    return HttpResponse.json({
      id: `12021${Date.now()}`,
      name: body.name,
      status: body.status || 'PAUSED',
      objective: body.objective,
    })
  }),

  // Update Campaign
  http.post(`${META_API_BASE}/:campaignId`, async ({ params, request }) => {
    const body = await request.json() as Record<string, string>
    return HttpResponse.json({
      id: params.campaignId,
      success: true,
      ...body,
    })
  }),

  // Get AdSets
  http.get(`${META_API_BASE}/:campaignId/adsets`, ({ params }) => {
    return HttpResponse.json({
      data: [
        {
          id: 'adset_001',
          campaign_id: params.campaignId,
          name: 'Test Ad Set',
          status: 'ACTIVE',
          daily_budget: '20000',
          billing_event: 'IMPRESSIONS',
          optimization_goal: 'REACH',
        },
      ],
      paging: {
        cursors: { before: 'cursor_before', after: 'cursor_after' },
      },
    })
  }),

  // Get Pixels
  http.get(`${META_API_BASE}/act_:accountId/adspixels`, () => {
    return HttpResponse.json({
      data: [
        {
          id: '1234567890',
          name: 'Test Pixel 1',
          code: 'fbq("init", "1234567890");',
        },
      ],
    })
  }),

  // Token validation (debug_token)
  http.get(`${META_API_BASE}/debug_token`, ({ request }) => {
    const url = new URL(request.url)
    const inputToken = url.searchParams.get('input_token')

    if (inputToken === 'invalid_token') {
      return HttpResponse.json({
        data: {
          is_valid: false,
          error: {
            code: 190,
            message: 'Invalid OAuth 2.0 Access Token',
          },
        },
      })
    }

    return HttpResponse.json({
      data: {
        app_id: '123456789',
        type: 'USER',
        is_valid: true,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        scopes: ['ads_management', 'ads_read', 'business_management'],
      },
    })
  }),

  // Error handler - rate limit
  http.get(`${META_API_BASE}/rate-limit-test`, () => {
    return HttpResponse.json(
      {
        error: {
          message: '(#17) User request limit reached',
          type: 'OAuthException',
          code: 17,
          fbtrace_id: 'trace_123',
        },
      },
      { status: 400 }
    )
  }),
]
