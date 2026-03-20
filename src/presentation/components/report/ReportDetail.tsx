'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Sparkles } from 'lucide-react'
import { KPICard } from '../dashboard/KPICard'
import DOMPurify from 'dompurify'
import { ShareReportButton } from './ShareReportButton'
import { ReportScheduleForm } from './ReportScheduleForm'
import {
  OverallSummarySection,
  DailyTrendSection,
  CampaignPerformanceSection,
  CreativePerformanceSection,
  CreativeFatigueSection,
  FormatComparisonSection,
  FunnelPerformanceSection,
  PerformanceAnalysisSection,
  RecommendationsSection,
} from './sections'
import type { EnhancedReportSections } from '@application/dto/report/EnhancedReportSections'

interface ReportDetailProps {
  report: {
    id: string
    type: string
    dateRange: { startDate: string; endDate: string }
    shareToken?: string | null
    shareExpiresAt?: string | null
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
    // Enhanced sections (Phase 2) — optional for backward compatibility
    overallSummary?: EnhancedReportSections['overallSummary']
    dailyTrend?: EnhancedReportSections['dailyTrend']
    campaignPerformance?: EnhancedReportSections['campaignPerformance']
    creativePerformance?: EnhancedReportSections['creativePerformance']
    creativeFatigue?: EnhancedReportSections['creativeFatigue']
    formatComparison?: EnhancedReportSections['formatComparison']
    funnelPerformance?: EnhancedReportSections['funnelPerformance']
    performanceAnalysis?: EnhancedReportSections['performanceAnalysis']
    recommendations?: EnhancedReportSections['recommendations']
  }
  isLoading?: boolean
  onDownload?: () => void
  onShareCreated?: (url: string, expiresAt: string) => void
  onShareRevoked?: () => void
  onScheduleCreated?: () => void
}

export function ReportDetail({
  report,
  isLoading = false,
  onDownload,
  onShareCreated,
  onShareRevoked,
  onScheduleCreated,
}: ReportDetailProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  const hasEnhancedData = !!report.overallSummary

  // Determine an existing share URL if a token exists and is valid
  const existingShareUrl =
    report.shareToken && report.shareExpiresAt && new Date(report.shareExpiresAt) > new Date()
      ? `${process.env.NEXT_PUBLIC_APP_URL || ''}/reports/share/${report.shareToken}`
      : undefined

  const typeLabel = report.type === 'DAILY' ? '일간' : report.type === 'WEEKLY' ? '주간' : '월간'

  return (
    <div className="space-y-6" data-testid="report-detail">
      {/* Header */}
      <div className="flex items-center justify-between" data-testid="report-detail-header">
        <div>
          <h1 className="text-2xl font-bold">{typeLabel} 성과 보고서</h1>
          <p className="text-muted-foreground">
            {report.dateRange.startDate} ~ {report.dateRange.endDate}
          </p>
        </div>
        <div className="flex gap-2">
          <ReportScheduleForm onScheduleCreated={onScheduleCreated} />

          <ShareReportButton
            reportId={report.id}
            existingShareUrl={existingShareUrl}
            existingShareExpiresAt={report.shareExpiresAt || undefined}
            onShareCreated={onShareCreated}
            onShareRevoked={onShareRevoked}
          />

          {onDownload && (
            <Button onClick={onDownload} data-testid="report-download-btn">
              <Download className="mr-1 h-4 w-4" />
              다운로드
            </Button>
          )}
        </div>
      </div>

      {hasEnhancedData ? (
        <div data-testid="report-enhanced-sections">
          {/* Enhanced 9-Section View */}
          {report.overallSummary && (
            <div data-testid="section-overall-summary">
              <OverallSummarySection data={report.overallSummary} />
            </div>
          )}

          {report.dailyTrend && (
            <div data-testid="section-daily-trend">
              <DailyTrendSection data={report.dailyTrend} />
            </div>
          )}

          {report.campaignPerformance && (
            <div data-testid="section-campaign-performance">
              <CampaignPerformanceSection data={report.campaignPerformance} />
            </div>
          )}

          {report.creativePerformance && (
            <div data-testid="section-creative-performance">
              <CreativePerformanceSection data={report.creativePerformance} />
            </div>
          )}

          {report.creativeFatigue && (
            <div data-testid="section-creative-fatigue">
              <CreativeFatigueSection data={report.creativeFatigue} />
            </div>
          )}

          {report.formatComparison && (
            <div data-testid="section-format-comparison">
              <FormatComparisonSection data={report.formatComparison} />
            </div>
          )}

          {report.funnelPerformance && (
            <div data-testid="section-funnel-performance">
              <FunnelPerformanceSection data={report.funnelPerformance} />
            </div>
          )}

          {report.performanceAnalysis && (
            <div data-testid="section-performance-analysis">
              <PerformanceAnalysisSection data={report.performanceAnalysis} />
            </div>
          )}

          {report.recommendations && (
            <div data-testid="section-recommendations">
              <RecommendationsSection data={report.recommendations} />
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Basic View (backward compatibility) */}
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

          {report.sections.map((section, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(section.content) }}
                />
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  )
}
