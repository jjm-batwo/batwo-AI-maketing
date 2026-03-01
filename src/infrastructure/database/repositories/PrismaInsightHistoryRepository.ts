import { PrismaClient } from '@/generated/prisma'
import type { Prisma } from '@/generated/prisma'
import type {
  IInsightHistoryRepository,
  SaveInsightHistoryDTO,
  InsightHistoryRecord,
} from '@domain/repositories/IInsightHistoryRepository'

export class PrismaInsightHistoryRepository implements IInsightHistoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(dto: SaveInsightHistoryDTO): Promise<void> {
    await this.prisma.insightHistory.create({
      data: {
        userId: dto.userId,
        campaignId: dto.campaignId ?? null,
        category: dto.category,
        priority: dto.priority,
        title: dto.title,
        description: dto.description,
        rootCause: dto.rootCause ?? null,
        metadata: dto.metadata ? (dto.metadata as Prisma.InputJsonValue) : undefined,
      },
    })
  }

  async findByUserId(userId: string, limit = 50): Promise<InsightHistoryRecord[]> {
    const records = await this.prisma.insightHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return records.map((r) => ({
      id: r.id,
      userId: r.userId,
      campaignId: r.campaignId ?? undefined,
      category: r.category,
      priority: r.priority,
      title: r.title,
      description: r.description,
      rootCause: r.rootCause ?? undefined,
      metadata: (r.metadata as Record<string, unknown>) ?? undefined,
      createdAt: r.createdAt,
    }))
  }
}
