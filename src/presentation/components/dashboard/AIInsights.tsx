'use client'

import { memo, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

type InsightType = 'opportunity' | 'warning' | 'tip' | 'success'

interface Insight {
  id: string
  type: InsightType
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
}

interface AIInsightsProps {
  insights?: Insight[]
  isLoading?: boolean
  onRefresh?: () => void
  className?: string
}

const typeConfig: Record<InsightType, { icon: React.ComponentType<{ className?: string }>; className: string }> = {
  opportunity: {
    icon: TrendingUp,
    className: 'bg-blue-50 border-blue-200 text-blue-700',
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-amber-50 border-amber-200 text-amber-700',
  },
  tip: {
    icon: Lightbulb,
    className: 'bg-purple-50 border-purple-200 text-purple-700',
  },
  success: {
    icon: TrendingUp,
    className: 'bg-green-50 border-green-200 text-green-700',
  },
}


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
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg border p-4">
                <div className="mb-2 h-4 w-32 rounded bg-gray-200" />
                <div className="h-3 w-full rounded bg-gray-200" />
                <div className="mt-1 h-3 w-3/4 rounded bg-gray-200" />
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
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>{t('title')}</CardTitle>
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
        <div className="space-y-4">
          {insights.map((insight) => {
            const config = typeConfig[insight.type]
            const Icon = config.icon
            return (
              <div
                key={insight.id}
                className={cn(
                  'rounded-lg border p-4 transition-colors hover:bg-opacity-80',
                  config.className
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <h4 className="font-medium">{insight.title}</h4>
                    <p className="text-sm opacity-90">{insight.description}</p>
                    {insight.action && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-current underline"
                        asChild
                      >
                        <a href={insight.action.href}>{insight.action.label} →</a>
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
