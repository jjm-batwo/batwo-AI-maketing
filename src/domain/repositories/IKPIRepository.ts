import { KPI } from '../entities/KPI'

export interface KPIFilters {
  campaignId?: string
  dateFrom?: Date
  dateTo?: Date
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
  delete(id: string): Promise<void>
  deleteByCampaignId(campaignId: string): Promise<void>
}
