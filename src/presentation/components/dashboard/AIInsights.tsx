'use client'

import { memo, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  TrendingUp,
  // TrendingDown,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

// ============================================================================
// Types
// ============================================================================

type InsightType = 'opportunity' | 'warning' | 'tip' | 'success'
type InsightPriority = 'critical' | 'high' | 'medium' | 'low'
type ActionVariant = 'primary' | 'secondary' | 'warning'

interface InsightAction {
  label: string
  href: string
  variant?: ActionVariant
}

interface Insight {
  id: string
  type: InsightType
  priority?: InsightPriority
  title: string
  description: string
  metric?: string
  currentValue?: number
  comparisonValue?: number
  changePercent?: number
  timeContext?: string
  action?: InsightAction
  campaignName?: string
}

interface AIInsightsProps {
  insights?: Insight[]
  isLoading?: boolean
  onRefresh?: () => void
  className?: string
}

// ============================================================================
// Config
// ============================================================================

const typeConfig: Record<InsightType, {
  icon: React.ComponentType<{ className?: string }>
  className: string
  darkClassName: string
}> = {
  opportunity: {
    icon: TrendingUp,
    className: 'bg-blue-50 border-blue-200 text-blue-700',
    darkClassName: 'dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300',
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-amber-50 border-amber-200 text-amber-700',
    darkClassName: 'dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300',
  },
  tip: {
    icon: Lightbulb,
    className: 'bg-purple-50 border-purple-200 text-purple-700',
    darkClassName: 'dark:bg-purple-950/30 dark:border-purple-800 dark:text-purple-300',
  },
  success: {
    icon: TrendingUp,
    className: 'bg-green-50 border-green-200 text-green-700',
    darkClassName: 'dark:bg-green-950/30 dark:border-green-800 dark:text-green-300',
  },
}

const priorityConfig: Record<InsightPriority, {
  label: string
  className: string
}> = {
  critical: {
    label: '긴급',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  },
  high: {
    label: '높음',
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
  },
  medium: {
    label: '보통',
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
  },
  low: {
    label: '낮음',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  },
}

const actionVariantConfig: Record<ActionVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  warning: 'bg-amber-500 text-white hover:bg-amber-600',
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatValue(value: number | undefined, metric?: string): string {
  if (value === undefined) return '-'

  if (metric === 'spend' || metric === 'revenue' || metric === 'cpa') {
    return `${value.toLocaleString()}원`
  }
  if (metric === 'roas') {
    return `${value.toFixed(2)}x`
  }
  if (metric === 'ctr' || metric === 'cvr') {
    return `${value.toFixed(2)}%`
  }
  return value.toLocaleString()
}

function formatChangePercent(change: number | undefined): string {
  if (change === undefined) return ''
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}%`
}

// ============================================================================
// Component
// ============================================================================

export const AIInsights = memo(function AIInsights({
  insights: providedInsights,
  isLoading = false,
  onRefresh,
  className,
}: AIInsightsProps) {
  const t = useTranslations('aiInsights')
  const insights = useMemo(() => providedInsights ?? [], [providedInsights])

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>{t('title')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-4 w-12 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
                <div className="mt-1 h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // 인사이트가 없을 때 빈 상태 표시
  if (insights.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>{t('title')}</CardTitle>
            </div>
            {onRefresh && (
              <Button variant="ghost" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">
              {t('empty')}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>{t('title')}</CardTitle>
            <Badge variant="secondary" className="ml-1 text-xs">
              {insights.length}
            </Badge>
          </div>
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh} className="h-8 w-8 p-0">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {insights.map((insight) => {
            const config = typeConfig[insight.type]
            const Icon = config.icon
            const priority = insight.priority ? priorityConfig[insight.priority] : null
            const hasChange = insight.changePercent !== undefined
            const isPositiveChange = (insight.changePercent ?? 0) >= 0

            return (
              <div
                key={insight.id}
                className={cn(
                  'rounded-lg border p-3 transition-all hover:shadow-sm',
                  config.className,
                  config.darkClassName
                )}
              >
                {/* Header: Priority + Time Context */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {priority && (
                      <Badge className={cn('text-[10px] px-1.5 py-0', priority.className)}>
                        {priority.label}
                      </Badge>
                    )}
                    {insight.campaignName && (
                      <span className="text-xs opacity-70 truncate max-w-[120px]">
                        {insight.campaignName}
                      </span>
                    )}
                  </div>
                  {insight.timeContext && (
                    <div className="flex items-center gap-1 text-xs opacity-60">
                      <Clock className="h-3 w-3" />
                      <span>{insight.timeContext}</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm leading-tight">{insight.title}</h4>
                    <p className="text-xs opacity-80 mt-1 line-clamp-2">{insight.description}</p>

                    {/* Metrics */}
                    {(insight.currentValue !== undefined || hasChange) && (
                      <div className="flex items-center gap-3 mt-2">
                        {insight.currentValue !== undefined && (
                          <span className="text-sm font-semibold">
                            {formatValue(insight.currentValue, insight.metric)}
                          </span>
                        )}
                        {hasChange && (
                          <span className={cn(
                            'flex items-center text-xs font-medium',
                            isPositiveChange ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          )}>
                            {isPositiveChange ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            {formatChangePercent(insight.changePercent)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action Button */}
                    {insight.action && (
                      <Button
                        size="sm"
                        className={cn(
                          'mt-2 h-7 text-xs',
                          insight.action.variant ? actionVariantConfig[insight.action.variant] : ''
                        )}
                        asChild
                      >
                        <Link href={insight.action.href}>
                          {insight.action.label}
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
})
