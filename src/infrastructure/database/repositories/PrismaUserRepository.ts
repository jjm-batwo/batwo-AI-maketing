import {
  PrismaClient,
  GlobalRole as PrismaGlobalRole,
  SubscriptionPlan as PrismaPlan,
  SubscriptionStatus as PrismaStatus,
  Prisma,
} from '@/generated/prisma'
import {
  IUserRepository,
  User,
  UserWithSubscription,
  UserWithDetails,
  UserFullDetails,
  AdminUserFilters,
  PaginatedResult,
} from '@domain/repositories/IUserRepository'
import { GlobalRole } from '@domain/value-objects/GlobalRole'
import { SubscriptionPlan } from '@domain/value-objects/SubscriptionPlan'
import { SubscriptionStatus } from '@domain/value-objects/SubscriptionStatus'

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ========================================
  // Basic CRUD
  // ========================================

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return null
    }

    return this.mapToUser(user)
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return null
    }

    return this.mapToUser(user)
  }

  async save(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        image: userData.image,
        emailVerified: userData.emailVerified,
        globalRole: userData.globalRole as PrismaGlobalRole,
      },
    })

    return this.mapToUser(user)
  }

  async update(id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        name: data.name,
        image: data.image,
        emailVerified: data.emailVerified,
        globalRole: data.globalRole as PrismaGlobalRole,
        updatedAt: data.updatedAt,
      },
    })

    return this.mapToUser(user)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    })
  }

  // ========================================
  // Admin statistics
  // ========================================

  async count(): Promise<number> {
    return this.prisma.user.count()
  }

  async countCreatedAfter(date: Date): Promise<number> {
    return this.prisma.user.count({
      where: {
        createdAt: { gte: date },
      },
    })
  }

  async countActiveAfter(date: Date): Promise<number> {
    // Active users are those who have logged in recently
    // Using sessions as a proxy for activity
    return this.prisma.user.count({
      where: {
        sessions: {
          some: {
            expires: { gte: date },
          },
        },
      },
    })
  }

  // ========================================
  // Admin queries
  // ========================================

  async findRecent(limit: number): Promise<UserWithSubscription[]> {
    const users = await this.prisma.user.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: true,
      },
    })

    return users.map((user) => this.mapToUserWithSubscription(user))
  }

  async findForAdmin(
    filters: AdminUserFilters & { page: number; limit: number }
  ): Promise<PaginatedResult<UserWithDetails>> {
    const where: Prisma.UserWhereInput = {}

    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    if (filters.globalRole) {
      where.globalRole = filters.globalRole as PrismaGlobalRole
    }

    if (filters.subscriptionPlan || filters.subscriptionStatus) {
      const subscriptionFilter: Prisma.SubscriptionWhereInput = {}
      if (filters.subscriptionPlan) {
        subscriptionFilter.plan = filters.subscriptionPlan as PrismaPlan
      }
      if (filters.subscriptionStatus) {
        subscriptionFilter.status = filters.subscriptionStatus as PrismaStatus
      }
      where.subscription = subscriptionFilter
    }

    if (filters.createdAtFrom || filters.createdAtTo) {
      const dateFilter: Prisma.DateTimeFilter = {}
      if (filters.createdAtFrom) {
        dateFilter.gte = filters.createdAtFrom
      }
      if (filters.createdAtTo) {
        dateFilter.lte = filters.createdAtTo
      }
      where.createdAt = dateFilter
    }

    const orderBy: Prisma.UserOrderByWithRelationInput = filters.sortBy
      ? { [filters.sortBy]: filters.sortOrder || 'desc' }
      : { createdAt: 'desc' }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        orderBy,
        include: {
          subscription: true,
          sessions: {
            orderBy: { expires: 'desc' },
            take: 1,
          },
          campaigns: {
            select: {
              id: true,
              dailyBudget: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ])

    const data: UserWithDetails[] = users.map((user) => ({
      ...this.mapToUserWithSubscription(user),
      campaignCount: user.campaigns.length,
      totalSpend: user.campaigns.reduce((sum, c) => sum + Number(c.dailyBudget), 0),
      lastLoginAt: user.sessions[0]?.expires ?? null,
    }))

    return {
      data,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    }
  }

  async findByIdWithDetails(id: string): Promise<UserWithDetails | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        subscription: true,
        sessions: {
          orderBy: { expires: 'desc' },
          take: 1,
        },
        campaigns: {
          select: {
            id: true,
            dailyBudget: true,
          },
        },
      },
    })

    if (!user) {
      return null
    }

    return {
      ...this.mapToUserWithSubscription(user),
      campaignCount: user.campaigns.length,
      totalSpend: user.campaigns.reduce((sum, c) => sum + Number(c.dailyBudget), 0),
      lastLoginAt: user.sessions[0]?.expires ?? null,
    }
  }

  async findByIdWithFullDetails(id: string): Promise<UserFullDetails | null> {
    const [user, teamMemberships] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id },
        include: {
          subscription: {
            include: {
              invoices: {
                orderBy: { createdAt: 'desc' },
                take: 10,
              },
            },
          },
          sessions: {
            orderBy: { expires: 'desc' },
            take: 1,
          },
          campaigns: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
              id: true,
              name: true,
              status: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.teamMember.findMany({
        where: { userId: id },
        include: {
          team: true,
        },
        orderBy: { joinedAt: 'desc' },
      }),
    ])

    if (!user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      emailVerified: user.emailVerified,
      globalRole: user.globalRole as GlobalRole,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      subscription: user.subscription
        ? {
            id: user.subscription.id,
            plan: user.subscription.plan as SubscriptionPlan,
            status: user.subscription.status as SubscriptionStatus,
            currentPeriodStart: user.subscription.currentPeriodStart,
            currentPeriodEnd: user.subscription.currentPeriodEnd,
            cancelledAt: user.subscription.cancelledAt,
            createdAt: user.subscription.createdAt,
          }
        : null,
      teams: teamMemberships.map((tm) => ({
        id: tm.team.id,
        name: tm.team.name,
        role: tm.role,
        joinedAt: tm.joinedAt ?? tm.createdAt,
      })),
      campaigns: user.campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        createdAt: c.createdAt,
      })),
      invoices: user.subscription?.invoices.map((inv) => ({
        id: inv.id,
        amount: Number(inv.amount),
        currency: inv.currency,
        status: inv.status,
        paidAt: inv.paidAt,
        createdAt: inv.createdAt,
      })) ?? [],
      lastActiveAt: user.sessions[0]?.expires ?? null,
    }
  }

  // ========================================
  // Role management
  // ========================================

  async countByRole(role: GlobalRole): Promise<number> {
    return this.prisma.user.count({
      where: {
        globalRole: role as PrismaGlobalRole,
      },
    })
  }

  async updateRole(userId: string, role: GlobalRole): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        globalRole: role as PrismaGlobalRole,
      },
    })
  }

  // ========================================
  // Private helpers
  // ========================================

  private mapToUser(
    prismaUser: {
      id: string
      email: string
      name: string | null
      image: string | null
      emailVerified: Date | null
      globalRole: string
      createdAt: Date
      updatedAt: Date
    }
  ): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      name: prismaUser.name,
      image: prismaUser.image,
      emailVerified: prismaUser.emailVerified,
      globalRole: prismaUser.globalRole as GlobalRole,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    }
  }

  private mapToUserWithSubscription(
    prismaUser: {
      id: string
      email: string
      name: string | null
      image: string | null
      emailVerified: Date | null
      globalRole: string
      createdAt: Date
      updatedAt: Date
      subscription?: {
        id: string
        plan: string
        status: string
        currentPeriodEnd: Date
      } | null
    }
  ): UserWithSubscription {
    return {
      ...this.mapToUser(prismaUser),
      subscription: prismaUser.subscription
        ? {
            id: prismaUser.subscription.id,
            plan: prismaUser.subscription.plan as SubscriptionPlan,
            status: prismaUser.subscription.status as SubscriptionStatus,
            currentPeriodEnd: prismaUser.subscription.currentPeriodEnd,
          }
        : null,
    }
  }
}
