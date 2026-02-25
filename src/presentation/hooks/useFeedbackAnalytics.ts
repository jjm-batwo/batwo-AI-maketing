'use client'

import { useState, useEffect } from 'react'

export interface FeedbackAnalyticsSummary {
  positive: number
  negative: number
  total: number
  positiveRate: number
}

export interface FeedbackTrendItem {
  period: string
  avgRating: number
  count: number
}

export interface RecentNegativeFeedback {
  id: string
  comment: string | null
  createdAt: Date
}

export interface FeedbackAnalyticsData {
  summary: FeedbackAnalyticsSummary
  trend: FeedbackTrendItem[]
  recentNegative: RecentNegativeFeedback[]
}

interface UseFeedbackAnalyticsOptions {
  period?: 'day' | 'week' | 'month'
  limit?: number
}

interface UseFeedbackAnalyticsResult {
  data: FeedbackAnalyticsData | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useFeedbackAnalytics(
  options: UseFeedbackAnalyticsOptions = {}
): UseFeedbackAnalyticsResult {
  const { period = 'week', limit = 5 } = options
  const [data, setData] = useState<FeedbackAnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchKey, setFetchKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function fetchAnalytics() {
      setIsLoading(true)
      setError(null)

      try {
        const url = `/api/ai/feedback/analytics?period=${period}&limit=${limit}`
        const response = await fetch(url)

        if (!response.ok) {
          const body = (await response.json()) as { error?: string }
          throw new Error(body.error ?? `HTTP ${response.status}`)
        }

        const json = (await response.json()) as {
          summary: FeedbackAnalyticsSummary
          trend: FeedbackTrendItem[]
          recentNegative: Array<{ id: string; comment: string | null; createdAt: string }>
        }

        if (!cancelled) {
          setData({
            summary: json.summary,
            trend: json.trend,
            recentNegative: json.recentNegative.map((item) => ({
              ...item,
              createdAt: new Date(item.createdAt),
            })),
          })
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '데이터를 불러오지 못했습니다')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void fetchAnalytics()

    return () => {
      cancelled = true
    }
  }, [period, limit, fetchKey])

  const refetch = () => setFetchKey((k) => k + 1)

  return { data, isLoading, error, refetch }
}
