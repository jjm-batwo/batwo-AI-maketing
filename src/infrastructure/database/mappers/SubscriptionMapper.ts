import {
  Subscription as PrismaSubscription,
  SubscriptionPlan as PrismaPlan,
  SubscriptionStatus as PrismaStatus,
} from '@/generated/prisma'
import { Subscription } from '@domain/entities/Subscription'
import { SubscriptionPlan } from '@domain/value-objects/SubscriptionPlan'
import { SubscriptionStatus } from '@domain/value-objects/SubscriptionStatus'

export class SubscriptionMapper {
  static toDomain(prisma: PrismaSubscription): Subscription {
    return Subscription.restore({
      id: prisma.id,
      userId: prisma.userId,
      plan: prisma.plan as SubscriptionPlan,
      status: prisma.status as SubscriptionStatus,
      currentPeriodStart: prisma.currentPeriodStart,
      currentPeriodEnd: prisma.currentPeriodEnd,
      cancelledAt: prisma.cancelledAt ?? undefined,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    })
  }

  static toCreateInput(subscription: Subscription) {
    return {
      id: subscription.id,
      userId: subscription.userId,
      plan: subscription.plan as PrismaPlan,
      status: subscription.status as PrismaStatus,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelledAt: subscription.cancelledAt ?? null,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    }
  }

  static toUpdateInput(subscription: Subscription) {
    return {
      plan: subscription.plan as PrismaPlan,
      status: subscription.status as PrismaStatus,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelledAt: subscription.cancelledAt ?? null,
      updatedAt: subscription.updatedAt,
    }
  }
}
