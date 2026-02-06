'use client'

import { useQuery } from '@tanstack/react-query'

// ============================================================================
// Types
// ============================================================================

export interface ActionButton {
  label: string
  href: string
  variant: 'primary' | 'secondary' | 'warning'
}

export interface KPIInsightDTO {
  id: string
  type: 'opportunity' | 'warning' | 'tip' | 'success'
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  metric?: string
  currentValue?: number
  comparisonValue?: number
  changePercent?: number
  timeContext?: string
  action?: ActionButton
  campaignId?: string
  campaignName?: string
}

interface KPIInsightsResponse {
  success: boolean
  insights: KPIInsightDTO[]
  summary: {
    critical: number
    high: number
    medium: number
    low: number
    total: number
  }
  generatedAt: string
}

interface UseKPIInsightsOptions {
  enabled?: boolean
  refetchInterval?: number
}

interface UseKPIInsightsResult {
  insights: KPIInsightDTO[]
  summary: KPIInsightsResponse['summary'] | null
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

// ============================================================================
// Fetch Function
// ============================================================================

async function fetchKPIInsights(): Promise<KPIInsightsResponse> {
  const response = await fetch('/api/ai/kpi-insights')

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'KPI 인사이트 조회에 실패했습니다',
    }))
    throw new Error(error.message || 'KPI 인사이트 조회에 실패했습니다')
  }

  return response.json()
}

// ============================================================================
// Hook
// ============================================================================

/**
 * useKPIInsights Hook
 *
 * 실시간 KPI 기반 인사이트를 가져옵니다.
 * 시간 인지적 비교와 액션 가능한 인사이트를 제공합니다.
 *
 * @param options - 설정 옵션
 * @returns 인사이트 데이터와 상태
 */
export function useKPIInsights(options: UseKPIInsightsOptions = {}): UseKPIInsightsResult {
  const { enabled = true, refetchInterval = 0 } = options

  const query = useQuery({
    queryKey: ['kpi-insights'],
    queryFn: fetchKPIInsights,
    enabled,
    refetchInterval,
    staleTime: 1000 * 60 * 2, // 2분
    gcTime: 1000 * 60 * 10, // 10분
    retry: 1,
  })

  return {
    insights: query.data?.insights ?? [],
    summary: query.data?.summary ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: () => query.refetch(),
  }
}
