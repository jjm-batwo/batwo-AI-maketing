'use client'

import { useQuery } from '@tanstack/react-query'

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
