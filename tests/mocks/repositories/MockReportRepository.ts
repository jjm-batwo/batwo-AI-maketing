import { Report, ReportType, ReportStatus } from '@domain/entities/Report'
import {
  IReportRepository,
  ReportFilters,
} from '@domain/repositories/IReportRepository'

export class MockReportRepository implements IReportRepository {
  private reports: Map<string, Report> = new Map()

  async save(report: Report): Promise<Report> {
    this.reports.set(report.id, report)
    return report
  }

  async findById(id: string): Promise<Report | null> {
    return this.reports.get(id) || null
  }

  async findByUserId(userId: string): Promise<Report[]> {
    return Array.from(this.reports.values()).filter(
      (r) => r.userId === userId
    )
  }

  async findByFilters(filters: ReportFilters): Promise<Report[]> {
    let results = Array.from(this.reports.values())

    if (filters.userId) {
      results = results.filter((r) => r.userId === filters.userId)
    }

    if (filters.type) {
      results = results.filter((r) => r.type === filters.type)
    }

    if (filters.status) {
      results = results.filter((r) => r.status === filters.status)
    }

    if (filters.campaignIds && filters.campaignIds.length > 0) {
      results = results.filter((r) =>
        r.campaignIds.some((id) => filters.campaignIds!.includes(id))
      )
    }

    return results
  }

  async findLatestByUserAndType(
    userId: string,
    type: ReportType
  ): Promise<Report | null> {
    const reports = Array.from(this.reports.values())
      .filter((r) => r.userId === userId && r.type === type)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return reports[0] || null
  }

  async update(report: Report): Promise<Report> {
    this.reports.set(report.id, report)
    return report
  }

  async delete(id: string): Promise<void> {
    this.reports.delete(id)
  }

  // Test helpers
  clear(): void {
    this.reports.clear()
  }

  getAll(): Report[] {
    return Array.from(this.reports.values())
  }
}
