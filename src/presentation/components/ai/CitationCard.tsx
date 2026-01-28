'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { BookOpen, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Citation {
  source: string
  finding: string
  applicability: number
}

interface CitationCardProps {
  source: string
  finding: string
  applicability: number
  className?: string
}

interface CitationListProps {
  citations: Citation[]
  maxVisible?: number
  isLoading?: boolean
  className?: string
}

function getApplicabilityConfig(score: number) {
  if (score > 0.7) {
    return {
      label: '높음',
      color: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      barColor: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
    }
  }
  if (score >= 0.4) {
    return {
      label: '보통',
      color: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30',
      barColor: 'bg-gradient-to-r from-blue-500 to-blue-400',
    }
  }
  return {
    label: '낮음',
    color: 'bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30',
    barColor: 'bg-gradient-to-r from-gray-500 to-gray-400',
  }
}

export function CitationCard({ source, finding, applicability, className }: CitationCardProps) {
  const config = getApplicabilityConfig(applicability)

  return (
    <Card
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/20 dark:border-white/5',
        'bg-white/40 dark:bg-black/20 backdrop-blur-md',
        'transition-all duration-300 hover:shadow-lg hover:border-white/30 dark:hover:border-white/10',
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden="true" />
            <Badge
              variant="outline"
              className="font-medium border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300"
            >
              {source}
            </Badge>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={cn('font-semibold border', config.color)}
                >
                  {config.label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>적용 가능성: {Math.round(applicability * 100)}%</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
          {finding}
        </p>

        <div className="relative h-1.5 bg-gray-200/50 dark:bg-gray-700/30 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', config.barColor)}
            style={{ width: `${applicability * 100}%` }}
            role="progressbar"
            aria-valuenow={Math.round(applicability * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="적용 가능성 점수"
          />
        </div>
      </CardContent>
    </Card>
  )
}

export function CitationList({
  citations,
  maxVisible = 3,
  isLoading = false,
  className,
}: CitationListProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)} role="status" aria-label="인용 정보 로딩 중">
        {[...Array(3)].map((_, i) => (
          <Card
            key={i}
            className="relative overflow-hidden rounded-2xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-black/20 backdrop-blur-md animate-pulse"
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded" />
                <div className="h-5 w-32 bg-gray-300 dark:bg-gray-600 rounded" />
              </div>
              <div className="space-y-2 mb-3">
                <div className="h-4 w-full bg-gray-300 dark:bg-gray-600 rounded" />
                <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-600 rounded" />
              </div>
              <div className="h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!citations || citations.length === 0) {
    return (
      <Card
        className={cn(
          'relative overflow-hidden rounded-2xl border border-white/20 dark:border-white/5',
          'bg-white/40 dark:bg-black/20 backdrop-blur-md',
          className
        )}
      >
        <CardContent className="p-8 text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" aria-hidden="true" />
          <p className="text-sm text-gray-600 dark:text-gray-400">인용 정보가 없습니다</p>
        </CardContent>
      </Card>
    )
  }

  const visibleCitations = isExpanded ? citations : citations.slice(0, maxVisible)
  const hasMore = citations.length > maxVisible

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-violet-600 dark:text-violet-400" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            과학적 근거
          </h3>
        </div>
        <Badge
          variant="outline"
          className="font-semibold border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300"
        >
          {citations.length}개 인용
        </Badge>
      </div>

      <div className="space-y-3">
        {visibleCitations.map((citation, index) => (
          <CitationCard
            key={`${citation.source}-${index}`}
            source={citation.source}
            finding={citation.finding}
            applicability={citation.applicability}
          />
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'w-full py-3 rounded-xl',
            'border border-white/20 dark:border-white/5',
            'bg-white/40 dark:bg-black/20 backdrop-blur-md',
            'text-sm font-medium text-gray-700 dark:text-gray-300',
            'transition-all duration-300',
            'hover:bg-white/60 dark:hover:bg-black/30',
            'hover:border-white/30 dark:hover:border-white/10',
            'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2',
            'flex items-center justify-center gap-2'
          )}
          aria-expanded={isExpanded}
          aria-controls="citation-list"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
              <span>접기</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
              <span>더 보기 ({citations.length - maxVisible}개)</span>
            </>
          )}
        </button>
      )}
    </div>
  )
}
