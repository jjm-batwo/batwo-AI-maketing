import {
  Report as PrismaReport,
  ReportType as PrismaReportType,
  ReportStatus as PrismaReportStatus,
  Prisma,
} from '@/generated/prisma'
import {
  Report,
  ReportType,
  ReportStatus,
  ReportSection,
  AIInsight,
} from '@domain/entities/Report'
import { DateRange } from '@domain/value-objects/DateRange'

type InputJsonValue = Prisma.InputJsonValue

export class ReportMapper {
  static toDomain(prisma: PrismaReport): Report {
    const dateRange = DateRange.create(prisma.startDate, prisma.endDate)

    return Report.restore({
      id: prisma.id,
      type: prisma.type as ReportType,
      userId: prisma.userId,
      campaignIds: prisma.campaignIds,
      dateRange,
      sections: (prisma.sections as unknown) as ReportSection[],
      aiInsights: (prisma.aiInsights as unknown) as AIInsight[],
      status: prisma.status as ReportStatus,
      generatedAt: prisma.generatedAt ?? undefined,
      sentAt: prisma.sentAt ?? undefined,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    })
  }

  static toPrisma(domain: Report): Omit<PrismaReport, 'user'> {
    const json = domain.toJSON()
    return {
      id: json.id,
      type: json.type as PrismaReportType,
      userId: json.userId,
      campaignIds: json.campaignIds,
      startDate: json.dateRange.startDate,
      endDate: json.dateRange.endDate!,
      sections: json.sections as unknown as PrismaReport['sections'],
      aiInsights: json.aiInsights as unknown as PrismaReport['aiInsights'],
      status: json.status as PrismaReportStatus,
      generatedAt: json.generatedAt ?? null,
      sentAt: json.sentAt ?? null,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
    }
  }

  static toCreateInput(domain: Report) {
    const json = domain.toJSON()
    return {
      id: json.id,
      type: json.type as PrismaReportType,
      userId: json.userId,
      campaignIds: json.campaignIds,
      startDate: json.dateRange.startDate,
      endDate: json.dateRange.endDate!,
      sections: json.sections as unknown as InputJsonValue,
      aiInsights: json.aiInsights as unknown as InputJsonValue,
      status: json.status as PrismaReportStatus,
      generatedAt: json.generatedAt ?? null,
      sentAt: json.sentAt ?? null,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
    }
  }

  static toUpdateInput(domain: Report) {
    const json = domain.toJSON()
    return {
      sections: json.sections as unknown as InputJsonValue,
      aiInsights: json.aiInsights as unknown as InputJsonValue,
      status: json.status as PrismaReportStatus,
      generatedAt: json.generatedAt ?? null,
      sentAt: json.sentAt ?? null,
      updatedAt: new Date(),
    }
  }
}
