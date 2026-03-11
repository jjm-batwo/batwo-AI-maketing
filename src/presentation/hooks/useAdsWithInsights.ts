'use client'

import { useQuery } from '@tanstack/react-query'
import { type CampaignDatePreset } from '@/presentation/utils/campaignPeriod'

interface AdInsights {
  impressions: number
  clicks: number
  spend: number
  conversions: number
  revenue: number
}

interface AdWithInsights {
  id: string
  name: string
  status: string
  insights: AdInsights
}

interface AdsWithInsightsResponse {
  ads: AdWithInsights[]
}

async function fetchAdsWithInsights(
  adSetId: string | null,
  datePreset: CampaignDatePreset
): Promise<AdWithInsights[]> {
  const url = adSetId
    ? `/api/adsets/${adSetId}/ads-with-insights?datePreset=${datePreset}`
    : `/api/meta/all-ads-with-insights?datePreset=${datePreset}`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to fetch ads with insights')
  }
  const data: AdsWithInsightsResponse = await res.json()
  return data.ads || []
}

export function useAdsWithInsights(
  adSetId: string | null,
  datePreset: CampaignDatePreset = 'last_7d',
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['ads-with-insights', adSetId, datePreset],
    queryFn: () => fetchAdsWithInsights(adSetId, datePreset),
    enabled: enabled,
    staleTime: 5 * 60 * 1000, // 5분: Meta API N+1 부하 경감
  })
}
