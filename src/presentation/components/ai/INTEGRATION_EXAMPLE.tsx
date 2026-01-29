/**
 * Integration Examples for Contextual AI Suggestion System
 *
 * This file contains practical examples of how to integrate the
 * contextual AI suggestion system into your application.
 */

'use client'

import { useEffect } from 'react'
import {
  ContextualAIProvider,
  useContextTracking,
  CompactAISuggestion,
  useManualSuggestion,
  useSuggestionTiming
} from './index'

/**
 * Example 1: Global Provider
 *
 * Add to your root layout to enable contextual suggestions globally
 */
export function RootLayoutExample({ children }: { children: React.ReactNode }) {
  return (
    <ContextualAIProvider enabled={true}>
      {children}
    </ContextualAIProvider>
  )
}

/**
 * Example 2: Custom Suggestions
 *
 * Override default suggestions with custom ones
 */
export function CustomSuggestionsExample({ children }: { children: React.ReactNode }) {
  return (
    <ContextualAIProvider
      enabled={true}
      customSuggestions={{
        creating_campaign: {
          text: '맞춤형 타겟팅을 AI가 추천해 드립니다',
          context: '캠페인 설정 중',
          action: () => {
            // Custom action
            console.log('Opening custom targeting AI')
          }
        }
      }}
    >
      {children}
    </ContextualAIProvider>
  )
}

/**
 * Example 3: Track Actions in Campaign Form
 */
export function CampaignFormExample() {
  const { trackAction } = useContextTracking()

  useEffect(() => {
    // Track page view
    trackAction('view_campaign_creator')

    return () => {
      trackAction('exit_campaign_creator')
    }
  }, [trackAction])

  const handleNameChange = (name: string) => {
    trackAction('input_campaign_name', { valueChanged: name.length > 0 })
  }

  const handleBudgetChange = (budget: number) => {
    trackAction('input_budget', { valueChanged: true })
  }

  const handleSubmitError = (error: Error) => {
    trackAction('campaign_creation_error', { errorOccurred: true })
  }

  return (
    <form>
      <input
        type="text"
        placeholder="캠페인 이름"
        onChange={(e) => handleNameChange(e.target.value)}
      />
      <input
        type="number"
        placeholder="예산"
        onChange={(e) => handleBudgetChange(Number(e.target.value))}
      />
      {/* ... */}
    </form>
  )
}

/**
 * Example 4: Track Repeated Actions (Stuck Detection)
 */
export function MetricsDashboardExample() {
  const { trackAction } = useContextTracking()
  let viewCount = 0

  const handleViewMetric = (metricId: string) => {
    viewCount++
    trackAction('view_metric', {
      repeatCount: viewCount,
      metricId
    })
  }

  const handleRefresh = () => {
    trackAction('refresh_dashboard', {
      repeatCount: ++viewCount
    })
  }

  return (
    <div>
      <button onClick={handleRefresh}>새로고침</button>
      {/* Dashboard content */}
    </div>
  )
}

/**
 * Example 5: Manual Suggestion Trigger
 *
 * Show suggestion on demand (e.g., after user action)
 */
export function ManualSuggestionExample() {
  const { isShowing, showSuggestion, hideSuggestion } = useManualSuggestion()

  const handleComplexAction = () => {
    // After completing a complex action, suggest next steps
    showSuggestion()
  }

  return (
    <div>
      <button onClick={handleComplexAction}>
        복잡한 작업 완료
      </button>

      {isShowing && (
        <CompactAISuggestion
          suggestion="다음 단계를 AI가 도와드릴까요?"
          onAccept={() => {
            hideSuggestion(true)
            // Navigate to next step
          }}
          onDismiss={() => {
            hideSuggestion(false)
          }}
        />
      )}
    </div>
  )
}

/**
 * Example 6: Copy Editor with Context Tracking
 */
export function CopyEditorExample() {
  const { trackAction } = useContextTracking()
  let editCount = 0
  let lastValue = ''

  useEffect(() => {
    trackAction('view_copy_editor')
  }, [trackAction])

  const handleCopyChange = (value: string) => {
    editCount++
    trackAction('edit_copy', {
      repeatCount: editCount,
      valueChanged: value !== lastValue,
      duration: Date.now() // Track time spent
    })
    lastValue = value
  }

  return (
    <textarea
      placeholder="광고 문구 입력"
      onChange={(e) => handleCopyChange(e.target.value)}
    />
  )
}

/**
 * Example 7: Page Duration Tracking
 */
export function PageWithDurationTracking() {
  const { trackAction } = useContextTracking()

  useEffect(() => {
    const startTime = Date.now()
    trackAction('page_enter')

    return () => {
      const duration = Date.now() - startTime
      trackAction('page_exit', { duration })
    }
  }, [trackAction])

  return <div>{/* Page content */}</div>
}

/**
 * Example 8: Check Suggestion Stats
 */
export function SuggestionStatsExample() {
  const { getStats } = useSuggestionTiming()

  const handleViewStats = () => {
    const stats = getStats()
    console.log('Suggestion Stats:', {
      shown: stats.shown,
      accepted: stats.accepted,
      dismissed: stats.dismissed,
      acceptanceRate: `${(stats.acceptanceRate * 100).toFixed(1)}%`
    })
  }

  return (
    <button onClick={handleViewStats}>
      제안 통계 보기
    </button>
  )
}

/**
 * Example 9: Conditional Suggestion Display
 */
export function ConditionalSuggestionExample() {
  const { getCurrentContext, shouldSuggestAI } = useContextTracking()
  const { canSuggestNow } = useSuggestionTiming()

  const handleCheckSuggestion = () => {
    const context = getCurrentContext()
    const { suggest, reason } = shouldSuggestAI()
    const canShow = canSuggestNow()

    console.log({
      currentContext: context?.type,
      confidence: context?.confidence,
      shouldSuggest: suggest,
      reason,
      canShowNow: canShow
    })
  }

  return (
    <button onClick={handleCheckSuggestion}>
      제안 상태 확인
    </button>
  )
}

/**
 * Example 10: Complete Integration in Dashboard
 */
export function DashboardWithContextualAI() {
  const { trackAction } = useContextTracking()

  useEffect(() => {
    trackAction('view_dashboard')
  }, [trackAction])

  const handleViewReport = (reportId: string) => {
    trackAction('view_report', { reportId })
  }

  const handleAnalyzeMetrics = () => {
    trackAction('analyze_metrics')
  }

  const handleCreateCampaign = () => {
    trackAction('create_campaign')
  }

  return (
    <div className="dashboard">
      <h1>대시보드</h1>

      <button onClick={handleAnalyzeMetrics}>
        성과 분석
      </button>

      <button onClick={handleCreateCampaign}>
        새 캠페인
      </button>

      <div className="reports">
        {['weekly', 'monthly'].map((reportId) => (
          <button
            key={reportId}
            onClick={() => handleViewReport(reportId)}
          >
            {reportId} 보고서
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Example 11: Error Recovery Suggestion
 */
export function ErrorRecoveryExample() {
  const { trackAction } = useContextTracking()
  const { showSuggestion } = useManualSuggestion()

  const handleApiError = async () => {
    try {
      // API call that might fail
      await fetch('/api/campaign')
    } catch (error) {
      // Track error
      trackAction('api_error', {
        errorOccurred: true,
        errorType: 'network'
      })

      // Show recovery suggestion
      showSuggestion()
    }
  }

  return (
    <button onClick={handleApiError}>
      API 호출 (오류 테스트)
    </button>
  )
}

/**
 * Example 12: A/B Test Different Suggestions
 */
export function ABTestSuggestionsExample({ children }: { children: React.ReactNode }) {
  // Randomly assign users to variant A or B
  const variant = Math.random() > 0.5 ? 'A' : 'B'

  const customSuggestions = variant === 'A'
    ? {
        creating_campaign: {
          text: 'AI 추천으로 시작하세요', // Variant A
          context: '캠페인 생성',
          action: () => console.log('Variant A')
        }
      }
    : {
        creating_campaign: {
          text: '스마트 타겟팅을 경험해보세요', // Variant B
          context: '캠페인 생성',
          action: () => console.log('Variant B')
        }
      }

  return (
    <ContextualAIProvider customSuggestions={customSuggestions}>
      {children}
    </ContextualAIProvider>
  )
}
