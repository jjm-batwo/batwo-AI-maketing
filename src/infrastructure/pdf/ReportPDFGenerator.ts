import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import type { ReportDTO } from '@application/dto/report/ReportDTO'
import type {
  IReportPDFGenerator,
  PDFGeneratorResult,
  PDFReportType,
} from '@application/ports/IReportPDFGenerator'
import { WeeklyReportTemplate } from './templates/WeeklyReportTemplate'
import { EnhancedWeeklyReportTemplate } from './templates/EnhancedWeeklyReportTemplate'
import { DailyReportTemplate } from './templates/DailyReportTemplate'
import { MonthlyReportTemplate } from './templates/MonthlyReportTemplate'

export type { PDFGeneratorResult, IReportPDFGenerator }

export class ReportPDFGenerator implements IReportPDFGenerator {
  async generateWeeklyReport(report: ReportDTO): Promise<PDFGeneratorResult> {
    return this.generateReport('WEEKLY', report)
  }

  async generateReport(type: PDFReportType, report: ReportDTO): Promise<PDFGeneratorResult> {
    const templateMap: Record<string, React.ComponentType<{ report: ReportDTO }>> = {
      DAILY: DailyReportTemplate,
      WEEKLY: report.overallSummary ? EnhancedWeeklyReportTemplate : WeeklyReportTemplate,
      MONTHLY: MonthlyReportTemplate,
    }
    const Template = templateMap[type] ?? WeeklyReportTemplate

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const document = React.createElement(Template, { report }) as any
    const buffer = await renderToBuffer(document)

    const startDate = new Date(report.dateRange.startDate)
    const endDate = new Date(report.dateRange.endDate)
    const formatDate = (date: Date) => date.toISOString().split('T')[0].replace(/-/g, '')

    const typeLabel: Record<string, string> = { DAILY: '일간', WEEKLY: '주간', MONTHLY: '월간' }
    const label = typeLabel[type] ?? '주간'
    const filename = type === 'DAILY'
      ? `바투_${label}리포트_${formatDate(startDate)}.pdf`
      : `바투_${label}리포트_${formatDate(startDate)}_${formatDate(endDate)}.pdf`

    return { buffer: Buffer.from(buffer), filename, contentType: 'application/pdf' }
  }
}
