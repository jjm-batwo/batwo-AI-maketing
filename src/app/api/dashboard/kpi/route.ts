import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS, getCacheService } from '@/lib/di/container'
import { GetDashboardKPIUseCase } from '@application/use-cases/kpi/GetDashboardKPIUseCase'
import type { DateRangePreset } from '@application/dto/kpi/DashboardKPIDTO'
import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import type { IMetaAdsService } from '@application/ports/IMetaAdsService'
import { CacheKeys, CacheTTL } from '@/infrastructure/cache/CacheKeys'
import { prisma } from '@/lib/prisma'
import { safeDecryptToken } from '@application/utils/TokenEncryption'

// Map API period format to Use Case DateRangePreset
function mapPeriodToPreset(period: string): DateRangePreset {
  switch (period) {
    case '7d':
      return 'last_7d'
    case '30d':
      return 'last_30d'
    case '90d':
      return 'last_90d'
    case 'today':
      return 'today'
    case 'yesterday':
      return 'yesterday'
    case 'this_month':
      return 'this_month'
    case 'last_month':
      return 'last_month'
    default:
      return 'last_7d'
  }
}

// Valid campaign objective types
const validObjectives = [
  'AWARENESS',
  'TRAFFIC',
  'ENGAGEMENT',
  'LEADS',
  'APP_PROMOTION',
  'SALES',
  'CONVERSIONS',
] as const
type CampaignObjective = (typeof validObjectives)[number]

// Validate and cast objective parameter
function validateObjective(objective: string | null): CampaignObjective | undefined {
  if (!objective) return undefined
  if (validObjectives.includes(objective as CampaignObjective)) {
    return objective as CampaignObjective
  }
  return undefined
}

// Live fetch 지원 기간 (Meta API 직접 조회)
type LivePeriod = 'today' | 'yesterday' | '7d'

// 캐시 TTL: 실시간 데이터용
const LIVE_CACHE_TTL = 120 // 2분

// 날짜 유틸리티
function daysAgoStr(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

// 캠페인별 일별 데이터 타입
type DailyData = {
  date: string
  impressions: number
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

type KPIApiResponse = {
  summary: {
    totalSpend: number
    totalRevenue: number
    totalImpressions: number
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
      clicks: number
    }
  }
  campaignBreakdown?: Array<{
    campaignId: string
    campaignName: string
    impressions: number
    clicks: number
    conversions: number
    spend: number
    revenue: number
    roas: number
    ctr: number
    cpa: number
  }>
  chartData: Array<{
    date: string
    spend: number
    revenue: number
    roas: number
    impressions: number
    clicks: number
    linkClicks: number
    conversions: number
  }>
}

function hasKPIData(data: KPIApiResponse): boolean {
  const { summary, chartData } = data
  return (
    summary.totalSpend > 0 ||
    summary.totalImpressions > 0 ||
    summary.totalClicks > 0 ||
    summary.totalLinkClicks > 0 ||
    summary.totalConversions > 0 ||
    chartData.length > 0
  )
}

// 캠페인별 Meta API 인사이트를 집계 (전체 합계)
function aggregateLiveResults(
  liveResults: PromiseSettledResult<CampaignLiveResult>[],
  campaigns: { id: string; objective: string }[],
  objective?: CampaignObjective,
  includeBreakdown?: boolean
) {
  let totalImpressions = 0
  let totalClicks = 0
  let totalConversions = 0
  let totalSpend = 0
  let totalRevenue = 0
  let totalLinkClicks = 0

  const breakdowns: Array<{
    campaignId: string
    campaignName: string
    impressions: number
    clicks: number
    conversions: number
    spend: number
    revenue: number
    roas: number
    ctr: number
    cpa: number
  }> = []

  for (const result of liveResults) {
    if (result.status !== 'fulfilled') continue
    const { campaignId, name, data } = result.value

    if (objective) {
      const camp = campaigns.find((c) => c.id === campaignId)
      if (!camp || camp.objective !== objective) continue
    }

    let cS = 0,
      cR = 0,
      cI = 0,
      cCl = 0,
      cCo = 0,
      cL = 0
    for (const d of data) {
      cI += d.impressions
      cCl += d.clicks
      cCo += d.conversions
      cS += d.spend
      cR += d.revenue
      cL += d.linkClicks || 0
    }

    totalImpressions += cI
    totalClicks += cCl
    totalConversions += cCo
    totalSpend += cS
    totalRevenue += cR
    totalLinkClicks += cL

    if (includeBreakdown) {
      breakdowns.push({
        campaignId,
        campaignName: name,
        impressions: cI,
        clicks: cCl,
        conversions: cCo,
        spend: cS,
        revenue: cR,
        roas: cS > 0 ? cR / cS : 0,
        ctr: cI > 0 ? (cCl / cI) * 100 : 0,
        cpa: cCo > 0 ? cS / cCo : 0,
      })
    }
  }

  return {
    totalImpressions,
    totalClicks,
    totalConversions,
    totalSpend,
    totalRevenue,
    totalLinkClicks,
    breakdowns,
  }
}

// 일별 차트 데이터 생성 (여러 캠페인의 daily data를 날짜별로 집계)
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
      clicks: number
      linkClicks: number
      conversions: number
    }
  >()

  for (const result of liveResults) {
    if (result.status !== 'fulfilled') continue
    if (objective) {
      const camp = campaigns.find((c) => c.id === result.value.campaignId)
      if (!camp || camp.objective !== objective) continue
    }
    for (const d of result.value.data) {
      const existing = dailyMap.get(d.date) || {
        spend: 0,
        revenue: 0,
        impressions: 0,
        clicks: 0,
        linkClicks: 0,
        conversions: 0,
      }
      existing.spend += d.spend
      existing.revenue += d.revenue
      existing.impressions += d.impressions
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
      clicks: d.clicks,
      linkClicks: d.linkClicks,
      conversions: d.conversions,
    }))
}

/**
 * Meta API에서 실시간 KPI 데이터 조회
 * today/yesterday: 단일 날짜, 1일 전과 비교
 * 7d: 최근 7일 일별 데이터, 이전 7일과 비교
 */
async function fetchLiveKPI(
  userId: string,
  period: LivePeriod,
  objective?: CampaignObjective,
  includeBreakdown?: boolean
) {
  const metaAccount = await prisma.metaAdAccount.findUnique({
    where: { userId },
  })
  if (!metaAccount?.accessToken) return null

  const campaignRepo = container.resolve<ICampaignRepository>(DI_TOKENS.CampaignRepository)
  const metaService = container.resolve<IMetaAdsService>(DI_TOKENS.MetaAdsService)
  const token = safeDecryptToken(metaAccount.accessToken)

  const allCampaigns = await campaignRepo.findByUserId(userId)
  const metaCampaigns = allCampaigns.filter((c) => c.metaCampaignId)

  if (metaCampaigns.length === 0) return null

  const todayStr = new Date().toISOString().split('T')[0]

  // 기간별 현재/이전 날짜 범위 설정
  type FetchOpts = { preset: string; range?: { since: string; until: string } }
  let currentOpts: FetchOpts
  let prevOpts: FetchOpts

  if (period === 'today') {
    currentOpts = { preset: 'today' }
    prevOpts = { preset: 'yesterday' }
  } else if (period === 'yesterday') {
    currentOpts = { preset: 'yesterday' }
    prevOpts = { preset: 'yesterday', range: { since: daysAgoStr(2), until: daysAgoStr(2) } }
  } else {
    // 7d: 명시적 time_range로 정확한 날짜 범위 지정
    currentOpts = { preset: 'last_7d', range: { since: daysAgoStr(6), until: todayStr } }
    prevOpts = { preset: 'last_7d', range: { since: daysAgoStr(13), until: daysAgoStr(7) } }
  }

  // 현재 기간 + 비교 기간 병렬 조회
  const fetchCampaign = (opts: FetchOpts) =>
    Promise.allSettled(
      metaCampaigns.map(async (campaign) => {
        const data = await metaService.getCampaignDailyInsights(
          token,
          campaign.metaCampaignId!,
          opts.preset as 'today' | 'yesterday' | 'last_7d' | 'last_30d' | 'last_90d',
          opts.range
        )
        return { campaignId: campaign.id, name: campaign.name, objective: campaign.objective, data }
      })
    )

  const [currentResults, prevResults] = await Promise.all([
    fetchCampaign(currentOpts),
    fetchCampaign(prevOpts),
  ])

  const current = aggregateLiveResults(currentResults, allCampaigns, objective, includeBreakdown)
  const prev = aggregateLiveResults(prevResults, allCampaigns, objective)

  // KPI 지표 계산
  const roas = current.totalSpend > 0 ? current.totalRevenue / current.totalSpend : 0
  const ctr =
    current.totalImpressions > 0 ? (current.totalClicks / current.totalImpressions) * 100 : 0
  const cpa = current.totalConversions > 0 ? current.totalSpend / current.totalConversions : 0
  const cvr = current.totalClicks > 0 ? (current.totalConversions / current.totalClicks) * 100 : 0

  const prevRoas = prev.totalSpend > 0 ? prev.totalRevenue / prev.totalSpend : 0
  const prevCtr = prev.totalImpressions > 0 ? (prev.totalClicks / prev.totalImpressions) * 100 : 0

  const calcChange = (cur: number, pre: number) =>
    pre === 0 ? (cur > 0 ? 100 : 0) : ((cur - pre) / pre) * 100

  // 차트 데이터 생성
  let chartData: Array<{
    date: string
    spend: number
    revenue: number
    roas: number
    impressions: number
    clicks: number
    linkClicks: number
    conversions: number
  }>

  if (period === '7d') {
    // 7일: 일별 차트 데이터
    chartData = buildDailyChartData(currentResults, allCampaigns, objective)
  } else {
    // 오늘/어제: 단일 포인트
    const dateStr = period === 'yesterday' ? daysAgoStr(1) : todayStr
    chartData =
      current.totalSpend > 0 || current.totalImpressions > 0
        ? [
            {
              date: dateStr,
              spend: current.totalSpend,
              revenue: current.totalRevenue,
              roas,
              impressions: current.totalImpressions,
              clicks: current.totalClicks,
              linkClicks: current.totalLinkClicks,
              conversions: current.totalConversions,
            },
          ]
        : []
  }

  return {
    summary: {
      totalSpend: current.totalSpend,
      totalRevenue: current.totalRevenue,
      totalImpressions: current.totalImpressions,
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
        clicks: calcChange(current.totalClicks, prev.totalClicks),
        linkClicks: calcChange(current.totalLinkClicks, prev.totalLinkClicks),
      },
    },
    campaignBreakdown: includeBreakdown ? current.breakdowns : undefined,
    chartData,
  }
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d'
    const objectiveParam = searchParams.get('objective')
    const objective = validateObjective(objectiveParam)
    const includeComparison = searchParams.get('comparison') === 'true'
    const includeBreakdown = searchParams.get('breakdown') === 'true'

    // Get cache service from DI container
    const cacheService = getCacheService()

    // Generate cache key with date parameter
    const dateKey = objective ? `${period}_${objective}` : period
    const cacheKey = CacheKeys.kpiDashboard(user.id, dateKey)

    // Check cache first
    const cachedResponse = await cacheService.get<unknown>(cacheKey)
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: {
          'Cache-Control': 'private, max-age=120',
          'X-Cache': 'HIT',
        },
      })
    }

    // "오늘"/"어제"/"7일" — Meta API 실시간 조회 (DB 미경유)
    // 짧은 기간은 항상 최신 데이터를 보여주기 위해 Meta API에서 직접 조회
    if (period === 'today' || period === 'yesterday' || period === '7d') {
      let liveResponse = await fetchLiveKPI(
        user.id,
        period as LivePeriod,
        objective,
        includeBreakdown
      )

      if (liveResponse && objective && !hasKPIData(liveResponse)) {
        const fallbackResponse = await fetchLiveKPI(
          user.id,
          period as LivePeriod,
          undefined,
          includeBreakdown
        )

        if (fallbackResponse && hasKPIData(fallbackResponse)) {
          liveResponse = fallbackResponse
        }
      }

      if (liveResponse) {
        await cacheService.set(cacheKey, liveResponse, LIVE_CACHE_TTL)
        return NextResponse.json(liveResponse, {
          headers: {
            'Cache-Control': 'private, max-age=120',
            'X-Cache': 'LIVE',
          },
        })
      }
      // Meta 토큰 없으면 DB 폴백
    }

    // 30일/90일/월간 — DB 기반 조회 (UseCase 경유)
    const getDashboardKPI = container.resolve<GetDashboardKPIUseCase>(
      DI_TOKENS.GetDashboardKPIUseCase
    )

    let result = await getDashboardKPI.execute({
      userId: user.id,
      dateRange: mapPeriodToPreset(period),
      objective,
      includeComparison,
      includeBreakdown,
      includeChartData: true,
    })

    if (
      objective &&
      !(
        result.totalSpend > 0 ||
        result.totalImpressions > 0 ||
        result.totalClicks > 0 ||
        result.totalLinkClicks > 0 ||
        result.totalConversions > 0 ||
        (result.chartData?.length ?? 0) > 0
      )
    ) {
      result = await getDashboardKPI.execute({
        userId: user.id,
        dateRange: mapPeriodToPreset(period),
        objective: undefined,
        includeComparison,
        includeBreakdown,
        includeChartData: true,
      })
    }

    // Transform to API response format for backwards compatibility
    const response = {
      summary: {
        totalSpend: result.totalSpend,
        totalRevenue: result.totalRevenue,
        totalImpressions: result.totalImpressions,
        totalClicks: result.totalClicks,
        totalLinkClicks: result.totalLinkClicks,
        totalConversions: result.totalConversions,
        averageRoas: result.roas,
        averageCtr: result.ctr,
        averageCpa: result.cpa,
        cvr: result.cvr,
        activeCampaigns: result.campaignBreakdown?.length ?? 0,
        changes: result.comparison
          ? {
              spend: result.comparison.spendChange,
              revenue: result.comparison.revenueChange,
              roas: result.comparison.roasChange,
              ctr: result.comparison.ctrChange,
              conversions: result.comparison.conversionsChange,
              impressions: result.comparison.impressionsChange,
              clicks: result.comparison.clicksChange,
              linkClicks: result.comparison.linkClicksChange,
            }
          : undefined,
      },
      campaignBreakdown: result.campaignBreakdown,
      chartData: result.chartData ?? [],
    }

    // Store in cache with 5 minute TTL
    await cacheService.set(cacheKey, response, CacheTTL.KPI)

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, max-age=300',
        'X-Cache': 'MISS',
      },
    })
  } catch (error) {
    console.error('Failed to fetch dashboard KPI:', error)
    return NextResponse.json({ message: 'Failed to fetch dashboard KPI' }, { status: 500 })
  }
}
