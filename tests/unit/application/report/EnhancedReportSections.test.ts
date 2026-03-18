import { describe, it, expect } from 'vitest'
import type {
  EnhancedReportSections,
  OverallSummarySection,
  ChangeRate,
  FatigueLevel,
} from '@application/dto/report/EnhancedReportSections'

describe('EnhancedReportSections types', () => {
  it('should accept valid ChangeRate with direction up', () => {
    const change: ChangeRate = {
      value: 12.5,
      direction: 'up',
      isPositive: true,
    }
    expect(change.direction).toBe('up')
    expect(change.isPositive).toBe(true)
  })

  it('should accept spend change where increase is negative (isPositive=false)', () => {
    const spendChange: ChangeRate = {
      value: 5.2,
      direction: 'up',
      isPositive: false,
    }
    expect(spendChange.isPositive).toBe(false)
  })

  it('should accept valid OverallSummarySection', () => {
    const summary: OverallSummarySection = {
      totalSpend: 2_450_000,
      totalRevenue: 9_310_000,
      roas: 3.80,
      ctr: 2.56,
      totalConversions: 186,
      changes: {
        spend:       { value: 5.2,  direction: 'up',   isPositive: false },
        revenue:     { value: 12.8, direction: 'up',   isPositive: true },
        roas:        { value: 7.2,  direction: 'up',   isPositive: true },
        ctr:         { value: -1.3, direction: 'down', isPositive: false },
        conversions: { value: 15.4, direction: 'up',   isPositive: true },
      },
    }
    expect(summary.roas).toBe(3.80)
  })

  it('should accept all fatigue levels', () => {
    const levels: FatigueLevel[] = ['healthy', 'warning', 'critical']
    expect(levels).toHaveLength(3)
  })

  it('should accept valid full EnhancedReportSections', () => {
    const sections: EnhancedReportSections = {
      overallSummary: {
        totalSpend: 2_450_000, totalRevenue: 9_310_000,
        roas: 3.80, ctr: 2.56, totalConversions: 186,
        changes: {
          spend: { value: 5.2, direction: 'up', isPositive: false },
          revenue: { value: 12.8, direction: 'up', isPositive: true },
          roas: { value: 7.2, direction: 'up', isPositive: true },
          ctr: { value: -1.3, direction: 'down', isPositive: false },
          conversions: { value: 15.4, direction: 'up', isPositive: true },
        },
      },
      dailyTrend: { days: [] },
      campaignPerformance: { campaigns: [] },
      creativePerformance: { topN: 5, creatives: [] },
      creativeFatigue: { creatives: [] },
      formatComparison: { formats: [] },
      funnelPerformance: { stages: [], totalBudget: 0 },
      performanceAnalysis: { positiveFactors: [], negativeFactors: [], summary: '' },
      recommendations: { actions: [] },
    }
    expect(sections.overallSummary.roas).toBe(3.80)
  })
})
