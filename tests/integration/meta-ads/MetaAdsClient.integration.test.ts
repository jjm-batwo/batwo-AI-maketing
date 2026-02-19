/**
 * MetaAdsClient 실제 통합 테스트
 *
 * 실행 조건: META_TEST_ACCESS_TOKEN 환경변수 필요
 * 실행 방법:
 *   META_TEST_ACCESS_TOKEN=xxx META_TEST_AD_ACCOUNT_ID=act_xxx npx vitest run tests/integration/meta-ads
 *
 * 주의: 실제 Meta API를 호출하므로 테스트 전용 계정 사용 권장
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { MetaAdsClient } from '@infrastructure/external/meta-ads/MetaAdsClient'
import { MetaAdsApiError } from '@infrastructure/external/errors'

// META_TEST_ACCESS_TOKEN이 없으면 전체 테스트 skip
const describeIfMeta = process.env.META_TEST_ACCESS_TOKEN ? describe : describe.skip

describeIfMeta('MetaAdsClient 통합 테스트 (실제 Meta API)', () => {
  const accessToken = process.env.META_TEST_ACCESS_TOKEN!
  const adAccountId = process.env.META_TEST_AD_ACCOUNT_ID!
  let client: MetaAdsClient

  // 테스트 생명주기 중 생성된 캠페인 ID (클린업용)
  let createdCampaignId: string | null = null

  beforeAll(() => {
    // mockMode가 아닌 실제 모드로 동작 (META_MOCK_MODE=false 상태에서 실행)
    client = new MetaAdsClient()
  })

  afterAll(async () => {
    // 생명주기 테스트에서 캠페인이 남아있으면 강제 클린업
    if (createdCampaignId) {
      try {
        await client.deleteCampaign(accessToken, createdCampaignId)
      } catch {
        // 이미 삭제됐거나 존재하지 않는 경우 무시
      }
      createdCampaignId = null
    }
  })

  // -----------------------------------------------------------------------
  // 테스트 1: 캠페인 목록 조회 (읽기 전용, 안전)
  // -----------------------------------------------------------------------
  it('should_return_campaigns_array_when_listCampaigns_called', async () => {
    const result = await client.listCampaigns(accessToken, adAccountId)

    expect(result).toBeDefined()
    expect(Array.isArray(result.campaigns)).toBe(true)

    // 각 캠페인 항목이 필수 필드를 가지는지 검증
    for (const campaign of result.campaigns) {
      expect(typeof campaign.id).toBe('string')
      expect(typeof campaign.name).toBe('string')
      expect(typeof campaign.status).toBe('string')
      expect(typeof campaign.objective).toBe('string')
    }
  })

  // -----------------------------------------------------------------------
  // 테스트 2: 캠페인 인사이트 조회 (읽기 전용)
  // 기존 캠페인이 있을 때만 인사이트 필드를 검증
  // -----------------------------------------------------------------------
  it('should_return_numeric_insight_fields_when_getCampaignInsights_called', async () => {
    // 기존 캠페인 중 첫 번째를 사용 (없으면 테스트 스킵)
    const listResult = await client.listCampaigns(accessToken, adAccountId, { limit: 1 })
    if (listResult.campaigns.length === 0) {
      // 광고 계정에 캠페인이 없으면 테스트를 pass로 처리 (읽기 전용 테스트 목적)
      return
    }

    const targetCampaignId = listResult.campaigns[0].id
    const insights = await client.getCampaignInsights(accessToken, targetCampaignId, 'last_7d')

    expect(insights).toBeDefined()
    expect(typeof insights.campaignId).toBe('string')
    // 숫자 필드 검증 (0 이상의 정수)
    expect(typeof insights.impressions).toBe('number')
    expect(typeof insights.clicks).toBe('number')
    expect(typeof insights.spend).toBe('number')
    expect(insights.impressions).toBeGreaterThanOrEqual(0)
    expect(insights.clicks).toBeGreaterThanOrEqual(0)
    expect(insights.spend).toBeGreaterThanOrEqual(0)
  })

  // -----------------------------------------------------------------------
  // 테스트 3: 테스트 캠페인 생명주기
  // createCampaign (PAUSED) → getCampaign → deleteCampaign
  // -----------------------------------------------------------------------
  it('should_complete_campaign_lifecycle_create_get_delete', async () => {
    // 3-1. 캠페인 생성 (PAUSED 상태 - 실제 게재 없음)
    const created = await client.createCampaign(accessToken, adAccountId, {
      name: `[통합테스트] 자동 삭제 캠페인 ${Date.now()}`,
      objective: 'OUTCOME_TRAFFIC',
      status: 'PAUSED',
      dailyBudget: 10000, // 최소 예산 (실제 게재 안됨)
    })

    expect(created).toBeDefined()
    expect(typeof created.id).toBe('string')
    expect(created.id.length).toBeGreaterThan(0)

    // 클린업용 ID 저장 (afterAll에서 fallback 삭제)
    createdCampaignId = created.id

    try {
      // 3-2. 생성된 캠페인 단건 조회
      const fetched = await client.getCampaign(accessToken, created.id)

      expect(fetched).not.toBeNull()
      expect(fetched!.id).toBe(created.id)
      expect(fetched!.name).toContain('[통합테스트]')
      expect(fetched!.status).toBe('PAUSED')

      // 3-3. 캠페인 삭제 (클린업)
      await client.deleteCampaign(accessToken, created.id)

      // 삭제 후 조회하면 null 반환 확인
      const afterDelete = await client.getCampaign(accessToken, created.id)
      expect(afterDelete).toBeNull()
    } finally {
      // finally에서도 삭제 시도 (중간 단계에서 실패해도 클린업 보장)
      try {
        await client.deleteCampaign(accessToken, created.id)
      } catch {
        // 이미 삭제된 경우 무시
      }
      createdCampaignId = null
    }
  })

  // -----------------------------------------------------------------------
  // 테스트 4: 에러 핸들링 - 잘못된 토큰
  // -----------------------------------------------------------------------
  it('should_throw_MetaAdsApiError_when_invalid_access_token_used', async () => {
    const invalidClient = new MetaAdsClient()
    const invalidToken = 'invalid_token_that_does_not_exist'

    await expect(
      invalidClient.listCampaigns(invalidToken, adAccountId)
    ).rejects.toThrow(MetaAdsApiError)
  })
})
