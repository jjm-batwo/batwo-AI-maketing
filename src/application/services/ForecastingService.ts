import {
  movingAverage,
  exponentialSmoothing,
  linearRegression,
  standardDeviation,
  mean,
} from '@/lib/utils/statistics'

/**
 * Forecast result for a specific metric
 */
export interface ForecastResult {
  metric: string
  current: number
  predictions: {
    date: string
    value: number
    lower: number // 95% confidence lower
    upper: number // 95% confidence upper
  }[]
  confidence: 'high' | 'medium' | 'low'
  trend: 'improving' | 'declining' | 'stable'
  methodology: string
}

/**
 * Input for forecasting
 */
export interface ForecastInput {
  campaignId: string
  metrics: ('roas' | 'cpa' | 'ctr' | 'cvr' | 'spend' | 'revenue')[]
  horizon: 7 | 14 | 30
  historicalData: { date: string; [metric: string]: number | string }[]
}

/**
 * Forecasting Service for campaign metrics prediction
 * Uses simple statistical methods: Moving Average, Exponential Smoothing, Linear Regression
 */
export class ForecastingService {
  /**
   * Generate forecasts for multiple metrics
   */
  static generateForecast(input: ForecastInput): ForecastResult[] {
    const results: ForecastResult[] = []

    for (const metric of input.metrics) {
      const historicalValues = this.extractMetricValues(input.historicalData, metric)

      if (historicalValues.length === 0) {
        // No data available
        results.push({
          metric,
          current: 0,
          predictions: [],
          confidence: 'low',
          trend: 'stable',
          methodology: 'insufficient_data',
        })
        continue
      }

      const forecastResult = this.forecastMetric(
        metric,
        historicalValues,
        input.horizon,
        input.historicalData[input.historicalData.length - 1]?.date as string
      )
      results.push(forecastResult)
    }

    return results
  }

  /**
   * Extract metric values from historical data
   */
  private static extractMetricValues(
    data: { date: string; [key: string]: number | string }[],
    metric: string
  ): number[] {
    return data
      .map((d) => d[metric])
      .filter((v) => typeof v === 'number' && !isNaN(v)) as number[]
  }

  /**
   * Forecast a single metric
   */
  private static forecastMetric(
    metric: string,
    historicalValues: number[],
    horizon: number,
    lastDate: string
  ): ForecastResult {
    const dataQuality = this.assessDataQuality(historicalValues)
    const current = historicalValues[historicalValues.length - 1]

    // Choose methodology based on horizon and data quality
    let predictions: { date: string; value: number; lower: number; upper: number }[] = []
    let methodology: string

    if (horizon <= 7 && dataQuality.hasEnoughData) {
      // Short-term: Simple Moving Average
      methodology = 'simple_moving_average'
      predictions = this.forecastWithMovingAverage(historicalValues, horizon, lastDate)
    } else if (horizon <= 30 && dataQuality.hasEnoughData) {
      // Medium-term: Exponential Smoothing
      methodology = 'exponential_smoothing'
      predictions = this.forecastWithExponentialSmoothing(historicalValues, horizon, lastDate)
    } else {
      // Long-term or insufficient data: Linear Regression
      methodology = 'linear_regression'
      predictions = this.forecastWithLinearRegression(historicalValues, horizon, lastDate)
    }

    // Determine trend
    const trend = this.detectTrend(historicalValues, metric)

    // Determine confidence
    const confidence = this.assessConfidence(dataQuality, horizon)

    return {
      metric,
      current,
      predictions,
      confidence,
      trend,
      methodology,
    }
  }

  /**
   * Forecast using Simple Moving Average
   */
  private static forecastWithMovingAverage(
    data: number[],
    horizon: number,
    lastDate: string
  ): { date: string; value: number; lower: number; upper: number }[] {
    const window = Math.min(7, data.length) // 7-day window
    const maValues = movingAverage(data, window)

    if (maValues.length === 0) {
      // Not enough data for MA, use simple mean
      const avg = mean(data)
      const std = standardDeviation(data)
      return this.generatePredictions(avg, std, horizon, lastDate)
    }

    const lastMA = maValues[maValues.length - 1]
    const std = standardDeviation(data.slice(-window))

    return this.generatePredictions(lastMA, std, horizon, lastDate)
  }

  /**
   * Forecast using Exponential Smoothing
   */
  private static forecastWithExponentialSmoothing(
    data: number[],
    horizon: number,
    lastDate: string
  ): { date: string; value: number; lower: number; upper: number }[] {
    const alpha = 0.3 // Smoothing factor
    const smoothed = exponentialSmoothing(data, alpha)

    if (smoothed.length === 0) {
      const avg = mean(data)
      const std = standardDeviation(data)
      return this.generatePredictions(avg, std, horizon, lastDate)
    }

    const lastSmoothed = smoothed[smoothed.length - 1]
    const std = standardDeviation(data.slice(-14)) // Last 2 weeks

    return this.generatePredictions(lastSmoothed, std, horizon, lastDate)
  }

  /**
   * Forecast using Linear Regression
   */
  private static forecastWithLinearRegression(
    data: number[],
    horizon: number,
    lastDate: string
  ): { date: string; value: number; lower: number; upper: number }[] {
    const { slope, intercept } = linearRegression(data)
    const std = standardDeviation(data)
    const n = data.length

    const predictions: { date: string; value: number; lower: number; upper: number }[] = []

    for (let i = 1; i <= horizon; i++) {
      const date = this.addDays(lastDate, i)
      const value = slope * (n + i - 1) + intercept

      // Confidence interval grows with prediction distance
      const margin = 1.96 * std * Math.sqrt(1 + 1 / n + Math.pow(i, 2) / (12 * Math.pow(n, 2)))

      predictions.push({
        date,
        value: Math.max(0, value), // Ensure non-negative
        lower: Math.max(0, value - margin),
        upper: value + margin,
      })
    }

    return predictions
  }

  /**
   * Generate predictions with confidence intervals
   */
  private static generatePredictions(
    predictedValue: number,
    stdDev: number,
    horizon: number,
    lastDate: string
  ): { date: string; value: number; lower: number; upper: number }[] {
    const predictions: { date: string; value: number; lower: number; upper: number }[] = []

    for (let i = 1; i <= horizon; i++) {
      const date = this.addDays(lastDate, i)
      // Margin grows with prediction distance
      const margin = 1.96 * stdDev * Math.sqrt(i / horizon)

      predictions.push({
        date,
        value: Math.max(0, predictedValue),
        lower: Math.max(0, predictedValue - margin),
        upper: predictedValue + margin,
      })
    }

    return predictions
  }

  /**
   * Assess data quality
   */
  private static assessDataQuality(data: number[]): {
    hasEnoughData: boolean
    stability: 'stable' | 'volatile'
    completeness: number
  } {
    const hasEnoughData = data.length >= 7

    // Check stability
    const std = standardDeviation(data)
    const avg = mean(data)
    const coefficientOfVariation = avg !== 0 ? std / avg : 0
    const stability = coefficientOfVariation < 0.5 ? 'stable' : 'volatile'

    // Completeness (assume all provided data is valid)
    const completeness = 1.0

    return { hasEnoughData, stability, completeness }
  }

  /**
   * Detect trend direction
   */
  private static detectTrend(
    data: number[],
    metric: string
  ): 'improving' | 'declining' | 'stable' {
    if (data.length < 3) return 'stable'

    const { slope } = linearRegression(data)
    const threshold = 0.01 // 1% change threshold

    // For metrics where higher is better (ROAS, CTR, CVR, Revenue)
    const higherIsBetter = ['roas', 'ctr', 'cvr', 'revenue'].includes(metric)

    if (Math.abs(slope) < threshold) {
      return 'stable'
    }

    if (higherIsBetter) {
      return slope > 0 ? 'improving' : 'declining'
    } else {
      // For CPA and Spend, lower is better
      return slope < 0 ? 'improving' : 'declining'
    }
  }

  /**
   * Assess confidence level
   */
  private static assessConfidence(
    dataQuality: { hasEnoughData: boolean; stability: 'stable' | 'volatile'; completeness: number },
    horizon: number
  ): 'high' | 'medium' | 'low' {
    if (!dataQuality.hasEnoughData) return 'low'

    if (dataQuality.stability === 'volatile') {
      return horizon <= 7 ? 'medium' : 'low'
    }

    if (horizon <= 7) return 'high'
    if (horizon <= 14) return 'medium'
    return 'low'
  }

  /**
   * Add days to a date string (YYYY-MM-DD)
   */
  private static addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr)
    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
  }
}
