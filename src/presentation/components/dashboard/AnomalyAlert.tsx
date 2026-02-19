'use client'

import { useState, ReactNode } from 'react'
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
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Target,
  Activity,
  HelpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Simple Collapsible Component (inline implementation)
function SimpleCollapsible({
  open,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}) {
  return <div data-state={open ? 'open' : 'closed'}>{children}</div>
}

function SimpleCollapsibleTrigger({
  onClick,
  className,
  children,
}: {
  onClick: () => void
  className?: string
  children: ReactNode
}) {
  return (
    <button type="button" onClick={onClick} className={cn('cursor-pointer', className)}>
      {children}
    </button>
  )
}

function SimpleCollapsibleContent({
  open,
  className,
  children,
}: {
  open: boolean
  className?: string
  children: ReactNode
}) {
  if (!open) return null
  return <div className={className}>{children}</div>
}

// ============================================
// Types
// ============================================

type AnomalyType = 'spike' | 'drop' | 'trend_reversal' | 'budget_anomaly' | 'performance_degradation' | 'unusual_pattern'
type AnomalySeverity = 'critical' | 'warning' | 'info'
type CauseCategory = 'external' | 'internal' | 'technical' | 'market'

interface RecommendedAction {
  id: string
  action: string
  priority: 'high' | 'medium' | 'low'
  timeframe: string
}

interface PossibleCause {
  id: string
  category: CauseCategory
  name: string
  description: string
  probability: number
  confidence: 'high' | 'medium' | 'low'
  evidence: string[]
  actions: RecommendedAction[]
}

interface RootCauseAnalysis {
  possibleCauses: PossibleCause[]
  primaryCause: PossibleCause | null
  confidenceLevel: number
  analysisNote: string
}

interface StatisticalBaseline {
  mean: number
  stdDev: number
  median: number
  percentile95: number
}

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
  confidence?: number
  baseline?: StatisticalBaseline
  detectionMethods?: string[]
  rootCauseAnalysis?: RootCauseAnalysis
}

interface AnomalyResponse {
  anomalies: Anomaly[]
  detectedAt: string
  count: number
  summary: {
    critical: number
    warning: number
    info: number
    byType?: Record<string, number>
  }
  marketContext?: {
    isSpecialDay: boolean
    events: string[]
  }
}

// ============================================
// Configuration
// ============================================

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

const TYPE_ICON: Record<AnomalyType, typeof TrendingUp> = {
  spike: TrendingUp,
  drop: TrendingDown,
  trend_reversal: Activity,
  budget_anomaly: AlertTriangle,
  performance_degradation: TrendingDown,
  unusual_pattern: HelpCircle,
}

const TYPE_LABELS: Record<AnomalyType, string> = {
  spike: '급증',
  drop: '급감',
  trend_reversal: '추세 전환',
  budget_anomaly: '예산 이상',
  performance_degradation: '성과 저하',
  unusual_pattern: '이상 패턴',
}

const CAUSE_CATEGORY_LABELS: Record<CauseCategory, string> = {
  external: '외부 요인',
  internal: '내부 요인',
  technical: '기술적 요인',
  market: '시장 요인',
}

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-700',
}

// ============================================
// API
// ============================================

async function fetchAnomalies(includeRootCause: boolean): Promise<AnomalyResponse> {
  const url = includeRootCause
    ? '/api/ai/anomalies?includeRootCause=true'
    : '/api/ai/anomalies'
  const response = await fetch(url)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || '이상 탐지에 실패했습니다')
  }
  return response.json()
}

// ============================================
// Sub-components
// ============================================

function MetricDisplay({ label, value, unit = '' }: { label: string; value: number; unit?: string }) {
  return (
    <div className="text-xs">
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium">{typeof value === 'number' ? value.toFixed(2) : value}{unit}</span>
    </div>
  )
}

function RootCauseSection({ analysis }: { analysis: RootCauseAnalysis }) {
  const [isOpen, setIsOpen] = useState(false)

  if (!analysis.possibleCauses.length) {
    return null
  }

  const primaryCause = analysis.primaryCause || analysis.possibleCauses[0]

  return (
    <div className="mt-3 pt-3 border-t border-current/10">
      <SimpleCollapsible open={isOpen} onOpenChange={setIsOpen}>
        <SimpleCollapsibleTrigger
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 w-full text-left"
        >
          <Lightbulb className="h-4 w-4" />
          <span className="text-sm font-medium flex-1">원인 분석</span>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </SimpleCollapsibleTrigger>
        <SimpleCollapsibleContent open={isOpen} className="mt-2 space-y-2">
          {/* Primary Cause */}
          {primaryCause && (
            <div className="p-2 rounded-md bg-current/5">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  {CAUSE_CATEGORY_LABELS[primaryCause.category]}
                </Badge>
                <span className="text-sm font-medium">{primaryCause.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {Math.round(primaryCause.probability * 100)}% 확률
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {primaryCause.description}
              </p>

              {/* Evidence */}
              {primaryCause.evidence.length > 0 && (
                <div className="mb-2">
                  <span className="text-xs font-medium">근거:</span>
                  <ul className="text-xs text-muted-foreground list-disc list-inside">
                    {primaryCause.evidence.slice(0, 2).map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              {primaryCause.actions.length > 0 && (
                <div>
                  <span className="text-xs font-medium">권장 조치:</span>
                  <div className="mt-1 space-y-1">
                    {primaryCause.actions.slice(0, 2).map((action) => (
                      <div
                        key={action.id}
                        className="flex items-center gap-2 text-xs"
                      >
                        <Badge
                          variant="outline"
                          className={cn('text-xs px-1.5 py-0', PRIORITY_COLORS[action.priority])}
                        >
                          {action.priority === 'high' ? '긴급' : action.priority === 'medium' ? '권장' : '참고'}
                        </Badge>
                        <span>{action.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Other Causes (if any) */}
          {analysis.possibleCauses.length > 1 && (
            <div className="text-xs text-muted-foreground">
              +{analysis.possibleCauses.length - 1}개의 다른 가능한 원인이 있습니다
            </div>
          )}
        </SimpleCollapsibleContent>
      </SimpleCollapsible>
    </div>
  )
}

function BaselineSection({ baseline }: { baseline: StatisticalBaseline; metric: string }) {
  return (
    <div className="mt-2 pt-2 border-t border-current/10 grid grid-cols-2 gap-1">
      <MetricDisplay label="평균" value={baseline.mean} />
      <MetricDisplay label="표준편차" value={baseline.stdDev} />
      <MetricDisplay label="중간값" value={baseline.median} />
      <MetricDisplay label="95%ile" value={baseline.percentile95} />
    </div>
  )
}

function DetectionMethodsBadge({ methods }: { methods: string[] }) {
  const methodLabels: Record<string, string> = {
    zscore: 'Z-Score',
    iqr: 'IQR',
    moving_average: '이동평균',
    threshold: '임계값',
  }

  return (
    <div className="flex gap-1 flex-wrap">
      {methods.map((method) => (
        <Badge
          key={method}
          variant="secondary"
          className="text-xs px-1.5 py-0 bg-current/10"
        >
          {methodLabels[method] || method}
        </Badge>
      ))}
    </div>
  )
}

function AnomalyCard({ anomaly }: { anomaly: Anomaly }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const severityConfig = SEVERITY_CONFIG[anomaly.severity]
  const TypeIcon = TYPE_ICON[anomaly.type] || Activity
  const SeverityIcon = severityConfig.icon

  return (
    <div
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
            <Badge variant="outline" className="text-xs">
              {TYPE_LABELS[anomaly.type]}
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
            {anomaly.confidence && (
              <>
                <span className="mx-1">•</span>
                <Target className="h-3 w-3" />
                <span>신뢰도 {Math.round(anomaly.confidence * 100)}%</span>
              </>
            )}
          </div>

          {/* Detection Methods */}
          {anomaly.detectionMethods && anomaly.detectionMethods.length > 0 && (
            <div className="mt-2">
              <DetectionMethodsBadge methods={anomaly.detectionMethods} />
            </div>
          )}

          {/* Expandable Details */}
          <SimpleCollapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <SimpleCollapsibleTrigger
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs text-current/60 hover:text-current/80 mt-2"
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <span>상세 정보</span>
            </SimpleCollapsibleTrigger>
            <SimpleCollapsibleContent open={isExpanded} className="mt-2">
              {/* Baseline Statistics */}
              {anomaly.baseline && (
                <BaselineSection baseline={anomaly.baseline} metric={anomaly.metric} />
              )}

              {/* Root Cause Analysis */}
              {anomaly.rootCauseAnalysis && (
                <RootCauseSection analysis={anomaly.rootCauseAnalysis} />
              )}
            </SimpleCollapsibleContent>
          </SimpleCollapsible>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Main Component
// ============================================

interface AnomalyAlertProps {
  className?: string
  maxItems?: number
  showRootCause?: boolean
}

export function AnomalyAlert({ className, maxItems = 5, showRootCause = true }: AnomalyAlertProps) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['anomalies', showRootCause],
    queryFn: () => fetchAnomalies(showRootCause),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 15, // Auto-refresh every 15 minutes
  })

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">이상 탐지</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
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
  const marketContext = data?.marketContext

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">이상 탐지</CardTitle>
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

        {/* Market Context */}
        {marketContext?.isSpecialDay && marketContext.events.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" />
            <span>오늘: {marketContext.events.join(', ')}</span>
          </div>
        )}

        {/* Summary Stats */}
        {summary && anomalies.length > 0 && (
          <div className="mt-2 flex gap-3 text-xs">
            {summary.critical > 0 && (
              <span className="text-red-600">긴급 {summary.critical}</span>
            )}
            {summary.warning > 0 && (
              <span className="text-amber-600">주의 {summary.warning}</span>
            )}
            {summary.info > 0 && (
              <span className="text-blue-600">정보 {summary.info}</span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
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

        {displayedAnomalies.map((anomaly) => (
          <AnomalyCard key={anomaly.id} anomaly={anomaly} />
        ))}

        {anomalies.length > maxItems && (
          <p className="text-center text-xs text-muted-foreground">
            +{anomalies.length - maxItems}개 더 있습니다
          </p>
        )}
      </CardContent>
    </Card>
  )
}
