import {
  Campaign as PrismaCampaign,
  CampaignObjective as PrismaObjective,
  CampaignStatus as PrismaStatus,
  Prisma,
} from '@/generated/prisma'
import { Campaign, TargetAudience } from '@domain/entities/Campaign'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'
import { Money, Currency } from '@domain/value-objects/Money'

const { Decimal } = Prisma

type JsonValue = Prisma.JsonValue

export class CampaignMapper {
  static toDomain(prisma: PrismaCampaign): Campaign {
    return Campaign.restore({
      id: prisma.id,
      userId: prisma.userId,
      name: prisma.name,
      objective: prisma.objective as CampaignObjective,
      status: prisma.status as CampaignStatus,
      dailyBudget: Money.create(
        Number(prisma.dailyBudget),
        prisma.currency as Currency
      ),
      startDate: prisma.startDate,
      endDate: prisma.endDate ?? undefined,
      targetAudience: prisma.targetAudience as TargetAudience | undefined,
      metaCampaignId: prisma.metaCampaignId ?? undefined,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    })
  }

  static toPrisma(domain: Campaign): Omit<PrismaCampaign, 'user' | 'kpiSnapshots'> {
    const json = domain.toJSON()
    return {
      id: json.id,
      userId: json.userId,
      name: json.name,
      objective: json.objective as PrismaObjective,
      status: json.status as PrismaStatus,
      dailyBudget: new Decimal(json.dailyBudget.amount),
      currency: json.dailyBudget.currency,
      startDate: json.startDate,
      endDate: json.endDate ?? null,
      targetAudience: json.targetAudience as JsonValue ?? null,
      metaCampaignId: json.metaCampaignId ?? null,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
    }
  }

  static toCreateInput(domain: Campaign) {
    const json = domain.toJSON()
    return {
      id: json.id,
      userId: json.userId,
      name: json.name,
      objective: json.objective as PrismaObjective,
      status: json.status as PrismaStatus,
      dailyBudget: new Decimal(json.dailyBudget.amount),
      currency: json.dailyBudget.currency,
      startDate: json.startDate,
      endDate: json.endDate ?? null,
      targetAudience: json.targetAudience as JsonValue ?? Prisma.JsonNull,
      metaCampaignId: json.metaCampaignId ?? null,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
    }
  }

  static toUpdateInput(domain: Campaign) {
    const json = domain.toJSON()
    return {
      name: json.name,
      objective: json.objective as PrismaObjective,
      status: json.status as PrismaStatus,
      dailyBudget: new Decimal(json.dailyBudget.amount),
      currency: json.dailyBudget.currency,
      startDate: json.startDate,
      endDate: json.endDate ?? null,
      targetAudience: json.targetAudience as JsonValue ?? Prisma.JsonNull,
      metaCampaignId: json.metaCampaignId ?? null,
      updatedAt: new Date(),
    }
  }
}
