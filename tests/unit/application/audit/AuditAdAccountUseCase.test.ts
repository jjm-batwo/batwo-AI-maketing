/**
 * AuditAdAccountUseCase 단위 테스트
 * TDD: RED → GREEN → REFACTOR
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

const TEST_DTO = {
  accessToken: 'test-access-token',
  adAccountId: 'act_123456789',
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
    vi.mocked(mockMetaAdsService.getCampaignInsights).mockResolvedValue(
      makeProfitableInsights('meta-campaign-1')
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
    vi.mocked(mockMetaAdsService.getCampaignInsights)
      .mockResolvedValueOnce(makeUnprofitableInsights('meta-campaign-1')) // spend=100000
      .mockResolvedValueOnce(makeUnprofitableInsights('meta-campaign-2')) // spend=100000

    const report = await useCase.execute(TEST_DTO)

    // 두 캠페인 모두 ROAS < 1.0: spend 합산 = 100000 + 100000 = 200,000
    // estimatedWaste는 { amount, currency } 평면 객체로 직렬화됨
    expect(report.estimatedWaste.amount).toBe(200000)
    expect(report.estimatedImprovement.amount).toBeGreaterThanOrEqual(0)
  })

  it('should_skip_campaign_when_insights_fetch_fails', async () => {
    const campaigns = [
      makeActiveCampaignItem({ id: 'meta-campaign-1', name: '정상 캠페인' }),
      makeActiveCampaignItem({ id: 'meta-campaign-2', name: '오류 캠페인' }),
    ]
    vi.mocked(mockMetaAdsService.listCampaigns).mockResolvedValue({
      campaigns,
      paging: { hasNext: false },
    } satisfies ListCampaignsResponse)
    vi.mocked(mockMetaAdsService.getCampaignInsights)
      .mockResolvedValueOnce(makeProfitableInsights('meta-campaign-1'))
      .mockRejectedValueOnce(new Error('Meta API 오류'))

    // 오류 발생해도 전체 실행이 실패하지 않아야 함
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
    vi.mocked(mockMetaAdsService.getCampaignInsights).mockResolvedValue(
      makeProfitableInsights('meta-campaign-1')
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
    vi.mocked(mockMetaAdsService.getCampaignInsights).mockResolvedValue(
      makeProfitableInsights('meta-campaign-1')
    )

    await useCase.execute(TEST_DTO)

    // 읽기 전용: 캠페인 수정 API는 절대 호출되어서는 안 됨
    expect(mockMetaAdsService.updateCampaign).not.toHaveBeenCalled()
    expect(mockMetaAdsService.updateCampaignStatus).not.toHaveBeenCalled()
    expect(mockMetaAdsService.deleteCampaign).not.toHaveBeenCalled()
    expect(mockMetaAdsService.createCampaign).not.toHaveBeenCalled()
  })
})
