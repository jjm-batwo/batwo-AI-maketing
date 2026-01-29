'use client'

import { useEffect, useState } from 'react'
import { X, TrendingUp, AlertTriangle, Lightbulb, Target } from 'lucide-react'
import type { ProactiveInsight } from '@presentation/hooks/useProactiveInsights'
import type { AnalysisTaskType } from '@application/services/BackgroundAnalysisService'

// ============================================================================
// Types
// ============================================================================

interface AmbientInsightToastProps {
  insight: ProactiveInsight
  onDismiss: (id: string) => void
  onSeen?: (id: string) => void
}

// ============================================================================
// Component
// ============================================================================

/**
 * AmbientInsightToast
 *
 * Non-intrusive toast for ambient AI insights.
 * Features:
 * - Subtle slide-in animation from bottom-right
 * - Auto-dismisses after delay
 * - Shows confidence indicator
 * - Optional action button
 * - Doesn't block UI interaction
 *
 * @example
 * ```tsx
 * <AmbientInsightToast
 *   insight={insight}
 *   onDismiss={handleDismiss}
 * />
 * ```
 */
export function AmbientInsightToast({
  insight,
  onDismiss,
  onSeen,
}: AmbientInsightToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Animate in after mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Mark as seen when visible
  useEffect(() => {
    if (isVisible && onSeen && !insight.seenAt) {
      onSeen(insight.id)
    }
  }, [isVisible, onSeen, insight.id, insight.seenAt])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => onDismiss(insight.id), 300)
  }

  const config = getTypeConfig(insight.type)

  return (
    <div
      className={`
        fixed bottom-6 right-6 z-50
        w-[380px] max-w-[calc(100vw-3rem)]
        transition-all duration-300 ease-out
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
        ${isHovered ? 'scale-[1.02]' : 'scale-100'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="alert"
      aria-live="polite"
    >
      <div
        className={`
          relative rounded-lg shadow-lg border
          backdrop-blur-sm
          ${config.bgColor}
          ${config.borderColor}
        `}
      >
        {/* Confidence Indicator Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-t-lg overflow-hidden">
          <div
            className={`h-full ${config.confidenceColor} transition-all duration-1000`}
            style={{ width: `${insight.confidence}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-4 pt-5">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div
              className={`
                flex-shrink-0 w-10 h-10 rounded-full
                flex items-center justify-center
                ${config.iconBgColor}
              `}
            >
              <config.icon className={`w-5 h-5 ${config.iconColor}`} />
            </div>

            {/* Text Content */}
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                {insight.title}
              </h3>

              {/* Message */}
              <p className="text-sm text-gray-700 leading-relaxed">
                {insight.message}
              </p>

              {/* Confidence Badge */}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  신뢰도: {insight.confidence}%
                </span>
                {insight.confidence >= 85 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    높음
                  </span>
                )}
              </div>

              {/* Action Button */}
              {insight.action && (
                <button
                  onClick={() => {
                    insight.action?.onClick()
                    handleDismiss()
                  }}
                  className={`
                    mt-3 inline-flex items-center gap-1.5
                    text-sm font-medium rounded-md px-3 py-1.5
                    transition-colors
                    ${config.actionButtonClass}
                  `}
                >
                  {insight.action.label}
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Dismiss Button */}
            <button
              onClick={handleDismiss}
              className="
                flex-shrink-0 w-6 h-6 rounded-full
                flex items-center justify-center
                text-gray-400 hover:text-gray-600
                hover:bg-gray-100
                transition-colors
              "
              aria-label="알림 닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Pulse Animation on First Render */}
        {!insight.seenAt && (
          <div className="absolute inset-0 rounded-lg border-2 border-blue-400 animate-ping opacity-20 pointer-events-none" />
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Configuration
// ============================================================================

interface TypeConfig {
  icon: typeof TrendingUp
  bgColor: string
  borderColor: string
  iconBgColor: string
  iconColor: string
  confidenceColor: string
  actionButtonClass: string
}

function getTypeConfig(type: AnalysisTaskType): TypeConfig {
  const configs: Record<AnalysisTaskType, TypeConfig> = {
    anomaly: {
      icon: AlertTriangle,
      bgColor: 'bg-amber-50/95',
      borderColor: 'border-amber-200',
      iconBgColor: 'bg-amber-100',
      iconColor: 'text-amber-600',
      confidenceColor: 'bg-amber-500',
      actionButtonClass:
        'bg-amber-100 text-amber-700 hover:bg-amber-200',
    },
    trend: {
      icon: TrendingUp,
      bgColor: 'bg-blue-50/95',
      borderColor: 'border-blue-200',
      iconBgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      confidenceColor: 'bg-blue-500',
      actionButtonClass: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    },
    opportunity: {
      icon: Target,
      bgColor: 'bg-green-50/95',
      borderColor: 'border-green-200',
      iconBgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      confidenceColor: 'bg-green-500',
      actionButtonClass:
        'bg-green-100 text-green-700 hover:bg-green-200',
    },
    recommendation: {
      icon: Lightbulb,
      bgColor: 'bg-purple-50/95',
      borderColor: 'border-purple-200',
      iconBgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      confidenceColor: 'bg-purple-500',
      actionButtonClass:
        'bg-purple-100 text-purple-700 hover:bg-purple-200',
    },
  }

  return configs[type]
}
