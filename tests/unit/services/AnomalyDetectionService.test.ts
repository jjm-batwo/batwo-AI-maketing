/**
 * AnomalyDetectionService 단위 테스트
 *
 * 테스트 범위:
 * - 통계적 유틸리티 함수 (평균, 표준편차, 백분위수, Z-Score, IQR)
 * - 기준선 계산
 * - 이동 평균 및 트렌드 감지
 * - 한국 시장 캘린더 통합
 * - 이상 징후 감지 로직
 */

import { describe, it, expect } from 'vitest'
import {
  calculateMean,
  calculateStdDev,
  calculatePercentile,
  calculateZScore,
  calculateIQRDistance,
  calculateBaseline,
  calculateMovingAverage,
  detectTrend,
} from '@application/services/AnomalyDetectionService'

describe('Statistical Utility Functions', () => {
  describe('calculateMean', () => {
    it('should return 0 for empty array', () => {
      expect(calculateMean([])).toBe(0)
    })

    it('should calculate correct mean for positive numbers', () => {
      expect(calculateMean([1, 2, 3, 4, 5])).toBe(3)
    })

    it('should calculate correct mean for decimal numbers', () => {
      expect(calculateMean([1.5, 2.5, 3.5])).toBeCloseTo(2.5)
    })

    it('should handle single value', () => {
      expect(calculateMean([10])).toBe(10)
    })

    it('should handle negative numbers', () => {
      expect(calculateMean([-10, 10])).toBe(0)
    })

    it('should handle large numbers', () => {
      expect(calculateMean([1000000, 2000000, 3000000])).toBe(2000000)
    })
  })

  describe('calculateStdDev', () => {
    it('should return 0 for single value', () => {
      expect(calculateStdDev([5], 5)).toBe(0)
    })

    it('should return 0 for empty array', () => {
      expect(calculateStdDev([], 0)).toBe(0)
    })

    it('should calculate correct standard deviation', () => {
      // Values: 2, 4, 4, 4, 5, 5, 7, 9
      // Mean: 5, StdDev: ~2.14
      const values = [2, 4, 4, 4, 5, 5, 7, 9]
      const mean = calculateMean(values)
      const stdDev = calculateStdDev(values, mean)
      expect(stdDev).toBeCloseTo(2.14, 1)
    })

    it('should return 0 for identical values', () => {
      const values = [5, 5, 5, 5, 5]
      expect(calculateStdDev(values, 5)).toBe(0)
    })
  })

  describe('calculatePercentile', () => {
    it('should return 0 for empty array', () => {
      expect(calculatePercentile([], 50)).toBe(0)
    })

    it('should calculate median (50th percentile)', () => {
      const sorted = [1, 2, 3, 4, 5]
      expect(calculatePercentile(sorted, 50)).toBe(3)
    })

    it('should calculate 25th percentile (Q1)', () => {
      const sorted = [1, 2, 3, 4, 5, 6, 7, 8]
      expect(calculatePercentile(sorted, 25)).toBeCloseTo(2.75, 1)
    })

    it('should calculate 75th percentile (Q3)', () => {
      const sorted = [1, 2, 3, 4, 5, 6, 7, 8]
      expect(calculatePercentile(sorted, 75)).toBeCloseTo(6.25, 1)
    })

    it('should calculate 95th percentile', () => {
      const sorted = Array.from({ length: 100 }, (_, i) => i + 1)
      expect(calculatePercentile(sorted, 95)).toBeCloseTo(95.05, 0)
    })

    it('should handle single value', () => {
      expect(calculatePercentile([42], 50)).toBe(42)
    })
  })

  describe('calculateZScore', () => {
    it('should return 0 when stdDev is 0', () => {
      expect(calculateZScore(100, 100, 0)).toBe(0)
    })

    it('should calculate positive Z-Score for value above mean', () => {
      // Value 120, Mean 100, StdDev 10 => Z-Score = 2
      expect(calculateZScore(120, 100, 10)).toBe(2)
    })

    it('should calculate negative Z-Score for value below mean', () => {
      // Value 80, Mean 100, StdDev 10 => Z-Score = -2
      expect(calculateZScore(80, 100, 10)).toBe(-2)
    })

    it('should return 0 when value equals mean', () => {
      expect(calculateZScore(100, 100, 10)).toBe(0)
    })

    it('should handle extreme values', () => {
      // Value 150, Mean 100, StdDev 10 => Z-Score = 5
      expect(calculateZScore(150, 100, 10)).toBe(5)
    })
  })

  describe('calculateIQRDistance', () => {
    it('should return 0 when IQR is 0', () => {
      expect(calculateIQRDistance(50, 40, 60, 0)).toBe(0)
    })

    it('should return 0 when value is within IQR', () => {
      // Value 50, Q1 40, Q3 60 => within range
      expect(calculateIQRDistance(50, 40, 60, 20)).toBe(0)
    })

    it('should calculate distance for value below Q1', () => {
      // Value 30, Q1 40, Q3 60, IQR 20
      // Distance = (40 - 30) / 20 = 0.5
      expect(calculateIQRDistance(30, 40, 60, 20)).toBe(0.5)
    })

    it('should calculate distance for value above Q3', () => {
      // Value 80, Q1 40, Q3 60, IQR 20
      // Distance = (80 - 60) / 20 = 1.0
      expect(calculateIQRDistance(80, 40, 60, 20)).toBe(1.0)
    })

    it('should identify outlier (distance > 1.5)', () => {
      // Value 100, Q1 40, Q3 60, IQR 20
      // Distance = (100 - 60) / 20 = 2.0 (outlier)
      expect(calculateIQRDistance(100, 40, 60, 20)).toBe(2.0)
    })

    it('should return 0 at exact boundary', () => {
      expect(calculateIQRDistance(40, 40, 60, 20)).toBe(0)
      expect(calculateIQRDistance(60, 40, 60, 20)).toBe(0)
    })
  })
})

describe('calculateBaseline', () => {
  it('should return zeros for empty array', () => {
    const baseline = calculateBaseline([])
    expect(baseline.mean).toBe(0)
    expect(baseline.stdDev).toBe(0)
    expect(baseline.median).toBe(0)
    expect(baseline.sampleSize).toBe(0)
  })

  it('should calculate complete baseline statistics', () => {
    const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    const baseline = calculateBaseline(values)

    expect(baseline.mean).toBe(55)
    expect(baseline.median).toBe(55)
    expect(baseline.min).toBe(10)
    expect(baseline.max).toBe(100)
    expect(baseline.sampleSize).toBe(10)
    // 선형 보간 percentile 계산:
    // Q1 (25%): index = 0.25 * 9 = 2.25 → 30 * 0.75 + 40 * 0.25 = 32.5
    // Q3 (75%): index = 0.75 * 9 = 6.75 → 70 * 0.25 + 80 * 0.75 = 77.5
    expect(baseline.q1).toBeCloseTo(32.5, 0)
    expect(baseline.q3).toBeCloseTo(77.5, 0)
    expect(baseline.iqr).toBeCloseTo(45, 0)
  })

  it('should handle real advertising metrics', () => {
    // Simulated daily CPA values (KRW)
    const cpaValues = [15000, 18000, 14000, 16000, 17000, 15500, 19000,
                       14500, 16500, 17500, 15000, 18500, 16000, 17000]
    const baseline = calculateBaseline(cpaValues)

    expect(baseline.sampleSize).toBe(14)
    expect(baseline.mean).toBeGreaterThan(15000)
    expect(baseline.mean).toBeLessThan(18000)
    expect(baseline.stdDev).toBeGreaterThan(0)
    expect(baseline.percentile95).toBeGreaterThan(baseline.median)
  })

  it('should calculate percentile95 correctly', () => {
    const values = Array.from({ length: 30 }, (_, i) => i * 1000 + 10000)
    const baseline = calculateBaseline(values)

    expect(baseline.percentile95).toBeCloseTo(37550, -2) // ~95th percentile
  })
})

describe('calculateMovingAverage', () => {
  it('should return empty array if values less than window', () => {
    expect(calculateMovingAverage([1, 2, 3], 5)).toEqual([])
  })

  it('should calculate 3-day moving average', () => {
    const values = [10, 20, 30, 40, 50]
    const ma = calculateMovingAverage(values, 3)

    expect(ma.length).toBe(3) // values.length - window + 1
    expect(ma[0]).toBe(20) // (10+20+30)/3
    expect(ma[1]).toBe(30) // (20+30+40)/3
    expect(ma[2]).toBe(40) // (30+40+50)/3
  })

  it('should calculate 7-day moving average', () => {
    const values = [100, 110, 90, 120, 80, 130, 70, 140, 60]
    const ma = calculateMovingAverage(values, 7)

    expect(ma.length).toBe(3)
    // First MA: (100+110+90+120+80+130+70)/7 = 100
    expect(ma[0]).toBe(100)
  })

  it('should handle constant values', () => {
    const values = [50, 50, 50, 50, 50, 50, 50]
    const ma = calculateMovingAverage(values, 3)

    ma.forEach(v => expect(v).toBe(50))
  })
})

describe('detectTrend', () => {
  it('should return stable for less than 3 values', () => {
    expect(detectTrend([1, 2])).toBe('stable')
  })

  it('should detect increasing trend', () => {
    const values = [100, 120, 140, 160, 180, 200]
    expect(detectTrend(values)).toBe('increasing')
  })

  it('should detect decreasing trend', () => {
    const values = [200, 180, 160, 140, 120, 100]
    expect(detectTrend(values)).toBe('decreasing')
  })

  it('should detect stable trend', () => {
    const values = [100, 101, 99, 100, 102, 98, 100]
    expect(detectTrend(values)).toBe('stable')
  })

  it('should detect volatile pattern', () => {
    const values = [100, 200, 50, 180, 30, 220, 10]
    expect(detectTrend(values)).toBe('volatile')
  })

  it('should handle real advertising data pattern', () => {
    // Gradual improvement in ROAS
    const roasValues = [2.0, 2.1, 2.3, 2.2, 2.5, 2.6, 2.8]
    expect(detectTrend(roasValues)).toBe('increasing')

    // Declining CTR (ad fatigue)
    const ctrValues = [3.5, 3.2, 3.0, 2.8, 2.5, 2.3, 2.0]
    expect(detectTrend(ctrValues)).toBe('decreasing')
  })
})

describe('Anomaly Detection Scenarios', () => {
  describe('Z-Score based detection', () => {
    it('should identify significant spike (Z > 2.5)', () => {
      const historicalValues = [100, 95, 105, 98, 102, 97, 103, 99, 101, 100, 98, 102, 97, 103]
      const baseline = calculateBaseline(historicalValues)

      // New value significantly higher
      const newValue = 150
      const zScore = calculateZScore(newValue, baseline.mean, baseline.stdDev)

      expect(Math.abs(zScore)).toBeGreaterThan(2.5) // Should be flagged as anomaly
    })

    it('should not flag normal variation', () => {
      const historicalValues = [100, 95, 105, 98, 102, 97, 103, 99, 101, 100, 98, 102, 97, 103]
      const baseline = calculateBaseline(historicalValues)

      // New value within normal range (stdDev ≈ 2.83, so 2.5 stdDev ≈ 7)
      // 106은 평균 100에서 6 떨어짐 → Z ≈ 2.1 < 2.5
      const newValue = 106
      const zScore = calculateZScore(newValue, baseline.mean, baseline.stdDev)

      expect(Math.abs(zScore)).toBeLessThan(2.5) // Should NOT be flagged
    })
  })

  describe('IQR based detection', () => {
    it('should identify outlier above Q3', () => {
      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
      const baseline = calculateBaseline(values)

      const outlierValue = 200
      const iqrDistance = calculateIQRDistance(
        outlierValue,
        baseline.q1,
        baseline.q3,
        baseline.iqr
      )

      expect(iqrDistance).toBeGreaterThan(1.5) // Outlier threshold
    })

    it('should identify outlier below Q1', () => {
      const values = [100, 110, 120, 130, 140, 150, 160, 170]
      const baseline = calculateBaseline(values)

      const outlierValue = 20
      const iqrDistance = calculateIQRDistance(
        outlierValue,
        baseline.q1,
        baseline.q3,
        baseline.iqr
      )

      expect(iqrDistance).toBeGreaterThan(1.5)
    })
  })

  describe('Moving Average trend deviation', () => {
    it('should detect sudden deviation from trend', () => {
      const values = [100, 102, 98, 101, 99, 103, 97]
      const ma = calculateMovingAverage(values, 7)
      const latestMA = ma[ma.length - 1] || calculateMean(values)

      // Sudden spike
      const spikeValue = 150
      const deviation = ((spikeValue - latestMA) / latestMA) * 100

      expect(deviation).toBeGreaterThan(30) // 30% threshold
    })

    it('should not flag gradual change', () => {
      const values = [100, 105, 108, 112, 115, 118, 120]
      const ma = calculateMovingAverage(values, 7)
      const latestMA = ma[ma.length - 1] || calculateMean(values)

      // Next value following trend
      const nextValue = 125
      const deviation = ((nextValue - latestMA) / latestMA) * 100

      expect(deviation).toBeLessThan(30)
    })
  })
})

describe('Advertising Metric Specific Tests', () => {
  describe('CPA anomaly detection', () => {
    it('should flag CPA spike as high severity', () => {
      // Historical CPA: around 15,000 KRW
      const historicalCPA = [15000, 14500, 15500, 14800, 15200, 14700, 15300,
                            15100, 14900, 15000, 14600, 15400, 14800, 15200]
      const baseline = calculateBaseline(historicalCPA)

      // New CPA: 25,000 KRW (significant increase)
      const newCPA = 25000
      const zScore = calculateZScore(newCPA, baseline.mean, baseline.stdDev)

      expect(zScore).toBeGreaterThan(2.5)
      // CPA spike should be critical severity (worse efficiency)
    })
  })

  describe('ROAS anomaly detection', () => {
    it('should flag ROAS drop as critical', () => {
      // Historical ROAS: around 3.0
      const historicalROAS = [3.0, 3.1, 2.9, 3.2, 2.8, 3.3, 2.7, 3.1, 2.9, 3.0, 3.2, 2.8, 3.1, 2.9]
      const baseline = calculateBaseline(historicalROAS)

      // New ROAS: 1.5 (significant drop)
      const newROAS = 1.5
      const zScore = calculateZScore(newROAS, baseline.mean, baseline.stdDev)

      expect(zScore).toBeLessThan(-2.5) // Negative Z-Score for drop
    })

    it('should celebrate ROAS spike (positive anomaly)', () => {
      const historicalROAS = [2.0, 2.1, 1.9, 2.2, 1.8, 2.1, 2.0, 2.0, 2.1, 1.9, 2.2, 1.8, 2.1, 2.0]
      const baseline = calculateBaseline(historicalROAS)

      // New ROAS: 4.0 (significant improvement)
      const newROAS = 4.0
      const zScore = calculateZScore(newROAS, baseline.mean, baseline.stdDev)

      expect(zScore).toBeGreaterThan(2.5) // Positive spike
    })
  })

  describe('CTR anomaly detection', () => {
    it('should detect CTR decline (ad fatigue)', () => {
      // Declining CTR pattern
      const ctrValues = [3.5, 3.3, 3.1, 2.9, 2.7, 2.5, 2.3]
      const trend = detectTrend(ctrValues)

      expect(trend).toBe('decreasing')

      // New CTR continuing decline
      const newCTR = 1.8
      const baseline = calculateBaseline(ctrValues)
      const zScore = calculateZScore(newCTR, baseline.mean, baseline.stdDev)

      expect(zScore).toBeLessThan(-2) // Below average, continuing trend
    })
  })

  describe('Spend anomaly detection', () => {
    it('should detect budget overrun', () => {
      // Normal daily spend: around 100,000 KRW
      const historicalSpend = [100000, 95000, 105000, 98000, 102000, 97000, 103000,
                              99000, 101000, 100000, 96000, 104000, 98000, 102000]
      const baseline = calculateBaseline(historicalSpend)

      // Sudden spend spike: 200,000 KRW
      const newSpend = 200000
      const zScore = calculateZScore(newSpend, baseline.mean, baseline.stdDev)

      expect(zScore).toBeGreaterThan(2.5)
    })

    it('should detect underspend', () => {
      const historicalSpend = [100000, 95000, 105000, 98000, 102000, 97000, 103000,
                              99000, 101000, 100000, 96000, 104000, 98000, 102000]
      const baseline = calculateBaseline(historicalSpend)

      // Spend drop: 30,000 KRW (budget exhaustion?)
      const newSpend = 30000
      const zScore = calculateZScore(newSpend, baseline.mean, baseline.stdDev)

      expect(zScore).toBeLessThan(-2.5)
    })
  })
})

describe('Edge Cases', () => {
  it('should handle all zero values', () => {
    const baseline = calculateBaseline([0, 0, 0, 0, 0])
    expect(baseline.mean).toBe(0)
    expect(baseline.stdDev).toBe(0)
  })

  it('should handle very large variations', () => {
    const values = [1, 1000000]
    const baseline = calculateBaseline(values)
    expect(baseline.mean).toBe(500000.5)
  })

  it('should handle negative values (like growth rates)', () => {
    const growthRates = [-10, 5, -3, 8, -2, 12, -5]
    const baseline = calculateBaseline(growthRates)
    expect(baseline.min).toBe(-10)
    expect(baseline.max).toBe(12)
  })

  it('should handle single outlier in otherwise stable data', () => {
    const values = [100, 100, 100, 100, 100, 100, 100, 100, 100, 500]
    const baseline = calculateBaseline(values.slice(0, -1)) // Exclude outlier

    // stdDev가 0일 때 Z-Score는 0을 반환 (division by zero 방지)
    expect(baseline.stdDev).toBe(0)
    const zScore = calculateZScore(500, baseline.mean, baseline.stdDev)
    expect(zScore).toBe(0)

    // 대신 IQR 방식으로 이상치 감지 (동일한 값들이므로 IQR도 0)
    const iqrDistance = calculateIQRDistance(500, baseline.q1, baseline.q3, baseline.iqr)
    expect(iqrDistance).toBe(0) // IQR이 0이면 distance도 0
  })
})

describe('Baseline Calculation Performance', () => {
  it('should handle 30 days of data efficiently', () => {
    const thirtyDaysData = Array.from({ length: 30 }, () =>
      Math.random() * 100000 + 50000
    )

    const start = performance.now()
    const baseline = calculateBaseline(thirtyDaysData)
    const duration = performance.now() - start

    expect(baseline.sampleSize).toBe(30)
    expect(duration).toBeLessThan(10) // Should complete in under 10ms
  })

  it('should handle 90 days of data efficiently', () => {
    const ninetyDaysData = Array.from({ length: 90 }, () =>
      Math.random() * 100000 + 50000
    )

    const start = performance.now()
    const baseline = calculateBaseline(ninetyDaysData)
    const duration = performance.now() - start

    expect(baseline.sampleSize).toBe(90)
    expect(duration).toBeLessThan(20) // Should complete in under 20ms
  })
})
