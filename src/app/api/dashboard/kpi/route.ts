import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS, getCacheService } from '@/lib/di/container'
import { GetDashboardKPIUseCase } from '@application/use-cases/kpi/GetDashboardKPIUseCase'
import {
  GetLiveDashboardKPIUseCase,
  type DashboardLiveKPIResponse,
  type LivePeriod,
} from '@application/use-cases/kpi/GetLiveDashboardKPIUseCase'
import type { DateRangePreset } from '@application/dto/kpi/DashboardKPIDTO'
import { CacheKeys, CacheTTL } from '@/infrastructure/cache/CacheKeys'

const LIVE_CACHE_TTL = 120

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

function validateObjective(objective: string | null): CampaignObjective | undefined {
  if (!objective) return undefined
  if (validObjectives.includes(objective as CampaignObjective)) {
    return objective as CampaignObjective
  }
  return undefined
}

function hasKPIData(data: DashboardLiveKPIResponse): boolean {
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

    const cacheService = getCacheService()
    const dateKey = objective ? `${period}_${objective}` : period
    const cacheKey = CacheKeys.kpiDashboard(user.id, dateKey)

    const cachedResponse = await cacheService.get<unknown>(cacheKey)
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: {
          'Cache-Control': 'private, max-age=120',
          'X-Cache': 'HIT',
        },
      })
    }

    if (period === 'today' || period === 'yesterday' || period === '7d') {
      const getLiveDashboardKPI = container.resolve<GetLiveDashboardKPIUseCase>(
        DI_TOKENS.GetLiveDashboardKPIUseCase
      )

      let liveResponse = await getLiveDashboardKPI.execute(
        user.id,
        period as LivePeriod,
        objective,
        includeBreakdown
      )

      if (liveResponse && objective && !hasKPIData(liveResponse)) {
        const fallbackResponse = await getLiveDashboardKPI.execute(
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
    }

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

    const totalReach = 'totalReach' in result ? result.totalReach : result.totalImpressions
    const reachChange =
      result.comparison && 'reachChange' in result.comparison
        ? result.comparison.reachChange
        : result.comparison?.impressionsChange

    const response = {
      summary: {
        totalSpend: result.totalSpend,
        totalRevenue: result.totalRevenue,
        totalImpressions: result.totalImpressions,
        totalReach,
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
              reach: reachChange,
              clicks: result.comparison.clicksChange,
              linkClicks: result.comparison.linkClicksChange,
            }
          : undefined,
      },
      campaignBreakdown: result.campaignBreakdown?.map((item) => {
        const reach =
          'reach' in item && typeof item.reach === 'number' ? item.reach : item.impressions
        const cpm =
          'cpm' in item && typeof item.cpm === 'number'
            ? item.cpm
            : item.impressions > 0
              ? (item.spend / item.impressions) * 1000
              : 0
        const reachRate =
          'reachRate' in item && typeof item.reachRate === 'number'
            ? item.reachRate
            : item.impressions > 0
              ? (reach / item.impressions) * 100
              : 0

        return {
          ...item,
          reach,
          cpm,
          reachRate,
        }
      }),
      chartData: result.chartData ?? [],
    }

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
