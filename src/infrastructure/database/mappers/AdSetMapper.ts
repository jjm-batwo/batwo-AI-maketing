import {
  AdSet as PrismaAdSet,
  AdSetStatus as PrismaAdSetStatus,
  BillingEvent as PrismaBillingEvent,
  OptimizationGoal as PrismaOptimizationGoal,
  BidStrategy as PrismaBidStrategy,
  Prisma,
} from '@/generated/prisma'
import { AdSet } from '@domain/entities/AdSet'
import { AdSetStatus } from '@domain/value-objects/AdSetStatus'
import { BillingEvent } from '@domain/value-objects/BillingEvent'
import { OptimizationGoal } from '@domain/value-objects/OptimizationGoal'
import { BidStrategy } from '@domain/value-objects/BidStrategy'
import { Money, Currency } from '@domain/value-objects/Money'

const { Decimal } = Prisma

type JsonValue = Prisma.JsonValue

export class AdSetMapper {
  static toDomain(prisma: PrismaAdSet): AdSet {
    return AdSet.restore({
      id: prisma.id,
      campaignId: prisma.campaignId,
      name: prisma.name,
      status: prisma.status as AdSetStatus,
      dailyBudget: prisma.dailyBudget
        ? Money.create(Number(prisma.dailyBudget), prisma.currency as Currency)
        : undefined,
      lifetimeBudget: prisma.lifetimeBudget
        ? Money.create(Number(prisma.lifetimeBudget), prisma.currency as Currency)
        : undefined,
      currency: prisma.currency,
      billingEvent: prisma.billingEvent as BillingEvent,
      optimizationGoal: prisma.optimizationGoal as OptimizationGoal,
      bidStrategy: prisma.bidStrategy as BidStrategy,
      targeting: prisma.targeting as Record<string, unknown> | undefined,
      placements: prisma.placements as Record<string, unknown> | undefined,
      schedule: prisma.schedule as Record<string, unknown> | undefined,
      startDate: prisma.startDate,
      endDate: prisma.endDate ?? undefined,
      metaAdSetId: prisma.metaAdSetId ?? undefined,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    })
  }

  static toCreateInput(domain: AdSet) {
    const json = domain.toJSON()
    return {
      id: json.id,
      campaignId: json.campaignId,
      name: json.name,
      status: json.status as PrismaAdSetStatus,
      dailyBudget: json.dailyBudget ? new Decimal(json.dailyBudget.amount) : null,
      lifetimeBudget: json.lifetimeBudget ? new Decimal(json.lifetimeBudget.amount) : null,
      currency: json.currency ?? 'KRW',
      billingEvent: json.billingEvent as PrismaBillingEvent,
      optimizationGoal: json.optimizationGoal as PrismaOptimizationGoal,
      bidStrategy: json.bidStrategy as PrismaBidStrategy,
      targeting: json.targeting as JsonValue ?? Prisma.JsonNull,
      placements: json.placements as JsonValue ?? Prisma.JsonNull,
      schedule: json.schedule as JsonValue ?? Prisma.JsonNull,
      startDate: json.startDate,
      endDate: json.endDate ?? null,
      metaAdSetId: json.metaAdSetId ?? null,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
    }
  }

  static toUpdateInput(domain: AdSet) {
    const json = domain.toJSON()
    return {
      name: json.name,
      status: json.status as PrismaAdSetStatus,
      dailyBudget: json.dailyBudget ? new Decimal(json.dailyBudget.amount) : null,
      lifetimeBudget: json.lifetimeBudget ? new Decimal(json.lifetimeBudget.amount) : null,
      currency: json.currency ?? 'KRW',
      billingEvent: json.billingEvent as PrismaBillingEvent,
      optimizationGoal: json.optimizationGoal as PrismaOptimizationGoal,
      bidStrategy: json.bidStrategy as PrismaBidStrategy,
      targeting: json.targeting as JsonValue ?? Prisma.JsonNull,
      placements: json.placements as JsonValue ?? Prisma.JsonNull,
      schedule: json.schedule as JsonValue ?? Prisma.JsonNull,
      startDate: json.startDate,
      endDate: json.endDate ?? null,
      metaAdSetId: json.metaAdSetId ?? null,
      updatedAt: new Date(),
    }
  }
}
