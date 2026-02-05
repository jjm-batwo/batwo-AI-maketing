/**
 * Statistical Significance Value Object
 *
 * Implements Z-test for A/B testing with proportion comparison.
 * Provides statistical significance calculation and sample size estimation.
 */

export type SignificanceLevel = 0.90 | 0.95 | 0.99

export interface StatisticalResult {
  isSignificant: boolean
  pValue: number
  confidenceInterval: [number, number]
  relativeUplift: number
  absoluteUplift: number
}

/**
 * Statistical significance calculator for A/B tests
 * Uses two-proportion Z-test for conversion rate comparison
 */
export class StatisticalSignificance {
  private constructor(
    public readonly isSignificant: boolean,
    public readonly pValue: number,
    public readonly confidenceInterval: [number, number],
    public readonly relativeUplift: number,
    public readonly absoluteUplift: number,
    public readonly confidenceLevel: SignificanceLevel
  ) {
    // Make properties immutable
    Object.freeze(this)
  }

  /**
   * Calculate statistical significance using Z-test
   *
   * @param controlConversions - Number of conversions in control group
   * @param controlTotal - Total samples in control group
   * @param treatmentConversions - Number of conversions in treatment group
   * @param treatmentTotal - Total samples in treatment group
   * @param confidenceLevel - Confidence level (0.90, 0.95, or 0.99)
   * @returns StatisticalSignificance instance with test results
   */
  static calculate(
    controlConversions: number,
    controlTotal: number,
    treatmentConversions: number,
    treatmentTotal: number,
    confidenceLevel: SignificanceLevel = 0.95
  ): StatisticalSignificance {
    // Validate inputs
    this.validateCalculateInputs(
      controlConversions,
      controlTotal,
      treatmentConversions,
      treatmentTotal
    )

    // Calculate conversion rates
    const p1 = controlConversions / controlTotal
    const p2 = treatmentConversions / treatmentTotal

    // Calculate pooled proportion for Z-test
    const pooledP =
      (controlConversions + treatmentConversions) / (controlTotal + treatmentTotal)

    // Calculate standard error
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / controlTotal + 1 / treatmentTotal))

    // Calculate Z-score
    const zScore = se === 0 ? 0 : (p2 - p1) / se

    // Calculate two-tailed p-value
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)))

    // Determine significance
    const alpha = 1 - confidenceLevel
    const isSignificant = pValue < alpha

    // Calculate uplift
    const absoluteUplift = p2 - p1
    const relativeUplift = p1 === 0 ? Infinity : (p2 - p1) / p1

    // Calculate confidence interval for difference
    const zCritical = this.getZCritical(confidenceLevel)
    const seDiff = Math.sqrt((p1 * (1 - p1)) / controlTotal + (p2 * (1 - p2)) / treatmentTotal)
    const marginOfError = zCritical * seDiff
    const confidenceInterval: [number, number] = [
      absoluteUplift - marginOfError,
      absoluteUplift + marginOfError,
    ]

    return new StatisticalSignificance(
      isSignificant,
      pValue,
      confidenceInterval,
      relativeUplift,
      absoluteUplift,
      confidenceLevel
    )
  }

  /**
   * Calculate required sample size per variant
   *
   * Uses formula: n = (Zα/2 + Zβ)² * (p1(1-p1) + p2(1-p2)) / (p2-p1)²
   *
   * @param baselineRate - Expected baseline conversion rate (0-1)
   * @param minimumDetectableEffect - Minimum absolute effect to detect (0-1)
   * @param power - Statistical power (1 - β), typically 0.8
   * @param confidenceLevel - Confidence level (0.90, 0.95, or 0.99)
   * @returns Required sample size per variant
   */
  static requiredSampleSize(
    baselineRate: number,
    minimumDetectableEffect: number,
    power: number = 0.8,
    confidenceLevel: SignificanceLevel = 0.95
  ): number {
    // Validate inputs
    if (baselineRate < 0 || baselineRate > 1) {
      throw new Error('Baseline rate must be between 0 and 1')
    }
    if (minimumDetectableEffect <= 0) {
      throw new Error('Minimum detectable effect must be positive')
    }
    if (baselineRate + minimumDetectableEffect > 1) {
      throw new Error('Effect would exceed 100% conversion rate')
    }
    if (power <= 0 || power > 1) {
      throw new Error('Power must be between 0 and 1')
    }

    const p1 = baselineRate
    const p2 = baselineRate + minimumDetectableEffect

    // Get Z-scores
    const zAlpha = this.getZCritical(confidenceLevel)
    const zBeta = this.normalInverseCDF(power)

    // Calculate sample size
    const numerator =
      Math.pow(zAlpha + zBeta, 2) * (p1 * (1 - p1) + p2 * (1 - p2))
    const denominator = Math.pow(p2 - p1, 2)

    const sampleSize = numerator / denominator

    // Round up to nearest integer
    return Math.ceil(sampleSize)
  }

  /**
   * Validate inputs for calculate method
   */
  private static validateCalculateInputs(
    controlConversions: number,
    controlTotal: number,
    treatmentConversions: number,
    treatmentTotal: number
  ): void {
    if (controlConversions < 0 || treatmentConversions < 0) {
      throw new Error('Conversions cannot be negative')
    }
    if (controlTotal <= 0 || treatmentTotal <= 0) {
      throw new Error('Total samples must be positive')
    }
    if (controlConversions > controlTotal || treatmentConversions > treatmentTotal) {
      throw new Error('Conversions cannot exceed total')
    }
  }

  /**
   * Get Z-critical value for confidence level
   */
  private static getZCritical(confidenceLevel: SignificanceLevel): number {
    const zValues: Record<SignificanceLevel, number> = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576,
    }
    return zValues[confidenceLevel]
  }

  /**
   * Standard normal cumulative distribution function (CDF)
   * Approximation using the error function
   */
  private static normalCDF(z: number): number {
    // Using the approximation: Φ(z) = 0.5 * (1 + erf(z / sqrt(2)))
    return 0.5 * (1 + this.erf(z / Math.sqrt(2)))
  }

  /**
   * Inverse standard normal CDF (quantile function)
   * Approximation for finding Z-score from probability
   */
  private static normalInverseCDF(p: number): number {
    // Beasley-Springer-Moro algorithm approximation
    const a = [
      -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
      1.383577518672690e2, -3.066479806614716e1, 2.506628277459239,
    ]
    const b = [
      -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
      6.680131188771972e1, -1.328068155288572e1,
    ]
    const c = [
      -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
      -2.549732539343734, 4.374664141464968, 2.938163982698783,
    ]
    const d = [
      7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
      3.754408661907416,
    ]

    const pLow = 0.02425
    const pHigh = 1 - pLow

    let x: number

    if (p < pLow) {
      const q = Math.sqrt(-2 * Math.log(p))
      x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    } else if (p <= pHigh) {
      const q = p - 0.5
      const r = q * q
      x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
        (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    } else {
      const q = Math.sqrt(-2 * Math.log(1 - p))
      x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    }

    return x
  }

  /**
   * Error function approximation
   * Used for normal CDF calculation
   */
  private static erf(x: number): number {
    // Abramowitz and Stegun approximation
    const sign = x >= 0 ? 1 : -1
    x = Math.abs(x)

    const a1 = 0.254829592
    const a2 = -0.284496736
    const a3 = 1.421413741
    const a4 = -1.453152027
    const a5 = 1.061405429
    const p = 0.3275911

    const t = 1 / (1 + p * x)
    const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

    return sign * y
  }
}
