/**
 * AI Insights DTO
 *
 * Response mappers for anomaly detection and trend analysis APIs
 */

import type { Anomaly } from '@application/services/AnomalyDetectionService'

// ============================================================================
// Anomaly Insight Types
// ============================================================================

export interface AnomalyInsightDTO {
  id: string
  metric: string
  value: number
  expectedRange: { min: number; max: number }
  severity: 'low' | 'medium' | 'high'
  message: string
  recommendation: string
  confidence: number
  detectedAt: string
}

// ============================================================================
// Trend Insight Types
// ============================================================================

export interface TrendInsightDTO {
  id: string
  metric: string
  direction: 'up' | 'down' | 'stable'
  changePercent: number
  period: string
  message: string
  confidence: number
}

// ============================================================================
// API Response Types
// ============================================================================

export interface AnomalyAPIResponse {
  anomalies: Anomaly[]
  detectedAt: string
  count: number
  summary: {
    critical: number
    warning: number
    info: number
    byType: Record<string, number>
  }
}

export interface TrendAPIResponse {
  success: boolean
  data: {
    upcomingEvents: Array<{
      date: string
      eventName: string
      type: string
      industries: string[]
      expectedImpact: {
        trafficIncrease: string
        conversionChange: string
        competitionLevel: string
      }
      marketingTips: string[]
      prepDays: number
    }>
    weeklyDigest: {
      summary: string
      opportunityScore: number
      topOpportunities: Array<{
        date: string
        event: string
        priority: 'high' | 'medium' | 'low'
        actionItem: string
      }>
      industryInsights: string[]
    } | null
    lookaheadDays: number
    industry: string
  }
}

// ============================================================================
// Mappers
// ============================================================================

/**
 * Map anomaly API response to AnomalyInsightDTO
 */
export function mapAnomalyResponse(data: AnomalyAPIResponse): AnomalyInsightDTO[] {
  return data.anomalies.map((anomaly) => {
    // Calculate expected range based on baseline
    const baseline = anomaly.detail.baseline
    const expectedRange = baseline
      ? {
          min: Math.max(0, baseline.mean - 2 * baseline.stdDev),
          max: baseline.mean + 2 * baseline.stdDev,
        }
      : { min: 0, max: anomaly.currentValue * 2 }

    // Map severity
    const severity: 'low' | 'medium' | 'high' =
      anomaly.severity === 'critical' ? 'high' :
      anomaly.severity === 'warning' ? 'medium' :
      'low'

    // Calculate confidence based on detection method and baseline
    const confidence = calculateConfidence(anomaly)

    // Get primary recommendation
    const recommendation = anomaly.recommendations[0] || '캠페인을 모니터링하세요.'

    return {
      id: anomaly.id,
      metric: anomaly.metric,
      value: anomaly.currentValue,
      expectedRange,
      severity,
      message: anomaly.message,
      recommendation,
      confidence,
      detectedAt: anomaly.detectedAt.toISOString(),
    }
  })
}

/**
 * Map trend API response to TrendInsightDTO
 */
export function mapTrendResponse(data: TrendAPIResponse): TrendInsightDTO[] {
  if (!data.success || !data.data.upcomingEvents) {
    return []
  }

  const trends: TrendInsightDTO[] = []

  // Convert upcoming events to trend insights
  data.data.upcomingEvents.forEach((event, index) => {
    const impactDirection = event.expectedImpact.trafficIncrease.includes('증가')
      ? 'up'
      : event.expectedImpact.trafficIncrease.includes('감소')
      ? 'down'
      : 'stable'

    // Parse expected change percentage
    const changeMatch = event.expectedImpact.trafficIncrease.match(/(\d+)/)
    const changePercent = changeMatch ? parseInt(changeMatch[1]) : 0

    trends.push({
      id: `trend-${index}`,
      metric: event.type,
      direction: impactDirection,
      changePercent,
      period: event.date,
      message: `${event.eventName}: ${event.marketingTips[0] || '준비가 필요합니다.'}`,
      confidence: event.prepDays <= 7 ? 0.9 : event.prepDays <= 14 ? 0.75 : 0.6,
    })
  })

  // Add weekly digest opportunities as trends
  if (data.data.weeklyDigest?.topOpportunities) {
    data.data.weeklyDigest.topOpportunities.forEach((opportunity, index) => {
      const priority = opportunity.priority
      const confidence = priority === 'high' ? 0.85 : priority === 'medium' ? 0.7 : 0.55

      trends.push({
        id: `opportunity-${index}`,
        metric: 'opportunity',
        direction: 'up',
        changePercent: 0,
        period: opportunity.date,
        message: `${opportunity.event}: ${opportunity.actionItem}`,
        confidence,
      })
    })
  }

  return trends
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate confidence score based on anomaly characteristics
 */
function calculateConfidence(anomaly: Anomaly): number {
  let confidence = 0.5 // Base confidence

  // Increase confidence based on detection method
  if (anomaly.detail.zScore !== undefined) {
    const absZScore = Math.abs(anomaly.detail.zScore)
    if (absZScore > 3) confidence += 0.3
    else if (absZScore > 2.5) confidence += 0.2
    else confidence += 0.1
  }

  // Increase confidence if multiple methods agree
  const methodCount = [
    anomaly.detail.zScore,
    anomaly.detail.iqrDistance,
    anomaly.detail.movingAverageDeviation,
  ].filter((v) => v !== undefined).length

  if (methodCount > 1) confidence += 0.15

  // Increase confidence with larger sample size
  if (anomaly.detail.baseline) {
    const sampleSize = anomaly.detail.baseline.sampleSize
    if (sampleSize > 30) confidence += 0.1
    else if (sampleSize > 14) confidence += 0.05
  }

  // Cap confidence at 0.95
  return Math.min(0.95, confidence)
}
