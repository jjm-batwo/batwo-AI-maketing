import {
  Report,
  ReportType,
  ReportStatus,
  ReportSection,
  AIInsight,
  ReportSummaryMetrics,
} from '@domain/entities/Report'

export interface GenerateReportDTO {
  userId: string
  campaignIds: string[]
  startDate: string
  endDate: string
}

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
}

export function toReportDTO(report: Report): ReportDTO {
  return {
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
    summaryMetrics: report.calculateSummaryMetrics(),
    status: report.status,
    generatedAt: report.generatedAt?.toISOString(),
    sentAt: report.sentAt?.toISOString(),
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  }
}
