import type { IMetaAdsService } from '@application/ports/IMetaAdsService'
import type { IMetaAdAccountRepository } from '@application/ports/IMetaAdAccountRepository'
import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import { safeDecryptToken } from '@application/utils/TokenEncryption'

export type LivePeriod = 'today' | 'yesterday' | '7d'

export type DashboardLiveKPIResponse = {
  summary: {
    totalSpend: number
    totalRevenue: number
    totalImpressions: number
    totalReach: number
    totalClicks: number
    totalLinkClicks: number
    totalConversions: number
    averageRoas: number
    averageCtr: number
    averageCpa: number
    cvr: number
    activeCampaigns: number
    changes?: {
      spend: number
      revenue: number
      roas: number
      ctr: number
      conversions: number
      impressions: number
      reach: number
      clicks: number
      linkClicks: number
    }
  }
  campaignBreakdown?: Array<{
    campaignId: string
    campaignName: string
    impressions: number
    reach: number
    clicks: number
    linkClicks: number
    conversions: number
    spend: number
    revenue: number
    roas: number
    ctr: number
    cpa: number
    cpc: number
    cvr: number
    cpm: number
    reachRate: number
  }>
  chartData: Array<{
    date: string
    spend: number
    revenue: number
    roas: number
    impressions: number
    reach: number
    clicks: number
    linkClicks: number
    conversions: number
  }>
}

type CampaignObjective =
  | 'AWARENESS'
  | 'TRAFFIC'
  | 'ENGAGEMENT'
  | 'LEADS'
  | 'APP_PROMOTION'
  | 'SALES'
  | 'CONVERSIONS'

type DailyData = {
  date: string
  impressions: number
  reach: number
  clicks: number
  conversions: number
  spend: number
  revenue: number
  linkClicks: number
}

type CampaignLiveResult = {
  campaignId: string
  name: string
  objective: string
  data: DailyData[]
}

type FetchOpts = {
  preset: 'today' | 'yesterday' | 'last_7d' | 'last_30d' | 'last_90d'
  range?: { since: string; until: string }
}

function daysAgoStr(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

function aggregateLiveResults(
  liveResults: PromiseSettledResult<CampaignLiveResult>[],
  campaigns: { id: string; objective: string }[],
  objective?: CampaignObjective,
  includeBreakdown?: boolean
) {
  let totalImpressions = 0
  let totalReach = 0
  let totalClicks = 0
  let totalConversions = 0
  let totalSpend = 0
  let totalRevenue = 0
  let totalLinkClicks = 0

  const breakdowns: Array<{
    campaignId: string
    campaignName: string
    impressions: number
    reach: number
    clicks: number
    linkClicks: number
    conversions: number
    spend: number
    revenue: number
    roas: number
    ctr: number
    cpa: number
    cpc: number
    cvr: number
    cpm: number
    reachRate: number
  }> = []

  for (const result of liveResults) {
    if (result.status !== 'fulfilled') continue
    const { campaignId, name, data } = result.value

    if (objective) {
      const campaign = campaigns.find((c) => c.id === campaignId)
      if (!campaign || campaign.objective !== objective) continue
    }

    let cSpend = 0
    let cRevenue = 0
    let cImpressions = 0
    let cReach = 0
    let cClicks = 0
    let cConversions = 0
    let cLinkClicks = 0

    for (const d of data) {
      cImpressions += d.impressions
      cReach += d.reach || 0
      cClicks += d.clicks
      cConversions += d.conversions
      cSpend += d.spend
      cRevenue += d.revenue
      cLinkClicks += d.linkClicks || 0
    }

    totalImpressions += cImpressions
    totalReach += cReach
    totalClicks += cClicks
    totalConversions += cConversions
    totalSpend += cSpend
    totalRevenue += cRevenue
    totalLinkClicks += cLinkClicks

    if (includeBreakdown) {
      breakdowns.push({
        campaignId,
        campaignName: name,
        impressions: cImpressions,
        reach: cReach,
        clicks: cClicks,
        linkClicks: cLinkClicks,
        conversions: cConversions,
        spend: cSpend,
        revenue: cRevenue,
        roas: cSpend > 0 ? cRevenue / cSpend : 0,
        ctr: cImpressions > 0 ? (cClicks / cImpressions) * 100 : 0,
        cpa: cConversions > 0 ? cSpend / cConversions : 0,
        cpc: cLinkClicks > 0 ? cSpend / cLinkClicks : 0,
        cvr: cLinkClicks > 0 ? (cConversions / cLinkClicks) * 100 : 0,
        cpm: cImpressions > 0 ? (cSpend / cImpressions) * 1000 : 0,
        reachRate: cImpressions > 0 ? (cReach / cImpressions) * 100 : 0,
      })
    }
  }

  return {
    totalImpressions,
    totalReach,
    totalClicks,
    totalConversions,
    totalSpend,
    totalRevenue,
    totalLinkClicks,
    breakdowns,
  }
}

function buildDailyChartData(
  liveResults: PromiseSettledResult<CampaignLiveResult>[],
  campaigns: { id: string; objective: string }[],
  objective?: CampaignObjective
) {
  const dailyMap = new Map<
    string,
    {
      spend: number
      revenue: number
      impressions: number
      reach: number
      clicks: number
      linkClicks: number
      conversions: number
    }
  >()

  for (const result of liveResults) {
    if (result.status !== 'fulfilled') continue

    if (objective) {
      const campaign = campaigns.find((c) => c.id === result.value.campaignId)
      if (!campaign || campaign.objective !== objective) continue
    }

    for (const d of result.value.data) {
      const existing = dailyMap.get(d.date) || {
        spend: 0,
        revenue: 0,
        impressions: 0,
        reach: 0,
        clicks: 0,
        linkClicks: 0,
        conversions: 0,
      }

      existing.spend += d.spend
      existing.revenue += d.revenue
      existing.impressions += d.impressions
      existing.reach += d.reach || 0
      existing.clicks += d.clicks
      existing.linkClicks += d.linkClicks || 0
      existing.conversions += d.conversions
      dailyMap.set(d.date, existing)
    }
  }

  return Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({
      date,
      spend: d.spend,
      revenue: d.revenue,
      roas: d.spend > 0 ? d.revenue / d.spend : 0,
      impressions: d.impressions,
      reach: d.reach,
      clicks: d.clicks,
      linkClicks: d.linkClicks,
      conversions: d.conversions,
    }))
}

export class GetLiveDashboardKPIUseCase {
  constructor(
    private readonly campaignRepository: ICampaignRepository,
    private readonly metaAdsService: IMetaAdsService,
    private readonly metaAdAccountRepository: IMetaAdAccountRepository
  ) {}

  async execute(
    userId: string,
    period: LivePeriod,
    objective?: CampaignObjective,
    includeBreakdown?: boolean
  ): Promise<DashboardLiveKPIResponse | null> {
    const metaAccount = await this.metaAdAccountRepository.findByUserId(userId)
    if (!metaAccount?.accessToken) {
      return null
    }

    const token = safeDecryptToken(metaAccount.accessToken)
    const allCampaigns = await this.campaignRepository.findByUserId(userId)
    const metaCampaigns = allCampaigns.filter((c) => c.metaCampaignId)

    if (metaCampaigns.length === 0) {
      return null
    }

    const todayStr = new Date().toISOString().split('T')[0]
    let currentOpts: FetchOpts
    let prevOpts: FetchOpts

    if (period === 'today') {
      currentOpts = { preset: 'today' }
      prevOpts = { preset: 'yesterday' }
    } else if (period === 'yesterday') {
      currentOpts = { preset: 'yesterday' }
      prevOpts = { preset: 'yesterday', range: { since: daysAgoStr(2), until: daysAgoStr(2) } }
    } else {
      currentOpts = { preset: 'last_7d', range: { since: daysAgoStr(6), until: todayStr } }
      prevOpts = { preset: 'last_7d', range: { since: daysAgoStr(13), until: daysAgoStr(7) } }
    }

    const fetchCampaign = (opts: FetchOpts) =>
      Promise.allSettled(
        metaCampaigns.map(async (campaign) => {
          const data = await this.metaAdsService.getCampaignDailyInsights(
            token,
            campaign.metaCampaignId!,
            opts.preset,
            opts.range
          )

          return {
            campaignId: campaign.id,
            name: campaign.name,
            objective: campaign.objective,
            data,
          }
        })
      )

    const [currentResults, prevResults] = await Promise.all([
      fetchCampaign(currentOpts),
      fetchCampaign(prevOpts),
    ])

    const current = aggregateLiveResults(currentResults, allCampaigns, objective, includeBreakdown)
    const prev = aggregateLiveResults(prevResults, allCampaigns, objective)

    const roas = current.totalSpend > 0 ? current.totalRevenue / current.totalSpend : 0
    const ctr =
      current.totalImpressions > 0 ? (current.totalClicks / current.totalImpressions) * 100 : 0
    const cpa = current.totalConversions > 0 ? current.totalSpend / current.totalConversions : 0
    const cvr =
      current.totalLinkClicks > 0 ? (current.totalConversions / current.totalLinkClicks) * 100 : 0

    const prevRoas = prev.totalSpend > 0 ? prev.totalRevenue / prev.totalSpend : 0
    const prevCtr = prev.totalImpressions > 0 ? (prev.totalClicks / prev.totalImpressions) * 100 : 0
    const calcChange = (cur: number, pre: number) =>
      pre === 0 ? (cur > 0 ? 100 : 0) : ((cur - pre) / pre) * 100

    const chartData =
      period === '7d'
        ? buildDailyChartData(currentResults, allCampaigns, objective)
        : current.totalSpend > 0 || current.totalImpressions > 0
          ? [
              {
                date: period === 'yesterday' ? daysAgoStr(1) : todayStr,
                spend: current.totalSpend,
                revenue: current.totalRevenue,
                roas,
                impressions: current.totalImpressions,
                reach: current.totalReach,
                clicks: current.totalClicks,
                linkClicks: current.totalLinkClicks,
                conversions: current.totalConversions,
              },
            ]
          : []

    return {
      summary: {
        totalSpend: current.totalSpend,
        totalRevenue: current.totalRevenue,
        totalImpressions: current.totalImpressions,
        totalReach: current.totalReach,
        totalClicks: current.totalClicks,
        totalLinkClicks: current.totalLinkClicks,
        totalConversions: current.totalConversions,
        averageRoas: roas,
        averageCtr: ctr,
        averageCpa: cpa,
        cvr,
        activeCampaigns: current.breakdowns.length,
        changes: {
          spend: calcChange(current.totalSpend, prev.totalSpend),
          revenue: calcChange(current.totalRevenue, prev.totalRevenue),
          roas: roas - prevRoas,
          ctr: ctr - prevCtr,
          conversions: calcChange(current.totalConversions, prev.totalConversions),
          impressions: calcChange(current.totalImpressions, prev.totalImpressions),
          reach: calcChange(current.totalReach, prev.totalReach),
          clicks: calcChange(current.totalClicks, prev.totalClicks),
          linkClicks: calcChange(current.totalLinkClicks, prev.totalLinkClicks),
        },
      },
      campaignBreakdown: includeBreakdown ? current.breakdowns : undefined,
      chartData,
    }
  }
}
