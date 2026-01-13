'use client'

import { useQuery } from '@tanstack/react-query'

export interface CampaignKPISummary {
  impressions: number
  clicks: number
  conversions: number
  spend: number
  revenue: number
  roas: number
  ctr: number
  cvr: number
  cpa: number
  cpc: number
  cpm: number
}

export interface CampaignKPIComparison {
  impressions: number
  clicks: number
  conversions: number
  spend: number
  revenue: number
  roas: number
  ctr: number
}

export interface CampaignKPIChartData {
  date: string
  impressions: number
  clicks: number
  conversions: number
  spend: number
  revenue: number
  roas: number
  ctr: number
}

export interface CampaignKPIResponse {
  campaign: {
    id: string
    name: string
    status: string
    objective: string
    dailyBudget: number
    startDate: string
    endDate?: string
  }
  summary: CampaignKPISummary
  comparison: CampaignKPIComparison
  chartData: CampaignKPIChartData[]
  period: string
}

const CAMPAIGN_KPI_QUERY_KEY = ['campaign-kpi'] as const

async function fetchCampaignKPI(
  campaignId: string,
  period: string
): Promise<CampaignKPIResponse> {
  const response = await fetch(
    `/api/campaigns/${campaignId}/kpi?period=${period}`
  )
  if (!response.ok) {
    throw new Error('Failed to fetch campaign KPI')
  }
  return response.json()
}

export function useCampaignKPI(campaignId: string, period: string = '7d') {
  return useQuery({
    queryKey: [...CAMPAIGN_KPI_QUERY_KEY, campaignId, period],
    queryFn: () => fetchCampaignKPI(campaignId, period),
    enabled: !!campaignId,
    staleTime: 60 * 1000, // 1 minute
  })
}
