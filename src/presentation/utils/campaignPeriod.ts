export type CampaignDetailPeriod = 'today' | '3d' | '7d' | '30d'

export type CampaignKPIPeriod = 'today' | 'yesterday' | '7d' | '30d'

export type CampaignDatePreset =
  | 'today'
  | 'yesterday'
  | 'last_3d'
  | 'last_7d'
  | 'last_30d'
  | 'last_90d'

export function mapDetailPeriodToDatePreset(
  period: CampaignDetailPeriod | CampaignKPIPeriod
): CampaignDatePreset {
  if (period === 'today') return 'today'
  if (period === 'yesterday') return 'yesterday'
  if (period === '3d') return 'last_3d'
  if (period === '30d') return 'last_30d'
  return 'last_7d'
}

export const CAMPAIGN_KPI_PERIOD_LABELS: Record<CampaignKPIPeriod, string> = {
  today: '오늘',
  yesterday: '어제',
  '7d': '최근 7일',
  '30d': '최근 30일',
}
