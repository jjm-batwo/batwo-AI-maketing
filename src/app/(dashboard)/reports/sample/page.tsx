import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  FileText,
} from 'lucide-react'
import { KPICard } from '@/presentation/components/dashboard/KPICard'
import { getSampleReportForWebViewer, getSampleReportDTO } from '@/lib/sample-report-data'
import { SampleReportActions } from './SampleReportActions'
import Link from 'next/link'

export const dynamic = 'force-static'

export default function SampleReportPage() {
  const report = getSampleReportForWebViewer()
  const fullReport = getSampleReportDTO()

  const getInsightIcon = (type: 'POSITIVE' | 'NEGATIVE' | 'SUGGESTION') => {
    switch (type) {
      case 'POSITIVE':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'NEGATIVE':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'SUGGESTION':
        return <Lightbulb className="h-5 w-5 text-blue-600" />
    }
  }

  const getInsightLabel = (type: 'POSITIVE' | 'NEGATIVE' | 'SUGGESTION') => {
    switch (type) {
      case 'POSITIVE':
        return '성과 우수'
      case 'NEGATIVE':
        return '주의 필요'
      case 'SUGGESTION':
        return '개선 제안'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/reports">
              <ArrowLeft className="mr-2 h-4 w-4" />
              뒤로가기
            </Link>
          </Button>
          <Badge variant="secondary" className="text-amber-700 bg-amber-100">
            <FileText className="mr-1 h-3 w-3" />
            예시 보고서
          </Badge>
        </div>
      </div>

      {/* Report Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {report.type === 'WEEKLY' ? '주간' : '월간'} 성과 보고서
          </h1>
          <p className="text-muted-foreground">
            {report.dateRange.startDate} ~ {report.dateRange.endDate}
          </p>
          <p className="text-sm text-amber-600 mt-1">
            * 이 보고서는 예시 데이터로 생성되었습니다
          </p>
        </div>
        <SampleReportActions 
          startDate={report.dateRange.startDate}
          endDate={report.dateRange.endDate}
        />
      </div>

      {/* KPI Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard
          title="ROAS"
          value={report.summaryMetrics.averageRoas}
          unit="x"
          format="multiplier"
          icon="chart"
        />
        <KPICard
          title="총 지출"
          value={report.summaryMetrics.totalSpend}
          unit="원"
          format="currency"
          icon="dollar"
        />
        <KPICard
          title="전환수"
          value={report.summaryMetrics.totalConversions}
          format="number"
          icon="target"
        />
        <KPICard
          title="CTR"
          value={report.summaryMetrics.averageCtr}
          unit="%"
          format="percentage"
          icon="click"
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">총 노출</p>
              <p className="text-2xl font-bold">
                {report.summaryMetrics.totalImpressions.toLocaleString('ko-KR')}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">총 클릭</p>
              <p className="text-2xl font-bold">
                {report.summaryMetrics.totalClicks.toLocaleString('ko-KR')}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">총 매출</p>
              <p className="text-2xl font-bold">
                {report.summaryMetrics.totalRevenue.toLocaleString('ko-KR', {
                  style: 'currency',
                  currency: 'KRW',
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
          </CardContent>
        </Card>
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
            {report.aiInsights.map((insight, index) => (
              <div
                key={index}
                className={`rounded-lg p-4 ${
                  insight.type === 'POSITIVE'
                    ? 'bg-green-50 border border-green-200'
                    : insight.type === 'NEGATIVE'
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-blue-50 border border-blue-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded ${
                          insight.type === 'POSITIVE'
                            ? 'bg-green-200 text-green-800'
                            : insight.type === 'NEGATIVE'
                              ? 'bg-red-200 text-red-800'
                              : 'bg-blue-200 text-blue-800'
                        }`}
                      >
                        {getInsightLabel(insight.type)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        신뢰도: {Math.round(insight.confidence * 100)}%
                      </span>
                    </div>
                    <p
                      className={`text-sm ${
                        insight.type === 'POSITIVE'
                          ? 'text-green-800'
                          : insight.type === 'NEGATIVE'
                            ? 'text-red-800'
                            : 'text-blue-800'
                      }`}
                    >
                      {insight.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Campaign Performance */}
      <Card>
        <CardHeader>
          <CardTitle>캠페인별 성과</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fullReport.sections.map((section, index) => (
              <div
                key={index}
                className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{section.title}</h3>
                    <p className="text-sm text-muted-foreground">{section.content}</p>
                  </div>
                  {section.metrics && section.metrics.revenue && section.metrics.spend && (
                    <Badge
                      variant={
                        section.metrics.revenue / section.metrics.spend > 3
                          ? 'default'
                          : 'secondary'
                      }
                      className="flex items-center gap-1"
                    >
                      {section.metrics.revenue / section.metrics.spend > 3 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      ROAS {(section.metrics.revenue / section.metrics.spend).toFixed(2)}x
                    </Badge>
                  )}
                </div>
                {section.metrics && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">노출</p>
                      <p className="font-medium">
                        {(section.metrics.impressions || 0).toLocaleString('ko-KR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">클릭</p>
                      <p className="font-medium">
                        {(section.metrics.clicks || 0).toLocaleString('ko-KR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">전환</p>
                      <p className="font-medium">
                        {(section.metrics.conversions || 0).toLocaleString('ko-KR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">지출</p>
                      <p className="font-medium">
                        {(section.metrics.spend || 0).toLocaleString('ko-KR', {
                          style: 'currency',
                          currency: 'KRW',
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">매출</p>
                      <p className="font-medium">
                        {(section.metrics.revenue || 0).toLocaleString('ko-KR', {
                          style: 'currency',
                          currency: 'KRW',
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations Detail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            AI 추천 액션
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {fullReport.aiInsights.map((insight, insightIndex) => (
              <div key={insightIndex}>
                <h4 className="font-medium mb-2 text-muted-foreground text-sm">
                  {insight.type === 'performance'
                    ? '성과 최적화'
                    : insight.type === 'recommendation'
                      ? '개선 제안'
                      : '이상 징후 대응'}
                </h4>
                <ul className="space-y-2">
                  {insight.recommendations.map((rec, recIndex) => (
                    <li
                      key={recIndex}
                      className="flex items-start gap-2 text-sm bg-muted/50 rounded-lg p-3"
                    >
                      <span className="text-primary font-bold">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer Note */}
      <div className="text-center text-sm text-muted-foreground pb-8">
        <p>이 예시 보고서는 가상의 &quot;플로라 뷰티&quot; 쇼핑몰 데이터로 생성되었습니다.</p>
        <p className="mt-1">실제 Meta 광고 계정을 연결하면 실시간 데이터로 보고서가 생성됩니다.</p>
      </div>
    </div>
  )
}
