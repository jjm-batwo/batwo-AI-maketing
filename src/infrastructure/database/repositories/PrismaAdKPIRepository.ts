import { PrismaClient } from '@/generated/prisma'
import {
  IAdKPIRepository,
  AdKPIAggregate,
  DailyAdKPIAggregate,
  FormatAggregate,
  CreativeAggregate,
} from '@domain/repositories/IAdKPIRepository'
import { AdKPI } from '@domain/entities/AdKPI'
import { AdKPIMapper } from '../mappers/AdKPIMapper'

export class PrismaAdKPIRepository implements IAdKPIRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(kpi: AdKPI): Promise<AdKPI> {
    const data = AdKPIMapper.toCreateInput(kpi)

    const saved = await this.prisma.adKPISnapshot.upsert({
      where: {
        adId_date: {
          adId: data.adId,
          date: data.date,
        },
      },
      update: {
        adSetId: data.adSetId,
        campaignId: data.campaignId,
        creativeId: data.creativeId,
        impressions: data.impressions,
        clicks: data.clicks,
        linkClicks: data.linkClicks,
        conversions: data.conversions,
        spend: data.spend,
        currency: data.currency,
        revenue: data.revenue,
        reach: data.reach,
        frequency: data.frequency,
        cpm: data.cpm,
        cpc: data.cpc,
        videoViews: data.videoViews,
        thruPlays: data.thruPlays,
      },
      create: {
        id: data.id,
        adId: data.adId,
        adSetId: data.adSetId,
        campaignId: data.campaignId,
        creativeId: data.creativeId,
        impressions: data.impressions,
        clicks: data.clicks,
        linkClicks: data.linkClicks,
        conversions: data.conversions,
        spend: data.spend,
        currency: data.currency,
        revenue: data.revenue,
        reach: data.reach,
        frequency: data.frequency,
        cpm: data.cpm,
        cpc: data.cpc,
        videoViews: data.videoViews,
        thruPlays: data.thruPlays,
        date: data.date,
        createdAt: data.createdAt,
      },
    })

    return AdKPIMapper.toDomain(saved)
  }

  async saveMany(kpis: AdKPI[]): Promise<AdKPI[]> {
    if (kpis.length === 0) return []

    const operations = kpis.map((kpi) => {
      const data = AdKPIMapper.toCreateInput(kpi)
      return this.prisma.adKPISnapshot.upsert({
        where: {
          adId_date: {
            adId: data.adId,
            date: data.date,
          },
        },
        update: {
          adSetId: data.adSetId,
          campaignId: data.campaignId,
          creativeId: data.creativeId,
          impressions: data.impressions,
          clicks: data.clicks,
          linkClicks: data.linkClicks,
          conversions: data.conversions,
          spend: data.spend,
          currency: data.currency,
          revenue: data.revenue,
          reach: data.reach,
          frequency: data.frequency,
          cpm: data.cpm,
          cpc: data.cpc,
          videoViews: data.videoViews,
          thruPlays: data.thruPlays,
        },
        create: {
          id: data.id,
          adId: data.adId,
          adSetId: data.adSetId,
          campaignId: data.campaignId,
          creativeId: data.creativeId,
          impressions: data.impressions,
          clicks: data.clicks,
          linkClicks: data.linkClicks,
          conversions: data.conversions,
          spend: data.spend,
          currency: data.currency,
          revenue: data.revenue,
          reach: data.reach,
          frequency: data.frequency,
          cpm: data.cpm,
          cpc: data.cpc,
          videoViews: data.videoViews,
          thruPlays: data.thruPlays,
          date: data.date,
          createdAt: data.createdAt,
        },
      })
    })

    const results = await this.prisma.$transaction(operations)
    return results.map(AdKPIMapper.toDomain)
  }

  async upsertMany(kpis: AdKPI[]): Promise<number> {
    if (kpis.length === 0) return 0
    const saved = await this.saveMany(kpis)
    return saved.length
  }

  async findByAdId(adId: string, startDate: Date, endDate: Date): Promise<AdKPI[]> {
    const records = await this.prisma.adKPISnapshot.findMany({
      where: {
        adId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    })
    return records.map(AdKPIMapper.toDomain)
  }

  async findByCampaignId(
    campaignId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AdKPI[]> {
    const records = await this.prisma.adKPISnapshot.findMany({
      where: {
        campaignId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    })
    return records.map(AdKPIMapper.toDomain)
  }

  async findByCreativeId(
    creativeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AdKPI[]> {
    const records = await this.prisma.adKPISnapshot.findMany({
      where: {
        creativeId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    })
    return records.map(AdKPIMapper.toDomain)
  }

  async aggregateByCampaignId(
    campaignId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AdKPIAggregate> {
    const result = await this.prisma.adKPISnapshot.aggregate({
      where: {
        campaignId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: {
        impressions: true,
        clicks: true,
        linkClicks: true,
        conversions: true,
        spend: true,
        revenue: true,
        reach: true,
        videoViews: true,
        thruPlays: true,
      },
      _avg: {
        frequency: true,
        cpm: true,
        cpc: true,
      },
    })

    return {
      totalImpressions: result._sum.impressions ?? 0,
      totalClicks: result._sum.clicks ?? 0,
      totalLinkClicks: result._sum.linkClicks ?? 0,
      totalConversions: result._sum.conversions ?? 0,
      totalSpend: Number(result._sum.spend ?? 0),
      totalRevenue: Number(result._sum.revenue ?? 0),
      totalReach: result._sum.reach ?? 0,
      avgFrequency: Number(result._avg.frequency ?? 0),
      avgCpm: Number(result._avg.cpm ?? 0),
      avgCpc: Number(result._avg.cpc ?? 0),
      totalVideoViews: result._sum.videoViews ?? 0,
      totalThruPlays: result._sum.thruPlays ?? 0,
    }
  }

  async aggregateByCreativeId(
    creativeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AdKPIAggregate> {
    const result = await this.prisma.adKPISnapshot.aggregate({
      where: {
        creativeId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: {
        impressions: true,
        clicks: true,
        linkClicks: true,
        conversions: true,
        spend: true,
        revenue: true,
        reach: true,
        videoViews: true,
        thruPlays: true,
      },
      _avg: {
        frequency: true,
        cpm: true,
        cpc: true,
      },
    })

    return {
      totalImpressions: result._sum.impressions ?? 0,
      totalClicks: result._sum.clicks ?? 0,
      totalLinkClicks: result._sum.linkClicks ?? 0,
      totalConversions: result._sum.conversions ?? 0,
      totalSpend: Number(result._sum.spend ?? 0),
      totalRevenue: Number(result._sum.revenue ?? 0),
      totalReach: result._sum.reach ?? 0,
      avgFrequency: Number(result._avg.frequency ?? 0),
      avgCpm: Number(result._avg.cpm ?? 0),
      avgCpc: Number(result._avg.cpc ?? 0),
      totalVideoViews: result._sum.videoViews ?? 0,
      totalThruPlays: result._sum.thruPlays ?? 0,
    }
  }

  async aggregateByFormat(
    campaignIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<FormatAggregate[]> {
    if (campaignIds.length === 0) return []

    const results = await this.prisma.$queryRaw<
      Array<{
        format: string
        totalimpressions: bigint
        totalclicks: bigint
        totalconversions: bigint
        totalspend: number
        totalrevenue: number
      }>
    >`
      SELECT
        c.format,
        SUM(k.impressions)::bigint as totalimpressions,
        SUM(k.clicks)::bigint as totalclicks,
        SUM(k.conversions)::bigint as totalconversions,
        SUM(k.spend)::numeric as totalspend,
        SUM(k.revenue)::numeric as totalrevenue
      FROM "AdKPISnapshot" k
      JOIN "Creative" c ON k."creativeId" = c.id
      WHERE k."campaignId" = ANY(${campaignIds})
        AND k.date >= ${startDate}
        AND k.date <= ${endDate}
      GROUP BY c.format
    `

    return results.map((r) => ({
      format: r.format,
      totalImpressions: Number(r.totalimpressions),
      totalClicks: Number(r.totalclicks),
      totalConversions: Number(r.totalconversions),
      totalSpend: Number(r.totalspend),
      totalRevenue: Number(r.totalrevenue),
    }))
  }

  async getDailyAggregatesByCampaignIds(
    campaignIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<DailyAdKPIAggregate[]> {
    if (campaignIds.length === 0) return []

    const results = await this.prisma.adKPISnapshot.groupBy({
      by: ['date'],
      where: {
        campaignId: { in: campaignIds },
        date: { gte: startDate, lte: endDate },
      },
      _sum: {
        impressions: true,
        clicks: true,
        conversions: true,
        spend: true,
        revenue: true,
      },
      orderBy: { date: 'asc' },
    })

    return results.map((r) => ({
      date: r.date,
      totalImpressions: r._sum.impressions ?? 0,
      totalClicks: r._sum.clicks ?? 0,
      totalConversions: r._sum.conversions ?? 0,
      totalSpend: Number(r._sum.spend ?? 0),
      totalRevenue: Number(r._sum.revenue ?? 0),
    }))
  }

  async getTopCreatives(
    campaignIds: string[],
    startDate: Date,
    endDate: Date,
    limit: number,
    sortBy: 'roas' | 'conversions' | 'spend'
  ): Promise<CreativeAggregate[]> {
    if (campaignIds.length === 0) return []

    const orderClause =
      sortBy === 'roas'
        ? 'CASE WHEN SUM(k.spend) > 0 THEN SUM(k.revenue) / SUM(k.spend) ELSE 0 END DESC'
        : sortBy === 'conversions'
          ? 'SUM(k.conversions) DESC'
          : 'SUM(k.spend) DESC'

    const results = await this.prisma.$queryRawUnsafe<
      Array<{
        creativeid: string
        name: string
        format: string
        totalimpressions: bigint
        totalclicks: bigint
        totalconversions: bigint
        totalspend: number
        totalrevenue: number
        avgfrequency: number
      }>
    >(
      `
      SELECT
        k."creativeId" as creativeid,
        c.name,
        c.format,
        SUM(k.impressions)::bigint as totalimpressions,
        SUM(k.clicks)::bigint as totalclicks,
        SUM(k.conversions)::bigint as totalconversions,
        SUM(k.spend)::numeric as totalspend,
        SUM(k.revenue)::numeric as totalrevenue,
        AVG(k.frequency)::numeric as avgfrequency
      FROM "AdKPISnapshot" k
      JOIN "Creative" c ON k."creativeId" = c.id
      WHERE k."campaignId" = ANY($1)
        AND k.date >= $2
        AND k.date <= $3
      GROUP BY k."creativeId", c.name, c.format
      ORDER BY ${orderClause}
      LIMIT $4
    `,
      campaignIds,
      startDate,
      endDate,
      limit
    )

    return results.map((r) => ({
      creativeId: r.creativeid,
      name: r.name,
      format: r.format,
      totalImpressions: Number(r.totalimpressions),
      totalClicks: Number(r.totalclicks),
      totalConversions: Number(r.totalconversions),
      totalSpend: Number(r.totalspend),
      totalRevenue: Number(r.totalrevenue),
      avgFrequency: Number(r.avgfrequency),
    }))
  }
}
