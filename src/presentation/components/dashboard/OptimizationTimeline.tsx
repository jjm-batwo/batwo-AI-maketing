'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, PauseCircle, TrendingDown, Bell } from 'lucide-react'

interface OptimizationEvent {
  ruleId: string
  ruleName: string
  campaignId: string
  campaignName: string
  actionType: string
  estimatedSavings: { amount: number; currency: string }
  triggeredAt: string
}

interface OptimizationTimelineProps {
  events: OptimizationEvent[]
  isLoading?: boolean
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay === 1) return '어제'
  if (diffDay < 7) return `${diffDay}일 전`
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

interface ActionConfig {
  icon: React.ReactNode
  label: string
  badgeVariant: 'destructive' | 'default' | 'secondary' | 'outline'
  badgeClass: string
  dotClass: string
}

function getActionConfig(actionType: string): ActionConfig {
  switch (actionType) {
    case 'PAUSE_CAMPAIGN':
      return {
        icon: <PauseCircle className="h-3.5 w-3.5" aria-hidden="true" />,
        label: '캠페인 일시정지',
        badgeVariant: 'destructive',
        badgeClass: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200',
        dotClass: 'bg-red-500',
      }
    case 'REDUCE_BUDGET':
      return {
        icon: <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />,
        label: '예산 절감',
        badgeVariant: 'default',
        badgeClass:
          'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200',
        dotClass: 'bg-amber-500',
      }
    case 'ALERT_ONLY':
    default:
      return {
        icon: <Bell className="h-3.5 w-3.5" aria-hidden="true" />,
        label: '알림',
        badgeVariant: 'secondary',
        badgeClass:
          'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200',
        dotClass: 'bg-blue-500',
      }
  }
}

function formatAmount(amount: number): string {
  if (amount >= 10000) {
    return `₩${Math.round(amount / 10000).toLocaleString()}만원`
  }
  return `₩${amount.toLocaleString()}원`
}

export function OptimizationTimeline({ events, isLoading }: OptimizationTimelineProps) {
  if (isLoading) {
    return (
      <Card aria-label="최적화 이력 로딩 중">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">최적화 이력</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-3 w-3 rounded-full animate-pulse bg-muted mt-1 shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-3/4 animate-pulse bg-muted rounded" />
                <div className="h-3 w-1/2 animate-pulse bg-muted rounded" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card aria-label="최근 자동 최적화 이력">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">최적화 이력</CardTitle>
        <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">최근 최적화 이력이 없습니다</p>
          </div>
        ) : (
          <ol className="relative space-y-0" aria-label="최적화 실행 타임라인">
            {events.slice(0, 10).map((event, index) => {
              const config = getActionConfig(event.actionType)
              const isLast = index === events.slice(0, 10).length - 1
              return (
                <li key={`${event.ruleId}-${event.triggeredAt}`} className="flex gap-3 pb-4">
                  {/* 타임라인 도트 + 세로선 */}
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className={`h-2.5 w-2.5 rounded-full mt-1 ${config.dotClass}`}
                      aria-hidden="true"
                    />
                    {!isLast && (
                      <div className="w-px flex-1 bg-border mt-1" aria-hidden="true" />
                    )}
                  </div>

                  {/* 콘텐츠 */}
                  <div className="flex-1 min-w-0 pb-0.5">
                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                      <Badge
                        variant="outline"
                        className={`text-xs px-1.5 py-0 h-5 gap-1 ${config.badgeClass}`}
                      >
                        {config.icon}
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-xs font-medium text-foreground truncate">
                      {event.ruleName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{event.campaignName}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs text-emerald-600 font-medium">
                        절감 {formatAmount(event.estimatedSavings.amount)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {getRelativeTime(event.triggeredAt)}
                      </span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
