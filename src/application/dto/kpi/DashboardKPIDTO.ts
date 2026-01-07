export type DateRangePreset = 'today' | 'yesterday' | 'last_7d' | 'last_30d'

export interface GetDashboardKPIDTO {
  userId: string
  dateRange: DateRangePreset
  campaignIds?: string[]
  includeComparison?: boolean
  includeBreakdown?: boolean
  includeChartData?: boolean
}

export interface ChartDataPointDTO {
  date: string // YYYY-MM-DD format
  spend: number
  revenue: number
  roas: number
  impressions: number
  clicks: number
  conversions: number
}

export interface KPIComparisonDTO {
  impressionsChange: number
  clicksChange: number
  conversionsChange: number
  spendChange: number
  revenueChange: number
  roasChange: number
  ctrChange: number
}

export interface CampaignKPIBreakdownDTO {
  campaignId: string
  campaignName: string
  impressions: number
  clicks: number
  conversions: number
  spend: number
  revenue: number
  roas: number
  ctr: number
  cpa: number
}

export interface DashboardKPIDTO {
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  totalSpend: number
  totalRevenue: number
  roas: number
  ctr: number
  cpa: number
  cvr: number
  comparison?: KPIComparisonDTO
  campaignBreakdown?: CampaignKPIBreakdownDTO[]
  chartData?: ChartDataPointDTO[]
}
