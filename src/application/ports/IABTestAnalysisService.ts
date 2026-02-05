/**
 * A/B Test Analysis Service Port
 *
 * Interface for analyzing A/B test results and providing recommendations.
 */

import type { StatisticalSignificance } from '@domain/value-objects/StatisticalSignificance'

export interface VariantMetrics {
  variantId: string
  impressions: number
  conversions: number
  conversionRate: number
  revenue?: number
  revenuePerConversion?: number
}

export interface ABTestAnalysisResult {
  testId: string
  status: 'running' | 'significant' | 'not_significant' | 'insufficient_data'
  control: VariantMetrics
  treatment: VariantMetrics
  significance: StatisticalSignificance | null
  recommendation: string
  sampleSizeReached: boolean
  requiredSampleSize: number
}

export interface ABTestWinner {
  variantId: string
  uplift: number
  confidence: number
}

export interface StopTestRecommendation {
  shouldStop: boolean
  reason: string
  winner?: ABTestWinner
}

export interface IABTestAnalysisService {
  /**
   * Analyze an A/B test and determine statistical significance
   */
  analyzeTest(testId: string): Promise<ABTestAnalysisResult>

  /**
   * Get the winning variant if test is conclusive
   */
  getWinner(testId: string): Promise<ABTestWinner | null>

  /**
   * Determine if test should be stopped based on results
   */
  shouldStopTest(testId: string): Promise<StopTestRecommendation>
}
