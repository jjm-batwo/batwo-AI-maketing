'use client'

import { useQuery } from '@tanstack/react-query'

interface Ad {
  id: string
  name: string
  status: string
}

async function fetchAds(adSetId: string): Promise<{ ads: Ad[] }> {
  const response = await fetch(`/api/adsets/${adSetId}/ads`)
  if (!response.ok) throw new Error('광고 조회에 실패했습니다')
  return response.json()
}

export function useAds(adSetId: string) {
  return useQuery({
    queryKey: ['ads', adSetId],
    queryFn: () => fetchAds(adSetId),
    enabled: !!adSetId,
    staleTime: 60 * 1000,
  })
}
