import {
  PrismaClient,
  ReportType as PrismaReportType,
  ReportStatus as PrismaReportStatus,
} from '@/generated/prisma'
import { IReportRepository, ReportFilters } from '@domain/repositories/IReportRepository'
import { Report, ReportType } from '@domain/entities/Report'
import { ReportMapper } from '../mappers/ReportMapper'

export class PrismaReportRepository implements IReportRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(report: Report): Promise<Report> {
    const data = ReportMapper.toCreateInput(report)

    const created = await this.prisma.report.create({
      data: {
        id: data.id,
        type: data.type,
        campaignIds: data.campaignIds,
        startDate: data.startDate,
        endDate: data.endDate,
        sections: data.sections,
        aiInsights: data.aiInsights,
        status: data.status,
        generatedAt: data.generatedAt,
        sentAt: data.sentAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        user: {
          connect: { id: data.userId },
        },
      },
    })

    return ReportMapper.toDomain(created)
  }

  async findById(id: string): Promise<Report | null> {
    const report = await this.prisma.report.findUnique({
      where: { id },
    })

    if (!report) {
      return null
    }

    return ReportMapper.toDomain(report)
  }

  async findByUserId(userId: string): Promise<Report[]> {
    const reports = await this.prisma.report.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return reports.map(ReportMapper.toDomain)
  }

  async findByFilters(filters: ReportFilters): Promise<Report[]> {
    const where = this.buildWhereClause(filters)

    const reports = await this.prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return reports.map(ReportMapper.toDomain)
  }

  async findLatestByUserAndType(
    userId: string,
    type: ReportType
  ): Promise<Report | null> {
    const report = await this.prisma.report.findFirst({
      where: {
        userId,
        type: type as PrismaReportType,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!report) {
      return null
    }

    return ReportMapper.toDomain(report)
  }

  async update(report: Report): Promise<Report> {
    const data = ReportMapper.toUpdateInput(report)

    const updated = await this.prisma.report.update({
      where: { id: report.id },
      data,
    })

    return ReportMapper.toDomain(updated)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.report.delete({
      where: { id },
    })
  }

  private buildWhereClause(filters: ReportFilters) {
    const where: Record<string, unknown> = {}

    if (filters.userId) {
      where.userId = filters.userId
    }

    if (filters.type) {
      where.type = filters.type as PrismaReportType
    }

    if (filters.status) {
      where.status = filters.status as PrismaReportStatus
    }

    if (filters.campaignIds && filters.campaignIds.length > 0) {
      where.campaignIds = { hasSome: filters.campaignIds }
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) {
        (where.createdAt as Record<string, Date>).gte = filters.dateFrom
      }
      if (filters.dateTo) {
        (where.createdAt as Record<string, Date>).lte = filters.dateTo
      }
    }

    return where
  }
}
