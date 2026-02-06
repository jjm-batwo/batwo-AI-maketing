import { KPI } from '@domain/entities/KPI'
import { Money } from '@domain/value-objects/Money'
import { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import { IKPIRepository } from '@domain/repositories/IKPIRepository'
import { IMetaAdsService } from '@application/ports/IMetaAdsService'

export interface SyncMetaInsightsInput {
  userId: string
  campaignId: string
  accessToken: string
  datePreset?: 'today' | 'yesterday' | 'last_7d' | 'last_30d'
}

export interface SyncMetaInsightsResult {
  campaignId: string
  kpiId: string
  synced: boolean
  message?: string
}

export class SyncMetaInsightsUseCase {
  constructor(
    private readonly campaignRepository: ICampaignRepository,
    private readonly kpiRepository: IKPIRepository,
    private readonly metaAdsService: IMetaAdsService
  ) {}

  async execute(input: SyncMetaInsightsInput): Promise<SyncMetaInsightsResult> {
    // Verify campaign ownership
    const campaign = await this.campaignRepository.findById(input.campaignId)

    if (!campaign || campaign.userId !== input.userId) {
      return {
        campaignId: input.campaignId,
        kpiId: '',
        synced: false,
        message: 'Campaign not found or unauthorized',
      }
    }

    if (!campaign.metaCampaignId) {
      return {
        campaignId: input.campaignId,
        kpiId: '',
        synced: false,
        message: 'Campaign is not synced with Meta Ads',
      }
    }

    try {
      // Fetch insights from Meta Ads
      const insights = await this.metaAdsService.getCampaignInsights(
        input.accessToken,
        campaign.metaCampaignId,
        input.datePreset || 'today'
      )

      // Create KPI entity
      const kpi = KPI.create({
        campaignId: campaign.id,
        impressions: insights.impressions,
        clicks: insights.clicks,
        linkClicks: insights.linkClicks,
        conversions: insights.conversions,
        spend: Money.create(Math.round(insights.spend * 100), 'KRW'), // Convert to cents
        revenue: Money.create(Math.round(insights.revenue * 100), 'KRW'),
        date: new Date(insights.dateStart),
      })

      // Save KPI
      const savedKpi = await this.kpiRepository.save(kpi)

      return {
        campaignId: campaign.id,
        kpiId: savedKpi.id,
        synced: true,
      }
    } catch (error) {
      return {
        campaignId: input.campaignId,
        kpiId: '',
        synced: false,
        message:
          error instanceof Error ? error.message : 'Failed to sync insights',
      }
    }
  }
}
