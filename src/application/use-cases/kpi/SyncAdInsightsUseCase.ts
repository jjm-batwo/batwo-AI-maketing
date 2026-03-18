import { AdKPI } from '@domain/entities/AdKPI'
import { Money } from '@domain/value-objects/Money'
import { IAdKPIRepository } from '@domain/repositories/IAdKPIRepository'
import { IAdRepository } from '@domain/repositories/IAdRepository'
import { IMetaAdsService } from '@application/ports/IMetaAdsService'
import { IMetaAdAccountRepository } from '@application/ports/IMetaAdAccountRepository'
import { safeDecryptToken } from '@application/utils/TokenEncryption'

export interface SyncAdInsightsInput {
  userId: string
  campaignIds?: string[]
  datePreset?: 'today' | 'yesterday' | 'last_7d' | 'last_30d'
}

export interface SyncAdInsightsResult {
  syncedCount: number
  failedCount: number
  errors: string[]
}

export class SyncAdInsightsUseCase {
  constructor(
    private readonly adKPIRepository: IAdKPIRepository,
    private readonly adRepository: IAdRepository,
    private readonly metaAdsService: IMetaAdsService,
    private readonly metaAdAccountRepository: IMetaAdAccountRepository
  ) {}

  async execute(input: SyncAdInsightsInput): Promise<SyncAdInsightsResult> {
    const result: SyncAdInsightsResult = {
      syncedCount: 0,
      failedCount: 0,
      errors: [],
    }

    // 1. Meta 계정 조회
    const metaAccount = await this.metaAdAccountRepository.findByUserId(input.userId)
    if (!metaAccount?.accessToken) {
      result.errors.push('No Meta account found')
      return result
    }

    try {
      // 2. Ad 레벨 인사이트 벌크 조회 (A3: 내부에서 pagination 처리)
      const insightsMap = await this.metaAdsService.getAccountInsights(
        safeDecryptToken(metaAccount.accessToken),
        metaAccount.metaAccountId,
        {
          level: 'ad',
          datePreset: input.datePreset || 'last_7d',
          timeIncrement: '1',
          campaignIds: input.campaignIds,
        }
      )

      if (insightsMap.size === 0) {
        return result
      }

      // 3. Ad metaAdId -> local Ad 매핑 (creativeId 조회)
      const adCache = new Map<string, { id: string; creativeId: string; adSetId: string }>()
      const kpisToSave: AdKPI[] = []

      for (const [, insight] of insightsMap) {
        try {
          const metaAdId = insight.adId
          if (!metaAdId) continue

          let adInfo = adCache.get(metaAdId)
          if (!adInfo) {
            const ad = await this.adRepository.findByMetaAdId(metaAdId)
            if (!ad) continue
            adInfo = {
              id: ad.id,
              creativeId: ad.creativeId,
              adSetId: ad.adSetId,
            }
            adCache.set(metaAdId, adInfo)
          }

          const kpi = AdKPI.create({
            adId: adInfo.id,
            adSetId: adInfo.adSetId,
            campaignId: insight.campaignId,
            creativeId: adInfo.creativeId,
            impressions: insight.impressions,
            clicks: insight.clicks,
            linkClicks: insight.linkClicks,
            conversions: insight.conversions,
            spend: Money.create(Math.round(insight.spend), 'KRW'),
            revenue: Money.create(Math.round(insight.revenue), 'KRW'),
            reach: insight.reach,
            frequency: insight.frequency ?? 0,
            cpm: insight.cpm ?? 0,
            cpc: insight.cpc ?? 0,
            videoViews: insight.videoViews ?? 0,
            thruPlays: insight.thruPlays ?? 0,
            date: new Date(insight.dateStart + 'T00:00:00.000Z'),
          })

          kpisToSave.push(kpi)
        } catch (error) {
          result.failedCount++
          result.errors.push(
            `Ad ${insight.adId}: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
      }

      // 4. 벌크 저장
      if (kpisToSave.length > 0) {
        const savedCount = await this.adKPIRepository.upsertMany(kpisToSave)
        result.syncedCount = savedCount
      }
    } catch (error) {
      result.failedCount++
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    return result
  }
}
