'use client'

import { useQuery } from '@tanstack/react-query'
import {
  mapAnomalyResponse,
  mapTrendResponse,
  type AnomalyInsightDTO,
  type TrendInsightDTO,
  type AnomalyAPIResponse,
  type TrendAPIResponse,
} from '@application/dto/ai/AIInsightsDTO'

// ============================================================================
// Types
// ============================================================================

interface UseAIInsightsOptions {
  campaignId?: string
  enabled?: boolean
  refetchInterval?: number
  industry?: string
  includeRootCause?: boolean
  lookaheadDays?: number
}

interface AIInsightsResult {
  anomalies: AnomalyInsightDTO[]
  trends: TrendInsightDTO[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

// ============================================================================
// Fetch Functions
// ============================================================================

async function fetchAnomalies(
  industry?: string,
  includeRootCause = true
): Promise<AnomalyAPIResponse> {
  const params = new URLSearchParams()
  if (industry) params.set('industry', industry)
  params.set('includeRootCause', String(includeRootCause))

  const response = await fetch(`/api/ai/anomalies?${params.toString()}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: '이상 탐지 조회에 실패했습니다',
    }))
    throw new Error(error.message || '이상 탐지 조회에 실패했습니다')
  }

  return response.json()
}

async function fetchTrends(
  lookaheadDays = 14,
  industry?: string
): Promise<TrendAPIResponse> {
  const params = new URLSearchParams()
  params.set('lookahead', String(lookaheadDays))
  if (industry) params.set('industry', industry)

  const response = await fetch(`/api/ai/trends?${params.toString()}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: '트렌드 조회에 실패했습니다',
    }))
    throw new Error(error.message || '트렌드 조회에 실패했습니다')
  }

  return response.json()
}

// ============================================================================
// Hook
// ============================================================================

/**
 * useAIInsights Hook
 *
 * Fetches and combines anomaly detection and trend analysis insights
 *
 * @param options - Configuration options
 * @returns Combined insights with loading and error states
 */
export function useAIInsights(
  options: UseAIInsightsOptions = {}
): AIInsightsResult {
  const {
    enabled = true,
    refetchInterval = 0,
    industry,
    includeRootCause = true,
    lookaheadDays = 14,
  } = options

  // Fetch anomalies
  const anomalyQuery = useQuery({
    queryKey: ['ai-insights', 'anomalies', industry, includeRootCause],
    queryFn: () => fetchAnomalies(industry, includeRootCause),
    enabled,
    refetchInterval,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
  })

  // Fetch trends
  const trendQuery = useQuery({
    queryKey: ['ai-insights', 'trends', lookaheadDays, industry],
    queryFn: () => fetchTrends(lookaheadDays, industry),
    enabled,
    refetchInterval,
    staleTime: 1000 * 60 * 60, // 1 hour (trends change less frequently)
    gcTime: 1000 * 60 * 120, // 2 hours
    retry: 1,
  })

  // Transform data
  const anomalies = anomalyQuery.data
    ? mapAnomalyResponse(anomalyQuery.data)
    : []

  const trends = trendQuery.data
    ? mapTrendResponse(trendQuery.data)
    : []

  // Combined loading and error states
  const isLoading = anomalyQuery.isLoading || trendQuery.isLoading
  const isError = anomalyQuery.isError || trendQuery.isError
  const error = anomalyQuery.error || trendQuery.error

  const refetch = () => {
    anomalyQuery.refetch()
    trendQuery.refetch()
  }

  return {
    anomalies,
    trends,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  }
}
