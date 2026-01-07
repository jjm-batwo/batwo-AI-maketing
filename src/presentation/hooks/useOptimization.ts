'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'

export interface OptimizationSuggestion {
  category: 'budget' | 'targeting' | 'creative' | 'timing'
  priority: 'high' | 'medium' | 'low'
  suggestion: string
  expectedImpact: string
  rationale: string
}

export interface OptimizationMetrics {
  roas: number
  cpa: number
  ctr: number
  impressions: number
  clicks: number
  conversions: number
  spend: number
}

export interface OptimizationResponse {
  campaignId: string
  campaignName: string
  suggestions: OptimizationSuggestion[]
  metrics: OptimizationMetrics
  remainingQuota: number
  generatedAt: string
}

async function fetchOptimization(campaignId: string): Promise<OptimizationResponse> {
  const response = await fetch(`/api/ai/optimization/${campaignId}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'AI 최적화 제안 조회에 실패했습니다')
  }

  return response.json()
}

export function useOptimization(campaignId: string, enabled = false) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['optimization', campaignId],
    queryFn: () => fetchOptimization(campaignId),
    enabled: enabled && !!campaignId,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    retry: false, // Don't retry on quota errors
  })

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['optimization', campaignId] })
    return query.refetch()
  }

  return {
    data: query.data,
    suggestions: query.data?.suggestions ?? [],
    metrics: query.data?.metrics,
    remainingQuota: query.data?.remainingQuota,
    generatedAt: query.data?.generatedAt,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch,
  }
}
