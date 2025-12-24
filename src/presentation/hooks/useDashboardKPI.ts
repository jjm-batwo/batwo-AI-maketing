'use client'

import { useQuery } from '@tanstack/react-query'

interface KPIData {
  totalSpend: number
  totalRevenue: number
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  averageRoas: number
  averageCtr: number
  averageCpa: number
  activeCampaigns: number
  changes: {
    spend: number
    revenue: number
    roas: number
    ctr: number
    conversions: number
  }
}

interface KPIChartData {
  date: string
  spend: number
  revenue: number
  roas: number
  impressions: number
  clicks: number
  conversions: number
}

interface DashboardKPIResponse {
  summary: KPIData
  chartData: KPIChartData[]
  period: {
    startDate: string
    endDate: string
  }
}

const DASHBOARD_KPI_QUERY_KEY = ['dashboard', 'kpi'] as const

async function fetchDashboardKPI(params?: {
  period?: '7d' | '30d' | '90d'
  startDate?: string
  endDate?: string
}): Promise<DashboardKPIResponse> {
  const searchParams = new URLSearchParams()
  if (params?.period) searchParams.set('period', params.period)
  if (params?.startDate) searchParams.set('startDate', params.startDate)
  if (params?.endDate) searchParams.set('endDate', params.endDate)

  const response = await fetch(`/api/dashboard/kpi?${searchParams.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard KPI')
  }
  return response.json()
}

export function useDashboardKPI(params?: {
  period?: '7d' | '30d' | '90d'
  startDate?: string
  endDate?: string
}) {
  return useQuery({
    queryKey: [...DASHBOARD_KPI_QUERY_KEY, params],
    queryFn: () => fetchDashboardKPI(params),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  })
}

export function useDashboardSummary() {
  const { data, ...rest } = useDashboardKPI()
  return {
    data: data?.summary,
    ...rest,
  }
}

export function useDashboardChartData(period: '7d' | '30d' | '90d' = '7d') {
  const { data, ...rest } = useDashboardKPI({ period })
  return {
    data: data?.chartData,
    period: data?.period,
    ...rest,
  }
}
