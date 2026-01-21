import { PrismaClient, SubscriptionStatus as PrismaStatus, SubscriptionPlan as PrismaPlan, Prisma } from '@/generated/prisma'
import {
  ISubscriptionRepository,
  SubscriptionFilters,
  SubscriptionStats,
} from '@domain/repositories/ISubscriptionRepository'
import { PaginatedResult } from '@domain/repositories/ICampaignRepository'
import { Subscription } from '@domain/entities/Subscription'
import { SubscriptionPlan } from '@domain/value-objects/SubscriptionPlan'
import { SubscriptionStatus } from '@domain/value-objects/SubscriptionStatus'
import { SubscriptionMapper } from '../mappers/SubscriptionMapper'

export class PrismaSubscriptionRepository implements ISubscriptionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Subscription | null> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
    })

    if (!subscription) {
      return null
    }

    return SubscriptionMapper.toDomain(subscription)
  }

  async findByUserId(userId: string): Promise<Subscription | null> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    })

    if (!subscription) {
      return null
    }

    return SubscriptionMapper.toDomain(subscription)
  }

  async findByFilters(
    filters: SubscriptionFilters,
    pagination: { page: number; limit: number }
  ): Promise<PaginatedResult<Subscription>> {
    const where: Prisma.SubscriptionWhereInput = {}

    if (filters.userId) {
      where.userId = filters.userId
    }

    if (filters.plan) {
      where.plan = Array.isArray(filters.plan)
        ? { in: filters.plan as PrismaPlan[] }
        : (filters.plan as PrismaPlan)
    }

    if (filters.status) {
      where.status = Array.isArray(filters.status)
        ? { in: filters.status as PrismaStatus[] }
        : (filters.status as PrismaStatus)
    }

    if (filters.currentPeriodEndBefore) {
      where.currentPeriodEnd = {
        ...(where.currentPeriodEnd as object),
        lt: filters.currentPeriodEndBefore,
      }
    }

    if (filters.currentPeriodEndAfter) {
      where.currentPeriodEnd = {
        ...(where.currentPeriodEnd as object),
        gt: filters.currentPeriodEndAfter,
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subscription.count({ where }),
    ])

    return {
      data: data.map(SubscriptionMapper.toDomain),
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    }
  }

  async save(subscription: Subscription): Promise<Subscription> {
    const data = SubscriptionMapper.toCreateInput(subscription)

    const created = await this.prisma.subscription.create({
      data: {
        id: data.id,
        plan: data.plan,
        status: data.status,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
        cancelledAt: data.cancelledAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        user: {
          connect: { id: data.userId },
        },
      },
    })

    return SubscriptionMapper.toDomain(created)
  }

  async update(subscription: Subscription): Promise<Subscription> {
    const data = SubscriptionMapper.toUpdateInput(subscription)

    const updated = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data,
    })

    return SubscriptionMapper.toDomain(updated)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.subscription.delete({
      where: { id },
    })
  }

  async countByPlan(): Promise<Record<SubscriptionPlan, number>> {
    const result = await this.prisma.subscription.groupBy({
      by: ['plan'],
      _count: { plan: true },
    })

    const counts: Record<SubscriptionPlan, number> = {
      [SubscriptionPlan.FREE]: 0,
      [SubscriptionPlan.STARTER]: 0,
      [SubscriptionPlan.PRO]: 0,
      [SubscriptionPlan.ENTERPRISE]: 0,
    }

    for (const row of result) {
      counts[row.plan as SubscriptionPlan] = row._count.plan
    }

    return counts
  }

  async countByStatus(): Promise<Record<SubscriptionStatus, number>> {
    const result = await this.prisma.subscription.groupBy({
      by: ['status'],
      _count: { status: true },
    })

    const counts: Record<SubscriptionStatus, number> = {
      [SubscriptionStatus.TRIALING]: 0,
      [SubscriptionStatus.ACTIVE]: 0,
      [SubscriptionStatus.PAST_DUE]: 0,
      [SubscriptionStatus.CANCELLED]: 0,
      [SubscriptionStatus.EXPIRED]: 0,
    }

    for (const row of result) {
      counts[row.status as SubscriptionStatus] = row._count.status
    }

    return counts
  }

  async getStats(): Promise<SubscriptionStats> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [total, byPlan, byStatus, churnedThisMonth] = await Promise.all([
      this.prisma.subscription.count(),
      this.countByPlan(),
      this.countByStatus(),
      this.prisma.subscription.count({
        where: {
          status: 'CANCELLED',
          cancelledAt: {
            gte: startOfMonth,
          },
        },
      }),
    ])

    return {
      total,
      byPlan,
      byStatus,
      activeCount: byStatus[SubscriptionStatus.ACTIVE],
      churnedThisMonth,
    }
  }

  async findExpiringSoon(days: number): Promise<Subscription[]> {
    const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)

    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        currentPeriodEnd: {
          lte: futureDate,
          gt: new Date(),
        },
      },
      orderBy: { currentPeriodEnd: 'asc' },
    })

    return subscriptions.map(SubscriptionMapper.toDomain)
  }

  async findPastDue(): Promise<Subscription[]> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        status: 'PAST_DUE',
      },
      orderBy: { currentPeriodEnd: 'asc' },
    })

    return subscriptions.map(SubscriptionMapper.toDomain)
  }
}
