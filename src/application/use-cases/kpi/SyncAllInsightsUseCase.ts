import { KPI } from '@domain/entities/KPI'
import { Money } from '@domain/value-objects/Money'
import { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import { IKPIRepository } from '@domain/repositories/IKPIRepository'
import { IMetaAdsService } from '@application/ports/IMetaAdsService'
import { IMetaAdAccountRepository } from '@application/ports/IMetaAdAccountRepository'
import { safeDecryptToken } from '@application/utils/TokenEncryption'

export interface SyncAllInsightsInput {
  userId: string
  datePreset?: 'today' | 'yesterday' | 'last_7d' | 'last_30d' | 'last_90d'
  includeTodayData?: boolean
}

export interface SyncAllInsightsResult {
  synced: number
  failed: number
  total: number
  errors: Array<{ campaignId: string; error: string }>
}

export class SyncAllInsightsUseCase {
  constructor(
    private readonly campaignRepository: ICampaignRepository,
    private readonly kpiRepository: IKPIRepository,
    private readonly metaAdsService: IMetaAdsService,
    private readonly metaAdAccountRepository: IMetaAdAccountRepository
  ) {}

  async execute(input: SyncAllInsightsInput): Promise<SyncAllInsightsResult> {
    const metaAccount = await this.metaAdAccountRepository.findByUserId(input.userId)

    if (!metaAccount?.accessToken) {
      return { synced: 0, failed: 0, total: 0, errors: [] }
    }

    const campaigns = await this.campaignRepository.findByUserId(input.userId)
    const metaCampaigns = campaigns.filter((c) => c.metaCampaignId)

    const result: SyncAllInsightsResult = {
      synced: 0,
      failed: 0,
      total: metaCampaigns.length,
      errors: [],
    }

    if (metaCampaigns.length === 0) return result

    // Build metaCampaignId → localCampaignId map
    const metaToLocalMap = new Map<string, string>()
    for (const c of metaCampaigns) {
      metaToLocalMap.set(c.metaCampaignId!, c.id)
    }

    // Date range
    const until = new Date().toISOString().split('T')[0]
    const presetDays: Record<string, number> = {
      today: 0, yesterday: 1, last_7d: 7, last_30d: 30, last_90d: 90,
    }
    const days = presetDays[input.datePreset || 'last_7d'] ?? 7
    const sinceDate = new Date()
    sinceDate.setDate(sinceDate.getDate() - days)
    const since = sinceDate.toISOString().split('T')[0]

    try {
      // PERF-01: Single bulk API call instead of N per-campaign calls
      const insightsMap = await this.metaAdsService.getAccountInsights(
        safeDecryptToken(metaAccount.accessToken),
        metaAccount.metaAccountId,
        {
          level: 'campaign',
          timeRange: { since, until },
          timeIncrement: '1',
          campaignIds: metaCampaigns.map(c => c.metaCampaignId!),
        }
      )

      // Build KPI records and batch save
      const kpisToSave: KPI[] = []
      for (const [, insight] of insightsMap) {
        const localCampaignId = metaToLocalMap.get(insight.campaignId)
        if (!localCampaignId) continue

        try {
          kpisToSave.push(KPI.create({
            campaignId: localCampaignId,
            impressions: insight.impressions,
            clicks: insight.clicks,
            conversions: insight.conversions,
            linkClicks: insight.linkClicks || 0,
            spend: Money.create(Math.round(insight.spend), 'KRW'),
            revenue: Money.create(Math.round(insight.revenue), 'KRW'),
            date: new Date(insight.dateStart + 'T00:00:00.000Z'),
          }))
        } catch (error) {
          result.failed++
          result.errors.push({
            campaignId: localCampaignId,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      if (kpisToSave.length > 0) {
        await this.kpiRepository.saveMany(kpisToSave)
        result.synced = kpisToSave.length
      }
    } catch (error) {
      console.error('[SyncInsights] Bulk sync failed:', error)
      // Mark all campaigns as failed
      for (const c of metaCampaigns) {
        result.failed++
        result.errors.push({
          campaignId: c.id,
          error: error instanceof Error ? error.message : 'Bulk sync failed',
        })
      }
    }

    return result
  }
}
