import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SyncAdInsightsUseCase } from '@application/use-cases/kpi/SyncAdInsightsUseCase'

describe('SyncAdInsightsUseCase', () => {
  let useCase: SyncAdInsightsUseCase
  let mockAdKPIRepository: {
    upsertMany: ReturnType<typeof vi.fn>
    save: ReturnType<typeof vi.fn>
    saveMany: ReturnType<typeof vi.fn>
  }
  let mockAdRepository: {
    findById: ReturnType<typeof vi.fn>
    findByAdSetId: ReturnType<typeof vi.fn>
    findByMetaAdId: ReturnType<typeof vi.fn>
  }
  let mockMetaAdsService: {
    getAccountInsights: ReturnType<typeof vi.fn>
    listAllAds: ReturnType<typeof vi.fn>
  }
  let mockMetaAdAccountRepository: {
    findByUserId: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockAdKPIRepository = {
      upsertMany: vi.fn().mockResolvedValue(2),
      save: vi.fn(),
      saveMany: vi.fn(),
    }
    mockAdRepository = {
      findById: vi.fn(),
      findByAdSetId: vi.fn(),
      findByMetaAdId: vi.fn(),
    }
    mockMetaAdsService = {
      getAccountInsights: vi.fn(),
      listAllAds: vi.fn(),
    }
    mockMetaAdAccountRepository = {
      findByUserId: vi.fn(),
    }

    useCase = new SyncAdInsightsUseCase(
      mockAdKPIRepository as never,
      mockAdRepository as never,
      mockMetaAdsService as never,
      mockMetaAdAccountRepository as never
    )
  })

  it('should return early if no meta account', async () => {
    mockMetaAdAccountRepository.findByUserId.mockResolvedValue(null)

    const result = await useCase.execute({
      userId: 'user-1',
      datePreset: 'last_7d',
    })

    expect(result.syncedCount).toBe(0)
    expect(result.errors).toContain('No Meta account found')
  })

  it('should sync ad insights from Meta API', async () => {
    mockMetaAdAccountRepository.findByUserId.mockResolvedValue({
      metaAccountId: 'act_123',
      accessToken: 'encrypted-token',
    })

    const insightsMap = new Map([
      ['meta_ad_1_2026-03-15', {
        campaignId: 'meta_campaign_1',
        impressions: 5000,
        reach: 4000,
        clicks: 200,
        linkClicks: 150,
        spend: 50000,
        conversions: 20,
        revenue: 200000,
        dateStart: '2026-03-15',
        dateStop: '2026-03-15',
        frequency: 1.25,
        cpm: 10000,
        cpc: 250,
        videoViews: 1000,
        thruPlays: 500,
        adSetId: 'meta_adset_1',
        adId: 'meta_ad_1',
      }],
    ])

    mockMetaAdsService.getAccountInsights.mockResolvedValue(insightsMap)

    mockAdRepository.findByMetaAdId.mockResolvedValue({
      id: 'local_ad_1',
      metaAdId: 'meta_ad_1',
      creativeId: 'creative_1',
      adSetId: 'local_adset_1',
    })

    const result = await useCase.execute({
      userId: 'user-1',
      datePreset: 'last_7d',
    })

    expect(result.syncedCount).toBeGreaterThan(0)
    expect(mockAdKPIRepository.upsertMany).toHaveBeenCalled()
  })

  it('should handle errors gracefully', async () => {
    mockMetaAdAccountRepository.findByUserId.mockResolvedValue({
      metaAccountId: 'act_123',
      accessToken: 'encrypted-token',
    })
    mockMetaAdsService.getAccountInsights.mockRejectedValue(
      new Error('API rate limit')
    )

    const result = await useCase.execute({
      userId: 'user-1',
      datePreset: 'last_7d',
    })

    expect(result.failedCount).toBeGreaterThan(0)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})
