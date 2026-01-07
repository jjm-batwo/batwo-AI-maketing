'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, RefreshCw, Loader2, TrendingUp, Target, Palette, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOptimization, type OptimizationSuggestion } from '@/presentation/hooks/useOptimization'

interface OptimizationPanelProps {
  campaignId: string
  className?: string
}

const CATEGORY_CONFIG = {
  budget: {
    icon: TrendingUp,
    label: '예산',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  targeting: {
    icon: Target,
    label: '타겟팅',
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
  creative: {
    icon: Palette,
    label: '크리에이티브',
    color: 'text-pink-600 bg-pink-50 border-pink-200',
  },
  timing: {
    icon: Clock,
    label: '타이밍',
    color: 'text-orange-600 bg-orange-50 border-orange-200',
  },
}

const PRIORITY_CONFIG = {
  high: { label: '높음', color: 'bg-red-100 text-red-700 border-red-200' },
  medium: { label: '보통', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  low: { label: '낮음', color: 'bg-green-100 text-green-700 border-green-200' },
}

function SuggestionCard({ suggestion }: { suggestion: OptimizationSuggestion }) {
  const [expanded, setExpanded] = useState(false)
  const categoryConfig = CATEGORY_CONFIG[suggestion.category]
  const priorityConfig = PRIORITY_CONFIG[suggestion.priority]
  const Icon = categoryConfig.icon

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-all',
        categoryConfig.color,
        'cursor-pointer hover:shadow-sm'
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn('text-xs', priorityConfig.color)}>
              우선순위: {priorityConfig.label}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {categoryConfig.label}
            </Badge>
          </div>
          <p className="font-medium">{suggestion.suggestion}</p>
          <p className="text-sm opacity-80">
            예상 효과: {suggestion.expectedImpact}
          </p>
          {expanded && (
            <div className="mt-3 pt-3 border-t border-current/20">
              <p className="text-sm opacity-70">
                <span className="font-medium">근거: </span>
                {suggestion.rationale}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function OptimizationPanel({ campaignId, className }: OptimizationPanelProps) {
  const [enabled, setEnabled] = useState(false)
  const {
    suggestions,
    remainingQuota,
    generatedAt,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useOptimization(campaignId, enabled)

  const handleAnalyze = () => {
    if (!enabled) {
      setEnabled(true)
    } else {
      refetch()
    }
  }

  const sortedSuggestions = [...suggestions].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">AI 최적화 제안</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {remainingQuota !== undefined && (
              <Badge variant="outline" className="text-xs">
                남은 분석: {remainingQuota}/5
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Analysis Button */}
        <div className="flex items-center justify-between">
          <Button
            onClick={handleAnalyze}
            disabled={isLoading || isFetching}
            size="sm"
          >
            {isLoading || isFetching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                분석 중...
              </>
            ) : suggestions.length > 0 ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                다시 분석
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                최적화 분석
              </>
            )}
          </Button>
          {generatedAt && (
            <span className="text-xs text-muted-foreground">
              마지막 분석: {new Date(generatedAt).toLocaleString('ko-KR')}
            </span>
          )}
        </div>

        {/* Error State */}
        {isError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error?.message || 'AI 분석에 실패했습니다'}
          </div>
        )}

        {/* Empty State */}
        {!enabled && suggestions.length === 0 && !isError && (
          <p className="text-sm text-muted-foreground">
            &quot;최적화 분석&quot; 버튼을 클릭하면 AI가 캠페인 성과를 분석하고 개선 방안을 제안합니다.
          </p>
        )}

        {/* Suggestions List */}
        {sortedSuggestions.length > 0 && (
          <div className="space-y-3">
            {sortedSuggestions.map((suggestion, index) => (
              <SuggestionCard key={index} suggestion={suggestion} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
