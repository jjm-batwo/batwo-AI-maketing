'use client'

import { useQuery } from '@tanstack/react-query'
import { type CampaignDatePreset } from '@/presentation/utils/campaignPeriod'

interface AdSetInsights {
  impressions: number
  clicks: number
  spend: number
  conversions: number
  revenue: number
}

interface AdSetWithInsights {
  id: string
  name: string
  status: string
  dailyBudget?: number
  insights: AdSetInsights
}

interface AdSetsWithInsightsResponse {
  adSets: AdSetWithInsights[]
}

async function fetchAdSetsWithInsights(
  campaignId: string | null,
  datePreset: CampaignDatePreset
): Promise<AdSetWithInsights[]> {
  const url = campaignId
    ? `/api/campaigns/${campaignId}/adsets-with-insights?datePreset=${datePreset}`
    : `/api/meta/all-adsets-with-insights?datePreset=${datePreset}`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to fetch ad sets with insights')
  }
  const data: AdSetsWithInsightsResponse = await res.json()
  return data.adSets || []
}

export function useAdSetsWithInsights(
  campaignId: string | null,
  datePreset: CampaignDatePreset = 'last_7d',
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['adsets-with-insights', campaignId, datePreset],
    queryFn: () => fetchAdSetsWithInsights(campaignId, datePreset),
    enabled: enabled,
    staleTime: 5 * 60 * 1000, // 5분: Meta API N+1 부하 경감
  })
}
