import { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import { IKPIRepository } from '@domain/repositories/IKPIRepository'
import {
  GetDashboardKPIDTO,
  DashboardKPIDTO,
  KPIComparisonDTO,
  CampaignKPIBreakdownDTO,
  DateRangePreset,
} from '@application/dto/kpi/DashboardKPIDTO'

function getDateRangeFromPreset(
  preset: DateRangePreset
): { startDate: Date; endDate: Date } {
  const now = new Date()
  const endDate = new Date(now)
  endDate.setHours(23, 59, 59, 999)

  const startDate = new Date(now)

  switch (preset) {
    case 'today':
      startDate.setHours(0, 0, 0, 0)
      break
    case 'yesterday':
      startDate.setDate(startDate.getDate() - 1)
      startDate.setHours(0, 0, 0, 0)
      endDate.setDate(endDate.getDate() - 1)
      break
    case 'last_7d':
      startDate.setDate(startDate.getDate() - 7)
      startDate.setHours(0, 0, 0, 0)
      break
    case 'last_30d':
      startDate.setDate(startDate.getDate() - 30)
      startDate.setHours(0, 0, 0, 0)
      break
  }

  return { startDate, endDate }
}

function getPreviousPeriodRange(
  preset: DateRangePreset
): { startDate: Date; endDate: Date } {
  const current = getDateRangeFromPreset(preset)
  const duration = current.endDate.getTime() - current.startDate.getTime()

  return {
    startDate: new Date(current.startDate.getTime() - duration - 1),
    endDate: new Date(current.startDate.getTime() - 1),
  }
}

export class GetDashboardKPIUseCase {
  constructor(
    private readonly campaignRepository: ICampaignRepository,
    private readonly kpiRepository: IKPIRepository
  ) {}

  async execute(dto: GetDashboardKPIDTO): Promise<DashboardKPIDTO> {
    const { startDate, endDate } = getDateRangeFromPreset(dto.dateRange)

    // Get user's campaigns
    let campaigns = await this.campaignRepository.findByUserId(dto.userId)

    // Filter by specific campaign IDs if provided
    if (dto.campaignIds && dto.campaignIds.length > 0) {
      campaigns = campaigns.filter((c) => dto.campaignIds!.includes(c.id))
    }

    if (campaigns.length === 0) {
      return this.createEmptyResult()
    }

    // Aggregate KPIs across all campaigns
    let totalImpressions = 0
    let totalClicks = 0
    let totalConversions = 0
    let totalSpend = 0
    let totalRevenue = 0

    const breakdowns: CampaignKPIBreakdownDTO[] = []

    for (const campaign of campaigns) {
      const aggregated = await this.kpiRepository.aggregateByCampaignId(
        campaign.id,
        startDate,
        endDate
      )

      totalImpressions += aggregated.totalImpressions
      totalClicks += aggregated.totalClicks
      totalConversions += aggregated.totalConversions
      totalSpend += aggregated.totalSpend
      totalRevenue += aggregated.totalRevenue

      if (dto.includeBreakdown) {
        breakdowns.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          impressions: aggregated.totalImpressions,
          clicks: aggregated.totalClicks,
          conversions: aggregated.totalConversions,
          spend: aggregated.totalSpend,
          revenue: aggregated.totalRevenue,
          roas:
            aggregated.totalSpend > 0
              ? aggregated.totalRevenue / aggregated.totalSpend
              : 0,
          ctr:
            aggregated.totalImpressions > 0
              ? (aggregated.totalClicks / aggregated.totalImpressions) * 100
              : 0,
          cpa:
            aggregated.totalConversions > 0
              ? aggregated.totalSpend / aggregated.totalConversions
              : 0,
        })
      }
    }

    // Calculate metrics
    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0
    const cvr = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0

    const result: DashboardKPIDTO = {
      totalImpressions,
      totalClicks,
      totalConversions,
      totalSpend,
      totalRevenue,
      roas,
      ctr,
      cpa,
      cvr,
    }

    // Add comparison if requested
    if (dto.includeComparison) {
      result.comparison = await this.calculateComparison(
        campaigns.map((c) => c.id),
        dto.dateRange
      )
    }

    // Add breakdown if requested
    if (dto.includeBreakdown) {
      result.campaignBreakdown = breakdowns
    }

    return result
  }

  private async calculateComparison(
    campaignIds: string[],
    preset: DateRangePreset
  ): Promise<KPIComparisonDTO> {
    const current = getDateRangeFromPreset(preset)
    const previous = getPreviousPeriodRange(preset)

    const currentMetrics = {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      revenue: 0,
    }

    const previousMetrics = {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      revenue: 0,
    }

    for (const campaignId of campaignIds) {
      const currentAgg = await this.kpiRepository.aggregateByCampaignId(
        campaignId,
        current.startDate,
        current.endDate
      )
      const previousAgg = await this.kpiRepository.aggregateByCampaignId(
        campaignId,
        previous.startDate,
        previous.endDate
      )

      currentMetrics.impressions += currentAgg.totalImpressions
      currentMetrics.clicks += currentAgg.totalClicks
      currentMetrics.conversions += currentAgg.totalConversions
      currentMetrics.spend += currentAgg.totalSpend
      currentMetrics.revenue += currentAgg.totalRevenue

      previousMetrics.impressions += previousAgg.totalImpressions
      previousMetrics.clicks += previousAgg.totalClicks
      previousMetrics.conversions += previousAgg.totalConversions
      previousMetrics.spend += previousAgg.totalSpend
      previousMetrics.revenue += previousAgg.totalRevenue
    }

    const calcChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    const currentRoas =
      currentMetrics.spend > 0
        ? currentMetrics.revenue / currentMetrics.spend
        : 0
    const previousRoas =
      previousMetrics.spend > 0
        ? previousMetrics.revenue / previousMetrics.spend
        : 0

    const currentCtr =
      currentMetrics.impressions > 0
        ? (currentMetrics.clicks / currentMetrics.impressions) * 100
        : 0
    const previousCtr =
      previousMetrics.impressions > 0
        ? (previousMetrics.clicks / previousMetrics.impressions) * 100
        : 0

    return {
      impressionsChange: calcChange(
        currentMetrics.impressions,
        previousMetrics.impressions
      ),
      clicksChange: calcChange(currentMetrics.clicks, previousMetrics.clicks),
      conversionsChange: calcChange(
        currentMetrics.conversions,
        previousMetrics.conversions
      ),
      spendChange: calcChange(currentMetrics.spend, previousMetrics.spend),
      revenueChange: calcChange(currentMetrics.revenue, previousMetrics.revenue),
      roasChange: currentRoas - previousRoas,
      ctrChange: currentCtr - previousCtr,
    }
  }

  private createEmptyResult(): DashboardKPIDTO {
    return {
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0,
      totalSpend: 0,
      totalRevenue: 0,
      roas: 0,
      ctr: 0,
      cpa: 0,
      cvr: 0,
    }
  }
}
