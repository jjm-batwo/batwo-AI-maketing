'use client'

import { memo } from 'react'

interface SkeletonAIProps {
  type?: 'text' | 'card' | 'list'
  lines?: number
  className?: string
}

/**
 * SkeletonAI Component
 *
 * AI-specific skeleton loader with shimmer animation.
 * Used as a placeholder while AI content is loading.
 *
 * @param type - Type of skeleton layout ('text', 'card', 'list')
 * @param lines - Number of lines for text skeleton
 * @param className - Additional CSS classes
 */
export const SkeletonAI = memo(function SkeletonAI({
  type = 'text',
  lines = 3,
  className = ''
}: SkeletonAIProps) {
  if (type === 'card') {
    return (
      <div
        className={`rounded-lg border border-muted bg-card p-6 space-y-4 ${className}`}
        role="status"
        aria-label="AI 콘텐츠 로딩 중"
      >
        {/* Header */}
        <div className="space-y-3">
          <div className="h-4 w-24 bg-gradient-to-r from-muted via-muted/50 to-muted rounded animate-shimmer" />
          <div className="h-6 w-3/4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded animate-shimmer" />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <div className="h-4 w-full bg-gradient-to-r from-muted via-muted/50 to-muted rounded animate-shimmer" />
          <div className="h-4 w-5/6 bg-gradient-to-r from-muted via-muted/50 to-muted rounded animate-shimmer" />
          <div className="h-4 w-4/6 bg-gradient-to-r from-muted via-muted/50 to-muted rounded animate-shimmer" />
        </div>

        {/* Footer */}
        <div className="flex gap-2 pt-2">
          <div className="h-8 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted rounded animate-shimmer" />
          <div className="h-8 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted rounded animate-shimmer" />
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
          .animate-shimmer {
            background-size: 200% 100%;
            animation: shimmer 2s ease-in-out infinite;
          }
        `}</style>
      </div>
    )
  }

  if (type === 'list') {
    return (
      <div
        className={`space-y-3 ${className}`}
        role="status"
        aria-label="AI 목록 로딩 중"
      >
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 rounded-lg border border-muted bg-card"
          >
            {/* Icon */}
            <div className="w-10 h-10 rounded bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer flex-shrink-0" />

            {/* Content */}
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 bg-gradient-to-r from-muted via-muted/50 to-muted rounded animate-shimmer" />
              <div className="h-3 w-2/3 bg-gradient-to-r from-muted via-muted/50 to-muted rounded animate-shimmer" />
            </div>

            {/* Action */}
            <div className="w-16 h-8 bg-gradient-to-r from-muted via-muted/50 to-muted rounded animate-shimmer flex-shrink-0" />
          </div>
        ))}

        <style jsx>{`
          @keyframes shimmer {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
          .animate-shimmer {
            background-size: 200% 100%;
            animation: shimmer 2s ease-in-out infinite;
          }
        `}</style>
      </div>
    )
  }

  // Default: text skeleton
  return (
    <div
      className={`space-y-3 ${className}`}
      role="status"
      aria-label="AI 텍스트 로딩 중"
    >
      {Array.from({ length: lines }).map((_, index) => {
        // Vary the width for a more natural look
        const widthClass =
          index === lines - 1 ? 'w-3/4' :
          index % 3 === 0 ? 'w-full' :
          index % 3 === 1 ? 'w-11/12' :
          'w-5/6'

        return (
          <div
            key={index}
            className={`h-4 ${widthClass} bg-gradient-to-r from-muted via-muted/50 to-muted rounded animate-shimmer`}
          />
        )
      })}

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .animate-shimmer {
          background-size: 200% 100%;
          animation: shimmer 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
})
