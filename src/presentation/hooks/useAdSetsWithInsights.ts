'use client'

import { useQuery } from '@tanstack/react-query'

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

type DatePreset = 'today' | 'yesterday' | 'last_3d' | 'last_7d' | 'last_30d' | 'last_90d'

async function fetchAdSetsWithInsights(
  campaignId: string,
  datePreset: DatePreset
): Promise<AdSetWithInsights[]> {
  const res = await fetch(
    `/api/campaigns/${campaignId}/adsets-with-insights?datePreset=${datePreset}`
  )
  if (!res.ok) {
    throw new Error('Failed to fetch ad sets with insights')
  }
  const data: AdSetsWithInsightsResponse = await res.json()
  return data.adSets
}

export function useAdSetsWithInsights(campaignId: string, datePreset: DatePreset = 'last_7d') {
  return useQuery({
    queryKey: ['adsets-with-insights', campaignId, datePreset],
    queryFn: () => fetchAdSetsWithInsights(campaignId, datePreset),
    enabled: !!campaignId,
    staleTime: 60 * 1000,
  })
}
