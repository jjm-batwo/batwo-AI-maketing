'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

type InsightType = 'opportunity' | 'warning' | 'tip' | 'success'
type InsightPriority = 'critical' | 'high' | 'medium' | 'low'

interface EnhancedInsight {
  id: string
  type: InsightType
  priority?: InsightPriority
  title: string
  description: string
  rootCause?: string
  recommendations?: string[]
  forecast?: {
    direction: 'improving' | 'declining' | 'stable'
    confidence: number
    reasoning: string
  }
  action?: {
    label: string
    href: string
  }
  campaignName?: string
  campaignId?: string
}

interface InsightDetailModalProps {
  insight: EnhancedInsight | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ============================================================================
// Config
// ============================================================================

const priorityConfig: Record<InsightPriority, { label: string; className: string }> = {
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
    className: 'bg-muted text-muted-foreground dark:bg-gray-800 dark:text-muted-foreground',
  },
}

const forecastDirectionConfig = {
  improving: {
    icon: TrendingUp,
    label: '상승 추세',
    className: 'text-green-600 dark:text-green-400',
  },
  declining: {
    icon: TrendingDown,
    label: '하락 추세',
    className: 'text-red-600 dark:text-red-400',
  },
  stable: {
    icon: Minus,
    label: '안정',
    className: 'text-muted-foreground',
  },
}

// ============================================================================
// Component
// ============================================================================

export function InsightDetailModal({ insight, open, onOpenChange }: InsightDetailModalProps) {
  if (!insight) return null

  const priorityCfg = insight.priority ? priorityConfig[insight.priority] : null
  const forecastCfg = insight.forecast ? forecastDirectionConfig[insight.forecast.direction] : null
  const ForecastIcon = forecastCfg?.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="insight-detail-modal"
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {priorityCfg && (
                  <Badge className={cn('text-[10px] px-1.5 py-0', priorityCfg.className)}>
                    {priorityCfg.label}
                  </Badge>
                )}
                {insight.campaignName && (
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {insight.campaignName}
                  </span>
                )}
              </div>
              <DialogTitle data-testid="insight-modal-title" className="text-base leading-snug">
                {insight.title}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-5">
          {/* Description */}
          <div>
            <p className="text-sm text-muted-foreground leading-relaxed">{insight.description}</p>
          </div>

          {/* Root Cause */}
          {insight.rootCause && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-foreground">🔍 원인 분석</h4>
              <p className="text-sm text-muted-foreground leading-relaxed bg-muted/40 rounded-md p-3">
                {insight.rootCause}
              </p>
            </div>
          )}

          {/* Recommendations */}
          {insight.recommendations && insight.recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-foreground">💡 개선 방안</h4>
              <ol className="space-y-2">
                {insight.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <span className="flex-shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Forecast */}
          {insight.forecast && forecastCfg && ForecastIcon && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-foreground">📈 전망</h4>
              <div className="bg-muted/40 rounded-md p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <ForecastIcon className={cn('h-4 w-4 flex-shrink-0', forecastCfg.className)} />
                  <span className={cn('text-sm font-medium', forecastCfg.className)}>
                    {forecastCfg.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (신뢰도 {insight.forecast.confidence}%)
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {insight.forecast.reasoning}
                </p>
              </div>
            </div>
          )}

          {/* Action Button */}
          {insight.action && (
            <div className="pt-2">
              <Button className="w-full" asChild>
                <Link href={insight.action.href} data-testid="insight-modal-close">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {insight.action.label}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
