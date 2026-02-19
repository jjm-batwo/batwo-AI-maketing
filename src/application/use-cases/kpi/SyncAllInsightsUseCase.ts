import { KPI } from '@domain/entities/KPI'
import { Money } from '@domain/value-objects/Money'
import { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import { IKPIRepository } from '@domain/repositories/IKPIRepository'
import { IMetaAdsService } from '@application/ports/IMetaAdsService'
import { prisma } from '@/lib/prisma'
import { safeDecryptToken } from '@application/utils/TokenEncryption'

export interface SyncAllInsightsInput {
  userId: string
  datePreset?: 'today' | 'yesterday' | 'last_7d' | 'last_30d' | 'last_90d'
  includeTodayData?: boolean // Also fetch today's data separately (Meta's last_Xd excludes today)
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
    private readonly metaAdsService: IMetaAdsService
  ) {}

  async execute(input: SyncAllInsightsInput): Promise<SyncAllInsightsResult> {
    // Get user's Meta access token
    const metaAccount = await prisma.metaAdAccount.findUnique({
      where: { userId: input.userId },
    })

    console.log('[SyncInsights] Starting sync for user:', input.userId)
    console.log('[SyncInsights] Meta account found:', !!metaAccount?.accessToken)

    if (!metaAccount?.accessToken) {
      console.log('[SyncInsights] No access token, returning empty result')
      return { synced: 0, failed: 0, total: 0, errors: [] }
    }

    // Get all campaigns with metaCampaignId
    const campaigns = await this.campaignRepository.findByUserId(input.userId)
    const metaCampaigns = campaigns.filter(c => c.metaCampaignId)

    console.log('[SyncInsights] Total campaigns:', campaigns.length)
    console.log('[SyncInsights] Campaigns with Meta ID:', metaCampaigns.length)

    const result: SyncAllInsightsResult = {
      synced: 0,
      failed: 0,
      total: metaCampaigns.length,
      errors: [],
    }

    // Sync daily insights for each campaign (for chart data)
    for (const campaign of metaCampaigns) {
      try {
        console.log(`[SyncInsights] Fetching insights for campaign: ${campaign.name} (${campaign.metaCampaignId})`)

        // date_preset 대신 명시적 since/until 사용 (Meta의 date_preset은 최근 데이터 누락 가능)
        const until = new Date().toISOString().split('T')[0] // 오늘
        const presetDays: Record<string, number> = {
          'today': 0, 'yesterday': 1, 'last_7d': 7, 'last_30d': 30, 'last_90d': 90
        }
        const days = presetDays[input.datePreset || 'last_7d'] ?? 7
        const sinceDate = new Date()
        sinceDate.setDate(sinceDate.getDate() - days)
        const since = sinceDate.toISOString().split('T')[0]

        console.log(`[SyncInsights] Fetching with date range: ${since} ~ ${until}`)

        const dailyInsights = await this.metaAdsService.getCampaignDailyInsights(
          safeDecryptToken(metaAccount.accessToken),
          campaign.metaCampaignId!,
          input.datePreset || 'last_7d',
          { since, until }
        )

        console.log(`[SyncInsights] Received ${dailyInsights.length} daily insights`)
        if (dailyInsights.length > 0) {
          console.log('[SyncInsights] Sample data:', JSON.stringify(dailyInsights[0]))
          console.log('[SyncInsights] Last data:', JSON.stringify(dailyInsights[dailyInsights.length - 1]))
        }

        // Save each daily KPI record
        for (const daily of dailyInsights) {
          const kpi = KPI.create({
            campaignId: campaign.id,
            impressions: daily.impressions,
            clicks: daily.clicks,
            conversions: daily.conversions,
            linkClicks: daily.linkClicks || 0,
            spend: Money.create(Math.round(daily.spend), 'KRW'),
            revenue: Money.create(Math.round(daily.revenue), 'KRW'),
            date: new Date(daily.date + 'T00:00:00.000Z'),
          })

          await this.kpiRepository.save(kpi)
        }

        console.log(`[SyncInsights] Saved ${dailyInsights.length} KPI records for campaign ${campaign.name}`)
        result.synced += dailyInsights.length
      } catch (error) {
        console.error(`[SyncInsights] Error syncing campaign ${campaign.id}:`, error)
        result.failed++
        result.errors.push({
          campaignId: campaign.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    console.log('[SyncInsights] Sync complete:', result)
    return result
  }
}
