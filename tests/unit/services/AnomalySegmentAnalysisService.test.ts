import { describe, it, expect, beforeEach } from 'vitest'
import {
  AnomalySegmentAnalysisService,
} from '@application/services/AnomalySegmentAnalysisService'
import type { EnhancedAnomaly } from '@application/services/AnomalyDetectionService'
import type { DailyKPIAggregate } from '@domain/repositories/IKPIRepository'

// Test data factory
function createMockAnomaly(overrides: Partial<EnhancedAnomaly> = {}): EnhancedAnomaly {
  return {
    id: `anomaly-${Math.random().toString(36).substr(2, 9)}`,
    campaignId: 'campaign-1',
    campaignName: 'Test Campaign',
    type: 'spike',
    severity: 'warning',
    metric: 'ctr',
    currentValue: 3.5,
    previousValue: 2.0,
    changePercent: 75,
    message: 'CTR이 75% 증가했습니다',
    detectedAt: new Date(),
    detail: {
      detectionMethod: 'zscore',
      zScore: 2.8,
      baseline: { mean: 2.0, stdDev: 0.3, median: 2.0, q1: 1.7, q3: 2.3, iqr: 0.6, percentile95: 2.6, sampleSize: 14, min: 1.5, max: 2.8 },
      historicalTrend: 'stable',
    },
    recommendations: ['CTR 변동 원인 분석 필요'],
    ...overrides,
  }
}

function createMockKPIAggregate(date: Date, overrides: Partial<DailyKPIAggregate> = {}): DailyKPIAggregate {
  return {
    date,
    totalImpressions: 10000,
    totalClicks: 500,
    totalConversions: 50,
    totalSpend: 100000,
    totalRevenue: 500000,
    ...overrides,
  }
}

describe('AnomalySegmentAnalysisService', () => {
  let service: AnomalySegmentAnalysisService

  beforeEach(() => {
    service = new AnomalySegmentAnalysisService()
  })

  describe('analyzeSegments', () => {
    it('should analyze anomalies and return segment analysis result', () => {
      const anomalies: EnhancedAnomaly[] = [
        createMockAnomaly({ campaignId: 'c1', campaignName: 'Campaign 1', severity: 'critical' }),
        createMockAnomaly({ campaignId: 'c1', campaignName: 'Campaign 1', metric: 'cpa', severity: 'warning' }),
        createMockAnomaly({ campaignId: 'c2', campaignName: 'Campaign 2', severity: 'info' }),
      ]

      const result = service.analyzeSegments(anomalies)

      expect(result).toBeDefined()
      expect(result.segmentType).toBe('campaign')
      expect(result.segments).toHaveLength(2) // 2 campaigns
      expect(result.insights).toBeDefined()
      expect(result.correlations).toBeDefined()
    })

    it('should return empty segments for empty input', () => {
      const result = service.analyzeSegments([])

      expect(result.segments).toHaveLength(0)
      expect(result.insights).toBeDefined()
    })

    it('should sort segments by severity score (highest first)', () => {
      const anomalies: EnhancedAnomaly[] = [
        createMockAnomaly({ campaignId: 'c1', campaignName: 'Campaign 1', severity: 'info' }),
        createMockAnomaly({ campaignId: 'c2', campaignName: 'Campaign 2', severity: 'critical' }),
        createMockAnomaly({ campaignId: 'c3', campaignName: 'Campaign 3', severity: 'warning' }),
      ]

      const result = service.analyzeSegments(anomalies)

      expect(result.segments[0].name).toBe('Campaign 2') // critical
      expect(result.segments[1].name).toBe('Campaign 3') // warning
      expect(result.segments[2].name).toBe('Campaign 1') // info
    })
  })

  describe('compareCampaigns', () => {
    it('should compare campaigns and return comparison list', () => {
      const anomalies: EnhancedAnomaly[] = [
        createMockAnomaly({ campaignId: 'c1', campaignName: 'Campaign A', severity: 'critical', metric: 'ctr' }),
        createMockAnomaly({ campaignId: 'c1', campaignName: 'Campaign A', severity: 'critical', metric: 'cpa' }),
        createMockAnomaly({ campaignId: 'c2', campaignName: 'Campaign B', severity: 'info', metric: 'ctr' }),
      ]

      const result = service.compareCampaigns(anomalies)

      expect(result).toHaveLength(2)
      // Sorted by health score (lowest first = most problematic)
      expect(result[0].campaignName).toBe('Campaign A')
      expect(result[0].anomalyCount).toBe(2)
      expect(result[0].avgSeverity).toBe(3) // critical = 3
      expect(result[1].campaignName).toBe('Campaign B')
      expect(result[1].anomalyCount).toBe(1)
    })

    it('should calculate health score correctly', () => {
      const anomalies: EnhancedAnomaly[] = [
        createMockAnomaly({ campaignId: 'c1', severity: 'critical' }),
        createMockAnomaly({ campaignId: 'c1', severity: 'critical' }),
        createMockAnomaly({ campaignId: 'c1', severity: 'critical' }),
      ]

      const result = service.compareCampaigns(anomalies)

      // healthScore = max(0, 100 - count*10 - avgSeverity*15)
      // = max(0, 100 - 3*10 - 3*15) = max(0, 100 - 30 - 45) = 25
      expect(result[0].healthScore).toBe(25)
    })

    it('should track metrics per campaign', () => {
      const anomalies: EnhancedAnomaly[] = [
        createMockAnomaly({ campaignId: 'c1', metric: 'ctr', changePercent: 50 }),
        createMockAnomaly({ campaignId: 'c1', metric: 'ctr', changePercent: 30 }),
        createMockAnomaly({ campaignId: 'c1', metric: 'cpa', changePercent: 25 }),
      ]

      const result = service.compareCampaigns(anomalies)

      expect(result[0].metrics.ctr).toBeDefined()
      expect(result[0].metrics.ctr.anomalyCount).toBe(2)
      expect(result[0].metrics.ctr.avgChange).toBe(40) // (50 + 30) / 2
      expect(result[0].metrics.cpa.anomalyCount).toBe(1)
    })
  })

  describe('analyzeTimePatterns', () => {
    it('should detect weekday spike pattern', () => {
      // Create anomalies mostly on weekdays (Mon-Fri)
      const anomalies: EnhancedAnomaly[] = []
      for (let i = 0; i < 10; i++) {
        const date = new Date(2025, 0, 6 + i) // 2025-01-06 is Monday
        if (date.getDay() !== 0 && date.getDay() !== 6) { // weekday only
          anomalies.push(createMockAnomaly({ detectedAt: date }))
        }
      }

      const result = service.analyzeTimePatterns(anomalies)

      expect(result.pattern).toBe('weekday_spike')
      expect(result.confidence).toBeGreaterThan(0.7)
      expect(result.details).toContain('평일')
    })

    it('should detect weekend spike pattern', () => {
      // Create anomalies only on weekends
      const anomalies: EnhancedAnomaly[] = []
      for (let i = 0; i < 4; i++) {
        // Saturdays and Sundays in January 2025
        const saturday = new Date(2025, 0, 4 + i * 7) // 4, 11, 18, 25
        const sunday = new Date(2025, 0, 5 + i * 7) // 5, 12, 19, 26
        anomalies.push(createMockAnomaly({ detectedAt: saturday }))
        anomalies.push(createMockAnomaly({ detectedAt: sunday }))
      }

      const result = service.analyzeTimePatterns(anomalies)

      expect(result.pattern).toBe('weekend_spike')
      expect(result.confidence).toBeGreaterThan(0.7)
      expect(result.details).toContain('주말')
    })

    it('should detect consistent pattern when evenly distributed', () => {
      // Create anomalies across all days
      const anomalies: EnhancedAnomaly[] = []
      for (let i = 0; i < 7; i++) {
        const date = new Date(2025, 0, 6 + i) // Mon to Sun
        anomalies.push(createMockAnomaly({ detectedAt: date }))
      }

      const result = service.analyzeTimePatterns(anomalies)

      expect(result.pattern).toBe('consistent')
      expect(result.recommendedMonitoring).toBeDefined()
      expect(result.recommendedMonitoring.length).toBeGreaterThan(0)
    })

    it('should return recommended monitoring actions', () => {
      const anomalies: EnhancedAnomaly[] = [
        createMockAnomaly({ detectedAt: new Date(2025, 0, 6) }),
      ]

      const result = service.analyzeTimePatterns(anomalies)

      expect(result.recommendedMonitoring).toBeDefined()
      expect(Array.isArray(result.recommendedMonitoring)).toBe(true)
    })
  })

  describe('analyzeByMetric', () => {
    it('should categorize anomalies by metric category', () => {
      const anomalies: EnhancedAnomaly[] = [
        createMockAnomaly({ metric: 'spend' }), // spend_related
        createMockAnomaly({ metric: 'cpa' }), // spend_related
        createMockAnomaly({ metric: 'ctr' }), // engagement
        createMockAnomaly({ metric: 'conversions' }), // conversion
        createMockAnomaly({ metric: 'roas' }), // conversion
      ]

      const result = service.analyzeByMetric(anomalies)

      expect(result.get('spend_related')?.anomalyCount).toBe(2)
      expect(result.get('engagement')?.anomalyCount).toBe(1)
      expect(result.get('conversion')?.anomalyCount).toBe(2)
    })

    it('should calculate average severity per category', () => {
      const anomalies: EnhancedAnomaly[] = [
        createMockAnomaly({ metric: 'spend', severity: 'critical' }), // 3
        createMockAnomaly({ metric: 'cpa', severity: 'warning' }), // 2
      ]

      const result = service.analyzeByMetric(anomalies)

      expect(result.get('spend_related')?.avgSeverityScore).toBe(2.5) // (3+2)/2
    })

    it('should identify dominant anomaly type per category', () => {
      const anomalies: EnhancedAnomaly[] = [
        createMockAnomaly({ metric: 'spend', type: 'spike' }),
        createMockAnomaly({ metric: 'cpa', type: 'spike' }),
        createMockAnomaly({ metric: 'cpc', type: 'drop' }),
      ]

      const result = service.analyzeByMetric(anomalies)

      expect(result.get('spend_related')?.dominantType).toBe('spike')
    })
  })

  describe('analyzeKPITimePatterns', () => {
    it('should calculate weekday and weekend averages', () => {
      const kpiData: DailyKPIAggregate[] = [
        createMockKPIAggregate(new Date(2025, 0, 6), { totalClicks: 500 }), // Monday
        createMockKPIAggregate(new Date(2025, 0, 7), { totalClicks: 600 }), // Tuesday
        createMockKPIAggregate(new Date(2025, 0, 11), { totalClicks: 200 }), // Saturday
        createMockKPIAggregate(new Date(2025, 0, 12), { totalClicks: 100 }), // Sunday
      ]

      const result = service.analyzeKPITimePatterns(kpiData)

      expect(result.weekdayAvg.clicks).toBe(550) // (500+600)/2
      expect(result.weekendAvg.clicks).toBe(150) // (200+100)/2
    })

    it('should calculate day-of-week averages', () => {
      const kpiData: DailyKPIAggregate[] = [
        createMockKPIAggregate(new Date(2025, 0, 6), { totalSpend: 100000 }), // Monday
        createMockKPIAggregate(new Date(2025, 0, 13), { totalSpend: 150000 }), // Monday
      ]

      const result = service.analyzeKPITimePatterns(kpiData)

      expect(result.dayOfWeekAvg.monday.spend).toBe(125000) // (100000+150000)/2
    })

    it('should identify anomaly days (>50% deviation)', () => {
      const kpiData: DailyKPIAggregate[] = [
        createMockKPIAggregate(new Date(2025, 0, 6), { totalSpend: 100000 }),
        createMockKPIAggregate(new Date(2025, 0, 7), { totalSpend: 100000 }),
        createMockKPIAggregate(new Date(2025, 0, 8), { totalSpend: 100000 }),
        createMockKPIAggregate(new Date(2025, 0, 9), { totalSpend: 300000 }), // 200% increase
      ]

      const result = service.analyzeKPITimePatterns(kpiData)

      expect(result.anomalyDays.length).toBeGreaterThan(0)
    })
  })

  describe('metric correlations', () => {
    it('should detect positive correlation between metrics', () => {
      const baseDate = new Date(2025, 0, 6)
      const anomalies: EnhancedAnomaly[] = [
        // Same campaign, same day, both increasing
        createMockAnomaly({ campaignId: 'c1', metric: 'ctr', changePercent: 50, detectedAt: baseDate }),
        createMockAnomaly({ campaignId: 'c1', metric: 'conversions', changePercent: 40, detectedAt: baseDate }),
        // Another instance
        createMockAnomaly({ campaignId: 'c1', metric: 'ctr', changePercent: 30, detectedAt: new Date(baseDate.getTime() + 86400000) }),
        createMockAnomaly({ campaignId: 'c1', metric: 'conversions', changePercent: 25, detectedAt: new Date(baseDate.getTime() + 86400000) }),
      ]

      const result = service.analyzeSegments(anomalies)

      const ctrConversionsCorrelation = result.correlations.find(
        c => (c.metric1 === 'ctr' && c.metric2 === 'conversions') ||
             (c.metric1 === 'conversions' && c.metric2 === 'ctr')
      )

      expect(ctrConversionsCorrelation).toBeDefined()
      expect(ctrConversionsCorrelation?.correlationType).toBe('positive')
    })

    it('should detect negative correlation between metrics', () => {
      const baseDate = new Date(2025, 0, 6)
      const anomalies: EnhancedAnomaly[] = [
        // Same campaign, same day, opposite directions
        createMockAnomaly({ campaignId: 'c1', metric: 'cpa', changePercent: 50, detectedAt: baseDate }),
        createMockAnomaly({ campaignId: 'c1', metric: 'roas', changePercent: -40, detectedAt: baseDate }),
        // Another instance
        createMockAnomaly({ campaignId: 'c1', metric: 'cpa', changePercent: 30, detectedAt: new Date(baseDate.getTime() + 86400000) }),
        createMockAnomaly({ campaignId: 'c1', metric: 'roas', changePercent: -25, detectedAt: new Date(baseDate.getTime() + 86400000) }),
      ]

      const result = service.analyzeSegments(anomalies)

      const cpaRoasCorrelation = result.correlations.find(
        c => (c.metric1 === 'cpa' && c.metric2 === 'roas') ||
             (c.metric1 === 'roas' && c.metric2 === 'cpa')
      )

      expect(cpaRoasCorrelation).toBeDefined()
      expect(cpaRoasCorrelation?.correlationType).toBe('negative')
    })
  })

  describe('propagation analysis', () => {
    it('should identify anomaly propagation chain', () => {
      const baseDate = new Date(2025, 0, 6)
      const anomalies: EnhancedAnomaly[] = [
        createMockAnomaly({
          campaignId: 'c1',
          metric: 'spend',
          severity: 'critical',
          detectedAt: baseDate
        }),
        createMockAnomaly({
          campaignId: 'c1',
          metric: 'impressions',
          severity: 'warning',
          detectedAt: new Date(baseDate.getTime() + 3600000) // 1 hour later
        }),
        createMockAnomaly({
          campaignId: 'c1',
          metric: 'clicks',
          severity: 'info',
          detectedAt: new Date(baseDate.getTime() + 7200000) // 2 hours later
        }),
      ]

      const result = service.analyzeSegments(anomalies)

      expect(result.propagationPath).toBeDefined()
      expect(result.propagationPath?.rootAnomaly.metric).toBe('spend')
      expect(result.propagationPath?.propagationChain).toContain('spend')
      expect(result.propagationPath?.propagatedAnomalies.length).toBe(2)
    })

    it('should not detect propagation for unrelated anomalies', () => {
      const anomalies: EnhancedAnomaly[] = [
        createMockAnomaly({ campaignId: 'c1', severity: 'info' }),
        createMockAnomaly({ campaignId: 'c2', severity: 'info' }), // different campaign
      ]

      const result = service.analyzeSegments(anomalies)

      // No propagation because anomalies are in different campaigns
      expect(result.propagationPath).toBeUndefined()
    })
  })

  describe('insights generation', () => {
    it('should generate high-risk campaign warning', () => {
      const anomalies: EnhancedAnomaly[] = [
        createMockAnomaly({ campaignId: 'c1', severity: 'critical' }),
        createMockAnomaly({ campaignId: 'c1', severity: 'critical' }),
        createMockAnomaly({ campaignId: 'c1', severity: 'warning' }),
      ]

      const result = service.analyzeSegments(anomalies)

      const highRiskInsight = result.insights.find(i => i.id === 'high-risk-campaigns')
      expect(highRiskInsight).toBeDefined()
      expect(highRiskInsight?.type).toBe('warning')
      expect(highRiskInsight?.actionItems?.length).toBeGreaterThan(0)
    })

    it('should generate metric concentration insight', () => {
      const anomalies: EnhancedAnomaly[] = [
        createMockAnomaly({ metric: 'ctr' }),
        createMockAnomaly({ metric: 'ctr' }),
        createMockAnomaly({ metric: 'ctr' }),
        createMockAnomaly({ metric: 'cpa' }),
      ]

      const result = service.analyzeSegments(anomalies)

      const concentrationInsight = result.insights.find(i => i.id === 'metric-concentration')
      expect(concentrationInsight).toBeDefined()
      expect(concentrationInsight?.title).toContain('ctr')
    })

    it('should generate healthy status for low severity anomalies', () => {
      const anomalies: EnhancedAnomaly[] = [
        createMockAnomaly({ severity: 'info' }),
        createMockAnomaly({ severity: 'info' }),
      ]

      const result = service.analyzeSegments(anomalies)

      const healthyInsight = result.insights.find(i => i.id === 'healthy-status')
      expect(healthyInsight).toBeDefined()
      expect(healthyInsight?.type).toBe('recommendation')
    })
  })
})
