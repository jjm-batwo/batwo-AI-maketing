'use client'

import { useQuery } from '@tanstack/react-query'

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
  adSetId: string,
  datePreset: string
): Promise<AdWithInsights[]> {
  const res = await fetch(
    `/api/adsets/${adSetId}/ads-with-insights?datePreset=${datePreset}`
  )
  if (!res.ok) {
    throw new Error('Failed to fetch ads with insights')
  }
  const data: AdsWithInsightsResponse = await res.json()
  return data.ads
}

export function useAdsWithInsights(
  adSetId: string,
  datePreset: string = 'last_7d'
) {
  return useQuery({
    queryKey: ['ads-with-insights', adSetId, datePreset],
    queryFn: () => fetchAdsWithInsights(adSetId, datePreset),
    enabled: !!adSetId,
    staleTime: 60 * 1000,
  })
}
