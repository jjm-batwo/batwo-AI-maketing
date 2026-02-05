/**
 * A/B Test Analysis Service
 *
 * Provides statistical analysis for A/B tests using the StatisticalSignificance value object.
 * Analyzes test results and provides recommendations for test conclusions.
 */

import type { IABTestRepository } from '@domain/repositories/IABTestRepository'
import type {
  IABTestAnalysisService,
  ABTestAnalysisResult,
  ABTestWinner,
  StopTestRecommendation,
  VariantMetrics,
} from '@application/ports/IABTestAnalysisService'
import { StatisticalSignificance, type SignificanceLevel } from '@domain/value-objects/StatisticalSignificance'

export class ABTestAnalysisService implements IABTestAnalysisService {
  constructor(private readonly abTestRepository: IABTestRepository) {}

  /**
   * Analyze an A/B test and determine statistical significance
   */
  async analyzeTest(testId: string): Promise<ABTestAnalysisResult> {
    const test = await this.abTestRepository.findById(testId)

    if (!test) {
      throw new Error(`A/B test not found: ${testId}`)
    }

    // Get control and treatment variants
    const control = test.getControl()
    const treatments = test.getTreatments()

    if (treatments.length === 0) {
      throw new Error('No treatment variants found')
    }

    // For now, we'll analyze the first treatment (can be extended to support multiple treatments)
    const treatment = treatments[0]

    // Convert to VariantMetrics
    const controlMetrics: VariantMetrics = {
      variantId: control.id,
      impressions: control.impressions,
      conversions: control.conversions,
      conversionRate: control.impressions > 0 ? (control.conversions / control.impressions) * 100 : 0,
      revenue: control.revenue.amount,
      revenuePerConversion: control.conversions > 0 ? control.revenue.amount / control.conversions : 0,
    }

    const treatmentMetrics: VariantMetrics = {
      variantId: treatment.id,
      impressions: treatment.impressions,
      conversions: treatment.conversions,
      conversionRate: treatment.impressions > 0 ? (treatment.conversions / treatment.impressions) * 100 : 0,
      revenue: treatment.revenue.amount,
      revenuePerConversion: treatment.conversions > 0 ? treatment.revenue.amount / treatment.conversions : 0,
    }

    // Calculate required sample size
    const baselineRate = controlMetrics.conversionRate / 100
    const minimumDetectableEffect = 0.02 // 2% absolute effect (can be configurable)
    const requiredSampleSize = StatisticalSignificance.requiredSampleSize(
      baselineRate > 0 ? baselineRate : 0.01, // Avoid zero baseline
      minimumDetectableEffect,
      0.8, // 80% power
      (test.confidenceLevel / 100) as SignificanceLevel
    )

    // Check if minimum sample size is reached
    const totalSamples = controlMetrics.impressions + treatmentMetrics.impressions
    const sampleSizeReached = totalSamples >= requiredSampleSize

    // Calculate statistical significance
    let significance: StatisticalSignificance | null = null
    let status: ABTestAnalysisResult['status'] = 'running'
    let recommendation = ''

    if (controlMetrics.impressions === 0 || treatmentMetrics.impressions === 0) {
      status = 'insufficient_data'
      recommendation = 'Not enough data to analyze. Both variants need impressions.'
    } else if (!sampleSizeReached) {
      status = 'insufficient_data'
      const remaining = requiredSampleSize - totalSamples
      recommendation = `Need ${remaining.toLocaleString()} more samples to reach statistical power. Continue running the test.`
    } else {
      significance = StatisticalSignificance.calculate(
        controlMetrics.conversions,
        controlMetrics.impressions,
        treatmentMetrics.conversions,
        treatmentMetrics.impressions,
        (test.confidenceLevel / 100) as SignificanceLevel
      )

      if (significance.isSignificant) {
        status = 'significant'
        const winner = significance.absoluteUplift > 0 ? treatment.name : control.name
        const upliftPercent = (Math.abs(significance.relativeUplift) * 100).toFixed(1)
        recommendation = `${winner} wins with ${upliftPercent}% improvement at ${test.confidenceLevel}% confidence. Safe to stop test and implement winning variant.`
      } else {
        status = 'not_significant'
        recommendation = `No statistically significant difference detected (p-value: ${significance.pValue.toFixed(4)}). Consider running test longer or the variants may be truly similar.`
      }
    }

    return {
      testId: test.id,
      status,
      control: controlMetrics,
      treatment: treatmentMetrics,
      significance,
      recommendation,
      sampleSizeReached,
      requiredSampleSize,
    }
  }

  /**
   * Get the winning variant if test is conclusive
   */
  async getWinner(testId: string): Promise<ABTestWinner | null> {
    const analysis = await this.analyzeTest(testId)

    if (analysis.status !== 'significant' || !analysis.significance) {
      return null
    }

    // Determine winner based on absolute uplift
    const isControlWinner = analysis.significance.absoluteUplift < 0
    const winner = isControlWinner ? analysis.control : analysis.treatment

    return {
      variantId: winner.variantId,
      uplift: Math.abs(analysis.significance.relativeUplift) * 100,
      confidence: (1 - analysis.significance.pValue) * 100,
    }
  }

  /**
   * Determine if test should be stopped based on results
   */
  async shouldStopTest(testId: string): Promise<StopTestRecommendation> {
    const analysis = await this.analyzeTest(testId)

    // Case 1: Insufficient data - keep running
    if (analysis.status === 'insufficient_data') {
      return {
        shouldStop: false,
        reason: analysis.recommendation,
      }
    }

    // Case 2: Significant result - stop and declare winner
    if (analysis.status === 'significant') {
      const winner = await this.getWinner(testId)
      return {
        shouldStop: true,
        reason: analysis.recommendation,
        winner: winner || undefined,
      }
    }

    // Case 3: Not significant but reached sample size
    // Check if we've collected significantly more than required (e.g., 2x)
    const totalSamples = analysis.control.impressions + analysis.treatment.impressions
    const isWellOversampled = totalSamples >= analysis.requiredSampleSize * 2

    if (isWellOversampled) {
      return {
        shouldStop: true,
        reason: 'Collected sufficient samples (2x required) with no significant difference. Variants are likely equivalent. Safe to stop and use either variant.',
      }
    }

    // Case 4: Running with no significance yet
    return {
      shouldStop: false,
      reason: analysis.recommendation,
    }
  }
}
