import { KPI } from '../entities/KPI'

export interface KPIFilters {
  campaignId?: string
  dateFrom?: Date
  dateTo?: Date
}

export interface DailyKPIAggregate {
  date: Date
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  totalSpend: number
  totalRevenue: number
}

export interface IKPIRepository {
  save(kpi: KPI): Promise<KPI>
  saveMany(kpis: KPI[]): Promise<KPI[]>
  findById(id: string): Promise<KPI | null>
  findByCampaignId(campaignId: string): Promise<KPI[]>
  findByCampaignIdAndDateRange(
    campaignId: string,
    startDate: Date,
    endDate: Date
  ): Promise<KPI[]>
  findLatestByCampaignId(campaignId: string): Promise<KPI | null>
  findByFilters(filters: KPIFilters): Promise<KPI[]>
  aggregateByCampaignId(
    campaignId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalImpressions: number
    totalClicks: number
    totalConversions: number
    totalSpend: number
    totalRevenue: number
  }>
  getDailyAggregates(
    campaignIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<DailyKPIAggregate[]>
  /**
   * 오늘 날짜 기준 캠페인의 누적 지출액 조회
   */
  getCumulativeSpend(campaignId: string, date: Date): Promise<number>
  delete(id: string): Promise<void>
  deleteByCampaignId(campaignId: string): Promise<void>
}
