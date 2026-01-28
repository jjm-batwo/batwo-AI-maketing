/**
 * Statistical utility functions for forecasting and analysis
 */

/**
 * Calculate simple moving average
 * @param data - Array of numeric values
 * @param window - Window size for moving average
 * @returns Array of moving averages
 */
export function movingAverage(data: number[], window: number): number[] {
  if (data.length < window) {
    return []
  }

  const result: number[] = []
  for (let i = window - 1; i < data.length; i++) {
    const slice = data.slice(i - window + 1, i + 1)
    const avg = slice.reduce((sum, val) => sum + val, 0) / window
    result.push(avg)
  }
  return result
}

/**
 * Calculate exponential smoothing
 * @param data - Array of numeric values
 * @param alpha - Smoothing factor (0-1), higher = more weight on recent values
 * @returns Array of smoothed values
 */
export function exponentialSmoothing(data: number[], alpha: number): number[] {
  if (data.length === 0) return []
  if (alpha < 0 || alpha > 1) {
    throw new Error('Alpha must be between 0 and 1')
  }

  const result: number[] = [data[0]]
  for (let i = 1; i < data.length; i++) {
    const smoothed = alpha * data[i] + (1 - alpha) * result[i - 1]
    result.push(smoothed)
  }
  return result
}

/**
 * Calculate linear regression
 * @param data - Array of numeric values (y-values)
 * @returns Object with slope and intercept
 */
export function linearRegression(data: number[]): { slope: number; intercept: number } {
  const n = data.length
  if (n === 0) {
    return { slope: 0, intercept: 0 }
  }

  // x values are indices: 0, 1, 2, ...
  const xValues = Array.from({ length: n }, (_, i) => i)

  const sumX = xValues.reduce((sum, x) => sum + x, 0)
  const sumY = data.reduce((sum, y) => sum + y, 0)
  const sumXY = xValues.reduce((sum, x, i) => sum + x * data[i], 0)
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  return { slope, intercept }
}

/**
 * Calculate standard deviation
 * @param data - Array of numeric values
 * @returns Standard deviation
 */
export function standardDeviation(data: number[]): number {
  if (data.length === 0) return 0

  const mean = data.reduce((sum, val) => sum + val, 0) / data.length
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
  return Math.sqrt(variance)
}

/**
 * Calculate confidence interval
 * @param data - Array of numeric values
 * @param level - Confidence level (e.g., 95 for 95%)
 * @returns Object with lower and upper bounds
 */
export function confidenceInterval(
  data: number[],
  level: number
): { lower: number; upper: number } {
  if (data.length === 0) {
    return { lower: 0, upper: 0 }
  }

  const mean = data.reduce((sum, val) => sum + val, 0) / data.length
  const std = standardDeviation(data)

  // Z-scores for common confidence levels
  const zScores: Record<number, number> = {
    90: 1.645,
    95: 1.96,
    99: 2.576,
  }

  const z = zScores[level] || 1.96 // Default to 95%
  const margin = z * (std / Math.sqrt(data.length))

  return {
    lower: mean - margin,
    upper: mean + margin,
  }
}

/**
 * Calculate mean (average)
 * @param data - Array of numeric values
 * @returns Mean value
 */
export function mean(data: number[]): number {
  if (data.length === 0) return 0
  return data.reduce((sum, val) => sum + val, 0) / data.length
}

/**
 * Calculate median
 * @param data - Array of numeric values
 * @returns Median value
 */
export function median(data: number[]): number {
  if (data.length === 0) return 0

  const sorted = [...data].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}

/**
 * Detect outliers using IQR method
 * @param data - Array of numeric values
 * @returns Object with outlier indices and values
 */
export function detectOutliers(data: number[]): { indices: number[]; values: number[] } {
  if (data.length < 4) return { indices: [], values: [] }

  const sorted = [...data].sort((a, b) => a - b)
  const q1Index = Math.floor(sorted.length * 0.25)
  const q3Index = Math.floor(sorted.length * 0.75)

  const q1 = sorted[q1Index]
  const q3 = sorted[q3Index]
  const iqr = q3 - q1

  const lowerBound = q1 - 1.5 * iqr
  const upperBound = q3 + 1.5 * iqr

  const outlierIndices: number[] = []
  const outlierValues: number[] = []

  data.forEach((value, index) => {
    if (value < lowerBound || value > upperBound) {
      outlierIndices.push(index)
      outlierValues.push(value)
    }
  })

  return { indices: outlierIndices, values: outlierValues }
}
