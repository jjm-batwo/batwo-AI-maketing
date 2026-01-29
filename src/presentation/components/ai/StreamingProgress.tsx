'use client'

import { memo } from 'react'

interface StreamingProgressProps {
  stage: string
  progress: number // 0-100
  stages?: string[] // e.g., ['분석', '생성', '최적화']
  className?: string
}

/**
 * StreamingProgress Component
 *
 * Progress bar with stage indicators.
 * Shows current progress and highlights the active stage.
 *
 * @param stage - Current stage name
 * @param progress - Progress percentage (0-100)
 * @param stages - Array of stage names to display as steps
 * @param className - Additional CSS classes
 */
export const StreamingProgress = memo(function StreamingProgress({
  stage,
  progress,
  stages = ['분석', '생성', '최적화'],
  className = ''
}: StreamingProgressProps) {
  const currentStageIndex = stages.findIndex((s) =>
    s.toLowerCase() === stage.toLowerCase() ||
    stage.toLowerCase().includes(s.toLowerCase())
  )

  const normalizedProgress = Math.min(100, Math.max(0, progress))

  return (
    <div className={`w-full space-y-4 ${className}`} role="progressbar" aria-valuenow={normalizedProgress} aria-valuemin={0} aria-valuemax={100}>
      {/* Stage Steps */}
      {stages.length > 0 && (
        <div className="flex justify-between items-center">
          {stages.map((stageName, index) => {
            const isActive = index === currentStageIndex
            const isCompleted = currentStageIndex > index

            return (
              <div
                key={stageName}
                className="flex flex-col items-center gap-2 flex-1"
              >
                {/* Step Indicator */}
                <div className="flex items-center w-full">
                  {/* Line Before (except first) */}
                  {index > 0 && (
                    <div className={`h-0.5 flex-1 transition-colors duration-500 ${
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    }`} />
                  )}

                  {/* Dot */}
                  <div
                    className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-500 ${
                      isActive
                        ? 'bg-primary ring-4 ring-primary/20 scale-110'
                        : isCompleted
                        ? 'bg-primary'
                        : 'bg-muted'
                    }`}
                    aria-current={isActive ? 'step' : undefined}
                  >
                    {isCompleted && !isActive && (
                      <svg
                        className="w-4 h-4 text-primary-foreground"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {isActive && (
                      <div className="w-3 h-3 bg-primary-foreground rounded-full animate-pulse" />
                    )}
                  </div>

                  {/* Line After (except last) */}
                  {index < stages.length - 1 && (
                    <div className={`h-0.5 flex-1 transition-colors duration-500 ${
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    }`} />
                  )}
                </div>

                {/* Stage Label */}
                <span
                  className={`text-xs font-medium transition-colors duration-300 ${
                    isActive
                      ? 'text-primary'
                      : isCompleted
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {stageName}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Progress Bar */}
      <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${normalizedProgress}%` }}
        >
          {/* Shimmer Effect */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
            style={{
              animation: 'shimmer 2s infinite',
              backgroundSize: '200% 100%'
            }}
          />
        </div>
      </div>

      {/* Progress Percentage */}
      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground">{stage}</span>
        <span className="font-medium text-foreground">{normalizedProgress}%</span>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  )
})
