import type { PrismaClient } from '@/generated/prisma'
import type {
  IAIFeedbackRepository,
  AIFeedback,
  CreateFeedbackInput,
  FeedbackStats,
} from '@domain/repositories/IAIFeedbackRepository'

export class PrismaAIFeedbackRepository implements IAIFeedbackRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateFeedbackInput): Promise<{ id: string }> {
    const created = await this.prisma.aIFeedback.create({
      data: {
        responseId: input.responseId,
        userId: input.userId,
        rating: input.rating,
        isHelpful: input.isHelpful ?? null,
        comment: input.comment ?? null,
        feature: input.feature,
        context: input.context as object | undefined,
        responseType: input.responseType,
        modelUsed: input.modelUsed ?? null,
      },
      select: {
        id: true,
      },
    })
    return { id: created.id }
  }

  async findByUserId(userId: string, limit = 50): Promise<AIFeedback[]> {
    const records = await this.prisma.aIFeedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return records.map((r) => this.toFeedback(r))
  }

  async findByFeature(feature: string, limit = 100): Promise<AIFeedback[]> {
    const records = await this.prisma.aIFeedback.findMany({
      where: { feature },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return records.map((r) => this.toFeedback(r))
  }

  async getAverageRating(feature: string): Promise<number> {
    const result = await this.prisma.aIFeedback.aggregate({
      where: { feature },
      _avg: {
        rating: true,
      },
    })
    return result._avg.rating ?? 0
  }

  async getFeatureStats(feature: string): Promise<FeedbackStats> {
    const [total, avgResult, helpful, notHelpful] = await Promise.all([
      this.prisma.aIFeedback.count({ where: { feature } }),
      this.prisma.aIFeedback.aggregate({
        where: { feature },
        _avg: { rating: true },
      }),
      this.prisma.aIFeedback.count({
        where: { feature, isHelpful: true },
      }),
      this.prisma.aIFeedback.count({
        where: { feature, isHelpful: false },
      }),
    ])

    return {
      totalCount: total,
      averageRating: avgResult._avg.rating ?? 0,
      helpfulCount: helpful,
      notHelpfulCount: notHelpful,
    }
  }

  async findAll(options: {
    page: number
    limit: number
    feature?: string
    userId?: string
  }): Promise<{
    data: AIFeedback[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    const { page, limit, feature, userId } = options
    const skip = (page - 1) * limit

    const where = {
      ...(feature && { feature }),
      ...(userId && { userId }),
    }

    const [records, total] = await Promise.all([
      this.prisma.aIFeedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.aIFeedback.count({ where }),
    ])

    return {
      data: records.map((r) => this.toFeedback(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  private toFeedback(record: {
    id: string
    responseId: string
    userId: string
    rating: number
    isHelpful: boolean | null
    comment: string | null
    feature: string
    context: unknown
    responseType: string
    modelUsed: string | null
    createdAt: Date
  }): AIFeedback {
    return {
      id: record.id,
      responseId: record.responseId,
      userId: record.userId,
      rating: record.rating,
      isHelpful: record.isHelpful,
      comment: record.comment,
      feature: record.feature,
      context: record.context as Record<string, unknown> | null,
      responseType: record.responseType as 'streaming' | 'standard',
      modelUsed: record.modelUsed,
      createdAt: record.createdAt,
    }
  }
}
