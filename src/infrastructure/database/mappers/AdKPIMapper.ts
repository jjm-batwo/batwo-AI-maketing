import { AdKPISnapshot as PrismaAdKPI, Prisma } from '@/generated/prisma'
import { AdKPI } from '@domain/entities/AdKPI'
import { Money, Currency } from '@domain/value-objects/Money'

const { Decimal } = Prisma

export class AdKPIMapper {
  static toDomain(prisma: PrismaAdKPI): AdKPI {
    return AdKPI.restore({
      id: prisma.id,
      adId: prisma.adId,
      adSetId: prisma.adSetId,
      campaignId: prisma.campaignId,
      creativeId: prisma.creativeId,
      impressions: prisma.impressions,
      clicks: prisma.clicks,
      linkClicks: prisma.linkClicks,
      conversions: prisma.conversions,
      spend: Money.create(Number(prisma.spend), prisma.currency as Currency),
      revenue: Money.create(Number(prisma.revenue), prisma.currency as Currency),
      reach: prisma.reach,
      frequency: Number(prisma.frequency),
      cpm: Number(prisma.cpm),
      cpc: Number(prisma.cpc),
      videoViews: prisma.videoViews,
      thruPlays: prisma.thruPlays,
      date: prisma.date,
      createdAt: prisma.createdAt,
    })
  }

  static toCreateInput(domain: AdKPI) {
    const json = domain.toJSON()
    return {
      id: json.id,
      adId: json.adId,
      adSetId: json.adSetId,
      campaignId: json.campaignId,
      creativeId: json.creativeId,
      impressions: json.impressions,
      clicks: json.clicks,
      linkClicks: json.linkClicks,
      conversions: json.conversions,
      spend: new Decimal(json.spend.amount),
      currency: json.spend.currency,
      revenue: new Decimal(json.revenue.amount),
      reach: json.reach,
      frequency: new Decimal(json.frequency),
      cpm: new Decimal(json.cpm),
      cpc: new Decimal(json.cpc),
      videoViews: json.videoViews,
      thruPlays: json.thruPlays,
      date: json.date,
      createdAt: json.createdAt,
    }
  }
}
