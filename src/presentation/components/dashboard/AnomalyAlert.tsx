'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Bell,
  AlertCircle,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type AnomalyType = 'spike' | 'drop' | 'trend_change' | 'budget_anomaly'
type AnomalySeverity = 'critical' | 'warning' | 'info'

interface Anomaly {
  id: string
  campaignId: string
  campaignName: string
  type: AnomalyType
  severity: AnomalySeverity
  metric: string
  currentValue: number
  previousValue: number
  changePercent: number
  message: string
  detectedAt: string
}

interface AnomalyResponse {
  anomalies: Anomaly[]
  detectedAt: string
  count: number
  summary: {
    critical: number
    warning: number
    info: number
  }
}

const SEVERITY_CONFIG = {
  critical: {
    icon: AlertCircle,
    color: 'text-red-600 bg-red-50 border-red-200',
    badgeColor: 'bg-red-100 text-red-700 border-red-200',
    label: '긴급',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    badgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
    label: '주의',
  },
  info: {
    icon: Info,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
    label: '정보',
  },
}

const TYPE_ICON = {
  spike: TrendingUp,
  drop: TrendingDown,
  trend_change: TrendingUp,
  budget_anomaly: AlertTriangle,
}

async function fetchAnomalies(): Promise<AnomalyResponse> {
  const response = await fetch('/api/ai/anomalies')
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || '이상 탐지에 실패했습니다')
  }
  return response.json()
}

interface AnomalyAlertProps {
  className?: string
  maxItems?: number
}

export function AnomalyAlert({ className, maxItems = 5 }: AnomalyAlertProps) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['anomalies'],
    queryFn: fetchAnomalies,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 15, // Auto-refresh every 15 minutes
  })

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">이상 탐지</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg border p-4">
                <div className="mb-2 h-4 w-24 rounded bg-gray-200" />
                <div className="h-3 w-full rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const anomalies = data?.anomalies ?? []
  const displayedAnomalies = anomalies.slice(0, maxItems)
  const summary = data?.summary

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">이상 탐지</CardTitle>
            {summary && summary.critical > 0 && (
              <Badge variant="destructive" className="text-xs">
                {summary.critical}개 긴급
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            className="h-8 w-8"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            이상 탐지 중 오류가 발생했습니다.
          </div>
        )}

        {anomalies.length === 0 && !isError && (
          <div className="text-center py-4 text-muted-foreground">
            <Bell className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">현재 감지된 이상이 없습니다.</p>
            <p className="text-xs mt-1">캠페인이 정상적으로 운영되고 있습니다.</p>
          </div>
        )}

        {displayedAnomalies.map((anomaly) => {
          const severityConfig = SEVERITY_CONFIG[anomaly.severity]
          const TypeIcon = TYPE_ICON[anomaly.type]
          const SeverityIcon = severityConfig.icon

          return (
            <div
              key={anomaly.id}
              className={cn(
                'rounded-lg border p-4 transition-colors',
                severityConfig.color
              )}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  <SeverityIcon className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={cn('text-xs', severityConfig.badgeColor)}
                    >
                      {severityConfig.label}
                    </Badge>
                    <span className="text-xs text-current/70 truncate">
                      {anomaly.campaignName}
                    </span>
                  </div>
                  <p className="font-medium text-sm">{anomaly.message}</p>
                  <div className="flex items-center gap-2 text-xs text-current/70">
                    <TypeIcon className="h-3 w-3" />
                    <span>{anomaly.metric}</span>
                    <span
                      className={cn(
                        'font-medium',
                        anomaly.changePercent > 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      )}
                    >
                      {anomaly.changePercent > 0 ? '+' : ''}
                      {anomaly.changePercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {anomalies.length > maxItems && (
          <p className="text-center text-xs text-muted-foreground">
            +{anomalies.length - maxItems}개 더 있습니다
          </p>
        )}
      </CardContent>
    </Card>
  )
}
