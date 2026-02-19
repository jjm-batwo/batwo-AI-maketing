import type { ReportDTO } from '@application/dto/report/ReportDTO'

export interface PDFGeneratorResult {
  buffer: Buffer
  filename: string
  contentType: string
}

export interface IReportPDFGenerator {
  generateWeeklyReport(report: ReportDTO): Promise<PDFGeneratorResult>
}
