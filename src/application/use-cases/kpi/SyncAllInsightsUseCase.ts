import { KPI } from '@domain/entities/KPI'
import { Money } from '@domain/value-objects/Money'
import { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import { IKPIRepository } from '@domain/repositories/IKPIRepository'
import { IMetaAdsService } from '@application/ports/IMetaAdsService'
import { prisma } from '@/lib/prisma'

export interface SyncAllInsightsInput {
  userId: string
  datePreset?: 'today' | 'yesterday' | 'last_7d' | 'last_30d'
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

    if (!metaAccount?.accessToken) {
      return { synced: 0, failed: 0, total: 0, errors: [] }
    }

    // Get all campaigns with metaCampaignId
    const campaigns = await this.campaignRepository.findByUserId(input.userId)
    const metaCampaigns = campaigns.filter(c => c.metaCampaignId)

    const result: SyncAllInsightsResult = {
      synced: 0,
      failed: 0,
      total: metaCampaigns.length,
      errors: [],
    }

    // Sync daily insights for each campaign (for chart data)
    for (const campaign of metaCampaigns) {
      try {
        const dailyInsights = await this.metaAdsService.getCampaignDailyInsights(
          metaAccount.accessToken,
          campaign.metaCampaignId!,
          input.datePreset || 'last_7d'
        )

        // Save each daily KPI record
        for (const daily of dailyInsights) {
          const kpi = KPI.create({
            campaignId: campaign.id,
            impressions: daily.impressions,
            clicks: daily.clicks,
            conversions: daily.conversions,
            spend: Money.create(Math.round(daily.spend), 'KRW'),
            revenue: Money.create(Math.round(daily.revenue), 'KRW'),
            date: new Date(daily.date),
          })

          await this.kpiRepository.save(kpi)
        }

        result.synced += dailyInsights.length
      } catch (error) {
        result.failed++
        result.errors.push({
          campaignId: campaign.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return result
  }
}
