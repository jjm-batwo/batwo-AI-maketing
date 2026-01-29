'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  getContextDetectionEngine,
  getAISuggestionTiming,
  type UserContext,
  type ContextSignal
} from '@/application/services'
import { AISuggestionBubble } from './AISuggestionBubble'

/**
 * ContextualAIProvider
 *
 * Global provider that monitors user context and shows AI suggestions
 * at appropriate moments.
 *
 * Usage:
 * ```tsx
 * <ContextualAIProvider>
 *   <App />
 * </ContextualAIProvider>
 * ```
 */

export interface SuggestionMapping {
  text: string
  context: string
  action: () => void
}

export interface ContextualAIProviderProps {
  children: React.ReactNode
  enabled?: boolean
  customSuggestions?: Partial<Record<UserContext, SuggestionMapping>>
}

export function ContextualAIProvider({
  children,
  enabled = true,
  customSuggestions
}: ContextualAIProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [suggestion, setSuggestion] = useState<SuggestionMapping | null>(null)

  useEffect(() => {
    if (!enabled) return

    const engine = getContextDetectionEngine()
    const timing = getAISuggestionTiming()

    // Subscribe to context changes
    const unsubscribe = engine.onContextChange((context: ContextSignal) => {
      // Check if should suggest
      const { suggest } = engine.shouldSuggestAI()

      if (!suggest || !timing.canSuggestNow()) {
        return
      }

      // Don't show confidence below threshold
      if (!timing.shouldSuggestForConfidence(context.confidence)) {
        return
      }

      // Get suggestion for this context
      const suggestionData = getSuggestionForContext(context.type, router, customSuggestions)

      if (suggestionData) {
        setSuggestion(suggestionData)
        timing.recordSuggestion()
      }
    })

    // Track page navigation
    engine.trackAction('page_view', { path: pathname })

    return () => unsubscribe()
  }, [enabled, pathname, router, customSuggestions])

  // Track page duration on unmount
  useEffect(() => {
    if (!enabled) return

    const startTime = Date.now()
    const engine = getContextDetectionEngine()

    return () => {
      const duration = Date.now() - startTime
      engine.trackAction('page_exit', { duration })
    }
  }, [pathname, enabled])

  if (!enabled || !suggestion) {
    return <>{children}</>
  }

  return (
    <>
      {children}

      <AISuggestionBubble
        suggestion={suggestion.text}
        context={suggestion.context}
        onAccept={() => {
          const timing = getAISuggestionTiming()
          timing.recordResponse(true)
          suggestion.action()
          setSuggestion(null)
        }}
        onDismiss={() => {
          const timing = getAISuggestionTiming()
          timing.recordResponse(false)
          setSuggestion(null)
        }}
        position="bottom-right"
      />
    </>
  )
}

/**
 * Get suggestion for context type
 */
function getSuggestionForContext(
  contextType: UserContext,
  router: ReturnType<typeof useRouter>,
  customSuggestions?: Partial<Record<UserContext, SuggestionMapping>>
): SuggestionMapping | null {
  // Use custom suggestions if provided
  if (customSuggestions?.[contextType]) {
    return customSuggestions[contextType]!
  }

  // Default suggestions
  const defaultSuggestions: Partial<Record<UserContext, SuggestionMapping>> = {
    creating_campaign: {
      text: 'AI가 타겟팅과 예산을 추천해 드릴까요?',
      context: '캠페인 생성 중',
      action: () => router.push('/ai/targeting')
    },
    analyzing_metrics: {
      text: '성과 데이터를 AI가 심층 분석해 드릴까요?',
      context: '메트릭 분석 중',
      action: () => router.push('/ai/analysis')
    },
    writing_copy: {
      text: 'AI가 더 효과적인 광고 문구를 제안해 드릴까요?',
      context: '광고 문구 작성 중',
      action: () => router.push('/ai/copywriting')
    },
    reviewing_performance: {
      text: '주간 성과를 AI가 요약해 드릴까요?',
      context: '성과 검토 중',
      action: () => router.push('/reports/weekly')
    },
    stuck_on_task: {
      text: '도움이 필요하신가요? AI 어시스턴트에게 물어보세요.',
      context: '작업 진행 중',
      action: () => router.push('/ai/chat')
    }
  }

  return defaultSuggestions[contextType] || null
}

/**
 * Hook for tracking actions in components
 */
export function useContextTracking() {
  const engine = getContextDetectionEngine()

  const trackAction = (action: string, metadata?: Record<string, unknown>) => {
    engine.trackAction(action, metadata)
  }

  const getCurrentContext = () => {
    return engine.getCurrentContext()
  }

  const shouldSuggestAI = () => {
    return engine.shouldSuggestAI()
  }

  return {
    trackAction,
    getCurrentContext,
    shouldSuggestAI
  }
}

/**
 * Hook for suggestion timing
 */
export function useSuggestionTiming() {
  const timing = getAISuggestionTiming()

  return {
    canSuggestNow: () => timing.canSuggestNow(),
    recordSuggestion: () => timing.recordSuggestion(),
    recordResponse: (accepted: boolean) => timing.recordResponse(accepted),
    getStats: () => timing.getStats(),
    getTimeUntilNextSuggestion: () => timing.getTimeUntilNextSuggestion()
  }
}

/**
 * Hook for showing manual suggestions
 */
export function useManualSuggestion() {
  const [isShowing, setIsShowing] = useState(false)
  const timing = getAISuggestionTiming()

  const showSuggestion = () => {
    if (timing.canSuggestNow()) {
      setIsShowing(true)
      timing.recordSuggestion()
      return true
    }
    return false
  }

  const hideSuggestion = (accepted: boolean) => {
    timing.recordResponse(accepted)
    setIsShowing(false)
  }

  return {
    isShowing,
    showSuggestion,
    hideSuggestion
  }
}
