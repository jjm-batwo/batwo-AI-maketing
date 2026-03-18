import { AdKPI } from '../entities/AdKPI'

export interface AdKPIAggregate {
  totalImpressions: number
  totalClicks: number
  totalLinkClicks: number
  totalConversions: number
  totalSpend: number
  totalRevenue: number
  totalReach: number
  avgFrequency: number
  avgCpm: number
  avgCpc: number
  totalVideoViews: number
  totalThruPlays: number
}

export interface DailyAdKPIAggregate {
  date: Date
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  totalSpend: number
  totalRevenue: number
}

export interface FormatAggregate {
  format: string          // CreativeFormat
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  totalSpend: number
  totalRevenue: number
}

export interface CreativeAggregate {
  creativeId: string
  name: string
  format: string
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  totalSpend: number
  totalRevenue: number
  avgFrequency: number
}

export interface IAdKPIRepository {
  save(kpi: AdKPI): Promise<AdKPI>
  saveMany(kpis: AdKPI[]): Promise<AdKPI[]>
  upsertMany(kpis: AdKPI[]): Promise<number>

  findByAdId(adId: string, startDate: Date, endDate: Date): Promise<AdKPI[]>
  findByCampaignId(campaignId: string, startDate: Date, endDate: Date): Promise<AdKPI[]>
  findByCreativeId(creativeId: string, startDate: Date, endDate: Date): Promise<AdKPI[]>

  aggregateByCampaignId(
    campaignId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AdKPIAggregate>

  aggregateByCreativeId(
    creativeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AdKPIAggregate>

  aggregateByFormat(
    campaignIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<FormatAggregate[]>

  getDailyAggregatesByCampaignIds(
    campaignIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<DailyAdKPIAggregate[]>

  getTopCreatives(
    campaignIds: string[],
    startDate: Date,
    endDate: Date,
    limit: number,
    sortBy: 'roas' | 'conversions' | 'spend'
  ): Promise<CreativeAggregate[]>
}
