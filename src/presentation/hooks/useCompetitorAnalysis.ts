'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface CompetitorInfo {
  pageName: string
  pageId: string
  adCount: number
  dominantFormats: string[]
  commonHooks: string[]
  averageAdLifespan: number
}

export interface CompetitorTrends {
  popularHooks: string[]
  commonOffers: string[]
  formatDistribution: Array<{ format: string; percentage: number }>
}

export interface CompetitorAnalysis {
  competitors: CompetitorInfo[]
  trends: CompetitorTrends
  recommendations: string[]
}

export interface CompetitorSearchResult {
  totalAds: number
  analysis: CompetitorAnalysis
}

const COMPETITOR_QUERY_KEY = ['competitors', 'search'] as const

async function fetchCompetitorAnalysis(
  keywords: string,
  countries: string,
  industry?: string
): Promise<CompetitorSearchResult> {
  const searchParams = new URLSearchParams()
  searchParams.set('keywords', keywords)
  searchParams.set('countries', countries)
  if (industry) searchParams.set('industry', industry)

  const response = await fetch(`/api/ai/competitors?${searchParams.toString()}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch competitor analysis')
  }
  const json = await response.json()
  return json.data
}

export function useCompetitorSearch(
  keywords: string,
  countries?: string,
  industry?: string
) {
  const resolvedCountries = countries ?? 'KR'

  return useQuery({
    queryKey: [...COMPETITOR_QUERY_KEY, keywords, resolvedCountries, industry],
    queryFn: () => fetchCompetitorAnalysis(keywords, resolvedCountries, industry),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!keywords,
  })
}

// ========================================
// 경쟁사 추적 훅
// ========================================

export interface TrackedCompetitor {
  id: string
  pageId: string
  pageName: string
  industry: string | null
  createdAt: string
}

const TRACKED_QUERY_KEY = ['competitors', 'tracked'] as const

async function fetchTrackedCompetitors(): Promise<TrackedCompetitor[]> {
  const response = await fetch('/api/ai/competitors/tracking')
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '추적 목록을 불러올 수 없습니다')
  }
  const json = await response.json()
  return json.data
}

async function trackCompetitors(params: {
  pages: Array<{ pageId: string; pageName: string }>
  industry?: string
}): Promise<TrackedCompetitor[]> {
  const response = await fetch('/api/ai/competitors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '추적 저장에 실패했습니다')
  }
  const json = await response.json()
  return json.data
}

async function untrackCompetitor(pageId: string): Promise<void> {
  const response = await fetch('/api/ai/competitors/tracking', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pageId }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '추적 해제에 실패했습니다')
  }
}

export function useTrackedCompetitors() {
  return useQuery({
    queryKey: [...TRACKED_QUERY_KEY],
    queryFn: fetchTrackedCompetitors,
    staleTime: 2 * 60 * 1000,
  })
}

export function useTrackCompetitor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: trackCompetitors,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...TRACKED_QUERY_KEY] })
    },
  })
}

export function useUntrackCompetitor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: untrackCompetitor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...TRACKED_QUERY_KEY] })
    },
  })
}
