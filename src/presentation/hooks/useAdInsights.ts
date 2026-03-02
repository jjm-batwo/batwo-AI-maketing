'use client'

import { useQuery } from '@tanstack/react-query'

interface InsightsData {
  campaignId: string
  impressions: number
  reach: number
  clicks: number
  linkClicks: number
  spend: number
  conversions: number
  revenue: number
  dateStart: string
  dateStop: string
}

async function fetchAdInsights(adId: string): Promise<InsightsData> {
  const response = await fetch(`/api/ads/${adId}/insights`)
  if (!response.ok) throw new Error('광고 인사이트 조회에 실패했습니다')
  return response.json()
}

export function useAdInsights(adId: string) {
  return useQuery({
    queryKey: ['ad-insights', adId],
    queryFn: () => fetchAdInsights(adId),
    enabled: !!adId,
    staleTime: 60 * 1000,
  })
}
