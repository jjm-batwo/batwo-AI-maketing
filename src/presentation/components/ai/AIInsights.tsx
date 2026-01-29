'use client'

import { memo } from 'react'
import { useAIInsights } from '@/presentation/hooks/useAIInsights'
import { SkeletonAI } from './SkeletonAI'
import { AlertTriangle, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react'
import type { AnomalyInsightDTO, TrendInsightDTO } from '@application/dto/ai/AIInsightsDTO'

// ============================================================================
// Types
// ============================================================================

interface AIInsightsProps {
  campaignId?: string
  industry?: string
  enabled?: boolean
  refetchInterval?: number
  className?: string
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Confidence Indicator
 */
const ConfidenceIndicator = memo(function ConfidenceIndicator({
  confidence,
}: {
  confidence: number
}) {
  const percentage = Math.round(confidence * 100)
  const color =
    confidence >= 0.8 ? 'bg-green-500' :
    confidence >= 0.6 ? 'bg-yellow-500' :
    'bg-gray-400'

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{percentage}%</span>
    </div>
  )
})

/**
 * Anomaly Card
 */
const AnomalyCard = memo(function AnomalyCard({
  anomaly,
}: {
  anomaly: AnomalyInsightDTO
}) {
  const severityColors = {
    high: 'border-red-500 bg-red-50 dark:bg-red-950/20',
    medium: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
    low: 'border-blue-500 bg-blue-50 dark:bg-blue-950/20',
  }

  const severityTextColors = {
    high: 'text-red-700 dark:text-red-400',
    medium: 'text-yellow-700 dark:text-yellow-400',
    low: 'text-blue-700 dark:text-blue-400',
  }

  const severityLabels = {
    high: '높음',
    medium: '중간',
    low: '낮음',
  }

  return (
    <div
      className={`rounded-lg border-l-4 p-4 space-y-3 ${severityColors[anomaly.severity]}`}
      role="alert"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className={`w-5 h-5 ${severityTextColors[anomaly.severity]}`} />
          <div>
            <div className="font-semibold text-sm capitalize">
              {anomaly.metric}
            </div>
            <div className={`text-xs ${severityTextColors[anomaly.severity]}`}>
              심각도: {severityLabels[anomaly.severity]}
            </div>
          </div>
        </div>
        <ConfidenceIndicator confidence={anomaly.confidence} />
      </div>

      {/* Message */}
      <p className="text-sm text-foreground">{anomaly.message}</p>

      {/* Value and Range */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div>
          <span className="font-medium">현재:</span>{' '}
          {anomaly.value.toLocaleString()}
        </div>
        <div>
          <span className="font-medium">예상 범위:</span>{' '}
          {anomaly.expectedRange.min.toLocaleString()} -{' '}
          {anomaly.expectedRange.max.toLocaleString()}
        </div>
      </div>

      {/* Recommendation */}
      <div className="pt-2 border-t border-current/20">
        <div className="text-xs font-medium mb-1">권장 조치:</div>
        <p className="text-sm">{anomaly.recommendation}</p>
      </div>
    </div>
  )
})

/**
 * Trend Card
 */
const TrendCard = memo(function TrendCard({ trend }: { trend: TrendInsightDTO }) {
  const directionIcons = {
    up: TrendingUp,
    down: TrendingDown,
    stable: Minus,
  }

  const directionColors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    stable: 'text-gray-600 dark:text-gray-400',
  }

  const directionLabels = {
    up: '상승',
    down: '하락',
    stable: '안정',
  }

  const Icon = directionIcons[trend.direction]

  return (
    <div className="rounded-lg border border-muted bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${directionColors[trend.direction]}`} />
          <div>
            <div className="font-semibold text-sm capitalize">
              {trend.metric}
            </div>
            <div className={`text-xs ${directionColors[trend.direction]}`}>
              {directionLabels[trend.direction]}
              {trend.changePercent > 0 && ` (+${trend.changePercent}%)`}
            </div>
          </div>
        </div>
        <ConfidenceIndicator confidence={trend.confidence} />
      </div>

      {/* Message */}
      <p className="text-sm text-foreground">{trend.message}</p>

      {/* Period */}
      <div className="text-xs text-muted-foreground">
        <span className="font-medium">기간:</span> {trend.period}
      </div>
    </div>
  )
})

// ============================================================================
// Main Component
// ============================================================================

/**
 * AIInsights Component
 *
 * Displays AI-powered anomaly detection and trend insights
 */
export const AIInsights = memo(function AIInsights({
  campaignId,
  industry,
  enabled = true,
  refetchInterval,
  className = '',
}: AIInsightsProps) {
  const { anomalies, trends, isLoading, isError, error, refetch } = useAIInsights({
    campaignId,
    industry,
    enabled,
    refetchInterval,
  })

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">AI 인사이트</h3>
        </div>
        <SkeletonAI type="list" lines={3} />
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">AI 인사이트</h3>
          <button
            onClick={refetch}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="다시 로드"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-4 text-sm text-red-700 dark:text-red-400">
          <p className="font-medium mb-1">오류가 발생했습니다</p>
          <p className="text-xs">{error?.message || '인사이트를 불러올 수 없습니다.'}</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (anomalies.length === 0 && trends.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">AI 인사이트</h3>
          <button
            onClick={refetch}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="다시 로드"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="rounded-lg border border-muted bg-card p-6 text-center text-muted-foreground">
          <p className="text-sm">현재 특이사항이 없습니다.</p>
          <p className="text-xs mt-1">모든 캠페인이 정상 범위 내에서 운영되고 있습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">AI 인사이트</h3>
        <button
          onClick={refetch}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="다시 로드"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Anomalies Section */}
      {anomalies.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            이상 징후 ({anomalies.length})
          </h4>
          <div className="space-y-3">
            {anomalies.map((anomaly) => (
              <AnomalyCard key={anomaly.id} anomaly={anomaly} />
            ))}
          </div>
        </div>
      )}

      {/* Trends Section */}
      {trends.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            트렌드 예측 ({trends.length})
          </h4>
          <div className="space-y-3">
            {trends.map((trend) => (
              <TrendCard key={trend.id} trend={trend} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
})
