import { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import { IKPIRepository } from '@domain/repositories/IKPIRepository'
import {
  GetDashboardKPIDTO,
  DashboardKPIDTO,
  KPIComparisonDTO,
  CampaignKPIBreakdownDTO,
  ChartDataPointDTO,
  DateRangePreset,
} from '@application/dto/kpi/DashboardKPIDTO'

function getDateRangeFromPreset(
  preset: DateRangePreset
): { startDate: Date; endDate: Date } {
  const now = new Date()

  // Use UTC to match how dates are stored in database
  const endDate = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    23, 59, 59, 999
  ))

  const startDate = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    0, 0, 0, 0
  ))

  switch (preset) {
    case 'today':
      // startDate and endDate already set to today UTC
      break
    case 'yesterday':
      startDate.setUTCDate(startDate.getUTCDate() - 1)
      endDate.setUTCDate(endDate.getUTCDate() - 1)
      break
    case 'last_7d':
      startDate.setUTCDate(startDate.getUTCDate() - 6)
      break
    case 'last_30d':
      startDate.setUTCDate(startDate.getUTCDate() - 29)
      break
    case 'last_90d':
      startDate.setUTCDate(startDate.getUTCDate() - 89)
      break
    case 'this_month':
      startDate.setUTCDate(1)
      break
    case 'last_month':
      startDate.setUTCMonth(startDate.getUTCMonth() - 1)
      startDate.setUTCDate(1)
      endDate.setUTCDate(0) // Last day of previous month
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

    // Filter by objective if provided
    if (dto.objective) {
      campaigns = campaigns.filter((c) => c.objective === dto.objective)
    }

    if (campaigns.length === 0) {
      return this.createEmptyResult(dto.includeChartData)
    }

    // Aggregate KPIs across all campaigns (배치 쿼리)
    const campaignIds = campaigns.map((c) => c.id)
    const aggregatedMap = await this.kpiRepository.aggregateByCampaignIds(
      campaignIds,
      startDate,
      endDate
    )

    let totalImpressions = 0
    let totalClicks = 0
    let totalLinkClicks = 0
    let totalConversions = 0
    let totalSpend = 0
    let totalRevenue = 0

    const emptyAgg = {
      totalImpressions: 0,
      totalClicks: 0,
      totalLinkClicks: 0,
      totalConversions: 0,
      totalSpend: 0,
      totalRevenue: 0,
    }

    const breakdowns: CampaignKPIBreakdownDTO[] = []

    for (const campaign of campaigns) {
      const aggregated = aggregatedMap.get(campaign.id) ?? emptyAgg

      totalImpressions += aggregated.totalImpressions
      totalClicks += aggregated.totalClicks
      totalLinkClicks += aggregated.totalLinkClicks
      totalConversions += aggregated.totalConversions
      totalSpend += aggregated.totalSpend
      totalRevenue += aggregated.totalRevenue

      if (dto.includeBreakdown) {
        breakdowns.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          impressions: aggregated.totalImpressions,
          clicks: aggregated.totalClicks,
          linkClicks: aggregated.totalLinkClicks,
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
      totalLinkClicks,
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

    // Add chart data if requested
    if (dto.includeChartData) {
      const campaignIds = campaigns.map((c) => c.id)
      const dailyAggregates = await this.kpiRepository.getDailyAggregates(
        campaignIds,
        startDate,
        endDate
      )

      result.chartData = dailyAggregates.map(
        (agg): ChartDataPointDTO => ({
          date: agg.date.toISOString().split('T')[0],
          spend: agg.totalSpend,
          revenue: agg.totalRevenue,
          roas: agg.totalSpend > 0 ? agg.totalRevenue / agg.totalSpend : 0,
          impressions: agg.totalImpressions,
          clicks: agg.totalClicks,
          linkClicks: agg.totalLinkClicks,
          conversions: agg.totalConversions,
        })
      )
    }

    console.log('[GetDashboardKPI] Final result:', {
      totalSpend: result.totalSpend,
      totalRevenue: result.totalRevenue,
      chartDataLength: result.chartData?.length ?? 0,
      chartDataSample: result.chartData?.slice(0, 2),
      chartDataSpendSum: result.chartData?.reduce((sum, d) => sum + d.spend, 0) ?? 0,
    })

    return result
  }

  private async calculateComparison(
    campaignIds: string[],
    preset: DateRangePreset
  ): Promise<KPIComparisonDTO> {
    const current = getDateRangeFromPreset(preset)
    const previous = getPreviousPeriodRange(preset)

    console.log('[Comparison] Current period:', current.startDate, '-', current.endDate)
    console.log('[Comparison] Previous period:', previous.startDate, '-', previous.endDate)

    // 배치 쿼리로 현재/이전 기간 동시 조회
    const [currentMap, previousMap] = await Promise.all([
      this.kpiRepository.aggregateByCampaignIds(campaignIds, current.startDate, current.endDate),
      this.kpiRepository.aggregateByCampaignIds(campaignIds, previous.startDate, previous.endDate),
    ])

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
      const currentAgg = currentMap.get(campaignId)
      const previousAgg = previousMap.get(campaignId)

      if (currentAgg) {
        currentMetrics.impressions += currentAgg.totalImpressions
        currentMetrics.clicks += currentAgg.totalClicks
        currentMetrics.conversions += currentAgg.totalConversions
        currentMetrics.spend += currentAgg.totalSpend
        currentMetrics.revenue += currentAgg.totalRevenue
      }

      if (previousAgg) {
        previousMetrics.impressions += previousAgg.totalImpressions
        previousMetrics.clicks += previousAgg.totalClicks
        previousMetrics.conversions += previousAgg.totalConversions
        previousMetrics.spend += previousAgg.totalSpend
        previousMetrics.revenue += previousAgg.totalRevenue
      }
    }

    console.log('[Comparison] Current metrics:', currentMetrics)
    console.log('[Comparison] Previous metrics:', previousMetrics)

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

  private createEmptyResult(includeChartData?: boolean): DashboardKPIDTO {
    const result: DashboardKPIDTO = {
      totalImpressions: 0,
      totalClicks: 0,
      totalLinkClicks: 0,
      totalConversions: 0,
      totalSpend: 0,
      totalRevenue: 0,
      roas: 0,
      ctr: 0,
      cpa: 0,
      cvr: 0,
    }

    if (includeChartData) {
      result.chartData = []
    }

    return result
  }
}
