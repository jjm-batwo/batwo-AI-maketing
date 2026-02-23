'use client'

import { useQuery } from '@tanstack/react-query'

interface KPIData {
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
  changes: {
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

interface KPIChartData {
  date: string
  spend: number
  revenue: number
  roas: number
  impressions: number
  reach: number
  clicks: number
  linkClicks: number
  conversions: number
}

interface CampaignBreakdown {
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
}

interface DashboardKPIResponse {
  summary: KPIData
  chartData: KPIChartData[]
  campaignBreakdown?: CampaignBreakdown[]
  period: {
    startDate: string
    endDate: string
  }
}

type DashboardPeriod = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'this_month' | 'last_month'
type CampaignObjective =
  | 'ALL'
  | 'AWARENESS'
  | 'TRAFFIC'
  | 'ENGAGEMENT'
  | 'LEADS'
  | 'APP_PROMOTION'
  | 'SALES'
  | 'CONVERSIONS'

const DASHBOARD_KPI_QUERY_KEY = ['dashboard', 'kpi'] as const

async function fetchDashboardKPI(params?: {
  period?: DashboardPeriod
  objective?: CampaignObjective
  startDate?: string
  endDate?: string
  includeBreakdown?: boolean
  includeComparison?: boolean
}): Promise<DashboardKPIResponse> {
  const searchParams = new URLSearchParams()
  if (params?.period) searchParams.set('period', params.period)
  if (params?.objective && params.objective !== 'ALL')
    searchParams.set('objective', params.objective)
  if (params?.startDate) searchParams.set('startDate', params.startDate)
  if (params?.endDate) searchParams.set('endDate', params.endDate)
  if (params?.includeBreakdown) searchParams.set('breakdown', 'true')
  if (params?.includeComparison) searchParams.set('comparison', 'true')

  const response = await fetch(`/api/dashboard/kpi?${searchParams.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard KPI')
  }
  return response.json()
}

export function useDashboardKPI(params?: {
  period?: DashboardPeriod
  objective?: CampaignObjective
  startDate?: string
  endDate?: string
  includeBreakdown?: boolean
  includeComparison?: boolean
  enabled?: boolean
}) {
  const { enabled = true, ...queryParams } = params ?? {}
  return useQuery({
    queryKey: [...DASHBOARD_KPI_QUERY_KEY, queryParams],
    queryFn: () => fetchDashboardKPI(queryParams),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    enabled,
  })
}

export function useDashboardSummary(params?: {
  period?: DashboardPeriod
  objective?: CampaignObjective
}) {
  const { data, ...rest } = useDashboardKPI(params)
  return {
    data: data?.summary,
    ...rest,
  }
}

export function useDashboardChartData(params?: {
  period?: DashboardPeriod
  objective?: CampaignObjective
}) {
  const { period = '7d', objective } = params ?? {}
  const { data, ...rest } = useDashboardKPI({ period, objective })
  return {
    data: data?.chartData,
    period: data?.period,
    ...rest,
  }
}
