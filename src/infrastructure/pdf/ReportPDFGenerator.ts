import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import type { ReportDTO } from '@application/dto/report/ReportDTO'
import type { IReportPDFGenerator, PDFGeneratorResult } from '@application/ports/IReportPDFGenerator'
import { WeeklyReportTemplate } from './templates/WeeklyReportTemplate'

export type { PDFGeneratorResult, IReportPDFGenerator }

export class ReportPDFGenerator implements IReportPDFGenerator {
  async generateWeeklyReport(report: ReportDTO): Promise<PDFGeneratorResult> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const document = React.createElement(WeeklyReportTemplate, { report }) as any
    const buffer = await renderToBuffer(document)

    const startDate = new Date(report.dateRange.startDate)
    const endDate = new Date(report.dateRange.endDate)
    const formatDate = (date: Date) =>
      date.toISOString().split('T')[0].replace(/-/g, '')

    const filename = `바투_주간리포트_${formatDate(startDate)}_${formatDate(endDate)}.pdf`

    return {
      buffer: Buffer.from(buffer),
      filename,
      contentType: 'application/pdf',
    }
  }
}
