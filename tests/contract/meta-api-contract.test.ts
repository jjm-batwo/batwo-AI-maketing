import { describe, it, expect, beforeAll } from 'vitest'
import {
  MetaCampaignResponseSchema,
  MetaCampaignListResponseSchema,
  MetaInsightsResponseSchema,
  MetaAdAccountResponseSchema,
  MetaAdAccountListResponseSchema,
  MetaApiErrorResponseSchema,
} from './schemas'

/**
 * Meta Graph API Contract Tests
 *
 * 이 테스트는 Meta API 응답 스키마가 우리 코드의 기대와 일치하는지 검증합니다.
 * 실제 API를 호출하지 않고, 고정된 예시 응답(fixtures)을 Zod 스키마로 파싱하여
 * 스키마 변경을 자동 감지합니다.
 *
 * META_ACCESS_TOKEN 환경 변수가 설정되면 실제 API도 호출하여 검증합니다.
 *
 * 실행: npm run test:contract
 */

const META_API_VERSION = 'v25.0'
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`

// ─── Fixture: 실제 Meta API 응답 구조를 모사한 테스트 데이터 ──────────────
const fixtures = {
  campaign: {
    id: '120210000000001',
    name: '신규 고객 확보 캠페인',
    status: 'ACTIVE',
    objective: 'OUTCOME_SALES',
    daily_budget: '50000',
    start_time: '2026-01-01T00:00:00+0900',
    end_time: '2026-03-31T23:59:59+0900',
    created_time: '2026-01-01T00:00:00+0900',
    updated_time: '2026-03-10T12:00:00+0900',
    effective_status: 'ACTIVE',
  },

  campaignList: {
    data: [
      {
        id: '120210000000001',
        name: '신규 고객 확보 캠페인',
        status: 'ACTIVE',
        objective: 'OUTCOME_SALES',
        daily_budget: '50000',
        created_time: '2026-01-01T00:00:00+0900',
        updated_time: '2026-03-10T12:00:00+0900',
      },
      {
        id: '120210000000002',
        name: '브랜드 인지도 캠페인',
        status: 'PAUSED',
        objective: 'OUTCOME_AWARENESS',
        lifetime_budget: '1000000',
        created_time: '2026-02-01T00:00:00+0900',
        updated_time: '2026-03-10T12:00:00+0900',
      },
    ],
    paging: {
      cursors: {
        before: 'before_cursor_value',
        after: 'after_cursor_value',
      },
      next: `${META_API_BASE}/act_123456/campaigns?after=after_cursor_value`,
    },
  },

  insights: {
    data: [
      {
        campaign_id: '120210000000001',
        impressions: '15000',
        reach: '12000',
        clicks: '450',
        spend: '125000',
        actions: [
          { action_type: 'link_click', value: '380' },
          { action_type: 'purchase', value: '12' },
          { action_type: 'page_engagement', value: '45' },
        ],
        action_values: [
          { action_type: 'purchase', value: '480000' },
        ],
        date_start: '2026-03-04',
        date_stop: '2026-03-10',
      },
    ],
    paging: {
      cursors: {
        before: 'insights_before',
        after: 'insights_after',
      },
    },
  },

  adAccount: {
    id: 'act_123456789',
    account_id: '123456789',
    name: 'Batwo 광고 계정',
    account_status: 1,
    currency: 'KRW',
    timezone_name: 'Asia/Seoul',
    timezone_offset_hours_utc: 9,
    business_name: '바투 AI',
    amount_spent: '1500000',
    balance: '0',
  },

  adAccountList: {
    data: [
      {
        id: 'act_123456789',
        account_id: '123456789',
        name: 'Batwo 광고 계정',
        account_status: 1,
        currency: 'KRW',
      },
    ],
    paging: {
      cursors: {
        after: 'acc_cursor',
      },
    },
  },

  error: {
    error: {
      message: 'Invalid OAuth 2.0 Access Token',
      type: 'OAuthException',
      code: 190,
      error_subcode: 463,
      fbtrace_id: 'AbCdEfGhIjK',
    },
  },
}

// ─── Contract Tests ────────────────────────────────────────────────────────

describe('Meta Graph API Contract Tests (Fixture-based)', () => {
  describe('Campaign API', () => {
    it('단일 캠페인 응답이 스키마와 일치해야 함', () => {
      const result = MetaCampaignResponseSchema.safeParse(fixtures.campaign)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe('120210000000001')
        expect(result.data.status).toBe('ACTIVE')
      }
    })

    it('캠페인 목록 응답이 스키마와 일치해야 함', () => {
      const result = MetaCampaignListResponseSchema.safeParse(fixtures.campaignList)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.data).toHaveLength(2)
        expect(result.data.paging?.cursors?.after).toBeDefined()
      }
    })

    it('필수 필드 누락 시 파싱 실패해야 함', () => {
      const invalid = { id: '123', name: 'Test' } // status, objective 누락
      const result = MetaCampaignResponseSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('예상치 못한 status 값 시 파싱 실패해야 함', () => {
      const invalidStatus = {
        ...fixtures.campaign,
        status: 'UNKNOWN_STATUS',
      }
      const result = MetaCampaignResponseSchema.safeParse(invalidStatus)
      expect(result.success).toBe(false)
    })
  })

  describe('Insights API', () => {
    it('Insights 응답이 스키마와 일치해야 함', () => {
      const result = MetaInsightsResponseSchema.safeParse(fixtures.insights)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.data).toHaveLength(1)
        expect(result.data.data[0].campaign_id).toBe('120210000000001')
        expect(result.data.data[0].actions).toBeDefined()
      }
    })

    it('빈 data 배열도 유효해야 함', () => {
      const emptyInsights = { data: [] }
      const result = MetaInsightsResponseSchema.safeParse(emptyInsights)
      expect(result.success).toBe(true)
    })

    it('actions가 없는 Insights도 유효해야 함', () => {
      const noActions = {
        data: [{
          campaign_id: '120210000000001',
          date_start: '2026-03-04',
          date_stop: '2026-03-10',
        }],
      }
      const result = MetaInsightsResponseSchema.safeParse(noActions)
      expect(result.success).toBe(true)
    })

    it('actions 항목의 구조가 올바라야 함', () => {
      const invalidAction = {
        data: [{
          campaign_id: '120210000000001',
          date_start: '2026-03-04',
          date_stop: '2026-03-10',
          actions: [{ action_type: 'click' }], // value 누락
        }],
      }
      const result = MetaInsightsResponseSchema.safeParse(invalidAction)
      expect(result.success).toBe(false)
    })
  })

  describe('Ad Account API', () => {
    it('Ad Account 응답이 스키마와 일치해야 함', () => {
      const result = MetaAdAccountResponseSchema.safeParse(fixtures.adAccount)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.currency).toBe('KRW')
        expect(result.data.account_status).toBe(1)
      }
    })

    it('Ad Account 목록 응답이 스키마와 일치해야 함', () => {
      const result = MetaAdAccountListResponseSchema.safeParse(fixtures.adAccountList)
      expect(result.success).toBe(true)
    })
  })

  describe('Error Response', () => {
    it('Meta API 에러 응답이 스키마와 일치해야 함', () => {
      const result = MetaApiErrorResponseSchema.safeParse(fixtures.error)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.error.code).toBe(190)
        expect(result.data.error.type).toBe('OAuthException')
      }
    })

    it('에러 message가 없으면 파싱 실패해야 함', () => {
      const invalidError = {
        error: { code: 190 }, // message 누락
      }
      const result = MetaApiErrorResponseSchema.safeParse(invalidError)
      expect(result.success).toBe(false)
    })
  })
})

// ─── Live API Contract Tests (선택적) ──────────────────────────────────────

describe.skipIf(!process.env.META_ACCESS_TOKEN)(
  'Meta Graph API Contract Tests (Live API)',
  () => {
    let accessToken: string
    let adAccountId: string

    beforeAll(() => {
      accessToken = process.env.META_ACCESS_TOKEN!
      adAccountId = process.env.META_AD_ACCOUNT_ID || ''
    })

    it('실제 Campaign 목록 조회 응답이 스키마를 만족해야 함', async () => {
      if (!adAccountId) {
        console.warn('META_AD_ACCOUNT_ID가 설정되지 않아 건너뜁니다.')
        return
      }

      const url = `${META_API_BASE}/${adAccountId}/campaigns?access_token=${accessToken}&fields=id,name,status,objective,daily_budget,created_time,updated_time&limit=5`
      const response = await fetch(url)
      const data = await response.json()

      if (data.error) {
        console.warn('Meta API 에러:', data.error.message)
        // 에러 응답도 스키마를 만족하는지 확인
        const errorResult = MetaApiErrorResponseSchema.safeParse(data)
        expect(errorResult.success).toBe(true)
        return
      }

      const result = MetaCampaignListResponseSchema.safeParse(data)
      if (!result.success) {
        console.error('Schema validation failed:', JSON.stringify(result.error.issues, null, 2))
        console.error('Actual response:', JSON.stringify(data, null, 2))
      }
      expect(result.success).toBe(true)
    })

    it('실제 Ad Account 조회 응답이 스키마를 만족해야 함', async () => {
      if (!adAccountId) {
        console.warn('META_AD_ACCOUNT_ID가 설정되지 않아 건너뜁니다.')
        return
      }

      const url = `${META_API_BASE}/${adAccountId}?access_token=${accessToken}&fields=id,account_id,name,account_status,currency,timezone_name`
      const response = await fetch(url)
      const data = await response.json()

      if (data.error) {
        const errorResult = MetaApiErrorResponseSchema.safeParse(data)
        expect(errorResult.success).toBe(true)
        return
      }

      const result = MetaAdAccountResponseSchema.safeParse(data)
      if (!result.success) {
        console.error('Schema validation failed:', JSON.stringify(result.error.issues, null, 2))
        console.error('Actual response:', JSON.stringify(data, null, 2))
      }
      expect(result.success).toBe(true)
    })
  }
)
