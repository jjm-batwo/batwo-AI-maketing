'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Share2, Sparkles } from 'lucide-react'
import { KPICard } from '../dashboard/KPICard'

interface ReportDetailProps {
  report: {
    id: string
    type: string
    dateRange: { startDate: string; endDate: string }
    summaryMetrics: {
      totalImpressions: number
      totalClicks: number
      totalConversions: number
      totalSpend: number
      totalRevenue: number
      averageRoas: number
      averageCtr: number
      averageCpa: number
    }
    aiInsights: Array<{
      type: 'POSITIVE' | 'NEGATIVE' | 'SUGGESTION'
      message: string
      confidence: number
    }>
    sections: Array<{
      title: string
      content: string
    }>
  }
  isLoading?: boolean
  onDownload?: () => void
  onShare?: () => void
}

export function ReportDetail({
  report,
  isLoading = false,
  onDownload,
  onShare,
}: ReportDetailProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      </div>
    )
  }

  const { summaryMetrics, aiInsights } = report

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {report.type === 'WEEKLY' ? '주간' : '월간'} 성과 보고서
          </h1>
          <p className="text-muted-foreground">
            {report.dateRange.startDate} ~ {report.dateRange.endDate}
          </p>
        </div>
        <div className="flex gap-2">
          {onShare && (
            <Button variant="outline" onClick={onShare}>
              <Share2 className="mr-1 h-4 w-4" />
              공유
            </Button>
          )}
          {onDownload && (
            <Button onClick={onDownload}>
              <Download className="mr-1 h-4 w-4" />
              다운로드
            </Button>
          )}
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard
          title="ROAS"
          value={summaryMetrics.averageRoas}
          unit="x"
          format="multiplier"
          icon="chart"
        />
        <KPICard
          title="총 지출"
          value={summaryMetrics.totalSpend}
          unit="원"
          format="currency"
          icon="dollar"
        />
        <KPICard
          title="전환수"
          value={summaryMetrics.totalConversions}
          format="number"
          icon="target"
        />
        <KPICard
          title="CTR"
          value={summaryMetrics.averageCtr}
          unit="%"
          format="percentage"
          icon="click"
        />
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI 인사이트
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiInsights.map((insight, index) => (
              <div
                key={index}
                className={`rounded-lg p-4 ${
                  insight.type === 'POSITIVE'
                    ? 'bg-green-50 text-green-800'
                    : insight.type === 'NEGATIVE'
                    ? 'bg-red-50 text-red-800'
                    : 'bg-blue-50 text-blue-800'
                }`}
              >
                <p className="text-sm">{insight.message}</p>
                <p className="mt-1 text-xs opacity-70">
                  신뢰도: {Math.round(insight.confidence * 100)}%
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      {report.sections.map((section, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
