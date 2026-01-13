'use client'

import { useQuery } from '@tanstack/react-query'

export type AnomalyType = 'spike' | 'drop' | 'trend_change' | 'budget_anomaly'
export type AnomalySeverity = 'critical' | 'warning' | 'info'

export interface Alert {
  id: string
  campaignId: string
  campaignName: string
  type: AnomalyType
  severity: AnomalySeverity
  metric: string
  currentValue: number
  previousValue: number
  changePercent: number
  message: string
  detectedAt: string
}

export interface AlertsResponse {
  alerts: Alert[]
  count: number
}

const ALERTS_QUERY_KEY = ['alerts'] as const

async function fetchAlerts(): Promise<AlertsResponse> {
  const response = await fetch('/api/alerts')
  if (!response.ok) {
    throw new Error('알림을 불러오는데 실패했습니다')
  }
  return response.json()
}

/**
 * 사용자의 모든 알림 조회 훅
 */
export function useAlerts() {
  return useQuery({
    queryKey: ALERTS_QUERY_KEY,
    queryFn: fetchAlerts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  })
}

/**
 * 심각도별 알림 수 계산
 */
export function useAlertCounts() {
  const { data, ...rest } = useAlerts()

  const counts = {
    critical: data?.alerts.filter((a) => a.severity === 'critical').length ?? 0,
    warning: data?.alerts.filter((a) => a.severity === 'warning').length ?? 0,
    info: data?.alerts.filter((a) => a.severity === 'info').length ?? 0,
    total: data?.count ?? 0,
  }

  return { counts, ...rest }
}
