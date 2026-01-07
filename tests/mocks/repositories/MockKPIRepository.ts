import { KPI } from '@domain/entities/KPI'
import { IKPIRepository, KPIFilters, DailyKPIAggregate } from '@domain/repositories/IKPIRepository'

export class MockKPIRepository implements IKPIRepository {
  private kpis: Map<string, KPI> = new Map()

  async save(kpi: KPI): Promise<KPI> {
    this.kpis.set(kpi.id, kpi)
    return kpi
  }

  async saveMany(kpis: KPI[]): Promise<KPI[]> {
    for (const kpi of kpis) {
      this.kpis.set(kpi.id, kpi)
    }
    return kpis
  }

  async findById(id: string): Promise<KPI | null> {
    return this.kpis.get(id) || null
  }

  async findByCampaignId(campaignId: string): Promise<KPI[]> {
    return Array.from(this.kpis.values()).filter(
      (k) => k.campaignId === campaignId
    )
  }

  async findByCampaignIdAndDateRange(
    campaignId: string,
    startDate: Date,
    endDate: Date
  ): Promise<KPI[]> {
    return Array.from(this.kpis.values()).filter(
      (k) =>
        k.campaignId === campaignId &&
        k.date >= startDate &&
        k.date <= endDate
    )
  }

  async findLatestByCampaignId(campaignId: string): Promise<KPI | null> {
    const kpis = Array.from(this.kpis.values())
      .filter((k) => k.campaignId === campaignId)
      .sort((a, b) => b.date.getTime() - a.date.getTime())

    return kpis[0] || null
  }

  async findByFilters(filters: KPIFilters): Promise<KPI[]> {
    let results = Array.from(this.kpis.values())

    if (filters.campaignId) {
      results = results.filter((k) => k.campaignId === filters.campaignId)
    }

    if (filters.dateFrom) {
      results = results.filter((k) => k.date >= filters.dateFrom!)
    }

    if (filters.dateTo) {
      results = results.filter((k) => k.date <= filters.dateTo!)
    }

    return results
  }

  async aggregateByCampaignId(
    campaignId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalImpressions: number
    totalClicks: number
    totalConversions: number
    totalSpend: number
    totalRevenue: number
  }> {
    const kpis = await this.findByCampaignIdAndDateRange(
      campaignId,
      startDate,
      endDate
    )

    return kpis.reduce(
      (acc, kpi) => ({
        totalImpressions: acc.totalImpressions + kpi.impressions,
        totalClicks: acc.totalClicks + kpi.clicks,
        totalConversions: acc.totalConversions + kpi.conversions,
        totalSpend: acc.totalSpend + kpi.spend.amount,
        totalRevenue: acc.totalRevenue + kpi.revenue.amount,
      }),
      {
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalSpend: 0,
        totalRevenue: 0,
      }
    )
  }

  async getDailyAggregates(
    campaignIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<DailyKPIAggregate[]> {
    if (campaignIds.length === 0) {
      return []
    }

    const kpis = Array.from(this.kpis.values()).filter(
      (kpi) =>
        campaignIds.includes(kpi.campaignId) &&
        kpi.date >= startDate &&
        kpi.date <= endDate
    )

    // Group by date (YYYY-MM-DD)
    const grouped = new Map<string, DailyKPIAggregate>()

    for (const kpi of kpis) {
      const dateKey = kpi.date.toISOString().split('T')[0]
      const existing = grouped.get(dateKey)

      if (existing) {
        existing.totalImpressions += kpi.impressions
        existing.totalClicks += kpi.clicks
        existing.totalConversions += kpi.conversions
        existing.totalSpend += kpi.spend.amount
        existing.totalRevenue += kpi.revenue.amount
      } else {
        grouped.set(dateKey, {
          date: new Date(dateKey),
          totalImpressions: kpi.impressions,
          totalClicks: kpi.clicks,
          totalConversions: kpi.conversions,
          totalSpend: kpi.spend.amount,
          totalRevenue: kpi.revenue.amount,
        })
      }
    }

    // Sort by date ascending
    return Array.from(grouped.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    )
  }

  async getCumulativeSpend(campaignId: string, date: Date): Promise<number> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const kpis = Array.from(this.kpis.values()).filter(
      (kpi) =>
        kpi.campaignId === campaignId &&
        kpi.date >= startOfDay &&
        kpi.date <= endOfDay
    )

    return kpis.reduce((total, kpi) => total + kpi.spend.amount, 0)
  }

  async delete(id: string): Promise<void> {
    this.kpis.delete(id)
  }

  async deleteByCampaignId(campaignId: string): Promise<void> {
    for (const [id, kpi] of this.kpis.entries()) {
      if (kpi.campaignId === campaignId) {
        this.kpis.delete(id)
      }
    }
  }

  // Test helpers
  clear(): void {
    this.kpis.clear()
  }

  getAll(): KPI[] {
    return Array.from(this.kpis.values())
  }
}
