'use client'

import { Card, CardContent } from '@/components/ui/card'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import type { OverallSummarySection as OverallSummaryData } from '@application/dto/report/EnhancedReportSections'

function ChangeIndicator({ value, direction, isPositive }: { value: number; direction: string; isPositive: boolean }) {
  const isGood = (direction === 'up' && isPositive) || (direction === 'down' && !isPositive)
  const color = direction === 'flat' ? 'text-muted-foreground' : isGood ? 'text-green-600' : 'text-red-600'
  const Icon = direction === 'up' ? ArrowUp : direction === 'down' ? ArrowDown : Minus

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${color}`}>
      <Icon className="h-3 w-3" />
      {Math.abs(value).toFixed(1)}%
    </span>
  )
}

function formatWon(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toLocaleString('ko-KR')
}

interface OverallSummarySectionProps {
  data: OverallSummaryData
}

export function OverallSummarySection({ data }: OverallSummarySectionProps) {
  const metrics = [
    { label: '총 지출', value: `${formatWon(data.totalSpend)}원`, change: data.changes.spend },
    { label: '총 매출', value: `${formatWon(data.totalRevenue)}원`, change: data.changes.revenue },
    { label: 'ROAS', value: `${data.roas.toFixed(2)}x`, change: data.changes.roas },
    { label: 'CTR', value: `${data.ctr.toFixed(2)}%`, change: data.changes.ctr },
    { label: '전환수', value: data.totalConversions.toLocaleString('ko-KR'), change: data.changes.conversions },
  ]

  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
      {metrics.map((m) => (
        <Card key={m.label}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className="text-lg font-bold whitespace-nowrap">{m.value}</p>
            <ChangeIndicator {...m.change} />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
