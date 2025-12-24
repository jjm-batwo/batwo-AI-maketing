import { KPISnapshot as PrismaKPI, Prisma } from '@/generated/prisma'
import { KPI } from '@domain/entities/KPI'
import { Money, Currency } from '@domain/value-objects/Money'

const { Decimal } = Prisma

export class KPIMapper {
  static toDomain(prisma: PrismaKPI): KPI {
    return KPI.restore({
      id: prisma.id,
      campaignId: prisma.campaignId,
      impressions: prisma.impressions,
      clicks: prisma.clicks,
      conversions: prisma.conversions,
      spend: Money.create(Number(prisma.spend), prisma.currency as Currency),
      revenue: Money.create(Number(prisma.revenue), prisma.currency as Currency),
      date: prisma.date,
      createdAt: prisma.createdAt,
    })
  }

  static toPrisma(domain: KPI): Omit<PrismaKPI, 'campaign'> {
    const json = domain.toJSON()
    return {
      id: json.id,
      campaignId: json.campaignId,
      impressions: json.impressions,
      clicks: json.clicks,
      conversions: json.conversions,
      spend: new Decimal(json.spend.amount),
      currency: json.spend.currency,
      revenue: new Decimal(json.revenue.amount),
      date: json.date,
      createdAt: json.createdAt,
    }
  }

  static toCreateInput(domain: KPI) {
    const json = domain.toJSON()
    return {
      id: json.id,
      campaignId: json.campaignId,
      impressions: json.impressions,
      clicks: json.clicks,
      conversions: json.conversions,
      spend: new Decimal(json.spend.amount),
      currency: json.spend.currency,
      revenue: new Decimal(json.revenue.amount),
      date: json.date,
      createdAt: json.createdAt,
    }
  }
}
