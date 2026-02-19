import type { PrismaClient } from '@/generated/prisma'
import type { ICompetitorTrackingRepository } from '@domain/repositories/ICompetitorTrackingRepository'
import { CompetitorTracking } from '@domain/entities/CompetitorTracking'

export class PrismaCompetitorTrackingRepository implements ICompetitorTrackingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(tracking: CompetitorTracking): Promise<CompetitorTracking> {
    const saved = await this.prisma.competitorTracking.create({
      data: {
        userId: tracking.userId,
        pageId: tracking.pageId,
        pageName: tracking.pageName,
        industry: tracking.industry,
      },
    })

    return this.toDomain(saved)
  }

  async findByUserId(userId: string): Promise<CompetitorTracking[]> {
    const records = await this.prisma.competitorTracking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return records.map((r) => this.toDomain(r))
  }

  async findByUserIdAndPageId(userId: string, pageId: string): Promise<CompetitorTracking | null> {
    const record = await this.prisma.competitorTracking.findUnique({
      where: { userId_pageId: { userId, pageId } },
    })

    if (!record) return null
    return this.toDomain(record)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.competitorTracking.delete({ where: { id } })
  }

  async deleteByUserIdAndPageId(userId: string, pageId: string): Promise<void> {
    await this.prisma.competitorTracking.delete({
      where: { userId_pageId: { userId, pageId } },
    })
  }

  private toDomain(record: {
    id: string
    userId: string
    pageId: string
    pageName: string
    industry: string | null
    createdAt: Date
    updatedAt: Date
  }): CompetitorTracking {
    return CompetitorTracking.fromPersistence({
      id: record.id,
      userId: record.userId,
      pageId: record.pageId,
      pageName: record.pageName,
      industry: record.industry,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
  }
}
