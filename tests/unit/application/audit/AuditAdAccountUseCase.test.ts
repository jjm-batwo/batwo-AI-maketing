/**
 * AuditAdAccountUseCase 단위 테스트
 * TDD: RED → GREEN → REFACTOR
 * 벌크 조회 최적화: getCampaignInsights × N → getAccountInsights(level='campaign') 1회
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuditAdAccountUseCase } from '@application/use-cases/audit/AuditAdAccountUseCase'
import type {
  IMetaAdsService,
  MetaCampaignListItem,
  MetaInsightsData,
  ListCampaignsResponse,
} from '@application/ports/IMetaAdsService'

// IMetaAdsService 전체 Mock
const makeMockMetaAdsService = (): IMetaAdsService => ({
  listCampaigns: vi.fn(),
  getCampaignInsights: vi.fn(),
  getCampaign: vi.fn(),
  getCampaignDailyInsights: vi.fn(),
  createCampaign: vi.fn(),
  updateCampaignStatus: vi.fn(),
  updateCampaign: vi.fn(),
  deleteCampaign: vi.fn(),
  createAdSet: vi.fn(),
  updateAdSet: vi.fn(),
  deleteAdSet: vi.fn(),
  listAdSets: vi.fn(),
  createAd: vi.fn(),
  createAdCreative: vi.fn(),
  uploadImage: vi.fn(),
  uploadVideo: vi.fn(),
  // Bulk methods
  getAccountInsights: vi.fn(),
  listAllAdSets: vi.fn(),
  listAllAds: vi.fn(),
})

// 테스트 픽스처: 활성 캠페인 목록 항목
const makeActiveCampaignItem = (overrides: Partial<MetaCampaignListItem> = {}): MetaCampaignListItem => ({
  id: 'meta-campaign-1',
  name: '테스트 캠페인',
  status: 'ACTIVE',
  objective: 'CONVERSIONS',
  dailyBudget: 100000,
  createdTime: '2026-01-01T00:00:00Z',
  updatedTime: '2026-01-01T00:00:00Z',
  ...overrides,
})

// 테스트 픽스처: 캠페인 인사이트 (수익성 있음)
const makeProfitableInsights = (campaignId: string): MetaInsightsData => ({
  campaignId,
  impressions: 10000,
  reach: 8000,
  clicks: 300,
  linkClicks: 280,
  spend: 100000,
  conversions: 9,
  revenue: 400000,
  dateStart: '2026-01-01',
  dateStop: '2026-01-30',
})

// 테스트 픽스처: 캠페인 인사이트 (손실)
const makeUnprofitableInsights = (campaignId: string): MetaInsightsData => ({
  campaignId,
  impressions: 10000,
  reach: 8000,
  clicks: 40,
  linkClicks: 35,
  spend: 100000,
  conversions: 0,
  revenue: 50000,
  dateStart: '2026-01-01',
  dateStop: '2026-01-30',
})

/** Map 생성 헬퍼 */
function buildInsightsMap(entries: MetaInsightsData[]): Map<string, MetaInsightsData> {
  const map = new Map<string, MetaInsightsData>()
  for (const e of entries) {
    map.set(e.campaignId, e)
  }
  return map
}

// currency 추가 (하위 호환: 선택적 필드)
const TEST_DTO = {
  accessToken: 'test-access-token',
  adAccountId: 'act_123456789',
  currency: 'KRW',
}

describe('AuditAdAccountUseCase', () => {
  let mockMetaAdsService: IMetaAdsService
  let useCase: AuditAdAccountUseCase

  beforeEach(() => {
    mockMetaAdsService = makeMockMetaAdsService()
    useCase = new AuditAdAccountUseCase(mockMetaAdsService)
  })

  it('should_generate_report_with_all_categories_when_account_has_campaigns', async () => {
    const campaigns = [makeActiveCampaignItem()]
    vi.mocked(mockMetaAdsService.listCampaigns).mockResolvedValue({
      campaigns,
      paging: { hasNext: false },
    } satisfies ListCampaignsResponse)
    vi.mocked(mockMetaAdsService.getAccountInsights).mockResolvedValue(
      buildInsightsMap([makeProfitableInsights('meta-campaign-1')])
    )

    const report = await useCase.execute(TEST_DTO)

    expect(report.categories).toHaveLength(4)
    expect(report.overall).toBeGreaterThanOrEqual(0)
    expect(['A', 'B', 'C', 'D', 'F']).toContain(report.grade)
    expect(report.totalCampaigns).toBe(1)
    // analyzedAt은 ISO 문자열로 직렬화됨
    expect(typeof report.analyzedAt).toBe('string')
    expect(new Date(report.analyzedAt).getTime()).toBeGreaterThan(0)
  })

  it('should_return_empty_report_when_no_campaigns_exist', async () => {
    vi.mocked(mockMetaAdsService.listCampaigns).mockResolvedValue({
      campaigns: [],
      paging: { hasNext: false },
    } satisfies ListCampaignsResponse)

    const report = await useCase.execute(TEST_DTO)

    expect(report.totalCampaigns).toBe(0)
    expect(report.activeCampaigns).toBe(0)
    // 캠페인 없음 → 낭비 없음
    expect(report.estimatedWaste.amount).toBe(0)
  })

  it('should_calculate_estimated_waste_and_improvement', async () => {
    // ROAS < 1.0인 캠페인 2개 → 낭비 금액 계산
    const campaigns = [
      makeActiveCampaignItem({ id: 'meta-campaign-1', name: '손실 캠페인 1' }),
      makeActiveCampaignItem({ id: 'meta-campaign-2', name: '손실 캠페인 2' }),
    ]
    vi.mocked(mockMetaAdsService.listCampaigns).mockResolvedValue({
      campaigns,
      paging: { hasNext: false },
    } satisfies ListCampaignsResponse)
    vi.mocked(mockMetaAdsService.getAccountInsights).mockResolvedValue(
      buildInsightsMap([
        makeUnprofitableInsights('meta-campaign-1'),
        makeUnprofitableInsights('meta-campaign-2'),
      ])
    )

    const report = await useCase.execute(TEST_DTO)

    // 두 캠페인 모두 ROAS < 1.0: spend 합산 = 100000 + 100000 = 200,000
    expect(report.estimatedWaste.amount).toBe(200000)
    expect(report.estimatedImprovement.amount).toBeGreaterThanOrEqual(0)
  })

  it('should_skip_campaign_when_insights_not_available', async () => {
    const campaigns = [
      makeActiveCampaignItem({ id: 'meta-campaign-1', name: '정상 캠페인' }),
      makeActiveCampaignItem({ id: 'meta-campaign-2', name: '데이터 없는 캠페인' }),
    ]
    vi.mocked(mockMetaAdsService.listCampaigns).mockResolvedValue({
      campaigns,
      paging: { hasNext: false },
    } satisfies ListCampaignsResponse)
    // meta-campaign-2는 insightsMap에 없음 → 건너뜀
    vi.mocked(mockMetaAdsService.getAccountInsights).mockResolvedValue(
      buildInsightsMap([makeProfitableInsights('meta-campaign-1')])
    )

    const report = await useCase.execute(TEST_DTO)

    expect(report.totalCampaigns).toBe(2)
    // 성공한 캠페인만 분석
    expect(report.overall).toBeGreaterThanOrEqual(0)
  })

  it('should_count_active_campaigns_correctly', async () => {
    const campaigns = [
      makeActiveCampaignItem({ id: 'meta-campaign-1', status: 'ACTIVE' }),
      makeActiveCampaignItem({ id: 'meta-campaign-2', status: 'PAUSED' }),
      makeActiveCampaignItem({ id: 'meta-campaign-3', status: 'ACTIVE' }),
    ]
    vi.mocked(mockMetaAdsService.listCampaigns).mockResolvedValue({
      campaigns,
      paging: { hasNext: false },
    } satisfies ListCampaignsResponse)
    vi.mocked(mockMetaAdsService.getAccountInsights).mockResolvedValue(
      buildInsightsMap([
        makeProfitableInsights('meta-campaign-1'),
        makeProfitableInsights('meta-campaign-2'),
        makeProfitableInsights('meta-campaign-3'),
      ])
    )

    const report = await useCase.execute(TEST_DTO)

    expect(report.totalCampaigns).toBe(3)
    expect(report.activeCampaigns).toBe(2)
  })

  it('should_not_modify_any_campaign_data', async () => {
    const campaigns = [makeActiveCampaignItem()]
    vi.mocked(mockMetaAdsService.listCampaigns).mockResolvedValue({
      campaigns,
      paging: { hasNext: false },
    } satisfies ListCampaignsResponse)
    vi.mocked(mockMetaAdsService.getAccountInsights).mockResolvedValue(
      buildInsightsMap([makeProfitableInsights('meta-campaign-1')])
    )

    await useCase.execute(TEST_DTO)

    // 읽기 전용: 캠페인 수정 API는 절대 호출되어서는 안 됨
    expect(mockMetaAdsService.updateCampaign).not.toHaveBeenCalled()
    expect(mockMetaAdsService.updateCampaignStatus).not.toHaveBeenCalled()
    expect(mockMetaAdsService.deleteCampaign).not.toHaveBeenCalled()
    expect(mockMetaAdsService.createCampaign).not.toHaveBeenCalled()
  })

  it('20개 캠페인 → getAccountInsights가 1회만 호출된다', async () => {
    // 20개 캠페인 생성
    const campaigns = Array.from({ length: 20 }, (_, i) =>
      makeActiveCampaignItem({ id: `meta-campaign-${i + 1}`, name: `캠페인 ${i + 1}` })
    )
    vi.mocked(mockMetaAdsService.listCampaigns).mockResolvedValue({
      campaigns,
      paging: { hasNext: false },
    } satisfies ListCampaignsResponse)
    // 모든 인사이트 벌크 반환
    const allInsights = campaigns.map((c) => makeProfitableInsights(c.id))
    vi.mocked(mockMetaAdsService.getAccountInsights).mockResolvedValue(
      buildInsightsMap(allInsights)
    )

    const report = await useCase.execute(TEST_DTO)

    // 20개 캠페인 모두 처리됨
    expect(report.totalCampaigns).toBe(20)
    // getAccountInsights가 1번만 호출됨 (기존 20번 → 1번)
    expect(mockMetaAdsService.getAccountInsights).toHaveBeenCalledTimes(1)
    // getCampaignInsights는 호출되지 않음
    expect(mockMetaAdsService.getCampaignInsights).not.toHaveBeenCalled()
    expect(report.overall).toBeGreaterThanOrEqual(0)
  })

  it('currency가 DTO 값을 리포트에 반영한다', async () => {
    const campaigns = [makeActiveCampaignItem()]
    vi.mocked(mockMetaAdsService.listCampaigns).mockResolvedValue({
      campaigns,
      paging: { hasNext: false },
    } satisfies ListCampaignsResponse)
    vi.mocked(mockMetaAdsService.getAccountInsights).mockResolvedValue(
      buildInsightsMap([makeUnprofitableInsights('meta-campaign-1')])
    )

    const report = await useCase.execute({
      accessToken: 'test-token',
      adAccountId: 'act_123',
      currency: 'USD',
    })

    // estimatedWaste/estimatedImprovement 통화 코드가 USD여야 함
    expect(report.estimatedWaste.currency).toBe('USD')
    expect(report.estimatedImprovement.currency).toBe('USD')
  })

  it('currency 미전달 시 기본값 KRW를 사용한다', async () => {
    vi.mocked(mockMetaAdsService.listCampaigns).mockResolvedValue({
      campaigns: [],
      paging: { hasNext: false },
    } satisfies ListCampaignsResponse)

    // currency 필드 없이 호출
    const report = await useCase.execute({
      accessToken: 'test-token',
      adAccountId: 'act_123',
    })

    expect(report.estimatedWaste.currency).toBe('KRW')
    expect(report.estimatedImprovement.currency).toBe('KRW')
  })
})
