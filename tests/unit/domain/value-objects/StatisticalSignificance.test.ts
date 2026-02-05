import { describe, it, expect } from 'vitest'
import { StatisticalSignificance } from '@domain/value-objects/StatisticalSignificance'

describe('StatisticalSignificance', () => {
  describe('calculate', () => {
    it('should detect significant difference with large sample and clear winner', () => {
      // Control: 100/1000 = 10% conversion
      // Treatment: 150/1000 = 15% conversion
      // Expected: significant at 95% confidence
      const result = StatisticalSignificance.calculate(100, 1000, 150, 1000, 0.95)

      expect(result.isSignificant).toBe(true)
      expect(result.pValue).toBeLessThan(0.05)
      expect(result.relativeUplift).toBeCloseTo(0.5, 1) // 50% relative uplift
      expect(result.absoluteUplift).toBeCloseTo(0.05, 2) // 5% absolute uplift
      expect(result.confidenceInterval[0]).toBeGreaterThan(0)
      expect(result.confidenceInterval[1]).toBeLessThan(1)
    })

    it('should not detect significance with small sample size', () => {
      // Control: 5/50 = 10% conversion
      // Treatment: 8/50 = 16% conversion
      // Expected: not significant (small sample)
      const result = StatisticalSignificance.calculate(5, 50, 8, 50, 0.95)

      expect(result.isSignificant).toBe(false)
      expect(result.pValue).toBeGreaterThan(0.05)
    })

    it('should not detect significance when rates are similar', () => {
      // Control: 100/1000 = 10% conversion
      // Treatment: 105/1000 = 10.5% conversion
      // Expected: not significant (minimal difference)
      const result = StatisticalSignificance.calculate(100, 1000, 105, 1000, 0.95)

      expect(result.isSignificant).toBe(false)
      expect(result.pValue).toBeGreaterThan(0.05)
    })

    it('should calculate correct confidence intervals', () => {
      const result = StatisticalSignificance.calculate(100, 1000, 150, 1000, 0.95)

      // Confidence interval should contain the true difference
      expect(result.confidenceInterval[0]).toBeLessThan(result.absoluteUplift)
      expect(result.confidenceInterval[1]).toBeGreaterThan(result.absoluteUplift)
    })

    it('should support different confidence levels', () => {
      const control = 100
      const controlTotal = 1000
      const treatment = 150
      const treatmentTotal = 1000

      const result90 = StatisticalSignificance.calculate(
        control,
        controlTotal,
        treatment,
        treatmentTotal,
        0.90
      )
      const result95 = StatisticalSignificance.calculate(
        control,
        controlTotal,
        treatment,
        treatmentTotal,
        0.95
      )
      const result99 = StatisticalSignificance.calculate(
        control,
        controlTotal,
        treatment,
        treatmentTotal,
        0.99
      )

      // Higher confidence requires lower p-value
      expect(result90.confidenceLevel).toBe(0.90)
      expect(result95.confidenceLevel).toBe(0.95)
      expect(result99.confidenceLevel).toBe(0.99)

      // Wider interval for higher confidence
      const width90 = result90.confidenceInterval[1] - result90.confidenceInterval[0]
      const width95 = result95.confidenceInterval[1] - result95.confidenceInterval[0]
      const width99 = result99.confidenceInterval[1] - result99.confidenceInterval[0]

      expect(width90).toBeLessThan(width95)
      expect(width95).toBeLessThan(width99)
    })

    it('should handle edge case of zero conversions', () => {
      const result = StatisticalSignificance.calculate(0, 1000, 10, 1000, 0.95)

      expect(result.relativeUplift).toBe(Infinity) // Division by zero for relative uplift
      expect(result.absoluteUplift).toBeCloseTo(0.01, 2)
    })

    it('should handle edge case of 100% conversion rates', () => {
      const result = StatisticalSignificance.calculate(1000, 1000, 1000, 1000, 0.95)

      expect(result.isSignificant).toBe(false)
      expect(result.absoluteUplift).toBe(0)
      expect(result.relativeUplift).toBe(0)
    })

    it('should throw error for invalid inputs', () => {
      expect(() =>
        StatisticalSignificance.calculate(-1, 100, 10, 100, 0.95)
      ).toThrow('Conversions cannot be negative')

      expect(() =>
        StatisticalSignificance.calculate(10, 0, 10, 100, 0.95)
      ).toThrow('Total samples must be positive')

      expect(() =>
        StatisticalSignificance.calculate(150, 100, 10, 100, 0.95)
      ).toThrow('Conversions cannot exceed total')
    })
  })

  describe('requiredSampleSize', () => {
    it('should calculate required sample size for standard test', () => {
      // 10% baseline, want to detect 20% relative change (2% absolute)
      const sampleSize = StatisticalSignificance.requiredSampleSize(
        0.10,
        0.02,
        0.8,
        0.95
      )

      // Should require reasonable sample size (typically 2000-5000 per variant)
      expect(sampleSize).toBeGreaterThan(1000)
      expect(sampleSize).toBeLessThan(10000)
    })

    it('should require larger samples for smaller effects', () => {
      const baseline = 0.10
      const largeEffect = StatisticalSignificance.requiredSampleSize(baseline, 0.05, 0.8, 0.95)
      const smallEffect = StatisticalSignificance.requiredSampleSize(baseline, 0.01, 0.8, 0.95)

      expect(smallEffect).toBeGreaterThan(largeEffect)
    })

    it('should require larger samples for higher power', () => {
      const baseline = 0.10
      const effect = 0.02
      const power80 = StatisticalSignificance.requiredSampleSize(baseline, effect, 0.8, 0.95)
      const power90 = StatisticalSignificance.requiredSampleSize(baseline, effect, 0.9, 0.95)

      expect(power90).toBeGreaterThan(power80)
    })

    it('should require larger samples for higher confidence', () => {
      const baseline = 0.10
      const effect = 0.02
      const conf90 = StatisticalSignificance.requiredSampleSize(baseline, effect, 0.8, 0.90)
      const conf95 = StatisticalSignificance.requiredSampleSize(baseline, effect, 0.8, 0.95)
      const conf99 = StatisticalSignificance.requiredSampleSize(baseline, effect, 0.8, 0.99)

      expect(conf95).toBeGreaterThan(conf90)
      expect(conf99).toBeGreaterThan(conf95)
    })

    it('should throw error for invalid baseline rate', () => {
      expect(() =>
        StatisticalSignificance.requiredSampleSize(-0.1, 0.02, 0.8, 0.95)
      ).toThrow('Baseline rate must be between 0 and 1')

      expect(() =>
        StatisticalSignificance.requiredSampleSize(1.5, 0.02, 0.8, 0.95)
      ).toThrow('Baseline rate must be between 0 and 1')
    })

    it('should throw error for invalid minimum detectable effect', () => {
      expect(() =>
        StatisticalSignificance.requiredSampleSize(0.10, -0.02, 0.8, 0.95)
      ).toThrow('Minimum detectable effect must be positive')

      expect(() =>
        StatisticalSignificance.requiredSampleSize(0.10, 1.5, 0.8, 0.95)
      ).toThrow('Effect would exceed 100% conversion rate')
    })

    it('should throw error for invalid power', () => {
      expect(() =>
        StatisticalSignificance.requiredSampleSize(0.10, 0.02, 0, 0.95)
      ).toThrow('Power must be between 0 and 1')

      expect(() =>
        StatisticalSignificance.requiredSampleSize(0.10, 0.02, 1.5, 0.95)
      ).toThrow('Power must be between 0 and 1')
    })
  })

  describe('immutability', () => {
    it('should be immutable', () => {
      const result = StatisticalSignificance.calculate(100, 1000, 150, 1000, 0.95)

      expect(() => {
        // @ts-expect-error - testing runtime immutability
        result.isSignificant = false
      }).toThrow()

      expect(() => {
        // @ts-expect-error - testing runtime immutability
        result.pValue = 0.5
      }).toThrow()
    })
  })
})
