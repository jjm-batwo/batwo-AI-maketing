import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import type { IKPIRepository } from '@domain/repositories/IKPIRepository'
import { KPI, KPISnapshot } from '@domain/entities/KPI'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d'

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'yesterday':
        startDate.setDate(startDate.getDate() - 1)
        startDate.setHours(0, 0, 0, 0)
        endDate.setDate(endDate.getDate() - 1)
        endDate.setHours(23, 59, 59, 999)
        break
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
      default:
        startDate.setDate(startDate.getDate() - 7)
    }

    // Check campaign ownership
    const campaignRepository = container.resolve<ICampaignRepository>(
      DI_TOKENS.CampaignRepository
    )
    const campaign = await campaignRepository.findById(id)

    if (!campaign || campaign.userId !== user.id) {
      return NextResponse.json(
        { message: '캠페인을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // Get KPI data
    const kpiRepository = container.resolve<IKPIRepository>(
      DI_TOKENS.KPIRepository
    )

    const kpis = await kpiRepository.findByCampaignIdAndDateRange(
      id,
      startDate,
      endDate
    )

    // Aggregate current period KPIs
    const aggregated = KPISnapshot.aggregate(kpis)

    // Calculate previous period for comparison
    const prevStartDate = new Date(startDate)
    const prevEndDate = new Date(startDate)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    prevStartDate.setDate(prevStartDate.getDate() - daysDiff)

    const prevKpis = await kpiRepository.findByCampaignIdAndDateRange(
      id,
      prevStartDate,
      prevEndDate
    )
    const prevAggregated = KPISnapshot.aggregate(prevKpis)

    // Calculate comparison
    const comparison = KPISnapshot.compare(aggregated, prevAggregated)

    // Prepare chart data (daily breakdown)
    const chartData = kpis.map((kpi: KPI) => ({
      date: kpi.date.toISOString().split('T')[0],
      impressions: kpi.impressions,
      clicks: kpi.clicks,
      conversions: kpi.conversions,
      spend: kpi.spend.amount,
      revenue: kpi.revenue.amount,
      roas: kpi.calculateROAS(),
      ctr: kpi.calculateCTR().value,
    })).sort((a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date))

    const response = {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        objective: campaign.objective,
        dailyBudget: campaign.dailyBudget.amount,
        startDate: campaign.startDate.toISOString(),
        endDate: campaign.endDate?.toISOString(),
      },
      summary: {
        impressions: aggregated.impressions,
        clicks: aggregated.clicks,
        conversions: aggregated.conversions,
        spend: aggregated.spend.amount,
        revenue: aggregated.revenue.amount,
        roas: aggregated.calculateROAS(),
        ctr: aggregated.calculateCTR().value,
        cvr: aggregated.calculateCVR().value,
        cpa: aggregated.calculateCPA().amount,
        cpc: aggregated.calculateCPC().amount,
        cpm: aggregated.calculateCPM().amount,
      },
      comparison: {
        impressions: comparison.impressionsChange.value,
        clicks: comparison.clicksChange.value,
        conversions: comparison.conversionsChange.value,
        spend: comparison.spendChange.value,
        revenue: comparison.revenueChange.value,
        roas: comparison.roasChange,
        ctr: comparison.ctrChange.value,
      },
      chartData,
      period,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to fetch campaign KPI:', error)
    return NextResponse.json(
      { message: 'Failed to fetch campaign KPI' },
      { status: 500 }
    )
  }
}
