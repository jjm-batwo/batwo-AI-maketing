'use client'

import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'

interface ConfidenceIndicatorProps {
  confidence: number // 0-100
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CONFIG = {
  sm: {
    text: 'text-xs',
    icon: 'h-3 w-3',
    padding: 'px-2 py-0.5',
  },
  md: {
    text: 'text-sm',
    icon: 'h-3.5 w-3.5',
    padding: 'px-2.5 py-1',
  },
  lg: {
    text: 'text-base',
    icon: 'h-4 w-4',
    padding: 'px-3 py-1.5',
  },
}

export function ConfidenceIndicator({
  confidence,
  showPercentage = false,
  size = 'md',
  className,
}: ConfidenceIndicatorProps) {
  const normalizedConfidence = Math.min(Math.max(confidence, 0), 100)
  const config = SIZE_CONFIG[size]

  // Confidence level determination
  const getConfidenceLevel = (score: number) => {
    if (score >= 85) {
      return {
        level: 'high',
        label: '높음',
        className:
          'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
        icon: CheckCircle2,
        description: '신뢰도가 매우 높습니다. AI의 응답이 충분한 근거를 기반으로 합니다.',
      }
    } else if (score >= 60) {
      return {
        level: 'medium',
        label: '보통',
        className:
          'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
        icon: AlertTriangle,
        description: '보통 수준의 신뢰도입니다. 추가 검증이 필요할 수 있습니다.',
      }
    } else {
      return {
        level: 'low',
        label: '낮음',
        className:
          'bg-red-100 text-red-800 hover:bg-red-200 border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30',
        icon: XCircle,
        description: '신뢰도가 낮습니다. 이 응답을 참고용으로만 사용하세요.',
      }
    }
  }

  const confidenceInfo = getConfidenceLevel(normalizedConfidence)
  const Icon = confidenceInfo.icon

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'inline-flex items-center gap-1.5 font-medium transition-colors',
              confidenceInfo.className,
              config.text,
              config.padding,
              className
            )}
            role="status"
            aria-label={`신뢰도 ${confidenceInfo.label}${showPercentage ? ` ${normalizedConfidence}%` : ''}`}
          >
            <Icon className={cn(config.icon, 'flex-shrink-0')} aria-hidden="true" />
            <span className="font-semibold">{confidenceInfo.label}</span>
            {showPercentage && (
              <>
                <span className="mx-0.5 opacity-50" aria-hidden="true">
                  ·
                </span>
                <span className="tabular-nums">{normalizedConfidence}%</span>
              </>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold text-sm">
              신뢰도: {normalizedConfidence}%
            </p>
            <p className="text-xs text-muted-foreground">
              {confidenceInfo.description}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
