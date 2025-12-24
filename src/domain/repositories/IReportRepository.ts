import { Report, ReportType, ReportStatus } from '../entities/Report'

export interface ReportFilters {
  userId?: string
  type?: ReportType
  status?: ReportStatus
  campaignIds?: string[]
  dateFrom?: Date
  dateTo?: Date
}

export interface IReportRepository {
  save(report: Report): Promise<Report>
  findById(id: string): Promise<Report | null>
  findByUserId(userId: string): Promise<Report[]>
  findByFilters(filters: ReportFilters): Promise<Report[]>
  findLatestByUserAndType(userId: string, type: ReportType): Promise<Report | null>
  update(report: Report): Promise<Report>
  delete(id: string): Promise<void>
}
