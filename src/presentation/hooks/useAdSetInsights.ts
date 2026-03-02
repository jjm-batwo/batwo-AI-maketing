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

async function fetchAdSetInsights(adSetId: string): Promise<InsightsData> {
  const response = await fetch(`/api/adsets/${adSetId}/insights`)
  if (!response.ok) throw new Error('광고 세트 인사이트 조회에 실패했습니다')
  return response.json()
}

export function useAdSetInsights(adSetId: string) {
  return useQuery({
    queryKey: ['adset-insights', adSetId],
    queryFn: () => fetchAdSetInsights(adSetId),
    enabled: !!adSetId,
    staleTime: 60 * 1000,
  })
}
