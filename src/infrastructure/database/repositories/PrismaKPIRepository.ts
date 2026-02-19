import { PrismaClient } from '@/generated/prisma'
import { IKPIRepository, KPIFilters, DailyKPIAggregate } from '@domain/repositories/IKPIRepository'
import { KPI } from '@domain/entities/KPI'
import { KPIMapper } from '../mappers/KPIMapper'

export class PrismaKPIRepository implements IKPIRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(kpi: KPI): Promise<KPI> {
    const data = KPIMapper.toCreateInput(kpi)

    // Use upsert to handle re-sync (update existing record for same campaign+date)
    const saved = await this.prisma.kPISnapshot.upsert({
      where: {
        campaignId_date: {
          campaignId: data.campaignId,
          date: data.date,
        },
      },
      update: {
        impressions: data.impressions,
        clicks: data.clicks,
        linkClicks: data.linkClicks,
        conversions: data.conversions,
        spend: data.spend,
        currency: data.currency,
        revenue: data.revenue,
      },
      create: {
        id: data.id,
        impressions: data.impressions,
        clicks: data.clicks,
        linkClicks: data.linkClicks,
        conversions: data.conversions,
        spend: data.spend,
        currency: data.currency,
        revenue: data.revenue,
        date: data.date,
        createdAt: data.createdAt,
        campaign: {
          connect: { id: data.campaignId },
        },
      },
    })

    return KPIMapper.toDomain(saved)
  }

  async saveMany(kpis: KPI[]): Promise<KPI[]> {
    const results: KPI[] = []

    for (const kpi of kpis) {
      const saved = await this.save(kpi)
      results.push(saved)
    }

    return results
  }

  async findById(id: string): Promise<KPI | null> {
    const kpi = await this.prisma.kPISnapshot.findUnique({
      where: { id },
    })

    if (!kpi) {
      return null
    }

    return KPIMapper.toDomain(kpi)
  }

  async findByCampaignId(campaignId: string): Promise<KPI[]> {
    const kpis = await this.prisma.kPISnapshot.findMany({
      where: { campaignId },
      orderBy: { date: 'desc' },
    })

    return kpis.map(KPIMapper.toDomain)
  }

  async findByCampaignIdAndDateRange(
    campaignId: string,
    startDate: Date,
    endDate: Date
  ): Promise<KPI[]> {
    const kpis = await this.prisma.kPISnapshot.findMany({
      where: {
        campaignId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    })

    return kpis.map(KPIMapper.toDomain)
  }

  async findLatestByCampaignId(campaignId: string): Promise<KPI | null> {
    const kpi = await this.prisma.kPISnapshot.findFirst({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
    })

    if (!kpi) {
      return null
    }

    return KPIMapper.toDomain(kpi)
  }

  async findByFilters(filters: KPIFilters): Promise<KPI[]> {
    const where = this.buildWhereClause(filters)

    const kpis = await this.prisma.kPISnapshot.findMany({
      where,
      orderBy: { date: 'desc' },
    })

    return kpis.map(KPIMapper.toDomain)
  }

  async aggregateByCampaignId(
    campaignId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalImpressions: number
    totalClicks: number
    totalLinkClicks: number
    totalConversions: number
    totalSpend: number
    totalRevenue: number
  }> {
    console.log('[aggregateByCampaignId] Input params:', {
      campaignId,
      startDate,
      endDate,
    })

    const result = await this.prisma.kPISnapshot.aggregate({
      where: {
        campaignId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        impressions: true,
        clicks: true,
        linkClicks: true,
        conversions: true,
        spend: true,
        revenue: true,
      },
    })

    console.log('[aggregateByCampaignId] Raw result from aggregate:', result)

    const output = {
      totalImpressions: result._sum.impressions ?? 0,
      totalClicks: result._sum.clicks ?? 0,
      totalLinkClicks: result._sum.linkClicks ?? 0,
      totalConversions: result._sum.conversions ?? 0,
      totalSpend: Number(result._sum.spend ?? 0),
      totalRevenue: Number(result._sum.revenue ?? 0),
    }

    console.log('[aggregateByCampaignId] Mapped output:', output)

    return output
  }

  async aggregateByCampaignIds(
    campaignIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<Map<string, {
    totalImpressions: number
    totalClicks: number
    totalLinkClicks: number
    totalConversions: number
    totalSpend: number
    totalRevenue: number
  }>> {
    if (campaignIds.length === 0) {
      return new Map()
    }

    const results = await this.prisma.kPISnapshot.groupBy({
      by: ['campaignId'],
      where: {
        campaignId: { in: campaignIds },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        impressions: true,
        clicks: true,
        linkClicks: true,
        conversions: true,
        spend: true,
        revenue: true,
      },
    })

    const map = new Map<string, {
      totalImpressions: number
      totalClicks: number
      totalLinkClicks: number
      totalConversions: number
      totalSpend: number
      totalRevenue: number
    }>()

    for (const r of results) {
      map.set(r.campaignId, {
        totalImpressions: r._sum.impressions ?? 0,
        totalClicks: r._sum.clicks ?? 0,
        totalLinkClicks: r._sum.linkClicks ?? 0,
        totalConversions: r._sum.conversions ?? 0,
        totalSpend: Number(r._sum.spend ?? 0),
        totalRevenue: Number(r._sum.revenue ?? 0),
      })
    }

    return map
  }

  async getDailyAggregates(
    campaignIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<DailyKPIAggregate[]> {
    console.log('[getDailyAggregates] Input params:', {
      campaignIds,
      startDate,
      endDate,
    })

    if (campaignIds.length === 0) {
      return []
    }

    const results = await this.prisma.kPISnapshot.groupBy({
      by: ['date'],
      where: {
        campaignId: { in: campaignIds },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        impressions: true,
        clicks: true,
        linkClicks: true,
        conversions: true,
        spend: true,
        revenue: true,
      },
      orderBy: { date: 'asc' },
    })

    console.log('[getDailyAggregates] Raw results from groupBy:', results)

    const mapped = results.map((r) => ({
      date: r.date,
      totalImpressions: r._sum.impressions ?? 0,
      totalClicks: r._sum.clicks ?? 0,
      totalLinkClicks: r._sum.linkClicks ?? 0,
      totalConversions: r._sum.conversions ?? 0,
      totalSpend: Number(r._sum.spend ?? 0),
      totalRevenue: Number(r._sum.revenue ?? 0),
    }))

    console.log('[getDailyAggregates] Mapped output:', mapped)

    return mapped
  }

  async getCumulativeSpend(campaignId: string, date: Date): Promise<number> {
    // 해당 날짜의 지출액 조회
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const result = await this.prisma.kPISnapshot.aggregate({
      where: {
        campaignId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      _sum: {
        spend: true,
      },
    })

    return Number(result._sum.spend ?? 0)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.kPISnapshot.delete({
      where: { id },
    })
  }

  async deleteByCampaignId(campaignId: string): Promise<void> {
    await this.prisma.kPISnapshot.deleteMany({
      where: { campaignId },
    })
  }

  private buildWhereClause(filters: KPIFilters) {
    const where: Record<string, unknown> = {}

    if (filters.campaignId) {
      where.campaignId = filters.campaignId
    }

    if (filters.dateFrom || filters.dateTo) {
      where.date = {}
      if (filters.dateFrom) {
        (where.date as Record<string, Date>).gte = filters.dateFrom
      }
      if (filters.dateTo) {
        (where.date as Record<string, Date>).lte = filters.dateTo
      }
    }

    return where
  }
}
