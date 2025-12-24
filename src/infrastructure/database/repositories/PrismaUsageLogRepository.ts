import { PrismaClient } from '@/generated/prisma'
import {
  IUsageLogRepository,
  UsageLog,
  UsageType,
} from '@domain/repositories/IUsageLogRepository'
import { UsageLogMapper } from '../mappers/UsageLogMapper'

export class PrismaUsageLogRepository implements IUsageLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async log(userId: string, type: UsageType): Promise<void> {
    await this.prisma.usageLog.create({
      data: UsageLogMapper.toCreateInput(userId, type),
    })
  }

  async countByPeriod(
    userId: string,
    type: UsageType,
    period: 'day' | 'week'
  ): Promise<number> {
    const now = new Date()
    let startDate: Date

    if (period === 'day') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else {
      // Week: Start from Sunday of current week
      const dayOfWeek = now.getDay()
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek)
    }

    const count = await this.prisma.usageLog.count({
      where: {
        userId,
        type,
        createdAt: {
          gte: startDate,
        },
      },
    })

    return count
  }

  async findByUserAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<UsageLog[]> {
    const logs = await this.prisma.usageLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return logs.map(UsageLogMapper.toDomain)
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await this.prisma.usageLog.deleteMany({
      where: {
        createdAt: {
          lt: date,
        },
      },
    })

    return result.count
  }
}
