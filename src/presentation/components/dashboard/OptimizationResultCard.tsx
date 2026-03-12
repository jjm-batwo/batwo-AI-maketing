'use client'

import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowUpRight, ArrowDownRight, TrendingUp, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OptimizationMetrics {
  roas: number
  cpa: number
  ctr: number
}

export interface OptimizationResult {
  actionId: string
  campaignId: string
  appliedAt: Date
  before: OptimizationMetrics
  after: OptimizationMetrics
  improvement: OptimizationMetrics
  daysTracked: number
}

interface Props {
  result: OptimizationResult
  className?: string
}

const MetricDisplay = ({
  label,
  before,
  after,
  change,
  isPercent = false,
  inverse = false,
}: {
  label: string
  before: number
  after: number
  change: number
  isPercent?: boolean
  inverse?: boolean
}) => {
  const isPositive = inverse ? change < 0 : change > 0
  const isNeutral = change === 0

  const formatVal = (val: number) => {
    if (isPercent) return `${val.toFixed(2)}%`
    if (val > 1000) return `${Math.round(val).toLocaleString()}`
    return val.toFixed(2)
  }

  return (
    <div className="flex flex-col gap-1 p-3 bg-muted/50 rounded-lg">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">{formatVal(after)}</span>
        </div>
        {!isNeutral ? (
          <div
            className={cn(
              'flex items-center text-xs font-semibold px-1.5 py-0.5 rounded-full',
              isPositive
                ? 'text-green-700 bg-green-100 dark:bg-green-900/40 dark:text-green-400'
                : 'text-red-700 bg-red-100 dark:bg-red-900/40 dark:text-red-400'
            )}
          >
            {isPositive ? (
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3 h-3 mr-0.5" />
            )}
            {Math.abs(change).toFixed(2)}
            {isPercent ? '%' : ''}
          </div>
        ) : (
          <div className="flex items-center text-xs font-semibold text-muted-foreground">
            <Minus className="w-3 h-3 mr-0.5" />
            0.00
          </div>
        )}
      </div>
      <div className="text-[10px] text-muted-foreground mt-1">이전: {formatVal(before)}</div>
    </div>
  )
}

export const OptimizationResultCard = memo(function OptimizationResultCard({
  result,
  className,
}: Props) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3 bg-primary/5 dark:bg-primary/10 border-b">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-md text-primary">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">최적화 성과 리포트</CardTitle>
              <CardDescription className="text-xs">
                {new Date(result.appliedAt).toLocaleDateString()} 적용 건
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-background">
            {result.daysTracked}일차 경과
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MetricDisplay
            label="ROAS (상승이 좋음)"
            before={result.before.roas}
            after={result.after.roas}
            change={result.improvement.roas}
          />
          <MetricDisplay
            label="CPA (하락이 좋음)"
            before={result.before.cpa}
            after={result.after.cpa}
            change={result.improvement.cpa}
            inverse={true}
          />
          <MetricDisplay
            label="CTR (상승이 좋음)"
            before={result.before.ctr}
            after={result.after.ctr}
            change={result.improvement.ctr}
            isPercent={true}
          />
        </div>

        <div className="mt-4 text-xs text-muted-foreground flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          해당 최적화에 대한 성과 추적 중입니다. 적용 전 7일과 적용 후 지표를 비교합니다.
        </div>
      </CardContent>
    </Card>
  )
})
