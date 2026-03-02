import { describe, expect, it } from 'vitest'

import {
  CAMPAIGN_KPI_PERIOD_LABELS,
  mapDetailPeriodToDatePreset,
  type CampaignDetailPeriod,
} from '@/presentation/utils/campaignPeriod'

describe('campaignPeriod', () => {
  it('should_return_expected_date_preset_when_detail_period_changes', () => {
    const cases: Array<{ period: CampaignDetailPeriod; expected: string }> = [
      { period: 'today', expected: 'today' },
      { period: '3d', expected: 'last_3d' },
      { period: '7d', expected: 'last_7d' },
      { period: '30d', expected: 'last_30d' },
    ]

    for (const { period, expected } of cases) {
      expect(mapDetailPeriodToDatePreset(period)).toBe(expected)
    }
  })

  it('should_provide_consistent_labels_for_campaign_kpi_period_tabs', () => {
    expect(CAMPAIGN_KPI_PERIOD_LABELS.today).toBe('오늘')
    expect(CAMPAIGN_KPI_PERIOD_LABELS.yesterday).toBe('어제')
    expect(CAMPAIGN_KPI_PERIOD_LABELS['7d']).toBe('최근 7일')
    expect(CAMPAIGN_KPI_PERIOD_LABELS['30d']).toBe('최근 30일')
  })
})
