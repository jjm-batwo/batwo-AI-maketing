'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare } from 'lucide-react'
import type { FeedbackAnalyticsData } from '@presentation/hooks/useFeedbackAnalytics'

interface FeedbackSummaryCardProps {
  data?: FeedbackAnalyticsData | null
  isLoading?: boolean
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function FeedbackSummaryCard({ data, isLoading }: FeedbackSummaryCardProps) {
  if (isLoading) {
    return (
      <Card data-testid="feedback-summary-card" aria-label="피드백 요약 위젯 로딩 중">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">AI 피드백 요약</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-4 w-24 animate-pulse bg-muted rounded" />
          <div className="h-3 w-full animate-pulse bg-muted rounded" />
          <div className="h-3 w-3/4 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card data-testid="feedback-summary-card" aria-label="피드백 데이터 없음">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">AI 피드백 요약</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-4 text-center">
            피드백 데이터가 없습니다
          </p>
        </CardContent>
      </Card>
    )
  }

  const { summary, recentNegative } = data
  const positiveRate = summary.positiveRate

  return (
    <Card data-testid="feedback-summary-card" aria-label="AI 피드백 요약">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">AI 피드백 요약</CardTitle>
        <MessageSquare className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 긍정률 수치 */}
        <div>
          <p
            className="text-3xl font-bold text-foreground"
            data-testid="positive-rate"
            aria-label={`긍정 피드백 비율 ${positiveRate}%`}
          >
            {positiveRate}%
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            긍정 피드백 비율 ({summary.positive}/{summary.total}건)
          </p>
        </div>

        {/* 긍정/부정 프로그레스 바 */}
        <div>
          <div
            className="relative h-2 w-full rounded-full bg-muted overflow-hidden"
            role="progressbar"
            aria-valuenow={positiveRate}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`긍정 비율 ${positiveRate}%`}
          >
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${positiveRate}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-emerald-600">긍정 {summary.positive}건</span>
            <span className="text-xs text-red-500">부정 {summary.negative}건</span>
          </div>
        </div>

        {/* 최근 부정 피드백 */}
        {recentNegative.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">최근 부정 피드백</p>
            <ul className="space-y-2">
              {recentNegative.map((item) => (
                <li
                  key={item.id}
                  className="rounded-md bg-red-50 dark:bg-red-950/20 px-2 py-1.5"
                >
                  <p className="text-xs text-red-700 dark:text-red-400 line-clamp-2">
                    {item.comment ?? '(코멘트 없음)'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(item.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {summary.total === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            아직 피드백이 없습니다
          </p>
        )}
      </CardContent>
    </Card>
  )
}
