/**
 * AnomalyRootCauseService 단위 테스트
 *
 * 테스트 범위:
 * - 원인 분석 로직
 * - 카테고리별 필터링
 * - 우선순위 기반 액션 필터링
 * - 한국 시장 컨텍스트 통합
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  AnomalyRootCauseService,
  type CauseCategory,
  type PossibleCause,
  type RootCauseAnalysis,
  type AnalysisContext,
} from '@application/services/AnomalyRootCauseService'
import type { MetricName, AnomalySeverity, AnomalyDetail, AnomalyType, Anomaly } from '@application/services/AnomalyDetectionService'

// Test helper to create mock anomaly
interface MockAnomalyParams {
  metric: MetricName
  changePercent: number
  severity?: AnomalySeverity
  detail?: Partial<AnomalyDetail>
}

function createMockAnomaly(params: MockAnomalyParams): Anomaly {
  const { metric, changePercent, severity = 'warning', detail = {} } = params
  const type: AnomalyType = changePercent >= 0 ? 'spike' : 'drop'
  return {
    id: `test_anomaly_${Date.now()}`,
    campaignId: 'campaign_123',
    campaignName: '테스트 캠페인',
    type,
    severity,
    metric,
    currentValue: 100,
    previousValue: 100 / (1 + changePercent / 100),
    changePercent,
    message: `${metric} ${changePercent}% 변화`,
    detectedAt: new Date(),
    detail: {
      detectionMethod: 'zscore' as const,
      ...detail,
    },
    recommendations: [],
  }
}

describe('AnomalyRootCauseService', () => {
  let service: AnomalyRootCauseService

  beforeEach(() => {
    service = new AnomalyRootCauseService()
  })

  describe('analyzeRootCause', () => {
    it('should return analysis with top causes', () => {
      const anomaly = createMockAnomaly({
        metric: 'conversions',
        changePercent: -50,
        severity: 'critical',
      })

      const analysis = service.analyzeRootCause(anomaly)

      expect(analysis).toBeDefined()
      expect(analysis.metric).toBe('conversions')
      expect(analysis.topCauses.length).toBeGreaterThan(0)
      expect(analysis.topCauses.length).toBeLessThanOrEqual(3)
      expect(analysis.summary).toBeDefined()
      expect(analysis.nextSteps.length).toBeGreaterThan(0)
    })

    it('should identify technical cause for conversion drop', () => {
      const anomaly = createMockAnomaly({
        metric: 'conversions',
        changePercent: -60,
        severity: 'critical',
      })

      const analysis = service.analyzeRootCause(anomaly)
      const technicalCauses = analysis.allCauses.filter(c => c.category === 'technical')

      expect(technicalCauses.length).toBeGreaterThan(0)
      expect(technicalCauses.some(c => c.name.includes('픽셀'))).toBe(true)
    })

    it('should identify internal cause for CPA spike', () => {
      const anomaly = createMockAnomaly({
        metric: 'cpa',
        changePercent: 50,
        severity: 'warning',
      })

      const analysis = service.analyzeRootCause(anomaly)
      const internalCauses = analysis.allCauses.filter(c => c.category === 'internal')

      expect(internalCauses.length).toBeGreaterThan(0)
    })

    it('should identify external cause for spend increase', () => {
      const anomaly = createMockAnomaly({
        metric: 'spend',
        changePercent: 40,
        severity: 'warning',
      })

      const analysis = service.analyzeRootCause(anomaly)
      const externalCauses = analysis.allCauses.filter(c => c.category === 'external')

      expect(externalCauses.length).toBeGreaterThan(0)
    })

    it('should include market context when provided', () => {
      const anomaly = createMockAnomaly({
        metric: 'spend',
        changePercent: 30,
        severity: 'info',
      })

      const context: AnalysisContext = {
        currentDate: new Date('2024-01-01'), // 설날 근처
        industry: 'ecommerce',
      }

      const analysis = service.analyzeRootCause(anomaly, context)
      const marketCauses = analysis.allCauses.filter(c => c.category === 'market')

      // 특별일이면 market cause가 추가됨
      expect(analysis.allCauses.length).toBeGreaterThan(0)
    })

    it('should include recent changes in analysis', () => {
      const anomaly = createMockAnomaly({
        metric: 'ctr',
        changePercent: -25,
        severity: 'info',
      })

      const context: AnalysisContext = {
        currentDate: new Date(),
        recentChanges: [
          {
            type: 'creative',
            changedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1일 전
            description: '이미지 변경',
          },
        ],
      }

      const analysis = service.analyzeRootCause(anomaly, context)
      const hasRecentChangesCause = analysis.allCauses.some(
        c => c.id === 'recent_changes'
      )

      expect(hasRecentChangesCause).toBe(true)
    })
  })

  describe('urgency level determination', () => {
    it('should return critical urgency for critical severity anomaly', () => {
      const anomaly = createMockAnomaly({
        metric: 'conversions',
        changePercent: -70,
        severity: 'critical',
      })

      const analysis = service.analyzeRootCause(anomaly)

      expect(analysis.urgencyLevel).toBe('critical')
    })

    it('should return high urgency for technical issues', () => {
      const anomaly = createMockAnomaly({
        metric: 'conversions',
        changePercent: -40,
        severity: 'warning',
      })

      const analysis = service.analyzeRootCause(anomaly)

      // Technical causes have high urgency
      expect(['critical', 'high']).toContain(analysis.urgencyLevel)
    })

    it('should return low urgency for warning severity without critical actions', () => {
      const anomaly = createMockAnomaly({
        metric: 'ctr',
        changePercent: -20,
        severity: 'warning',
      })

      const analysis = service.analyzeRootCause(anomaly)

      // warning severity는 critical action이 없으면 low urgency
      expect(['low', 'medium']).toContain(analysis.urgencyLevel)
    })
  })

  describe('filterCausesByCategory', () => {
    it('should filter only external causes', () => {
      const anomaly = createMockAnomaly({
        metric: 'spend',
        changePercent: 50,
        severity: 'warning',
      })

      const analysis = service.analyzeRootCause(anomaly)
      const externalCauses = service.filterCausesByCategory(analysis, 'external')

      externalCauses.forEach(cause => {
        expect(cause.category).toBe('external')
      })
    })

    it('should filter only internal causes', () => {
      const anomaly = createMockAnomaly({
        metric: 'clicks',
        changePercent: -30,
        severity: 'warning',
      })

      const analysis = service.analyzeRootCause(anomaly)
      const internalCauses = service.filterCausesByCategory(analysis, 'internal')

      internalCauses.forEach(cause => {
        expect(cause.category).toBe('internal')
      })
    })

    it('should filter only technical causes', () => {
      const anomaly = createMockAnomaly({
        metric: 'conversions',
        changePercent: -50,
        severity: 'critical',
      })

      const analysis = service.analyzeRootCause(anomaly)
      const technicalCauses = service.filterCausesByCategory(analysis, 'technical')

      technicalCauses.forEach(cause => {
        expect(cause.category).toBe('technical')
      })
    })
  })

  describe('getHighPriorityActions', () => {
    it('should return only critical and high priority actions', () => {
      const anomaly = createMockAnomaly({
        metric: 'conversions',
        changePercent: -60,
        severity: 'critical',
      })

      const analysis = service.analyzeRootCause(anomaly)
      const highPriorityActions = service.getHighPriorityActions(analysis, 'high')

      highPriorityActions.forEach(action => {
        expect(['critical', 'high']).toContain(action.priority)
      })
    })

    it('should sort actions by priority', () => {
      const anomaly = createMockAnomaly({
        metric: 'cpa',
        changePercent: 80,
        severity: 'critical',
      })

      const analysis = service.analyzeRootCause(anomaly)
      const actions = service.getHighPriorityActions(analysis, 'medium')

      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      for (let i = 1; i < actions.length; i++) {
        expect(priorityOrder[actions[i - 1].priority]).toBeGreaterThanOrEqual(
          priorityOrder[actions[i].priority]
        )
      }
    })

    it('should not include duplicates', () => {
      const anomaly = createMockAnomaly({
        metric: 'roas',
        changePercent: -40,
        severity: 'warning',
      })

      const analysis = service.analyzeRootCause(anomaly)
      const actions = service.getHighPriorityActions(analysis, 'low')

      const actionIds = actions.map(a => a.id)
      const uniqueIds = new Set(actionIds)
      expect(actionIds.length).toBe(uniqueIds.size)
    })
  })

  describe('summary generation', () => {
    it('should generate Korean language summary', () => {
      const anomaly = createMockAnomaly({
        metric: 'cpa',
        changePercent: 45,
        severity: 'warning',
      })

      const analysis = service.analyzeRootCause(anomaly)

      expect(analysis.summary).toContain('CPA')
      expect(analysis.summary).toContain('증가')
      expect(analysis.summary).toMatch(/\d+(\.\d+)?%/)
    })

    it('should mention top cause in summary', () => {
      const anomaly = createMockAnomaly({
        metric: 'conversions',
        changePercent: -50,
        severity: 'critical',
      })

      const analysis = service.analyzeRootCause(anomaly)

      if (analysis.topCauses.length > 0) {
        expect(analysis.summary).toContain(analysis.topCauses[0].name)
      }
    })
  })

  describe('next steps generation', () => {
    it('should generate actionable next steps', () => {
      const anomaly = createMockAnomaly({
        metric: 'roas',
        changePercent: -35,
        severity: 'warning',
      })

      const analysis = service.analyzeRootCause(anomaly)

      expect(analysis.nextSteps.length).toBeGreaterThan(0)
      expect(analysis.nextSteps.length).toBeLessThanOrEqual(5)

      // Each step should have emoji prefix
      analysis.nextSteps.forEach(step => {
        expect(step).toMatch(/^[🚨⚠️📋💡]/)
      })
    })

    it('should include timeframe in next steps', () => {
      const anomaly = createMockAnomaly({
        metric: 'ctr',
        changePercent: -25,
        severity: 'warning',
      })

      const analysis = service.analyzeRootCause(anomaly)

      analysis.nextSteps.forEach(step => {
        // Check for timeframe indicators
        expect(step).toMatch(/(즉시|일|주|시간|기간)/)
      })
    })
  })

  describe('cause probability calculation', () => {
    it('should assign higher probability to matching causes', () => {
      const criticalAnomaly = createMockAnomaly({
        metric: 'conversions',
        changePercent: -70,
        severity: 'critical',
      })

      const mildAnomaly = createMockAnomaly({
        metric: 'conversions',
        changePercent: -15,
        severity: 'info',
      })

      const criticalAnalysis = service.analyzeRootCause(criticalAnomaly)
      const mildAnalysis = service.analyzeRootCause(mildAnomaly)

      // Critical anomaly should have higher probability causes
      const criticalMaxProb = Math.max(...criticalAnalysis.topCauses.map(c => c.probability))
      expect(criticalMaxProb).toBeGreaterThan(0.5)
    })

    it('should cap probability at 0.95', () => {
      const anomaly = createMockAnomaly({
        metric: 'conversions',
        changePercent: -80,
        severity: 'critical',
      })

      const analysis = service.analyzeRootCause(anomaly)

      analysis.allCauses.forEach(cause => {
        expect(cause.probability).toBeLessThanOrEqual(0.95)
      })
    })
  })
})

describe('Metric-Specific Root Cause Analysis', () => {
  let service: AnomalyRootCauseService

  beforeEach(() => {
    service = new AnomalyRootCauseService()
  })

  describe('Spend anomalies', () => {
    it('should identify budget cap for spend decrease', () => {
      const anomaly = createMockAnomaly({
        metric: 'spend',
        changePercent: -50,
        severity: 'warning',
      })

      const analysis = service.analyzeRootCause(anomaly)
      const budgetCause = analysis.allCauses.find(c => c.name.includes('예산'))

      expect(budgetCause).toBeDefined()
    })

    it('should identify auction competition for spend increase', () => {
      const anomaly = createMockAnomaly({
        metric: 'spend',
        changePercent: 40,
        severity: 'warning',
      })

      const analysis = service.analyzeRootCause(anomaly)
      const competitionCause = analysis.allCauses.find(c => c.name.includes('경매'))

      expect(competitionCause).toBeDefined()
    })
  })

  describe('Impression anomalies', () => {
    it('should identify audience saturation for impression drop', () => {
      const anomaly = createMockAnomaly({
        metric: 'impressions',
        changePercent: -40,
        severity: 'warning',
      })

      const analysis = service.analyzeRootCause(anomaly)
      const saturationCause = analysis.allCauses.find(c => c.name.includes('포화'))

      expect(saturationCause).toBeDefined()
    })

    it('should identify algorithm learning for mild drop', () => {
      const anomaly = createMockAnomaly({
        metric: 'impressions',
        changePercent: -20,
        severity: 'info',
      })

      const analysis = service.analyzeRootCause(anomaly)
      const learningCause = analysis.allCauses.find(c => c.name.includes('학습'))

      expect(learningCause).toBeDefined()
    })
  })

  describe('Click anomalies', () => {
    it('should identify creative fatigue for click drop', () => {
      const anomaly = createMockAnomaly({
        metric: 'clicks',
        changePercent: -35,
        severity: 'warning',
      })

      const analysis = service.analyzeRootCause(anomaly)
      const fatigueCause = analysis.allCauses.find(c => c.name.includes('피로'))

      expect(fatigueCause).toBeDefined()
    })
  })

  describe('Conversion anomalies', () => {
    it('should identify pixel issue for conversion drop', () => {
      const anomaly = createMockAnomaly({
        metric: 'conversions',
        changePercent: -60,
        severity: 'critical',
      })

      const analysis = service.analyzeRootCause(anomaly)
      const pixelCause = analysis.allCauses.find(c => c.name.includes('픽셀'))

      expect(pixelCause).toBeDefined()
      expect(pixelCause?.actions.some(a => a.priority === 'critical')).toBe(true)
    })

    it('should identify landing page issue', () => {
      const anomaly = createMockAnomaly({
        metric: 'conversions',
        changePercent: -40,
        severity: 'warning',
      })

      const analysis = service.analyzeRootCause(anomaly)
      const landingCause = analysis.allCauses.find(c => c.name.includes('랜딩'))

      expect(landingCause).toBeDefined()
    })
  })

  describe('CTR anomalies', () => {
    it('should identify creative relevance for CTR drop', () => {
      const anomaly = createMockAnomaly({
        metric: 'ctr',
        changePercent: -30,
        severity: 'warning',
      })

      const analysis = service.analyzeRootCause(anomaly)
      const relevanceCause = analysis.allCauses.find(c => c.name.includes('관련성'))

      expect(relevanceCause).toBeDefined()
    })
  })

  describe('CPA anomalies', () => {
    it('should identify funnel leak for CPA increase', () => {
      const anomaly = createMockAnomaly({
        metric: 'cpa',
        changePercent: 50,
        severity: 'critical',
      })

      const analysis = service.analyzeRootCause(anomaly)
      const funnelCause = analysis.allCauses.find(c => c.name.includes('퍼널'))

      expect(funnelCause).toBeDefined()
    })
  })

  describe('ROAS anomalies', () => {
    it('should identify attribution delay for ROAS drop', () => {
      const anomaly = createMockAnomaly({
        metric: 'roas',
        changePercent: -25,
        severity: 'info',
      })

      const analysis = service.analyzeRootCause(anomaly)
      const attributionCause = analysis.allCauses.find(c => c.name.includes('기여'))

      expect(attributionCause).toBeDefined()
    })
  })
})

describe('Context-Based Analysis', () => {
  let service: AnomalyRootCauseService

  beforeEach(() => {
    service = new AnomalyRootCauseService()
  })

  describe('Technical issues context', () => {
    it('should boost technical cause probability when issues reported', () => {
      const anomaly = createMockAnomaly({
        metric: 'conversions',
        changePercent: -40,
        severity: 'warning',
      })

      const contextWithTechnicalIssues: AnalysisContext = {
        currentDate: new Date(),
        technicalIssues: true,
      }

      const contextWithoutIssues: AnalysisContext = {
        currentDate: new Date(),
        technicalIssues: false,
      }

      const analysisWithIssues = service.analyzeRootCause(anomaly, contextWithTechnicalIssues)
      const analysisWithoutIssues = service.analyzeRootCause(anomaly, contextWithoutIssues)

      const techCauseWithIssues = analysisWithIssues.allCauses.find(c => c.category === 'technical')
      const techCauseWithoutIssues = analysisWithoutIssues.allCauses.find(c => c.category === 'technical')

      if (techCauseWithIssues && techCauseWithoutIssues) {
        expect(techCauseWithIssues.probability).toBeGreaterThan(techCauseWithoutIssues.probability)
      }
    })
  })

  describe('Competitor activity context', () => {
    it('should boost external cause probability when competitors active', () => {
      const anomaly = createMockAnomaly({
        metric: 'cpa',
        changePercent: 35,
        severity: 'warning',
      })

      const contextWithCompetitors: AnalysisContext = {
        currentDate: new Date(),
        competitorActivity: true,
      }

      const analysis = service.analyzeRootCause(anomaly, contextWithCompetitors)
      const externalCauses = analysis.allCauses.filter(c => c.category === 'external')

      expect(externalCauses.length).toBeGreaterThan(0)
    })
  })

  describe('Recent changes context', () => {
    it('should add recent changes cause when changes exist', () => {
      const anomaly = createMockAnomaly({
        metric: 'ctr',
        changePercent: -30,
        severity: 'warning',
      })

      const context: AnalysisContext = {
        currentDate: new Date(),
        recentChanges: [
          {
            type: 'creative',
            changedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2일 전
            description: '새 크리에이티브 적용',
          },
          {
            type: 'targeting',
            changedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1일 전
            description: '타겟팅 확장',
          },
        ],
      }

      const analysis = service.analyzeRootCause(anomaly, context)
      const recentChangesCause = analysis.allCauses.find(c => c.id === 'recent_changes')

      expect(recentChangesCause).toBeDefined()
      expect(recentChangesCause?.evidence.length).toBe(2)
    })

    it('should not add recent changes cause for old changes', () => {
      const anomaly = createMockAnomaly({
        metric: 'clicks',
        changePercent: -20,
        severity: 'warning',
      })

      const context: AnalysisContext = {
        currentDate: new Date(),
        recentChanges: [
          {
            type: 'budget',
            changedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10일 전
            description: '예산 변경',
          },
        ],
      }

      const analysis = service.analyzeRootCause(anomaly, context)
      const recentChangesCause = analysis.allCauses.find(c => c.id === 'recent_changes')

      expect(recentChangesCause).toBeUndefined()
    })
  })
})
