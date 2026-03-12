import { PrismaClient, ReportSchedule as PrismaReportSchedule } from '@/generated/prisma'
import { IReportScheduleRepository } from '@domain/repositories/IReportScheduleRepository'
import { ReportSchedule } from '@domain/entities/ReportSchedule'

export class ReportScheduleMapper {
  static toDomain(prisma: PrismaReportSchedule): ReportSchedule {
    return ReportSchedule.restore({
      id: prisma.id,
      userId: prisma.userId,
      frequency: prisma.frequency,
      recipients: prisma.recipients,
      nextSendAt: prisma.nextSendAt,
      isActive: prisma.isActive,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    })
  }

  static toCreateInput(domain: ReportSchedule) {
    const json = domain // Since domain doesn't have toJSON right now, we use getters
    return {
      id: json.id,
      userId: json.userId,
      frequency: json.frequency,
      recipients: json.recipients,
      nextSendAt: json.nextSendAt,
      isActive: json.isActive,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
    }
  }
}

export class PrismaReportScheduleRepository implements IReportScheduleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<ReportSchedule | null> {
    const schedule = await this.prisma.reportSchedule.findUnique({
      where: { id },
    })
    return schedule ? ReportScheduleMapper.toDomain(schedule) : null
  }

  async findByUserId(userId: string): Promise<ReportSchedule[]> {
    const schedules = await this.prisma.reportSchedule.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return schedules.map(ReportScheduleMapper.toDomain)
  }

  async findDue(beforeDate: Date): Promise<ReportSchedule[]> {
    const schedules = await this.prisma.reportSchedule.findMany({
      where: {
        isActive: true,
        nextSendAt: {
          lte: beforeDate,
        },
      },
    })
    return schedules.map(ReportScheduleMapper.toDomain)
  }

  async save(schedule: ReportSchedule): Promise<ReportSchedule> {
    const data = ReportScheduleMapper.toCreateInput(schedule)
    const created = await this.prisma.reportSchedule.create({
      data: {
        ...data,
      },
    })
    return ReportScheduleMapper.toDomain(created)
  }

  async update(schedule: ReportSchedule): Promise<ReportSchedule> {
    const data = ReportScheduleMapper.toCreateInput(schedule)
    const updated = await this.prisma.reportSchedule.update({
      where: { id: schedule.id },
      data: {
        frequency: data.frequency,
        recipients: data.recipients,
        nextSendAt: data.nextSendAt,
        isActive: data.isActive,
        updatedAt: new Date(),
      },
    })
    return ReportScheduleMapper.toDomain(updated)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.reportSchedule.delete({
      where: { id },
    })
  }
}
