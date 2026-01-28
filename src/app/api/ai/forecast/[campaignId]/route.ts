import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { ForecastingService, type ForecastResult } from '@/application/services/ForecastingService'
import { prisma } from '@/lib/prisma'
import type { Decimal } from '@prisma/client-runtime-utils'

/**
 * Forecast API Response
 */
interface ForecastResponse {
  campaignId: string
  forecasts: ForecastResult[]
  generatedAt: string
  dataRange: {
    startDate: string
    endDate: string
    totalDays: number
  }
}

/**
 * GET /api/ai/forecast/[campaignId]
 * Generate forecasts for campaign metrics
 *
 * Query Parameters:
 * - horizon: Forecast horizon in days (7, 14, or 30) - default: 7
 * - metrics: Comma-separated list of metrics (roas,cpa,ctr,cvr,spend,revenue) - default: all
 *
 * Example: /api/ai/forecast/cm123?horizon=14&metrics=roas,cpa
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { campaignId } = await params
    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const horizonParam = searchParams.get('horizon')
    const metricsParam = searchParams.get('metrics')

    const horizon = validateHorizon(horizonParam)
    const metrics = validateMetrics(metricsParam)

    // Verify campaign ownership
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
    })

    if (!campaign) {
      return NextResponse.json({ message: '캠페인을 찾을 수 없습니다' }, { status: 404 })
    }

    // Fetch historical KPI data (last 90 days for better predictions)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const kpiSnapshots = await prisma.kPISnapshot.findMany({
      where: {
        campaignId,
        date: {
          gte: ninetyDaysAgo,
        },
      },
      orderBy: {
        date: 'asc',
      },
      select: {
        date: true,
        impressions: true,
        clicks: true,
        conversions: true,
        spend: true,
        revenue: true,
      },
    })

    if (kpiSnapshots.length === 0) {
      return NextResponse.json(
        { message: '예측을 위한 충분한 데이터가 없습니다' },
        { status: 400 }
      )
    }

    // Transform data and calculate derived metrics
    const historicalData = kpiSnapshots.map((snapshot: {
      date: Date
      impressions: number
      clicks: number
      conversions: number
      spend: Decimal
      revenue: Decimal
    }) => {
      const spend = typeof snapshot.spend === 'object' && 'toNumber' in snapshot.spend
        ? snapshot.spend.toNumber()
        : Number(snapshot.spend)
      const revenue = typeof snapshot.revenue === 'object' && 'toNumber' in snapshot.revenue
        ? snapshot.revenue.toNumber()
        : Number(snapshot.revenue)
      const impressions = snapshot.impressions
      const clicks = snapshot.clicks
      const conversions = snapshot.conversions

      return {
        date: snapshot.date.toISOString().split('T')[0],
        spend,
        revenue,
        roas: spend > 0 ? revenue / spend : 0,
        cpa: conversions > 0 ? spend / conversions : 0,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cvr: clicks > 0 ? (conversions / clicks) * 100 : 0,
      }
    })

    // Generate forecasts
    const forecasts = ForecastingService.generateForecast({
      campaignId,
      metrics,
      horizon,
      historicalData,
    })

    // Prepare response
    const response: ForecastResponse = {
      campaignId,
      forecasts,
      generatedAt: new Date().toISOString(),
      dataRange: {
        startDate: historicalData[0].date,
        endDate: historicalData[historicalData.length - 1].date,
        totalDays: historicalData.length,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to generate forecast:', error)
    return NextResponse.json({ message: '예측 생성에 실패했습니다' }, { status: 500 })
  }
}

/**
 * Validate horizon parameter
 */
function validateHorizon(param: string | null): 7 | 14 | 30 {
  if (!param) return 7 // default

  const horizon = parseInt(param, 10)
  if ([7, 14, 30].includes(horizon)) {
    return horizon as 7 | 14 | 30
  }

  return 7 // fallback to default
}

/**
 * Validate metrics parameter
 */
function validateMetrics(
  param: string | null
): ('roas' | 'cpa' | 'ctr' | 'cvr' | 'spend' | 'revenue')[] {
  const validMetrics = ['roas', 'cpa', 'ctr', 'cvr', 'spend', 'revenue']

  if (!param) return validMetrics as ('roas' | 'cpa' | 'ctr' | 'cvr' | 'spend' | 'revenue')[]

  const requestedMetrics = param.split(',').map((m) => m.trim().toLowerCase())
  const filtered = requestedMetrics.filter((m) => validMetrics.includes(m))

  if (filtered.length === 0) {
    return validMetrics as ('roas' | 'cpa' | 'ctr' | 'cvr' | 'spend' | 'revenue')[]
  }

  return filtered as ('roas' | 'cpa' | 'ctr' | 'cvr' | 'spend' | 'revenue')[]
}
