'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Zap, Trophy } from 'lucide-react'

interface SavingsWidgetProps {
  totalSavings: { amount: number; currency: string }
  totalOptimizations: number
  topSavingEvent: {
    campaignName: string
    ruleName: string
    estimatedSavings: { amount: number; currency: string }
  } | null
  isLoading?: boolean
}

function formatSavings(amount: number): string {
  if (amount >= 10000) {
    return `${Math.round(amount / 10000).toLocaleString()}만원`
  }
  return `${amount.toLocaleString()}원`
}

export function SavingsWidget({
  totalSavings,
  totalOptimizations,
  topSavingEvent,
  isLoading,
}: SavingsWidgetProps) {
  if (isLoading) {
    return (
      <Card aria-label="AI 절감 효과 위젯 로딩 중">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">AI 절감 효과</CardTitle>
          <Zap className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-32 animate-pulse bg-muted rounded mb-2" />
          <div className="h-4 w-48 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    )
  }

  const hasData = totalOptimizations > 0

  return (
    <Card aria-label="이번 달 AI 절감 효과">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">AI 절감 효과</CardTitle>
        <Zap className="h-4 w-4 text-emerald-500" aria-hidden="true" />
      </CardHeader>
      <CardContent className="space-y-3">
        {hasData ? (
          <>
            <div>
              <p
                className="text-3xl font-bold text-emerald-600"
                aria-label={`이번 달 AI가 절감한 광고비 ${formatSavings(totalSavings.amount)}`}
              >
                +₩{formatSavings(totalSavings.amount)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                이번 달 AI가 절감한 광고비
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              자동 최적화{' '}
              <span className="font-semibold text-foreground">{totalOptimizations}회</span> 실행
            </p>
            {topSavingEvent && (
              <div
                className="flex items-start gap-2 rounded-md bg-emerald-50 dark:bg-emerald-950/20 p-2"
                aria-label={`최대 절감 캠페인: ${topSavingEvent.campaignName}`}
              >
                <Trophy className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    최대 절감
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {topSavingEvent.campaignName} —{' '}
                    <span className="text-emerald-600 font-medium">
                      ₩{formatSavings(topSavingEvent.estimatedSavings.amount)}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-4 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              아직 자동 최적화가 실행되지 않았습니다
            </p>
            <Badge variant="outline" className="text-xs">
              최적화 규칙을 설정해 보세요
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
