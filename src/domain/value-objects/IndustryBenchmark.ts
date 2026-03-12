export type BenchmarkMetric = 'roas' | 'ctr' | 'cpa' | 'cvr' | 'cpc' | 'cpm'

export type PercentileGrade =
  | 'top10'
  | 'top25'
  | 'above_average'
  | 'average'
  | 'below_average'
  | 'bottom25'

export interface MetricBenchmark {
  metric: BenchmarkMetric
  userValue: number
  industryAverage: number
  percentile: number // 0-100 (상위 몇 %인지)
  grade: PercentileGrade
  gap: number // userValue - industryAverage
  recommendation: string
}

export interface IndustryBenchmarkData {
  industry: string
  metrics: MetricBenchmark[]
  overallPercentile: number
  overallGrade: PercentileGrade
  sampleSize: number // 비교 대상 수
  periodDays: number
}

export function calculatePercentileGrade(percentile: number): PercentileGrade {
  if (percentile >= 90) return 'top10'
  if (percentile >= 75) return 'top25'
  if (percentile >= 50) return 'above_average'
  if (percentile >= 40) return 'average'
  if (percentile >= 25) return 'below_average'
  return 'bottom25'
}
