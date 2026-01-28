'use client'

import { BookOpen, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface EvidenceBadgeProps {
  confidence: 'high' | 'medium' | 'low'
  citationCount?: number
  domain?: string
  tooltip?: string
  className?: string
}

export function EvidenceBadge({
  confidence,
  citationCount,
  domain,
  tooltip,
  className,
}: EvidenceBadgeProps) {
  const config = {
    high: {
      label: '높은 신뢰도',
      className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-300',
      icon: CheckCircle2,
    },
    medium: {
      label: '보통 신뢰도',
      className: 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300',
      icon: TrendingUp,
    },
    low: {
      label: '낮은 신뢰도',
      className: 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300',
      icon: AlertCircle,
    },
  }

  const { label, className: variantClass, icon: Icon } = config[confidence]

  const tooltipText =
    tooltip ||
    `${label}${domain ? ` (${domain})` : ''}${citationCount ? ` - ${citationCount}개 근거` : ''}`

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'inline-flex items-center gap-1 text-xs px-2 py-0.5 font-medium',
              variantClass,
              className
            )}
          >
            <Icon className="h-3 w-3" aria-hidden="true" />
            <span>{label}</span>
            {citationCount !== undefined && citationCount > 0 && (
              <>
                <span className="mx-0.5" aria-hidden="true">·</span>
                <BookOpen className="h-3 w-3" aria-hidden="true" />
                <span className="font-semibold">{citationCount}</span>
              </>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface RecommendationCardProps {
  recommendation: string
  priority: 'high' | 'medium' | 'low'
  domain: string
  citationCount: number
  className?: string
}

export function RecommendationCard({
  recommendation,
  priority,
  domain,
  citationCount,
  className,
}: RecommendationCardProps) {
  const priorityConfig = {
    high: {
      label: '높음',
      borderClass: 'border-l-red-500',
      textClass: 'text-red-700',
    },
    medium: {
      label: '보통',
      borderClass: 'border-l-blue-500',
      textClass: 'text-blue-700',
    },
    low: {
      label: '낮음',
      borderClass: 'border-l-gray-500',
      textClass: 'text-gray-700',
    },
  }

  const { label: priorityLabel, borderClass, textClass } = priorityConfig[priority]

  return (
    <div
      className={cn(
        'rounded-lg border border-l-4 bg-card p-4 space-y-2',
        borderClass,
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm leading-relaxed flex-1">{recommendation}</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge
          variant="outline"
          className={cn('text-xs px-2 py-0.5 font-medium', textClass)}
        >
          우선순위: {priorityLabel}
        </Badge>
        <EvidenceBadge
          confidence={priority === 'high' ? 'high' : priority === 'medium' ? 'medium' : 'low'}
          citationCount={citationCount}
          domain={domain}
        />
      </div>
    </div>
  )
}
