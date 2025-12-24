import { PrismaClient, CampaignStatus as PrismaStatus } from '@/generated/prisma'
import {
  ICampaignRepository,
  CampaignFilters,
  PaginationOptions,
  PaginatedResult,
} from '@domain/repositories/ICampaignRepository'
import { Campaign } from '@domain/entities/Campaign'
import { CampaignMapper } from '../mappers/CampaignMapper'

export class PrismaCampaignRepository implements ICampaignRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(campaign: Campaign): Promise<Campaign> {
    const data = CampaignMapper.toCreateInput(campaign)

    const created = await this.prisma.campaign.create({
      data: {
        id: data.id,
        name: data.name,
        objective: data.objective,
        status: data.status,
        dailyBudget: data.dailyBudget,
        currency: data.currency,
        startDate: data.startDate,
        endDate: data.endDate,
        targetAudience: data.targetAudience ?? undefined,
        metaCampaignId: data.metaCampaignId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        user: {
          connect: { id: data.userId },
        },
      },
    })

    return CampaignMapper.toDomain(created)
  }

  async findById(id: string): Promise<Campaign | null> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
    })

    if (!campaign) {
      return null
    }

    return CampaignMapper.toDomain(campaign)
  }

  async findByUserId(userId: string): Promise<Campaign[]> {
    const campaigns = await this.prisma.campaign.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return campaigns.map(CampaignMapper.toDomain)
  }

  async findByFilters(
    filters: CampaignFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Campaign>> {
    const where = this.buildWhereClause(filters)

    const page = pagination?.page ?? 1
    const limit = pagination?.limit ?? 20
    const skip = (page - 1) * limit

    const [campaigns, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.campaign.count({ where }),
    ])

    return {
      data: campaigns.map(CampaignMapper.toDomain),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async update(campaign: Campaign): Promise<Campaign> {
    const data = CampaignMapper.toUpdateInput(campaign)

    const updated = await this.prisma.campaign.update({
      where: { id: campaign.id },
      data,
    })

    return CampaignMapper.toDomain(updated)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.campaign.delete({
      where: { id },
    })
  }

  async existsByNameAndUserId(
    name: string,
    userId: string,
    excludeId?: string
  ): Promise<boolean> {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        name,
        userId,
        ...(excludeId && { id: { not: excludeId } }),
      },
    })

    return campaign !== null
  }

  private buildWhereClause(filters: CampaignFilters) {
    const where: Record<string, unknown> = {}

    if (filters.userId) {
      where.userId = filters.userId
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        where.status = { in: filters.status.map(s => s as PrismaStatus) }
      } else {
        where.status = filters.status as PrismaStatus
      }
    }

    if (filters.startDateFrom || filters.startDateTo) {
      where.startDate = {}
      if (filters.startDateFrom) {
        (where.startDate as Record<string, Date>).gte = filters.startDateFrom
      }
      if (filters.startDateTo) {
        (where.startDate as Record<string, Date>).lte = filters.startDateTo
      }
    }

    return where
  }
}
