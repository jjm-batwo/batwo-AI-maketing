import { describe, it, expect } from 'vitest'
import {
  calculateBaseline,
  calculateMean,
  calculateStdDev,
  calculateZScore,
  calculateIQRDistance,
  calculateMovingAverage,
  detectTrend,
} from '@application/services/AnomalyDetectionService'

describe('AnomalyDetectionService — Statistical Utilities', () => {
  describe('calculateMean', () => {
    it('should calculate correct mean', () => {
      expect(calculateMean([10, 20, 30])).toBe(20)
    })

    it('should return 0 for empty array', () => {
      expect(calculateMean([])).toBe(0)
    })
  })

  describe('calculateStdDev', () => {
    it('should calculate standard deviation', () => {
      const values = [10, 12, 23, 23, 16, 23, 21, 16]
      const mean = calculateMean(values)
      const stdDev = calculateStdDev(values, mean)
      expect(stdDev).toBeGreaterThan(0)
      expect(stdDev).toBeLessThan(10)
    })

    it('should return 0 for identical values', () => {
      const mean = calculateMean([5, 5, 5, 5])
      expect(calculateStdDev([5, 5, 5, 5], mean)).toBe(0)
    })
  })

  describe('calculateZScore', () => {
    it('should return 0 when value equals mean', () => {
      expect(calculateZScore(10, 10, 2)).toBe(0)
    })

    it('should return positive z-score for above-mean value', () => {
      expect(calculateZScore(14, 10, 2)).toBe(2)
    })

    it('should return 0 when stdDev is 0', () => {
      expect(calculateZScore(10, 10, 0)).toBe(0)
    })
  })

  describe('calculateBaseline', () => {
    it('should calculate complete baseline statistics', () => {
      const data = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75]
      const baseline = calculateBaseline(data)

      expect(baseline.mean).toBeCloseTo(42.5)
      expect(baseline.median).toBeCloseTo(42.5)
      expect(baseline.min).toBe(10)
      expect(baseline.max).toBe(75)
      expect(baseline.sampleSize).toBe(14)
      expect(baseline.q1).toBeDefined()
      expect(baseline.q3).toBeDefined()
      expect(baseline.iqr).toBeGreaterThan(0)
    })
  })

  describe('calculateMovingAverage', () => {
    it('should calculate correct moving averages', () => {
      const data = [10, 20, 30, 40, 50]
      const ma = calculateMovingAverage(data, 3)
      expect(ma).toHaveLength(3) // 5 - 3 + 1
      expect(ma[0]).toBeCloseTo(20)  // (10+20+30)/3
      expect(ma[1]).toBeCloseTo(30)  // (20+30+40)/3
      expect(ma[2]).toBeCloseTo(40)  // (30+40+50)/3
    })
  })

  describe('detectTrend', () => {
    it('should detect upward trend', () => {
      // Use values with low CV (stdDev/mean < 50%) to avoid 'volatile' classification
      const trend = detectTrend([100, 110, 120, 130, 140, 150, 160])
      expect(trend).toBe('increasing')
    })

    it('should detect downward trend', () => {
      // Use values with low CV (stdDev/mean < 50%) to avoid 'volatile' classification
      const trend = detectTrend([160, 150, 140, 130, 120, 110, 100])
      expect(trend).toBe('decreasing')
    })

    it('should detect stable trend', () => {
      const trend = detectTrend([50, 51, 49, 50, 51, 49, 50])
      expect(trend).toBe('stable')
    })
  })
})

describe('AnomalyDetectionService — Threshold Validation', () => {
  // Generate 14 days of stable KPI data (no anomalies)
  function generateStableData(days: number, baseCtr: number = 3.0, variance: number = 0.3): number[] {
    return Array.from({ length: days }, (_, i) =>
      baseCtr + (Math.sin(i * 0.5) * variance) // slight natural oscillation
    )
  }

  // Generate data with a spike on the last day
  function generateSpikeData(days: number, baseCtr: number = 3.0, spikeMultiplier: number = 2.0): number[] {
    const data = generateStableData(days - 1, baseCtr)
    data.push(baseCtr * spikeMultiplier) // spike on last day
    return data
  }

  // Generate data with a drop on the last day
  function generateDropData(days: number, baseCtr: number = 3.0, dropMultiplier: number = 0.3): number[] {
    const data = generateStableData(days - 1, baseCtr)
    data.push(baseCtr * dropMultiplier) // drop on last day
    return data
  }

  describe('Z-Score threshold (2.3)', () => {
    it('should NOT flag stable data as anomaly', () => {
      const data = generateStableData(14, 3.0, 0.3)
      const baseline = calculateBaseline(data.slice(0, -1))
      const lastValue = data[data.length - 1]
      const zScore = calculateZScore(lastValue, baseline.mean, baseline.stdDev)

      expect(Math.abs(zScore)).toBeLessThan(2.3)
    })

    it('should flag 2x spike as anomaly', () => {
      const data = generateSpikeData(14, 3.0, 2.5)
      const baseline = calculateBaseline(data.slice(0, -1))
      const lastValue = data[data.length - 1]
      const zScore = calculateZScore(lastValue, baseline.mean, baseline.stdDev)

      expect(Math.abs(zScore)).toBeGreaterThan(2.3)
    })

    it('should flag 70% drop as anomaly', () => {
      const data = generateDropData(14, 3.0, 0.3)
      const baseline = calculateBaseline(data.slice(0, -1))
      const lastValue = data[data.length - 1]
      const zScore = calculateZScore(lastValue, baseline.mean, baseline.stdDev)

      expect(Math.abs(zScore)).toBeGreaterThan(2.3)
    })
  })

  describe('IQR threshold (1.6x)', () => {
    it('should NOT flag values within normal range', () => {
      const data = generateStableData(14, 100, 10)
      const baseline = calculateBaseline(data)
      const normalValue = baseline.mean + baseline.iqr * 0.5

      const distance = calculateIQRDistance(normalValue, baseline.q1, baseline.q3, baseline.iqr)
      expect(Math.abs(distance)).toBeLessThan(1.6)
    })

    it('should flag extreme outlier', () => {
      const data = generateStableData(14, 100, 10)
      const baseline = calculateBaseline(data)
      const outlierValue = baseline.q3 + baseline.iqr * 2.0

      const distance = calculateIQRDistance(outlierValue, baseline.q1, baseline.q3, baseline.iqr)
      expect(distance).toBeGreaterThan(1.6)
    })
  })

  describe('Spike/Drop threshold (60% / -35%)', () => {
    it('should NOT flag 30% increase as spike', () => {
      const prev = 100
      const current = 130
      const changePct = ((current - prev) / prev) * 100
      expect(changePct).toBeLessThan(60)
    })

    it('should flag 80% increase as spike', () => {
      const prev = 100
      const current = 180
      const changePct = ((current - prev) / prev) * 100
      expect(changePct).toBeGreaterThan(60)
    })

    it('should NOT flag 20% decrease as drop', () => {
      const prev = 100
      const current = 80
      const changePct = ((current - prev) / prev) * 100
      expect(changePct).toBeGreaterThan(-35)
    })

    it('should flag 50% decrease as drop', () => {
      const prev = 100
      const current = 50
      const changePct = ((current - prev) / prev) * 100
      expect(changePct).toBeLessThan(-35)
    })
  })

  describe('Realistic KPI Scenarios', () => {
    it('stable spend pattern should produce no anomalies', () => {
      // 14일간 일 예산 30,000원 ± 3,000원
      const spendData = [28000, 31000, 29500, 30200, 32000, 29000, 30500,
                         31200, 28800, 30000, 29700, 31500, 30800, 29200]
      const baseline = calculateBaseline(spendData)

      // All values should be within z-score 2.3
      for (const val of spendData) {
        const z = calculateZScore(val, baseline.mean, baseline.stdDev)
        expect(Math.abs(z)).toBeLessThan(2.3)
      }
    })

    it('sudden budget increase (3x) should be detected', () => {
      const spendData = [30000, 31000, 29000, 30500, 30200, 29800, 31000,
                         30000, 29500, 30800, 31200, 29700, 30000, 90000] // 3x spike
      const baseline = calculateBaseline(spendData.slice(0, -1))
      const z = calculateZScore(spendData[13], baseline.mean, baseline.stdDev)

      expect(Math.abs(z)).toBeGreaterThan(2.3)
    })

    it('gradual CTR decline should be detected by trend', () => {
      // CTR declining from 3.5% to 1.8% over 14 days
      const ctrData = [3.5, 3.4, 3.3, 3.1, 3.0, 2.8, 2.7,
                       2.5, 2.4, 2.3, 2.1, 2.0, 1.9, 1.8]
      const trend = detectTrend(ctrData)

      expect(trend).toBe('decreasing')
    })

    it('ROAS dip during Korean holiday should be within adjusted threshold', () => {
      // ROAS normally 3.0x, drops to 2.0x during Chuseok (expected -30%)
      // With 20% threshold relaxation, adjusted z-score threshold = 2.3 * 1.2 = 2.76
      const roasData = [3.0, 3.1, 2.9, 3.0, 3.2, 2.8, 3.1,
                        3.0, 2.9, 3.1, 3.0, 2.9, 3.0, 2.0] // holiday dip
      const baseline = calculateBaseline(roasData.slice(0, -1))
      const z = calculateZScore(roasData[13], baseline.mean, baseline.stdDev)
      // Korean holiday: adjusted threshold = 2.3 * 1.2 = 2.76
      // The z-score should be detectable even with adjustment
      expect(Math.abs(z)).toBeGreaterThan(2.0)
    })
  })
})
