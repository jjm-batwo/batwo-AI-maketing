import {
  ABTest as PrismaABTest,
  ABTestVariant as PrismaABTestVariant,
  ABTestStatus as PrismaABTestStatus,
  Prisma,
} from '@/generated/prisma'
import { ABTest, ABTestVariant, ABTestStatus } from '@domain/entities/ABTest'
import { Money, Currency } from '@domain/value-objects/Money'

const { Decimal } = Prisma

type PrismaABTestWithVariants = PrismaABTest & {
  variants: PrismaABTestVariant[]
}

export class ABTestMapper {
  static toDomain(prisma: PrismaABTestWithVariants): ABTest {
    const variants: ABTestVariant[] = prisma.variants.map((v) => ({
      id: v.id,
      name: v.name,
      description: v.description ?? undefined,
      trafficPercent: v.trafficPercent,
      impressions: v.impressions,
      clicks: v.clicks,
      conversions: v.conversions,
      spend: Money.create(Number(v.spend), v.currency as Currency),
      revenue: Money.create(Number(v.revenue), v.currency as Currency),
      isControl: v.isControl,
    }))

    return ABTest.create({
      id: prisma.id,
      campaignId: prisma.campaignId,
      name: prisma.name,
      description: prisma.description ?? undefined,
      status: prisma.status as ABTestStatus,
      variants,
      startDate: prisma.startDate,
      endDate: prisma.endDate,
      confidenceLevel: prisma.confidenceLevel,
      minimumSampleSize: prisma.minimumSampleSize,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    })
  }

  static toCreateInput(domain: ABTest, currency: string = 'KRW') {
    return {
      id: domain.id,
      campaignId: domain.campaignId,
      name: domain.name,
      description: domain.description || null,
      status: domain.status as PrismaABTestStatus,
      startDate: domain.startDate,
      endDate: domain.endDate,
      confidenceLevel: domain.confidenceLevel,
      minimumSampleSize: domain.minimumSampleSize,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      variants: {
        create: domain.variants.map((v) => ({
          id: v.id,
          name: v.name,
          description: v.description || null,
          trafficPercent: v.trafficPercent,
          impressions: v.impressions,
          clicks: v.clicks,
          conversions: v.conversions,
          spend: new Decimal(v.spend.amount),
          currency: currency,
          revenue: new Decimal(v.revenue.amount),
          isControl: v.isControl,
        })),
      },
    }
  }

  static toUpdateInput(domain: ABTest) {
    return {
      name: domain.name,
      description: domain.description || null,
      status: domain.status as PrismaABTestStatus,
      endDate: domain.endDate,
      confidenceLevel: domain.confidenceLevel,
      minimumSampleSize: domain.minimumSampleSize,
      updatedAt: new Date(),
    }
  }

  static toVariantUpdateInput(variant: ABTestVariant) {
    return {
      name: variant.name,
      description: variant.description || null,
      trafficPercent: variant.trafficPercent,
      impressions: variant.impressions,
      clicks: variant.clicks,
      conversions: variant.conversions,
      spend: new Decimal(variant.spend.amount),
      revenue: new Decimal(variant.revenue.amount),
      isControl: variant.isControl,
      updatedAt: new Date(),
    }
  }
}
