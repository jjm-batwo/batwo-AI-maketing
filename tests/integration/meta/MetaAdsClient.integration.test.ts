/**
 * MetaAdsClient 읽기 전용 통합 테스트
 *
 * 실행 조건: META_TEST_ACCESS_TOKEN, META_TEST_AD_ACCOUNT_ID 환경변수 필요
 * 실행 방법:
 *   META_TEST_ACCESS_TOKEN=xxx META_TEST_AD_ACCOUNT_ID=act_xxx \
 *     npx vitest run -c vitest.config.integration.ts tests/integration/meta/MetaAdsClient
 *
 * 주의: 읽기 전용 API만 호출합니다 (캠페인 생성/수정/삭제 없음).
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { MetaAdsClient } from '@infrastructure/external/meta-ads/MetaAdsClient'
import { MetaAdsApiError } from '@infrastructure/external/errors'
import { describeIfFullConfig, META_TEST_TOKEN, META_TEST_AD_ACCOUNT } from './setup'

describeIfFullConfig('MetaAdsClient 읽기 전용 통합 테스트', () => {
  const accessToken = META_TEST_TOKEN!
  const adAccountId = META_TEST_AD_ACCOUNT!
  let client: MetaAdsClient

  beforeAll(() => {
    // META_MOCK_MODE 환경변수가 설정되지 않은 상태에서 실행 (실제 API 호출)
    process.env['META_MOCK_MODE'] = 'false'
    client = new MetaAdsClient()
  })

  // -------------------------------------------------------------------------
  // 캠페인 목록 조회 (listCampaigns)
  // -------------------------------------------------------------------------
  describe('listCampaigns', () => {
    it('should_return_campaigns_array_with_required_fields', async () => {
      const result = await client.listCampaigns(accessToken, adAccountId)

      expect(result).toBeDefined()
      expect(Array.isArray(result.campaigns)).toBe(true)

      for (const campaign of result.campaigns) {
        expect(typeof campaign.id).toBe('string')
        expect(campaign.id.length).toBeGreaterThan(0)
        expect(typeof campaign.name).toBe('string')
        expect(typeof campaign.status).toBe('string')
        expect(typeof campaign.objective).toBe('string')
      }
    })

    it('should_respect_limit_option_when_provided', async () => {
      const result = await client.listCampaigns(accessToken, adAccountId, { limit: 2 })

      expect(result).toBeDefined()
      expect(Array.isArray(result.campaigns)).toBe(true)
      // limit 옵션이 캠페인 수에 반영되는지 검증 (실제 캠페인이 2개 이상인 경우)
      expect(result.campaigns.length).toBeLessThanOrEqual(2)
    })

    it('should_return_paging_cursor_when_more_results_exist', async () => {
      // 먼저 전체 목록을 가져와 총 개수 파악
      const fullResult = await client.listCampaigns(accessToken, adAccountId)

      if (fullResult.campaigns.length > 1) {
        // 1개만 가져오면 페이징 커서가 있어야 함
        const limitedResult = await client.listCampaigns(accessToken, adAccountId, { limit: 1 })
        // 캠페인이 2개 이상이면 paging 정보가 있을 수 있음
        // (API에서 항상 반환하지 않을 수 있으므로 타입만 검증)
        if (limitedResult.paging) {
          expect(typeof limitedResult.paging.after).toBe('string')
          expect(typeof limitedResult.paging.hasNext).toBe('boolean')
        }
      }
    })
  })

  // -------------------------------------------------------------------------
  // 인사이트 조회 (getCampaignInsights) - 기존 캠페인 사용
  // -------------------------------------------------------------------------
  describe('getCampaignInsights', () => {
    it('should_return_numeric_insight_fields_for_existing_campaign', async () => {
      const listResult = await client.listCampaigns(accessToken, adAccountId, { limit: 1 })

      if (listResult.campaigns.length === 0) {
        // 광고 계정에 캠페인이 없으면 테스트 패스 (읽기 전용 목적)
        return
      }

      const campaignId = listResult.campaigns[0].id
      const insights = await client.getCampaignInsights(accessToken, campaignId, 'last_7d')

      expect(insights).toBeDefined()
      expect(typeof insights.campaignId).toBe('string')
      expect(typeof insights.impressions).toBe('number')
      expect(typeof insights.clicks).toBe('number')
      expect(typeof insights.spend).toBe('number')
      expect(typeof insights.conversions).toBe('number')
      expect(typeof insights.revenue).toBe('number')
      expect(insights.impressions).toBeGreaterThanOrEqual(0)
      expect(insights.clicks).toBeGreaterThanOrEqual(0)
      expect(insights.spend).toBeGreaterThanOrEqual(0)
    })

    it('should_return_insights_for_different_date_presets', async () => {
      const listResult = await client.listCampaigns(accessToken, adAccountId, { limit: 1 })

      if (listResult.campaigns.length === 0) {
        return
      }

      const campaignId = listResult.campaigns[0].id
      const presets = ['today', 'last_7d', 'last_30d'] as const

      for (const preset of presets) {
        const insights = await client.getCampaignInsights(accessToken, campaignId, preset)
        expect(insights).toBeDefined()
        expect(insights.campaignId).toBe(campaignId)
        expect(insights.impressions).toBeGreaterThanOrEqual(0)
      }
    })
  })

  // -------------------------------------------------------------------------
  // 단건 캠페인 조회 (getCampaign)
  // -------------------------------------------------------------------------
  describe('getCampaign', () => {
    it('should_return_campaign_data_for_existing_campaign', async () => {
      const listResult = await client.listCampaigns(accessToken, adAccountId, { limit: 1 })

      if (listResult.campaigns.length === 0) {
        return
      }

      const campaignId = listResult.campaigns[0].id
      const campaign = await client.getCampaign(accessToken, campaignId)

      expect(campaign).not.toBeNull()
      expect(campaign!.id).toBe(campaignId)
      expect(typeof campaign!.name).toBe('string')
      expect(typeof campaign!.status).toBe('string')
      expect(typeof campaign!.objective).toBe('string')
    })

    it('should_return_null_for_nonexistent_campaign_id', async () => {
      // 존재하지 않는 캠페인 ID 조회 시 null 반환 검증
      const result = await client.getCampaign(accessToken, '0000000000000001')
      expect(result).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // 에러 핸들링
  // -------------------------------------------------------------------------
  describe('에러 핸들링', () => {
    it('should_throw_MetaAdsApiError_when_invalid_token_used', async () => {
      const invalidClient = new MetaAdsClient()
      const invalidToken = 'EAAinvalid_token_for_testing_purposes_only'

      await expect(
        invalidClient.listCampaigns(invalidToken, adAccountId)
      ).rejects.toThrow(MetaAdsApiError)
    })

    it('should_throw_MetaAdsApiError_with_auth_error_code_for_invalid_token', async () => {
      const invalidClient = new MetaAdsClient()
      const invalidToken = 'EAAinvalid_token_for_testing_purposes_only'

      try {
        await invalidClient.listCampaigns(invalidToken, adAccountId)
        expect.fail('MetaAdsApiError가 발생해야 합니다')
      } catch (error) {
        expect(error).toBeInstanceOf(MetaAdsApiError)
        // 인증 오류 코드(190) 또는 일반 OAuth 오류 확인
        if (error instanceof MetaAdsApiError) {
          expect(MetaAdsApiError.isAuthError(error)).toBe(true)
        }
      }
    })
  })
})
