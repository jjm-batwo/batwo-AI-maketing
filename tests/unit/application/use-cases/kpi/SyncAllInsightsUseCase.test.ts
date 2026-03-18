import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SyncAllInsightsUseCase } from '@application/use-cases/kpi/SyncAllInsightsUseCase'
import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import type { IKPIRepository } from '@domain/repositories/IKPIRepository'
import type { IMetaAdsService } from '@application/ports/IMetaAdsService'
import type { IMetaAdAccountRepository } from '@application/ports/IMetaAdAccountRepository'

const mockCampaignRepo = {
  findByUserId: vi.fn(),
} as unknown as ICampaignRepository

const mockKPIRepo = {
  save: vi.fn(),
  saveMany: vi.fn(),
} as unknown as IKPIRepository

const mockMetaAds = {
  getCampaignDailyInsights: vi.fn(),
  getAccountInsights: vi.fn(),
} as unknown as IMetaAdsService

const mockMetaAccountRepo = {
  findByUserId: vi.fn(),
} as unknown as IMetaAdAccountRepository

describe('SyncAllInsightsUseCase', () => {
  let useCase: SyncAllInsightsUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    useCase = new SyncAllInsightsUseCase(
      mockCampaignRepo,
      mockKPIRepo,
      mockMetaAds,
      mockMetaAccountRepo
    )
  })

  it('should return empty result when no Meta account', async () => {
    vi.mocked(mockMetaAccountRepo.findByUserId).mockResolvedValue(null)

    const result = await useCase.execute({ userId: 'user-1' })

    expect(result.synced).toBe(0)
    expect(result.total).toBe(0)
  })

  it('should use getAccountInsights instead of per-campaign calls', async () => {
    vi.mocked(mockMetaAccountRepo.findByUserId).mockResolvedValue({
      id: 'ma-1',
      userId: 'user-1',
      metaAccountId: 'act_123',
      accessToken: 'encrypted_token',
      tokenExpiry: new Date('2026-12-31'),
    } as any)

    vi.mocked(mockCampaignRepo.findByUserId).mockResolvedValue([
      { id: 'local-c1', metaCampaignId: 'meta-c1', name: 'Campaign 1' },
      { id: 'local-c2', metaCampaignId: 'meta-c2', name: 'Campaign 2' },
      { id: 'local-c3', metaCampaignId: null, name: 'No Meta Campaign' },
    ] as any)

    // Bulk insights: key = campaignId_dateStart when timeIncrement='1'
    const insightsMap = new Map([
      ['meta-c1_2026-03-15', {
        campaignId: 'meta-c1',
        impressions: 1000, reach: 800, clicks: 50, linkClicks: 40,
        conversions: 5, spend: 10000, revenue: 30000,
        dateStart: '2026-03-15', dateStop: '2026-03-15',
      }],
      ['meta-c1_2026-03-16', {
        campaignId: 'meta-c1',
        impressions: 1200, reach: 900, clicks: 60, linkClicks: 45,
        conversions: 6, spend: 12000, revenue: 36000,
        dateStart: '2026-03-16', dateStop: '2026-03-16',
      }],
      ['meta-c2_2026-03-15', {
        campaignId: 'meta-c2',
        impressions: 500, reach: 400, clicks: 25, linkClicks: 20,
        conversions: 2, spend: 5000, revenue: 10000,
        dateStart: '2026-03-15', dateStop: '2026-03-15',
      }],
    ])
    vi.mocked(mockMetaAds.getAccountInsights).mockResolvedValue(insightsMap)
    vi.mocked(mockKPIRepo.saveMany).mockResolvedValue([] as any)

    const result = await useCase.execute({ userId: 'user-1', datePreset: 'last_7d' })

    // Should call getAccountInsights once (bulk), NOT getCampaignDailyInsights
    expect(mockMetaAds.getAccountInsights).toHaveBeenCalledTimes(1)
    expect(mockMetaAds.getAccountInsights).toHaveBeenCalledWith(
      expect.any(String),
      'act_123',
      expect.objectContaining({
        level: 'campaign',
        timeIncrement: '1',
      })
    )
    expect(mockMetaAds.getCampaignDailyInsights).not.toHaveBeenCalled()

    // 3 daily records saved (2 for c1, 1 for c2)
    expect(result.synced).toBe(3)
    expect(result.total).toBe(2) // 2 meta campaigns
    expect(mockKPIRepo.saveMany).toHaveBeenCalledTimes(1)
    expect(mockKPIRepo.saveMany).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ campaignId: 'local-c1' }),
    ]))
  })

  it('should skip campaigns without metaCampaignId', async () => {
    vi.mocked(mockMetaAccountRepo.findByUserId).mockResolvedValue({
      id: 'ma-1', userId: 'user-1', metaAccountId: 'act_123',
      accessToken: 'encrypted_token', tokenExpiry: new Date('2026-12-31'),
    } as any)

    vi.mocked(mockCampaignRepo.findByUserId).mockResolvedValue([
      { id: 'local-c1', metaCampaignId: null, name: 'Local Only' },
    ] as any)

    vi.mocked(mockMetaAds.getAccountInsights).mockResolvedValue(new Map())

    const result = await useCase.execute({ userId: 'user-1' })

    expect(result.total).toBe(0)
    expect(mockMetaAds.getAccountInsights).not.toHaveBeenCalled()
  })
})
