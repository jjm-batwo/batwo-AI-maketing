import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import { GetDashboardKPIUseCase } from '@application/use-cases/kpi/GetDashboardKPIUseCase'
import type { DateRangePreset } from '@application/dto/kpi/DashboardKPIDTO'

// Map API period format to Use Case DateRangePreset
function mapPeriodToPreset(period: string): DateRangePreset {
  switch (period) {
    case '7d':
      return 'last_7d'
    case '30d':
      return 'last_30d'
    case 'today':
      return 'today'
    case 'yesterday':
      return 'yesterday'
    default:
      return 'last_7d'
  }
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d'
    const includeComparison = searchParams.get('comparison') === 'true'
    const includeBreakdown = searchParams.get('breakdown') === 'true'

    const getDashboardKPI = container.resolve<GetDashboardKPIUseCase>(
      DI_TOKENS.GetDashboardKPIUseCase
    )

    const result = await getDashboardKPI.execute({
      userId: user.id,
      dateRange: mapPeriodToPreset(period),
      includeComparison,
      includeBreakdown,
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
            }
          : undefined,
      },
      campaignBreakdown: result.campaignBreakdown,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to fetch dashboard KPI:', error)
    return NextResponse.json(
      { message: 'Failed to fetch dashboard KPI' },
      { status: 500 }
    )
  }
}
