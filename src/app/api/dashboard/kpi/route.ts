import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS, getCacheService } from '@/lib/di/container'
import { GetDashboardKPIUseCase } from '@application/use-cases/kpi/GetDashboardKPIUseCase'
import type { DateRangePreset } from '@application/dto/kpi/DashboardKPIDTO'
import { CacheKeys, CacheTTL } from '@/infrastructure/cache/CacheKeys'

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
const validObjectives = ['AWARENESS', 'TRAFFIC', 'ENGAGEMENT', 'LEADS', 'APP_PROMOTION', 'SALES', 'CONVERSIONS'] as const
type CampaignObjective = typeof validObjectives[number]

// Validate and cast objective parameter
function validateObjective(objective: string | null): CampaignObjective | undefined {
  if (!objective) return undefined
  if (validObjectives.includes(objective as CampaignObjective)) {
    return objective as CampaignObjective
  }
  return undefined
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
          'Cache-Control': 'private, max-age=300',
          'X-Cache': 'HIT',
        },
      })
    }

    const getDashboardKPI = container.resolve<GetDashboardKPIUseCase>(
      DI_TOKENS.GetDashboardKPIUseCase
    )

    const result = await getDashboardKPI.execute({
      userId: user.id,
      dateRange: mapPeriodToPreset(period),
      objective,
      includeComparison,
      includeBreakdown,
      includeChartData: true,
    })

    // Transform to API response format for backwards compatibility
    const response = {
      summary: {
        totalSpend: result.totalSpend,
        totalRevenue: result.totalRevenue,
        totalImpressions: result.totalImpressions,
        totalClicks: result.totalClicks,
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
    return NextResponse.json(
      { message: 'Failed to fetch dashboard KPI' },
      { status: 500 }
    )
  }
}
