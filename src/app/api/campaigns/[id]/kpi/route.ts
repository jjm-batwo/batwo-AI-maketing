import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import type { IKPIRepository } from '@domain/repositories/IKPIRepository'
import type { IMetaAdsService } from '@application/ports/IMetaAdsService'
import { KPI, KPISnapshot } from '@domain/entities/KPI'
import { prisma } from '@/lib/prisma'
import { safeDecryptToken } from '@application/utils/TokenEncryption'

// 날짜 유틸리티
function daysAgoStr(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

type LivePeriod = 'today' | 'yesterday' | '7d'

type ChartRow = {
  date: string
  impressions: number
  clicks: number
  conversions: number
  spend: number
  revenue: number
  roas: number
  ctr: number
}

function calcChange(cur: number, pre: number): number {
  if (pre === 0) return cur > 0 ? 100 : 0
  return ((cur - pre) / pre) * 100
}

/**
 * Meta API에서 특정 캠페인의 라이브 KPI 데이터 조회
 */
async function fetchLiveCampaignKPI(
  userId: string,
  metaCampaignId: string,
  period: LivePeriod,
) {
  const metaAccount = await prisma.metaAdAccount.findUnique({ where: { userId } })
  if (!metaAccount?.accessToken) return null

  const metaService = container.resolve<IMetaAdsService>(DI_TOKENS.MetaAdsService)
  const token = safeDecryptToken(metaAccount.accessToken)
  const todayStr = new Date().toISOString().split('T')[0]

  type Preset = 'today' | 'yesterday' | 'last_7d' | 'last_30d' | 'last_90d'

  let currentPreset: Preset
  let currentRange: { since: string; until: string } | undefined
  let prevPreset: Preset
  let prevRange: { since: string; until: string } | undefined

  if (period === 'today') {
    currentPreset = 'today'
    prevPreset = 'yesterday'
  } else if (period === 'yesterday') {
    currentPreset = 'yesterday'
    prevPreset = 'yesterday'
    prevRange = { since: daysAgoStr(2), until: daysAgoStr(2) }
  } else {
    // 7d
    currentPreset = 'last_7d'
    currentRange = { since: daysAgoStr(6), until: todayStr }
    prevPreset = 'last_7d'
    prevRange = { since: daysAgoStr(13), until: daysAgoStr(7) }
  }

  const [currentData, prevData] = await Promise.all([
    metaService.getCampaignDailyInsights(token, metaCampaignId, currentPreset, currentRange),
    metaService.getCampaignDailyInsights(token, metaCampaignId, prevPreset, prevRange),
  ])

  // 현재 기간 집계
  let impressions = 0, clicks = 0, conversions = 0, spend = 0, revenue = 0
  for (const d of currentData) {
    impressions += d.impressions
    clicks += d.clicks
    conversions += d.conversions
    spend += d.spend
    revenue += d.revenue
  }

  // 이전 기간 집계
  let pImpressions = 0, pClicks = 0, pConversions = 0, pSpend = 0, pRevenue = 0
  for (const d of prevData) {
    pImpressions += d.impressions
    pClicks += d.clicks
    pConversions += d.conversions
    pSpend += d.spend
    pRevenue += d.revenue
  }

  const roas = spend > 0 ? revenue / spend : 0
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
  const cvr = clicks > 0 ? (conversions / clicks) * 100 : 0
  const cpa = conversions > 0 ? spend / conversions : 0
  const cpc = clicks > 0 ? spend / clicks : 0
  const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0

  const prevRoas = pSpend > 0 ? pRevenue / pSpend : 0
  const prevCtr = pImpressions > 0 ? (pClicks / pImpressions) * 100 : 0

  // 일별 차트 데이터
  const chartData: ChartRow[] = currentData
    .map((d) => ({
      date: d.date,
      impressions: d.impressions,
      clicks: d.clicks,
      conversions: d.conversions,
      spend: d.spend,
      revenue: d.revenue,
      roas: d.spend > 0 ? d.revenue / d.spend : 0,
      ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    summary: { impressions, clicks, conversions, spend, revenue, roas, ctr, cvr, cpa, cpc, cpm },
    comparison: {
      impressions: calcChange(impressions, pImpressions),
      clicks: calcChange(clicks, pClicks),
      conversions: calcChange(conversions, pConversions),
      spend: calcChange(spend, pSpend),
      revenue: calcChange(revenue, pRevenue),
      roas: roas - prevRoas,
      ctr: ctr - prevCtr,
    },
    chartData,
  }
}

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

    // 캠페인 소유권 확인
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

    // today/yesterday/7d + metaCampaignId 있는 경우 Meta API 라이브 조회
    if (
      (period === 'today' || period === 'yesterday' || period === '7d') &&
      campaign.metaCampaignId
    ) {
      try {
        const live = await fetchLiveCampaignKPI(user.id, campaign.metaCampaignId, period as LivePeriod)
        if (live) {
          return NextResponse.json({
            campaign: {
              id: campaign.id,
              name: campaign.name,
              status: campaign.status,
              objective: campaign.objective,
              dailyBudget: campaign.dailyBudget.amount,
              startDate: campaign.startDate.toISOString(),
              endDate: campaign.endDate?.toISOString(),
            },
            ...live,
            period,
          })
        }
      } catch (liveError) {
        console.warn('Meta API live fetch failed, falling back to DB:', liveError)
      }
    }

    // DB 폴백: 날짜 범위 계산
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

    const kpiRepository = container.resolve<IKPIRepository>(DI_TOKENS.KPIRepository)

    const kpis = await kpiRepository.findByCampaignIdAndDateRange(id, startDate, endDate)
    const aggregated = KPISnapshot.aggregate(kpis)

    const prevStartDate = new Date(startDate)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    prevStartDate.setDate(prevStartDate.getDate() - daysDiff)
    const prevEndDate = new Date(startDate)

    const prevKpis = await kpiRepository.findByCampaignIdAndDateRange(id, prevStartDate, prevEndDate)
    const prevAggregated = KPISnapshot.aggregate(prevKpis)
    const comparison = KPISnapshot.compare(aggregated, prevAggregated)

    const chartData = kpis.map((kpi: KPI) => ({
      date: kpi.date.toISOString().split('T')[0],
      impressions: kpi.impressions,
      clicks: kpi.clicks,
      conversions: kpi.conversions,
      spend: kpi.spend.amount,
      revenue: kpi.revenue.amount,
      roas: kpi.calculateROAS(),
      ctr: kpi.calculateCTR().value,
    })).sort((a: ChartRow, b: ChartRow) => a.date.localeCompare(b.date))

    return NextResponse.json({
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
    })
  } catch (error) {
    console.error('Failed to fetch campaign KPI:', error)
    return NextResponse.json(
      { message: 'Failed to fetch campaign KPI' },
      { status: 500 }
    )
  }
}
