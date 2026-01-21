/**
 * AnomalySegmentAnalysisService
 *
 * 이상 징후의 세그먼트별 분석을 제공합니다:
 * - 시간대별 패턴 분석 (요일별, 주중/주말)
 * - 캠페인별 비교 분석
 * - 메트릭별 상관관계 분석
 * - 이상 징후 전파 분석
 */

import type { EnhancedAnomaly } from './AnomalyDetectionService'
import type { DailyKPIAggregate } from '@domain/repositories/IKPIRepository'

// ============================================
// Types and Interfaces
// ============================================

export type SegmentType =
  | 'time_based' // 시간대별 (요일, 주중/주말)
  | 'campaign' // 캠페인별
  | 'metric' // 메트릭별
  | 'severity' // 심각도별
  | 'pattern' // 패턴별

export type TimeSegment =
  | 'weekday' // 평일
  | 'weekend' // 주말
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export type MetricCategory =
  | 'spend_related' // 지출 관련 (spend, cpa, cpc)
  | 'engagement' // 참여 관련 (impressions, clicks, ctr)
  | 'conversion' // 전환 관련 (conversions, cvr, roas)

export interface SegmentAnalysisResult {
  segmentType: SegmentType
  segments: SegmentDetail[]
  insights: SegmentInsight[]
  correlations: MetricCorrelation[]
  propagationPath?: AnomalyPropagation
}

export interface SegmentDetail {
  name: string
  anomalyCount: number
  anomalies: EnhancedAnomaly[]
  avgSeverityScore: number
  dominantType: string
  mostAffectedMetric: string
  timeDistribution?: TimeDistribution
}

export interface TimeDistribution {
  weekday: number
  weekend: number
  byDayOfWeek: Record<TimeSegment, number>
}

export interface SegmentInsight {
  id: string
  type: 'pattern' | 'correlation' | 'recommendation' | 'warning'
  title: string
  description: string
  confidence: number // 0-1
  relatedSegments: string[]
  actionItems?: string[]
}

export interface MetricCorrelation {
  metric1: string
  metric2: string
  correlationType: 'positive' | 'negative' | 'none'
  strength: number // 0-1
  description: string
}

export interface AnomalyPropagation {
  rootAnomaly: EnhancedAnomaly
  propagatedAnomalies: EnhancedAnomaly[]
  propagationChain: string[] // metric -> metric 체인
  impactScore: number
}

export interface CampaignComparison {
  campaignId: string
  campaignName: string
  anomalyCount: number
  avgSeverity: number
  dominantAnomalyType: string
  metrics: {
    [key: string]: {
      anomalyCount: number
      avgChange: number
    }
  }
  healthScore: number // 0-100, 높을수록 건강
}

export interface TimePatternAnalysis {
  pattern: 'consistent' | 'weekend_spike' | 'weekday_spike' | 'periodic' | 'random'
  confidence: number
  details: string
  recommendedMonitoring: string[]
}

// ============================================
// Utility Functions
// ============================================

function getDayOfWeek(date: Date): TimeSegment {
  const days: TimeSegment[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ]
  return days[date.getDay()]
}

function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

function getSeverityScore(severity: string): number {
  switch (severity) {
    case 'critical':
      return 3
    case 'warning':
      return 2
    case 'info':
      return 1
    default:
      return 0
  }
}

function getMetricCategory(metric: string): MetricCategory {
  const spendRelated = ['spend', 'cpa', 'cpc']
  const engagement = ['impressions', 'clicks', 'ctr']
  const conversion = ['conversions', 'cvr', 'roas']

  if (spendRelated.includes(metric)) return 'spend_related'
  if (engagement.includes(metric)) return 'engagement'
  if (conversion.includes(metric)) return 'conversion'
  return 'engagement' // default
}

// ============================================
// Main Service
// ============================================

export class AnomalySegmentAnalysisService {
  /**
   * 전체 세그먼트 분석 실행
   */
  analyzeSegments(anomalies: EnhancedAnomaly[]): SegmentAnalysisResult {
    const segments = this.buildSegments(anomalies)
    const insights = this.generateInsights(anomalies, segments)
    const correlations = this.analyzeMetricCorrelations(anomalies)
    const propagationPath = this.analyzePropagation(anomalies)

    return {
      segmentType: 'campaign',
      segments,
      insights,
      correlations,
      propagationPath,
    }
  }

  /**
   * 캠페인별 비교 분석
   */
  compareCampaigns(anomalies: EnhancedAnomaly[]): CampaignComparison[] {
    const campaignMap = new Map<string, EnhancedAnomaly[]>()

    for (const anomaly of anomalies) {
      const existing = campaignMap.get(anomaly.campaignId) || []
      existing.push(anomaly)
      campaignMap.set(anomaly.campaignId, existing)
    }

    const comparisons: CampaignComparison[] = []

    for (const [campaignId, campaignAnomalies] of campaignMap) {
      const metrics: CampaignComparison['metrics'] = {}

      for (const anomaly of campaignAnomalies) {
        if (!metrics[anomaly.metric]) {
          metrics[anomaly.metric] = { anomalyCount: 0, avgChange: 0 }
        }
        metrics[anomaly.metric].anomalyCount++
        metrics[anomaly.metric].avgChange += Math.abs(anomaly.changePercent)
      }

      // 평균 계산
      for (const metric of Object.keys(metrics)) {
        metrics[metric].avgChange /= metrics[metric].anomalyCount
      }

      const avgSeverity =
        campaignAnomalies.reduce((sum, a) => sum + getSeverityScore(a.severity), 0) /
        campaignAnomalies.length

      // 가장 많이 발생한 이상 유형
      const typeCounts = new Map<string, number>()
      for (const anomaly of campaignAnomalies) {
        typeCounts.set(anomaly.type, (typeCounts.get(anomaly.type) || 0) + 1)
      }
      const dominantType = [...typeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown'

      // 건강 점수 계산 (이상 징후가 적을수록, 심각도가 낮을수록 높음)
      const healthScore = Math.max(0, 100 - campaignAnomalies.length * 10 - avgSeverity * 15)

      comparisons.push({
        campaignId,
        campaignName: campaignAnomalies[0]?.campaignName || '알 수 없음',
        anomalyCount: campaignAnomalies.length,
        avgSeverity,
        dominantAnomalyType: dominantType,
        metrics,
        healthScore: Math.round(healthScore),
      })
    }

    // 건강 점수로 정렬 (낮은 순 = 문제가 많은 순)
    return comparisons.sort((a, b) => a.healthScore - b.healthScore)
  }

  /**
   * 시간 패턴 분석
   */
  analyzeTimePatterns(anomalies: EnhancedAnomaly[]): TimePatternAnalysis {
    const distribution: Record<TimeSegment, number> = {
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
      weekday: 0,
      weekend: 0,
    }

    for (const anomaly of anomalies) {
      const date = new Date(anomaly.detectedAt)
      const dayOfWeek = getDayOfWeek(date)
      distribution[dayOfWeek]++

      if (isWeekend(date)) {
        distribution.weekend++
      } else {
        distribution.weekday++
      }
    }

    // 패턴 판별
    const weekdayRatio = distribution.weekday / (distribution.weekday + distribution.weekend || 1)

    let pattern: TimePatternAnalysis['pattern'] = 'random'
    let confidence = 0.5
    let details = ''

    if (weekdayRatio > 0.8) {
      pattern = 'weekday_spike'
      confidence = weekdayRatio
      details = '이상 징후가 주로 평일에 집중됩니다. 비즈니스 활동과 연관될 수 있습니다.'
    } else if (weekdayRatio < 0.3) {
      pattern = 'weekend_spike'
      confidence = 1 - weekdayRatio
      details = '이상 징후가 주로 주말에 집중됩니다. 소비자 행동 패턴 변화를 확인하세요.'
    } else {
      // 특정 요일 집중 여부 확인
      const maxDay = Object.entries(distribution)
        .filter(([key]) => !['weekday', 'weekend'].includes(key))
        .sort(([, a], [, b]) => b - a)[0]

      const totalDays = anomalies.length
      const maxDayRatio = maxDay ? maxDay[1] / totalDays : 0

      if (maxDayRatio > 0.4) {
        pattern = 'periodic'
        confidence = maxDayRatio
        details = `이상 징후가 ${this.translateDay(maxDay[0])}에 집중됩니다. 정기적인 이벤트나 예약된 활동을 확인하세요.`
      } else {
        pattern = 'consistent'
        confidence = 0.6
        details = '이상 징후가 특정 시간대에 집중되지 않고 고르게 분포합니다.'
      }
    }

    return {
      pattern,
      confidence,
      details,
      recommendedMonitoring: this.getRecommendedMonitoring(pattern),
    }
  }

  /**
   * 메트릭별 세그먼트 분석
   */
  analyzeByMetric(anomalies: EnhancedAnomaly[]): Map<MetricCategory, SegmentDetail> {
    const categoryMap = new Map<MetricCategory, EnhancedAnomaly[]>()

    for (const anomaly of anomalies) {
      const category = getMetricCategory(anomaly.metric)
      const existing = categoryMap.get(category) || []
      existing.push(anomaly)
      categoryMap.set(category, existing)
    }

    const result = new Map<MetricCategory, SegmentDetail>()

    for (const [category, categoryAnomalies] of categoryMap) {
      const avgSeverityScore =
        categoryAnomalies.reduce((sum, a) => sum + getSeverityScore(a.severity), 0) /
        categoryAnomalies.length

      const typeCounts = new Map<string, number>()
      const metricCounts = new Map<string, number>()

      for (const anomaly of categoryAnomalies) {
        typeCounts.set(anomaly.type, (typeCounts.get(anomaly.type) || 0) + 1)
        metricCounts.set(anomaly.metric, (metricCounts.get(anomaly.metric) || 0) + 1)
      }

      const dominantType = [...typeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown'
      const mostAffectedMetric =
        [...metricCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown'

      result.set(category, {
        name: this.translateCategory(category),
        anomalyCount: categoryAnomalies.length,
        anomalies: categoryAnomalies,
        avgSeverityScore,
        dominantType,
        mostAffectedMetric,
      })
    }

    return result
  }

  /**
   * KPI 데이터에서 시간대별 이상 패턴 분석
   */
  analyzeKPITimePatterns(
    kpiData: DailyKPIAggregate[],
    baselineWindow: number = 14
  ): {
    weekdayAvg: Record<string, number>
    weekendAvg: Record<string, number>
    dayOfWeekAvg: Record<TimeSegment, Record<string, number>>
    anomalyDays: Date[]
  } {
    const weekdayData: DailyKPIAggregate[] = []
    const weekendData: DailyKPIAggregate[] = []
    const dayOfWeekData: Record<TimeSegment, DailyKPIAggregate[]> = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
      weekday: [],
      weekend: [],
    }

    for (const kpi of kpiData) {
      const date = new Date(kpi.date)
      const dayOfWeek = getDayOfWeek(date)
      dayOfWeekData[dayOfWeek].push(kpi)

      if (isWeekend(date)) {
        weekendData.push(kpi)
      } else {
        weekdayData.push(kpi)
      }
    }

    const calculateAvg = (data: DailyKPIAggregate[]) => {
      if (data.length === 0) {
        return {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          spend: 0,
          revenue: 0,
        }
      }
      return {
        impressions: data.reduce((s, d) => s + d.totalImpressions, 0) / data.length,
        clicks: data.reduce((s, d) => s + d.totalClicks, 0) / data.length,
        conversions: data.reduce((s, d) => s + d.totalConversions, 0) / data.length,
        spend: data.reduce((s, d) => s + d.totalSpend, 0) / data.length,
        revenue: data.reduce((s, d) => s + d.totalRevenue, 0) / data.length,
      }
    }

    const dayOfWeekAvg: Record<TimeSegment, Record<string, number>> = {} as Record<
      TimeSegment,
      Record<string, number>
    >
    for (const [day, data] of Object.entries(dayOfWeekData)) {
      if (day !== 'weekday' && day !== 'weekend') {
        dayOfWeekAvg[day as TimeSegment] = calculateAvg(data)
      }
    }

    // 이상 일자 탐지 (평균 대비 50% 이상 차이)
    const anomalyDays: Date[] = []
    const overallAvg = calculateAvg(kpiData)

    for (const kpi of kpiData) {
      const spendDiff = Math.abs(kpi.totalSpend - overallAvg.spend) / overallAvg.spend
      const clicksDiff = Math.abs(kpi.totalClicks - overallAvg.clicks) / overallAvg.clicks
      if (spendDiff > 0.5 || clicksDiff > 0.5) {
        anomalyDays.push(kpi.date)
      }
    }

    return {
      weekdayAvg: calculateAvg(weekdayData),
      weekendAvg: calculateAvg(weekendData),
      dayOfWeekAvg,
      anomalyDays,
    }
  }

  // ============================================
  // Private Methods
  // ============================================

  private buildSegments(anomalies: EnhancedAnomaly[]): SegmentDetail[] {
    const campaignMap = new Map<string, EnhancedAnomaly[]>()

    for (const anomaly of anomalies) {
      const existing = campaignMap.get(anomaly.campaignId) || []
      existing.push(anomaly)
      campaignMap.set(anomaly.campaignId, existing)
    }

    const segments: SegmentDetail[] = []

    for (const [campaignId, campaignAnomalies] of campaignMap) {
      const avgSeverityScore =
        campaignAnomalies.reduce((sum, a) => sum + getSeverityScore(a.severity), 0) /
        campaignAnomalies.length

      const typeCounts = new Map<string, number>()
      const metricCounts = new Map<string, number>()

      for (const anomaly of campaignAnomalies) {
        typeCounts.set(anomaly.type, (typeCounts.get(anomaly.type) || 0) + 1)
        metricCounts.set(anomaly.metric, (metricCounts.get(anomaly.metric) || 0) + 1)
      }

      const dominantType = [...typeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown'
      const mostAffectedMetric =
        [...metricCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown'

      // 시간 분포 계산
      const timeDistribution = this.calculateTimeDistribution(campaignAnomalies)

      segments.push({
        name: campaignAnomalies[0]?.campaignName || campaignId,
        anomalyCount: campaignAnomalies.length,
        anomalies: campaignAnomalies,
        avgSeverityScore,
        dominantType,
        mostAffectedMetric,
        timeDistribution,
      })
    }

    return segments.sort((a, b) => b.avgSeverityScore - a.avgSeverityScore)
  }

  private calculateTimeDistribution(anomalies: EnhancedAnomaly[]): TimeDistribution {
    const distribution: TimeDistribution = {
      weekday: 0,
      weekend: 0,
      byDayOfWeek: {
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0,
        weekday: 0,
        weekend: 0,
      },
    }

    for (const anomaly of anomalies) {
      const date = new Date(anomaly.detectedAt)
      const dayOfWeek = getDayOfWeek(date)
      distribution.byDayOfWeek[dayOfWeek]++

      if (isWeekend(date)) {
        distribution.weekend++
      } else {
        distribution.weekday++
      }
    }

    return distribution
  }

  private generateInsights(
    anomalies: EnhancedAnomaly[],
    segments: SegmentDetail[]
  ): SegmentInsight[] {
    const insights: SegmentInsight[] = []

    // 1. 고위험 캠페인 식별
    const highRiskSegments = segments.filter((s) => s.avgSeverityScore >= 2.5)
    if (highRiskSegments.length > 0) {
      insights.push({
        id: 'high-risk-campaigns',
        type: 'warning',
        title: '고위험 캠페인 발견',
        description: `${highRiskSegments.length}개 캠페인에서 높은 수준의 이상 징후가 감지되었습니다. 즉각적인 검토가 필요합니다.`,
        confidence: 0.9,
        relatedSegments: highRiskSegments.map((s) => s.name),
        actionItems: [
          '해당 캠페인의 최근 설정 변경 확인',
          '예산 및 타겟팅 설정 검토',
          '경쟁사 활동 모니터링',
        ],
      })
    }

    // 2. 메트릭 패턴 분석
    const metricCounts = new Map<string, number>()
    for (const anomaly of anomalies) {
      metricCounts.set(anomaly.metric, (metricCounts.get(anomaly.metric) || 0) + 1)
    }
    const topMetric = [...metricCounts.entries()].sort((a, b) => b[1] - a[1])[0]

    if (topMetric && topMetric[1] / anomalies.length > 0.4) {
      insights.push({
        id: 'metric-concentration',
        type: 'pattern',
        title: `${topMetric[0]} 메트릭 이상 집중`,
        description: `전체 이상 징후의 ${Math.round((topMetric[1] / anomalies.length) * 100)}%가 ${topMetric[0]} 메트릭에서 발생했습니다.`,
        confidence: topMetric[1] / anomalies.length,
        relatedSegments: [],
        actionItems: [`${topMetric[0]} 관련 설정 전체 검토`, '연관된 다른 메트릭과의 상관관계 분석'],
      })
    }

    // 3. 시간 패턴 인사이트
    const timeAnalysis = this.analyzeTimePatterns(anomalies)
    if (timeAnalysis.pattern !== 'random' && timeAnalysis.confidence > 0.6) {
      insights.push({
        id: 'time-pattern',
        type: 'pattern',
        title: '시간 패턴 감지',
        description: timeAnalysis.details,
        confidence: timeAnalysis.confidence,
        relatedSegments: [],
        actionItems: timeAnalysis.recommendedMonitoring,
      })
    }

    // 4. 전반적 건강 상태
    const avgSeverity =
      anomalies.reduce((sum, a) => sum + getSeverityScore(a.severity), 0) / anomalies.length
    if (avgSeverity < 1.5 && anomalies.length < 5) {
      insights.push({
        id: 'healthy-status',
        type: 'recommendation',
        title: '전반적으로 양호한 상태',
        description:
          '대부분의 캠페인이 정상적으로 운영되고 있습니다. 현재 설정을 유지하면서 지속적인 모니터링을 권장합니다.',
        confidence: 0.8,
        relatedSegments: [],
      })
    }

    return insights
  }

  private analyzeMetricCorrelations(anomalies: EnhancedAnomaly[]): MetricCorrelation[] {
    const correlations: MetricCorrelation[] = []

    // 동시 발생 메트릭 쌍 분석
    const pairCounts = new Map<string, { positive: number; negative: number; total: number }>()

    // 같은 캠페인, 같은 시간대의 이상 징후 그룹화
    const groupedByContext = new Map<string, EnhancedAnomaly[]>()
    for (const anomaly of anomalies) {
      const dateKey = new Date(anomaly.detectedAt).toDateString()
      const contextKey = `${anomaly.campaignId}-${dateKey}`
      const existing = groupedByContext.get(contextKey) || []
      existing.push(anomaly)
      groupedByContext.set(contextKey, existing)
    }

    // 상관관계 계산
    for (const [, contextAnomalies] of groupedByContext) {
      if (contextAnomalies.length < 2) continue

      for (let i = 0; i < contextAnomalies.length; i++) {
        for (let j = i + 1; j < contextAnomalies.length; j++) {
          const a1 = contextAnomalies[i]
          const a2 = contextAnomalies[j]
          const pairKey = [a1.metric, a2.metric].sort().join('-')

          const existing = pairCounts.get(pairKey) || { positive: 0, negative: 0, total: 0 }
          existing.total++

          // 같은 방향 변화인지 확인
          const sameDirection =
            (a1.changePercent > 0 && a2.changePercent > 0) ||
            (a1.changePercent < 0 && a2.changePercent < 0)

          if (sameDirection) {
            existing.positive++
          } else {
            existing.negative++
          }

          pairCounts.set(pairKey, existing)
        }
      }
    }

    // 상관관계 결과 생성
    for (const [pairKey, counts] of pairCounts) {
      if (counts.total < 2) continue

      const [metric1, metric2] = pairKey.split('-')
      const positiveRatio = counts.positive / counts.total
      const negativeRatio = counts.negative / counts.total

      let correlationType: MetricCorrelation['correlationType'] = 'none'
      let strength = 0

      if (positiveRatio > 0.7) {
        correlationType = 'positive'
        strength = positiveRatio
      } else if (negativeRatio > 0.7) {
        correlationType = 'negative'
        strength = negativeRatio
      }

      if (correlationType !== 'none') {
        correlations.push({
          metric1,
          metric2,
          correlationType,
          strength,
          description: this.describeCorrelation(metric1, metric2, correlationType),
        })
      }
    }

    return correlations.sort((a, b) => b.strength - a.strength)
  }

  private analyzePropagation(anomalies: EnhancedAnomaly[]): AnomalyPropagation | undefined {
    if (anomalies.length < 2) return undefined

    // 시간순 정렬
    const sorted = [...anomalies].sort(
      (a, b) => new Date(a.detectedAt).getTime() - new Date(b.detectedAt).getTime()
    )

    // 가장 먼저 발생한 critical/warning 이상을 root로 가정
    const rootAnomaly = sorted.find((a) => a.severity === 'critical' || a.severity === 'warning')
    if (!rootAnomaly) return undefined

    // 같은 캠페인의 후속 이상 징후 추적
    const propagated = sorted.filter(
      (a) =>
        a.campaignId === rootAnomaly.campaignId &&
        a.id !== rootAnomaly.id &&
        new Date(a.detectedAt).getTime() >= new Date(rootAnomaly.detectedAt).getTime()
    )

    if (propagated.length === 0) return undefined

    const propagationChain = [rootAnomaly.metric, ...propagated.map((a) => a.metric)]
    const impactScore =
      (propagated.reduce((sum, a) => sum + getSeverityScore(a.severity), 0) +
        getSeverityScore(rootAnomaly.severity)) /
      (propagated.length + 1)

    return {
      rootAnomaly,
      propagatedAnomalies: propagated,
      propagationChain,
      impactScore,
    }
  }

  private translateDay(day: string): string {
    const translations: Record<string, string> = {
      monday: '월요일',
      tuesday: '화요일',
      wednesday: '수요일',
      thursday: '목요일',
      friday: '금요일',
      saturday: '토요일',
      sunday: '일요일',
    }
    return translations[day] || day
  }

  private translateCategory(category: MetricCategory): string {
    const translations: Record<MetricCategory, string> = {
      spend_related: '지출 관련',
      engagement: '참여 관련',
      conversion: '전환 관련',
    }
    return translations[category]
  }

  private getRecommendedMonitoring(pattern: TimePatternAnalysis['pattern']): string[] {
    switch (pattern) {
      case 'weekday_spike':
        return [
          '평일 오전 캠페인 성과 집중 모니터링',
          '비즈니스 활동 시간대와 광고 노출 시간 정합성 확인',
          '주말 예산 재분배 검토',
        ]
      case 'weekend_spike':
        return [
          '주말 소비자 행동 패턴 분석',
          '주말 특화 크리에이티브 테스트',
          '평일 대비 주말 입찰 전략 조정',
        ]
      case 'periodic':
        return ['주기적 이벤트와 이상 발생 시점 대조', '정기 리포트 일정과 연관성 확인', '자동화 작업 스케줄 검토']
      case 'consistent':
        return ['전 시간대 균등 모니터링 유지', '일일 체크포인트 설정', '트렌드 변화 조기 감지 알림 설정']
      default:
        return ['불규칙 패턴에 대한 추가 데이터 수집', '외부 요인 (경쟁사, 시장 변화) 모니터링']
    }
  }

  private describeCorrelation(
    metric1: string,
    metric2: string,
    type: MetricCorrelation['correlationType']
  ): string {
    if (type === 'positive') {
      return `${metric1}과 ${metric2}이 함께 변동하는 경향이 있습니다. 한 메트릭의 이상은 다른 메트릭에도 영향을 줄 수 있습니다.`
    } else if (type === 'negative') {
      return `${metric1}과 ${metric2}이 반대 방향으로 변동합니다. 한 메트릭이 증가하면 다른 메트릭이 감소하는 패턴입니다.`
    }
    return `${metric1}과 ${metric2} 사이에 명확한 상관관계가 없습니다.`
  }
}
