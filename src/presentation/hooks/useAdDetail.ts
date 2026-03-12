'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface AdCreativeDetail {
  id: string
  name: string
  pageId: string
  instagramActorId?: string
  linkUrl?: string
  message?: string
  callToAction?: string
  imageUrl?: string
  videoUrl?: string
  thumbnailUrl?: string
}

interface AdDetail {
  id: string
  name: string
  status: string
  creative: AdCreativeDetail
}

interface UpdateAdInput {
  name?: string
  status?: string
}

async function fetchAdDetail(adId: string): Promise<AdDetail> {
  const res = await fetch(`/api/ads/${adId}`)
  if (!res.ok) throw new Error('Failed to fetch ad detail')
  const data = await res.json()
  return data.ad
}

async function updateAd(adId: string, input: UpdateAdInput): Promise<void> {
  const res = await fetch(`/api/ads/${adId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('Failed to update ad')
}

export function useAdDetail(adId: string | null) {
  return useQuery({
    queryKey: ['ad-detail', adId],
    queryFn: () => fetchAdDetail(adId!),
    enabled: !!adId,
    staleTime: 2 * 60 * 1000,
  })
}

export function useUpdateAd() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ adId, input }: { adId: string; input: UpdateAdInput }) => updateAd(adId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ad-detail', variables.adId] })
      queryClient.invalidateQueries({ queryKey: ['ads-with-insights'] })
    },
  })
}

interface MetaPage {
  id: string
  name: string
  picture?: string
}

async function fetchMetaPages(): Promise<MetaPage[]> {
  const res = await fetch('/api/meta/pages')
  if (!res.ok) throw new Error('Failed to fetch pages')
  const data = await res.json()
  return data.pages || []
}

export function useMetaPages(enabled = true) {
  return useQuery({
    queryKey: ['meta-pages'],
    queryFn: fetchMetaPages,
    enabled,
    staleTime: 10 * 60 * 1000,
  })
}

export type { AdDetail, AdCreativeDetail, UpdateAdInput, MetaPage }
