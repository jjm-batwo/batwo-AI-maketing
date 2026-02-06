'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUIStore } from '@/presentation/stores/uiStore'

// ============================================================================
// Agent Alert Types (새 API - Proactive Alerts)
// ============================================================================

interface AlertItem {
  id: string
  type: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  title: string
  message: string
  status: string
  data: Record<string, unknown> | null
  createdAt: string
}

interface UseAlertsReturn {
  alerts: AlertItem[]
  unreadCount: number
  isLoading: boolean
  dismissAlert: (id: string) => Promise<void>
  markAsRead: (id: string) => Promise<void>
  refresh: () => Promise<void>
  // Legacy API compatibility
  data?: AlertsResponse
}

// ============================================================================
// Legacy Alert Types (기존 API - NotificationCenter 호환성)
// ============================================================================

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

export function useAlerts(pollingInterval = 60000): UseAlertsReturn {
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const setUnreadAlertCount = useUIStore((s) => s.setUnreadAlertCount)

  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/agent/alerts?status=UNREAD&limit=10')
      if (!response.ok) return

      const data = await response.json()
      setAlerts(data.alerts ?? [])
      setUnreadCount(data.unreadCount ?? 0)
      setUnreadAlertCount(data.unreadCount ?? 0)
    } catch {
      // 폴링 실패는 조용히 무시
    } finally {
      setIsLoading(false)
    }
  }, [setUnreadAlertCount])

  // 초기 로드 + 폴링
  useEffect(() => {
    fetchAlerts()
    const interval = setInterval(fetchAlerts, pollingInterval)
    return () => clearInterval(interval)
  }, [fetchAlerts, pollingInterval])

  const dismissAlert = useCallback(async (id: string) => {
    await fetch(`/api/agent/alerts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DISMISSED' }),
    })
    setAlerts((prev) => prev.filter((a) => a.id !== id))
    setUnreadCount((prev) => Math.max(0, prev - 1))
    setUnreadAlertCount(Math.max(0, unreadCount - 1))
  }, [unreadCount, setUnreadAlertCount])

  const markAsRead = useCallback(async (id: string) => {
    await fetch(`/api/agent/alerts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'READ' }),
    })
    setAlerts((prev) => prev.filter((a) => a.id !== id))
    setUnreadCount((prev) => Math.max(0, prev - 1))
    setUnreadAlertCount(Math.max(0, unreadCount - 1))
  }, [unreadCount, setUnreadAlertCount])

  return {
    alerts,
    unreadCount,
    isLoading,
    dismissAlert,
    markAsRead,
    refresh: fetchAlerts,
    // Legacy API 호환성 (NotificationCenter)
    data: { alerts: [], count: 0 } as AlertsResponse,
  }
}
