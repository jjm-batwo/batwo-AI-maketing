import {
  Report,
  ReportType,
  ReportStatus,
  ReportSection,
  AIInsight,
  ReportSummaryMetrics,
} from '@domain/entities/Report'
import type { EnhancedReportSections } from './EnhancedReportSections'

export interface GenerateReportDTO {
  userId: string
  campaignIds: string[]
  startDate: string
  endDate: string
}

// Re-export domain types for backward compatibility
export type ReportAIInsightDTO = AIInsight
export type ReportSummaryMetricsDTO = ReportSummaryMetrics

export interface ReportDTO {
  id: string
  type: ReportType
  userId: string
  campaignIds: string[]
  dateRange: {
    startDate: string
    endDate: string
  }
  sections: ReportSection[]
  aiInsights: AIInsight[]
  summaryMetrics: ReportSummaryMetrics
  status: ReportStatus
  generatedAt?: string
  sentAt?: string
  createdAt: string
  updatedAt: string

  // 9개 섹션 (Phase 2) -- enrichedData가 있을 때만 채워짐
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

export function toReportDTO(report: Report): ReportDTO {
  const metrics = report.calculateSummaryMetrics()

  const base: ReportDTO = {
    id: report.id,
    type: report.type,
    userId: report.userId,
    campaignIds: report.campaignIds,
    dateRange: {
      startDate: report.dateRange.startDate.toISOString(),
      endDate: report.dateRange.endDate?.toISOString() ?? report.dateRange.startDate.toISOString(),
    },
    sections: report.sections,
    aiInsights: report.aiInsights,
    summaryMetrics: metrics,
    status: report.status,
    generatedAt: report.generatedAt?.toISOString(),
    sentAt: report.sentAt?.toISOString(),
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  }

  // enrichedData가 있으면 9개 섹션 매핑
  if (report.enrichedData) {
    const enriched = report.enrichedData as unknown as EnhancedReportSections
    return {
      ...base,
      overallSummary: enriched.overallSummary,
      dailyTrend: enriched.dailyTrend,
      campaignPerformance: enriched.campaignPerformance,
      creativePerformance: enriched.creativePerformance,
      creativeFatigue: enriched.creativeFatigue,
      formatComparison: enriched.formatComparison,
      funnelPerformance: enriched.funnelPerformance,
      performanceAnalysis: enriched.performanceAnalysis,
      recommendations: enriched.recommendations,
    }
  }

  return base
}
