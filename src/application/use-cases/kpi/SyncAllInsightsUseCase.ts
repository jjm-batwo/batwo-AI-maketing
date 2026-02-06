import { KPI } from '@domain/entities/KPI'
import { Money } from '@domain/value-objects/Money'
import { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import { IKPIRepository } from '@domain/repositories/IKPIRepository'
import { IMetaAdsService } from '@application/ports/IMetaAdsService'
import { prisma } from '@/lib/prisma'

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

        // Fetch historical data
        const dailyInsights = await this.metaAdsService.getCampaignDailyInsights(
          metaAccount.accessToken,
          campaign.metaCampaignId!,
          input.datePreset || 'last_7d'
        )

        console.log(`[SyncInsights] Received ${dailyInsights.length} daily insights`)
        if (dailyInsights.length > 0) {
          console.log('[SyncInsights] Sample data:', JSON.stringify(dailyInsights[0]))
        }

        // Also fetch today's data if requested (Meta's last_Xd presets exclude today)
        if (input.includeTodayData && input.datePreset !== 'today') {
          try {
            const todayInsights = await this.metaAdsService.getCampaignDailyInsights(
              metaAccount.accessToken,
              campaign.metaCampaignId!,
              'today'
            )
            console.log(`[SyncInsights] Received ${todayInsights.length} today insights`)
            if (todayInsights.length > 0) {
              // Add today's data (will be upserted, so duplicates are handled)
              dailyInsights.push(...todayInsights)
            }
          } catch (todayError) {
            // Today's data might not be available yet, continue without it
            console.log('[SyncInsights] Today data not available:', todayError instanceof Error ? todayError.message : 'Unknown')
          }
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
