'use client'

import { memo } from 'react'

interface AILoadingIndicatorProps {
  stage?: 'analyzing' | 'generating' | 'optimizing' | string
  progress?: number
  message?: string
  className?: string
}

const STAGE_LABELS: Record<string, string> = {
  analyzing: '분석 중',
  generating: '생성 중',
  optimizing: '최적화 중'
}

/**
 * AILoadingIndicator Component
 *
 * AI-specific loading indicator with stage information and optional progress.
 * Shows a spinner animation with current processing stage.
 *
 * @param stage - Current processing stage
 * @param progress - Progress percentage (0-100)
 * @param message - Additional message to display
 * @param className - Additional CSS classes
 */
export const AILoadingIndicator = memo(function AILoadingIndicator({
  stage,
  progress,
  message,
  className = ''
}: AILoadingIndicatorProps) {
  const stageLabel = stage ? STAGE_LABELS[stage] || stage : 'AI 처리 중'

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 py-8 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={`${stageLabel}${progress !== undefined ? ` ${progress}%` : ''}`}
    >
      {/* Spinner */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
        <div
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"
          style={{ animationDuration: '1s' }}
        />
        <div
          className="absolute inset-2 rounded-full bg-primary/10 animate-pulse"
          style={{ animationDuration: '2s' }}
        />
      </div>

      {/* Stage Label */}
      <div className="text-center space-y-2">
        <p className="text-sm font-medium text-foreground">
          {stageLabel}
        </p>

        {/* Progress Bar */}
        {progress !== undefined && (
          <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        )}

        {/* Additional Message */}
        {message && (
          <p className="text-xs text-muted-foreground mt-2">
            {message}
          </p>
        )}
      </div>
    </div>
  )
})
