'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type {
  AnalysisResult,
  AnalysisTaskType,
  TaskPriority,
} from '@application/services/BackgroundAnalysisService'
import { BackgroundAnalysisService } from '@application/services/BackgroundAnalysisService'

// ============================================================================
// Types
// ============================================================================

export interface ProactiveInsight {
  id: string
  type: AnalysisTaskType
  title: string
  message: string
  confidence: number
  action?: {
    label: string
    onClick: () => void
  }
  dismissedAt?: Date
  seenAt?: Date
  createdAt: Date
}

interface UseProactiveInsightsOptions {
  /**
   * Maximum number of insights to show at once
   * @default 3
   */
  maxVisible?: number

  /**
   * Minimum confidence threshold (0-100)
   * @default 70
   */
  minConfidence?: number

  /**
   * Auto-dismiss insights after N milliseconds
   * @default 30000 (30 seconds)
   */
  autoDismissDelay?: number

  /**
   * Enable auto-dismiss
   * @default true
   */
  enableAutoDismiss?: boolean
}

interface UseProactiveInsightsResult {
  insights: ProactiveInsight[]
  dismiss: (id: string) => void
  markSeen: (id: string) => void
  clearAll: () => void
  queueTask: (
    type: AnalysisTaskType,
    context: Record<string, unknown>,
    priority?: TaskPriority
  ) => void
}

// ============================================================================
// Singleton Service Instance
// ============================================================================

let serviceInstance: BackgroundAnalysisService | null = null

function getServiceInstance(): BackgroundAnalysisService {
  if (!serviceInstance) {
    serviceInstance = new BackgroundAnalysisService()
  }
  return serviceInstance
}

// ============================================================================
// Hook
// ============================================================================

/**
 * useProactiveInsights Hook
 *
 * Manages ambient AI insights that appear automatically without user action.
 * Insights are non-intrusive, prioritized by confidence, and auto-dismiss.
 *
 * @param options - Configuration options
 * @returns Insights and control functions
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { insights, dismiss, queueTask } = useProactiveInsights({
 *     maxVisible: 2,
 *     minConfidence: 75
 *   })
 *
 *   // Queue analysis task
 *   useEffect(() => {
 *     queueTask('anomaly', { campaignId: '123', metric: 'ctr' }, 'high')
 *   }, [])
 *
 *   return (
 *     <>
 *       {insights.map(insight => (
 *         <InsightToast key={insight.id} {...insight} onDismiss={dismiss} />
 *       ))}
 *     </>
 *   )
 * }
 * ```
 */
export function useProactiveInsights(
  options: UseProactiveInsightsOptions = {}
): UseProactiveInsightsResult {
  const {
    maxVisible = 3,
    minConfidence = 70,
    autoDismissDelay = 30000,
    enableAutoDismiss = true,
  } = options

  const [insights, setInsights] = useState<ProactiveInsight[]>([])
  const autoDismissTimers = useRef<Map<string, NodeJS.Timeout>>(new Map())

  /**
   * Transform AnalysisResult to ProactiveInsight
   */
  const transformResult = useCallback(
    (result: AnalysisResult): ProactiveInsight | null => {
      // Filter by confidence
      if (result.confidence < minConfidence) {
        return null
      }

      return {
        id: result.taskId,
        type: result.type,
        title: getTitleForType(result.type),
        message: result.insight,
        confidence: result.confidence,
        action: result.actionable
          ? {
              label: result.suggestedAction?.label || '자세히 보기',
              onClick: () => handleAction(result),
            }
          : undefined,
        createdAt: result.createdAt,
      }
    },
    [minConfidence]
  )

  /**
   * Handle action click
   */
  const handleAction = (result: AnalysisResult) => {
    if (result.suggestedAction?.url) {
      window.location.href = result.suggestedAction.url
    } else if (result.suggestedAction?.handler) {
      // Custom handler logic could be implemented here
      console.log('Custom handler:', result.suggestedAction.handler)
    }
  }

  /**
   * Subscribe to service results
   */
  useEffect(() => {
    const service = getServiceInstance()

    const unsubscribe = service.onResult((result) => {
      const insight = transformResult(result)
      if (!insight) return

      setInsights((prev) => {
        // Prevent duplicates
        if (prev.some((i) => i.id === insight.id)) {
          return prev
        }

        // Add new insight and limit to maxVisible
        const updated = [insight, ...prev].slice(0, maxVisible)
        return updated
      })

      // Setup auto-dismiss timer
      if (enableAutoDismiss) {
        const timer = setTimeout(() => {
          dismiss(insight.id)
        }, autoDismissDelay)

        autoDismissTimers.current.set(insight.id, timer)
      }
    })

    return () => {
      unsubscribe()

      // Clear all timers
      autoDismissTimers.current.forEach((timer) => clearTimeout(timer))
      autoDismissTimers.current.clear()
    }
  }, [
    transformResult,
    maxVisible,
    enableAutoDismiss,
    autoDismissDelay,
  ])

  /**
   * Dismiss an insight
   */
  const dismiss = useCallback((id: string) => {
    setInsights((prev) =>
      prev.map((insight) =>
        insight.id === id
          ? { ...insight, dismissedAt: new Date() }
          : insight
      )
    )

    // Remove after animation
    setTimeout(() => {
      setInsights((prev) => prev.filter((insight) => insight.id !== id))
    }, 300)

    // Clear auto-dismiss timer
    const timer = autoDismissTimers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      autoDismissTimers.current.delete(id)
    }
  }, [])

  /**
   * Mark an insight as seen
   */
  const markSeen = useCallback((id: string) => {
    setInsights((prev) =>
      prev.map((insight) =>
        insight.id === id
          ? { ...insight, seenAt: new Date() }
          : insight
      )
    )
  }, [])

  /**
   * Clear all insights
   */
  const clearAll = useCallback(() => {
    setInsights((prev) =>
      prev.map((insight) => ({ ...insight, dismissedAt: new Date() }))
    )

    setTimeout(() => {
      setInsights([])
    }, 300)

    // Clear all timers
    autoDismissTimers.current.forEach((timer) => clearTimeout(timer))
    autoDismissTimers.current.clear()
  }, [])

  /**
   * Queue an analysis task
   */
  const queueTask = useCallback(
    (
      type: AnalysisTaskType,
      context: Record<string, unknown>,
      priority: TaskPriority = 'medium'
    ) => {
      const service = getServiceInstance()
      service.queueTask({ type, context, priority })
    },
    []
  )

  // Filter out dismissed insights
  const visibleInsights = insights.filter((i) => !i.dismissedAt)

  return {
    insights: visibleInsights,
    dismiss,
    markSeen,
    clearAll,
    queueTask,
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function getTitleForType(type: AnalysisTaskType): string {
  const titles: Record<AnalysisTaskType, string> = {
    anomaly: '이상 징후 감지',
    trend: '트렌드 분석',
    opportunity: '기회 발견',
    recommendation: 'AI 추천',
  }
  return titles[type]
}
