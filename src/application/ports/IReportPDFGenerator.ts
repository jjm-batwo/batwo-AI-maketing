import type { ReportDTO } from '@application/dto/report/ReportDTO'

export interface PDFGeneratorResult {
  buffer: Buffer
  filename: string
  contentType: string
}

export type PDFReportType = 'DAILY' | 'WEEKLY' | 'MONTHLY'

export interface IReportPDFGenerator {
  generateWeeklyReport(report: ReportDTO): Promise<PDFGeneratorResult>
  generateReport(type: PDFReportType, report: ReportDTO): Promise<PDFGeneratorResult>
}
