import { UsageLog as PrismaUsageLog } from '@/generated/prisma'
import { UsageLog, UsageType } from '@domain/repositories/IUsageLogRepository'

export class UsageLogMapper {
  static toDomain(prisma: PrismaUsageLog): UsageLog {
    return {
      id: prisma.id,
      userId: prisma.userId,
      type: prisma.type as UsageType,
      createdAt: prisma.createdAt,
    }
  }

  static toCreateInput(userId: string, type: UsageType) {
    return {
      userId,
      type,
    }
  }
}
