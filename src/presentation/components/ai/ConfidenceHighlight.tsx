'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export interface SentenceConfidence {
  text: string
  confidence: number // 0-100
  evidence?: string
}

interface ConfidenceHighlightProps {
  sentences: SentenceConfidence[]
  showConfidence?: boolean
  onSentenceClick?: (sentence: SentenceConfidence) => void
  className?: string
}

export function ConfidenceHighlight({
  sentences,
  showConfidence = true,
  onSentenceClick,
  className,
}: ConfidenceHighlightProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Get confidence level for styling
  const getConfidenceStyle = (confidence: number) => {
    const normalizedConfidence = Math.min(Math.max(confidence, 0), 100)

    if (normalizedConfidence >= 85) {
      return {
        level: 'high',
        label: '높음',
        // Green highlight
        background:
          'bg-emerald-50/80 dark:bg-emerald-500/10 hover:bg-emerald-100/80 dark:hover:bg-emerald-500/20',
        border: 'border-b-2 border-emerald-500/30 hover:border-emerald-500/60',
        text: 'text-emerald-900 dark:text-emerald-100',
      }
    } else if (normalizedConfidence >= 60) {
      return {
        level: 'medium',
        label: '보통',
        // Yellow highlight
        background:
          'bg-amber-50/80 dark:bg-amber-500/10 hover:bg-amber-100/80 dark:hover:bg-amber-500/20',
        border: 'border-b-2 border-amber-500/30 hover:border-amber-500/60',
        text: 'text-amber-900 dark:text-amber-100',
      }
    } else {
      return {
        level: 'low',
        label: '낮음',
        // Red highlight
        background:
          'bg-red-50/80 dark:bg-red-500/10 hover:bg-red-100/80 dark:hover:bg-red-500/20',
        border: 'border-b-2 border-red-500/30 hover:border-red-500/60',
        text: 'text-red-900 dark:text-red-100',
      }
    }
  }

  return (
    <div className={cn('space-y-0.5', className)} role="article">
      <TooltipProvider delayDuration={300}>
        {sentences.map((sentence, index) => {
          const style = getConfidenceStyle(sentence.confidence)
          const isInteractive = !!onSentenceClick || !!sentence.evidence
          const isHovered = hoveredIndex === index

          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    'inline transition-all duration-200 rounded-sm px-0.5',
                    showConfidence && style.background,
                    showConfidence && style.border,
                    isInteractive && 'cursor-pointer',
                    isHovered && 'shadow-sm'
                  )}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => onSentenceClick?.(sentence)}
                  role={isInteractive ? 'button' : undefined}
                  tabIndex={isInteractive ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (
                      isInteractive &&
                      (e.key === 'Enter' || e.key === ' ')
                    ) {
                      e.preventDefault()
                      onSentenceClick?.(sentence)
                    }
                  }}
                  aria-label={
                    showConfidence
                      ? `신뢰도 ${style.label} ${sentence.confidence}%: ${sentence.text}`
                      : sentence.text
                  }
                >
                  {sentence.text}
                </span>
              </TooltipTrigger>
              {showConfidence && (
                <TooltipContent className="max-w-sm">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">
                        신뢰도: {sentence.confidence}%
                      </span>
                      <span
                        className={cn(
                          'text-xs px-1.5 py-0.5 rounded',
                          style.level === 'high' &&
                            'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
                          style.level === 'medium' &&
                            'bg-amber-500/20 text-amber-700 dark:text-amber-300',
                          style.level === 'low' &&
                            'bg-red-500/20 text-red-700 dark:text-red-300'
                        )}
                      >
                        {style.label}
                      </span>
                    </div>
                    {sentence.evidence && (
                      <p className="text-xs text-muted-foreground">
                        {sentence.evidence}
                      </p>
                    )}
                    {isInteractive && (
                      <p className="text-xs text-muted-foreground italic">
                        클릭하여 자세히 보기
                      </p>
                    )}
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          )
        })}
      </TooltipProvider>
    </div>
  )
}
