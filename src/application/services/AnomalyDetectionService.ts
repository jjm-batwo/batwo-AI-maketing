/**
 * 이상 징후 감지 서비스 (Statistical Anomaly Detection)
 *
 * 개선된 통계적 방법론:
 * - Z-Score 기반 감지 (2.5 표준편차)
 * - IQR (사분위수 범위) 기반 감지
 * - 이동 평균 기반 트렌드 분석
 * - 한국 시장 캘린더 연동
 * - 세그먼트별 분석
 */

import type { IKPIRepository } from '@domain/repositories/IKPIRepository'
import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import type { KPI } from '@domain/entities/KPI'
import {
  KoreanMarketCalendar,
  getKoreanMarketCalendar,
  type DateEventInfo,
} from '@domain/value-objects/KoreanMarketCalendar'

// ============================================================================
// Types
// ============================================================================

export type AnomalyType =
  | 'spike'
  | 'drop'
  | 'trend_reversal'
  | 'budget_anomaly'
  | 'performance_degradation'
  | 'unusual_pattern'

export type AnomalySeverity = 'critical' | 'warning' | 'info'
export type DetectionMethod = 'zscore' | 'iqr' | 'moving_average' | 'threshold'

export type MetricName =
  | 'spend'
  | 'impressions'
  | 'clicks'
  | 'conversions'
  | 'ctr'
  | 'cpa'
  | 'roas'
  | 'cpc'
  | 'cvr'

export interface StatisticalBaseline {
  mean: number
  stdDev: number
  median: number
  q1: number // 25th percentile
  q3: number // 75th percentile
  iqr: number // Interquartile Range
  min: number
  max: number
  percentile95: number
  sampleSize: number
}

export interface AnomalyDetail {
  detectionMethod: DetectionMethod
  zScore?: number
  iqrDistance?: number
  movingAverageDeviation?: number
  baseline?: StatisticalBaseline
  historicalTrend?: 'increasing' | 'decreasing' | 'stable' | 'volatile'
}

export interface MarketContext {
  isSpecialDay: boolean
  events: string[]
  expectedChangeRange?: { min: number; max: number }
  isWithinExpectedRange: boolean
}

export interface Anomaly {
  id: string
  campaignId: string
  campaignName: string
  type: AnomalyType
  severity: AnomalySeverity
  metric: MetricName
  currentValue: number
  previousValue: number
  changePercent: number
  message: string
  detectedAt: Date
  detail: AnomalyDetail
  marketContext?: MarketContext
  recommendations: string[]
}

// EnhancedAnomaly is an alias for Anomaly (used by AnomalyRootCauseService)
export type EnhancedAnomaly = Anomaly

export interface AnomalyDetectionConfig {
  // Z-Score 설정
  zScoreThreshold: number // 이상치 판단 Z-Score 임계값 (default: 2.5)

  // IQR 설정
  iqrMultiplier: number // IQR 이상치 판단 배수 (default: 1.5)

  // 이동 평균 설정
  movingAverageWindow: number // 이동 평균 윈도우 크기 (default: 7)
  trendDeviationThreshold: number // 트렌드 이탈 임계값 % (default: 30)

  // 백분율 변화 임계값 (폴백용)
  spikeThreshold: number // 급등 임계값 % (default: 50)
  dropThreshold: number // 급락 임계값 % (default: -30)

  // 데이터 요구사항
  minDataPoints: number // 통계 분석 최소 데이터 포인트 (default: 7)
  minDataPointsForZScore: number // Z-Score 분석 최소 데이터 (default: 14)

  // 한국 시장 캘린더 사용 여부
  useKoreanCalendar: boolean
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: AnomalyDetectionConfig = {
  zScoreThreshold: 2.5,
  iqrMultiplier: 1.5,
  movingAverageWindow: 7,
  trendDeviationThreshold: 30,
  spikeThreshold: 50,
  dropThreshold: -30,
  minDataPoints: 7,
  minDataPointsForZScore: 14,
  useKoreanCalendar: true,
}

const METRIC_LABELS: Record<MetricName, string> = {
  spend: '지출',
  impressions: '노출수',
  clicks: '클릭수',
  conversions: '전환수',
  ctr: 'CTR',
  cpa: 'CPA',
  roas: 'ROAS',
  cpc: 'CPC',
  cvr: 'CVR',
}

const SEVERITY_BY_METRIC: Record<MetricName, { spike: AnomalySeverity; drop: AnomalySeverity }> = {
  spend: { spike: 'warning', drop: 'info' },
  impressions: { spike: 'info', drop: 'warning' },
  clicks: { spike: 'info', drop: 'warning' },
  conversions: { spike: 'info', drop: 'critical' },
  ctr: { spike: 'info', drop: 'warning' },
  cpa: { spike: 'critical', drop: 'info' },
  roas: { spike: 'info', drop: 'critical' },
  cpc: { spike: 'warning', drop: 'info' },
  cvr: { spike: 'info', drop: 'warning' },
}

// ============================================================================
// Statistical Utility Functions
// ============================================================================

/**
 * 평균 계산
 */
function calculateMean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/**
 * 표준편차 계산
 */
function calculateStdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2))
  return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / (values.length - 1))
}

/**
 * 백분위수 계산
 */
function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0
  const index = (percentile / 100) * (sortedValues.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)

  if (lower === upper) return sortedValues[lower]

  const fraction = index - lower
  return sortedValues[lower] * (1 - fraction) + sortedValues[upper] * fraction
}

/**
 * Z-Score 계산
 */
function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0
  return (value - mean) / stdDev
}

/**
 * IQR 거리 계산 (IQR 단위로 정규화된 거리)
 */
function calculateIQRDistance(value: number, q1: number, q3: number, iqr: number): number {
  if (iqr === 0) return 0
  if (value < q1) return (q1 - value) / iqr
  if (value > q3) return (value - q3) / iqr
  return 0
}

/**
 * 통계적 기준선 계산
 */
export function calculateBaseline(values: number[]): StatisticalBaseline {
  if (values.length === 0) {
    return {
      mean: 0,
      stdDev: 0,
      median: 0,
      q1: 0,
      q3: 0,
      iqr: 0,
      min: 0,
      max: 0,
      percentile95: 0,
      sampleSize: 0,
    }
  }

  const sorted = [...values].sort((a, b) => a - b)
  const mean = calculateMean(values)
  const stdDev = calculateStdDev(values, mean)
  const median = calculatePercentile(sorted, 50)
  const q1 = calculatePercentile(sorted, 25)
  const q3 = calculatePercentile(sorted, 75)
  const iqr = q3 - q1
  const percentile95 = calculatePercentile(sorted, 95)

  return {
    mean,
    stdDev,
    median,
    q1,
    q3,
    iqr,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    percentile95,
    sampleSize: values.length,
  }
}

/**
 * 이동 평균 계산
 */
function calculateMovingAverage(values: number[], window: number): number[] {
  if (values.length < window) return []

  const result: number[] = []
  for (let i = window - 1; i < values.length; i++) {
    const windowValues = values.slice(i - window + 1, i + 1)
    result.push(calculateMean(windowValues))
  }
  return result
}

/**
 * 트렌드 방향 판단
 */
function detectTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' | 'volatile' {
  if (values.length < 3) return 'stable'

  // 간단한 선형 회귀로 트렌드 감지
  const n = values.length
  const xMean = (n - 1) / 2
  const yMean = calculateMean(values)

  let numerator = 0
  let denominator = 0

  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - yMean)
    denominator += Math.pow(i - xMean, 2)
  }

  if (denominator === 0) return 'stable'

  const slope = numerator / denominator
  const slopePercent = yMean !== 0 ? (slope / yMean) * 100 : 0

  // 변동성 체크
  const stdDev = calculateStdDev(values, yMean)
  const cv = yMean !== 0 ? (stdDev / yMean) * 100 : 0

  if (cv > 50) return 'volatile'
  if (slopePercent > 5) return 'increasing'
  if (slopePercent < -5) return 'decreasing'
  return 'stable'
}

// ============================================================================
// Anomaly Detection Service
// ============================================================================

export class AnomalyDetectionService {
  private readonly config: AnomalyDetectionConfig
  private readonly calendar: KoreanMarketCalendar

  constructor(
    private readonly kpiRepository: IKPIRepository,
    private readonly campaignRepository: ICampaignRepository,
    config: Partial<AnomalyDetectionConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.calendar = getKoreanMarketCalendar()
  }

  /**
   * 사용자의 모든 활성 캠페인에서 이상 징후 감지
   */
  async detectAnomalies(userId: string, industry?: string): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = []

    const campaigns = await this.campaignRepository.findByUserId(userId)
    const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE')

    for (const campaign of activeCampaigns) {
      const campaignAnomalies = await this.detectCampaignAnomalies(
        campaign.id,
        campaign.name,
        industry
      )
      anomalies.push(...campaignAnomalies)
    }

    return this.sortBySeverity(anomalies)
  }

  /**
   * 특정 캠페인의 이상 징후 감지
   */
  async detectCampaignAnomalies(
    campaignId: string,
    campaignName: string,
    industry?: string
  ): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = []

    // 최근 30일 KPI 데이터 조회
    const kpis = await this.kpiRepository.findByCampaignId(campaignId)
    if (kpis.length < this.config.minDataPoints) {
      return anomalies // 최소 데이터 부족
    }

    // 날짜순 정렬 (오래된 것부터)
    const sortedKpis = [...kpis].sort((a, b) => a.date.getTime() - b.date.getTime())

    // 최신 KPI
    const latest = sortedKpis[sortedKpis.length - 1]

    // 메트릭별 이상 감지
    const metrics: MetricName[] = ['spend', 'ctr', 'cpa', 'roas', 'conversions', 'cpc']

    for (const metric of metrics) {
      const metricAnomalies = this.detectMetricAnomalies(
        sortedKpis,
        latest,
        metric,
        campaignId,
        campaignName,
        industry
      )
      anomalies.push(...metricAnomalies)
    }

    return anomalies
  }

  /**
   * 특정 메트릭의 이상 감지
   */
  private detectMetricAnomalies(
    kpis: KPI[],
    latestKpi: KPI,
    metric: MetricName,
    campaignId: string,
    campaignName: string,
    industry?: string
  ): Anomaly[] {
    const anomalies: Anomaly[] = []

    // 메트릭 값 추출
    const values = kpis.map((kpi) => this.extractMetricValue(kpi, metric))
    const latestValue = values[values.length - 1]
    const previousValue = values.length > 1 ? values[values.length - 2] : latestValue

    // 통계적 기준선 계산 (최신 값 제외)
    const historicalValues = values.slice(0, -1)
    const baseline = calculateBaseline(historicalValues)

    // 한국 시장 컨텍스트 확인
    const marketContext = this.getMarketContext(latestKpi.date, metric, industry)

    // Z-Score 기반 감지 (충분한 데이터가 있을 때)
    if (baseline.sampleSize >= this.config.minDataPointsForZScore && baseline.stdDev > 0) {
      const zScore = calculateZScore(latestValue, baseline.mean, baseline.stdDev)
      const absZScore = Math.abs(zScore)

      // 한국 시장 특수일 감안 임계값 조정
      const adjustedThreshold = this.getAdjustedZScoreThreshold(
        marketContext,
        this.config.zScoreThreshold
      )

      if (absZScore > adjustedThreshold) {
        const isSpike = zScore > 0
        const anomaly = this.createStatisticalAnomaly({
          campaignId,
          campaignName,
          metric,
          latestValue,
          previousValue,
          baseline,
          zScore,
          isSpike,
          detectionMethod: 'zscore',
          marketContext,
        })

        if (anomaly && !this.isExpectedByMarketContext(anomaly, marketContext)) {
          anomalies.push(anomaly)
        }
      }
    }

    // IQR 기반 감지 (Z-Score 대안)
    if (baseline.sampleSize >= this.config.minDataPoints && baseline.iqr > 0) {
      const iqrDistance = calculateIQRDistance(latestValue, baseline.q1, baseline.q3, baseline.iqr)

      if (iqrDistance > this.config.iqrMultiplier) {
        const isSpike = latestValue > baseline.q3
        const anomaly = this.createStatisticalAnomaly({
          campaignId,
          campaignName,
          metric,
          latestValue,
          previousValue,
          baseline,
          iqrDistance,
          isSpike,
          detectionMethod: 'iqr',
          marketContext,
        })

        // Z-Score로 이미 감지되지 않았으면 추가
        if (anomaly && !this.isDuplicateAnomaly(anomalies, anomaly) &&
            !this.isExpectedByMarketContext(anomaly, marketContext)) {
          anomalies.push(anomaly)
        }
      }
    }

    // 이동 평균 기반 트렌드 이탈 감지
    if (values.length >= this.config.movingAverageWindow) {
      const maAnomalies = this.detectMovingAverageAnomalies(
        values,
        latestValue,
        previousValue,
        metric,
        campaignId,
        campaignName,
        baseline,
        marketContext
      )
      anomalies.push(...maAnomalies)
    }

    // 폴백: 단순 임계값 기반 감지 (데이터 부족 시)
    if (baseline.sampleSize < this.config.minDataPoints && previousValue > 0) {
      const changePercent = ((latestValue - previousValue) / previousValue) * 100
      const threshold = this.getAdjustedThreshold(changePercent > 0, marketContext)

      if (changePercent >= threshold.spike || changePercent <= threshold.drop) {
        const isSpike = changePercent > 0
        anomalies.push(
          this.createThresholdAnomaly({
            campaignId,
            campaignName,
            metric,
            latestValue,
            previousValue,
            changePercent,
            isSpike,
            marketContext,
          })
        )
      }
    }

    return anomalies
  }

  /**
   * 이동 평균 기반 이상 감지
   */
  private detectMovingAverageAnomalies(
    values: number[],
    latestValue: number,
    previousValue: number,
    metric: MetricName,
    campaignId: string,
    campaignName: string,
    baseline: StatisticalBaseline,
    marketContext: MarketContext
  ): Anomaly[] {
    const anomalies: Anomaly[] = []

    const movingAverages = calculateMovingAverage(values, this.config.movingAverageWindow)
    if (movingAverages.length === 0) return anomalies

    const latestMA = movingAverages[movingAverages.length - 1]
    if (latestMA === 0) return anomalies

    const deviation = ((latestValue - latestMA) / latestMA) * 100
    const absDeviation = Math.abs(deviation)

    // 한국 시장 특수일 감안 임계값 조정
    const adjustedThreshold = this.getAdjustedTrendThreshold(marketContext)

    if (absDeviation > adjustedThreshold) {
      const trend = detectTrend(values.slice(-this.config.movingAverageWindow))
      const isSpike = deviation > 0

      const changePercent = previousValue > 0
        ? ((latestValue - previousValue) / previousValue) * 100
        : 0

      const anomaly: Anomaly = {
        id: this.generateAnomalyId(campaignId, metric, 'ma'),
        campaignId,
        campaignName,
        type: this.determineAnomalyType(isSpike, trend, metric),
        severity: this.determineSeverity(metric, isSpike, absDeviation),
        metric,
        currentValue: latestValue,
        previousValue,
        changePercent,
        message: this.generateMessage(metric, changePercent, 'moving_average', trend),
        detectedAt: new Date(),
        detail: {
          detectionMethod: 'moving_average',
          movingAverageDeviation: deviation,
          baseline,
          historicalTrend: trend,
        },
        marketContext: this.config.useKoreanCalendar ? marketContext : undefined,
        recommendations: this.generateRecommendations(metric, isSpike, trend),
      }

      if (!this.isExpectedByMarketContext(anomaly, marketContext)) {
        anomalies.push(anomaly)
      }
    }

    return anomalies
  }

  /**
   * KPI에서 메트릭 값 추출
   */
  private extractMetricValue(kpi: KPI, metric: MetricName): number {
    switch (metric) {
      case 'spend':
        return kpi.spend.amount
      case 'impressions':
        return kpi.impressions
      case 'clicks':
        return kpi.clicks
      case 'conversions':
        return kpi.conversions
      case 'ctr':
        return kpi.calculateCTR().value
      case 'cpa':
        return kpi.calculateCPA().amount
      case 'roas':
        return kpi.calculateROAS()
      case 'cpc':
        return kpi.calculateCPC().amount
      case 'cvr':
        return kpi.calculateCVR().value
      default:
        return 0
    }
  }

  /**
   * 한국 시장 컨텍스트 조회
   */
  private getMarketContext(
    date: Date,
    metric: MetricName,
    industry?: string
  ): MarketContext {
    if (!this.config.useKoreanCalendar) {
      return {
        isSpecialDay: false,
        events: [],
        isWithinExpectedRange: false,
      }
    }

    const eventInfo: DateEventInfo = this.calendar.getDateEventInfo(date, industry)

    // 메트릭에 따른 예상 변동폭 매핑
    const metricToChangeKey: Record<MetricName, 'spend' | 'conversion' | 'ctr'> = {
      spend: 'spend',
      impressions: 'spend',
      clicks: 'spend',
      conversions: 'conversion',
      ctr: 'ctr',
      cpa: 'conversion',
      roas: 'conversion',
      cpc: 'spend',
      cvr: 'conversion',
    }

    const changeKey = metricToChangeKey[metric]
    const expectedRange = eventInfo.isSpecialDay
      ? eventInfo.combinedExpectedChange[changeKey]
      : undefined

    return {
      isSpecialDay: eventInfo.isSpecialDay,
      events: eventInfo.events.map((e) => e.name),
      expectedChangeRange: expectedRange,
      isWithinExpectedRange: false, // 나중에 계산
    }
  }

  /**
   * 이상치가 시장 컨텍스트 내에서 예상 범위인지 확인
   */
  private isExpectedByMarketContext(anomaly: Anomaly, context: MarketContext): boolean {
    if (!context.isSpecialDay || !context.expectedChangeRange) {
      return false
    }

    const change = anomaly.changePercent
    return change >= context.expectedChangeRange.min && change <= context.expectedChangeRange.max
  }

  /**
   * 조정된 Z-Score 임계값 반환
   */
  private getAdjustedZScoreThreshold(context: MarketContext, baseThreshold: number): number {
    if (!context.isSpecialDay) return baseThreshold

    // 특수일에는 임계값을 20% 높여서 민감도 낮춤
    return baseThreshold * 1.2
  }

  /**
   * 조정된 트렌드 이탈 임계값 반환
   */
  private getAdjustedTrendThreshold(context: MarketContext): number {
    const baseThreshold = this.config.trendDeviationThreshold

    if (!context.isSpecialDay || !context.expectedChangeRange) {
      return baseThreshold
    }

    // 특수일 예상 변동폭만큼 임계값 증가
    const maxExpectedChange = Math.max(
      Math.abs(context.expectedChangeRange.min),
      Math.abs(context.expectedChangeRange.max)
    )

    return baseThreshold + maxExpectedChange * 0.5
  }

  /**
   * 조정된 단순 임계값 반환
   */
  private getAdjustedThreshold(
    isPositive: boolean,
    context: MarketContext
  ): { spike: number; drop: number } {
    const baseSpike = this.config.spikeThreshold
    const baseDrop = this.config.dropThreshold

    if (!context.isSpecialDay || !context.expectedChangeRange) {
      return { spike: baseSpike, drop: baseDrop }
    }

    return {
      spike: baseSpike + context.expectedChangeRange.max * 0.5,
      drop: baseDrop + context.expectedChangeRange.min * 0.5,
    }
  }

  /**
   * 통계적 이상치 객체 생성
   */
  private createStatisticalAnomaly(params: {
    campaignId: string
    campaignName: string
    metric: MetricName
    latestValue: number
    previousValue: number
    baseline: StatisticalBaseline
    zScore?: number
    iqrDistance?: number
    isSpike: boolean
    detectionMethod: DetectionMethod
    marketContext: MarketContext
  }): Anomaly | null {
    const {
      campaignId,
      campaignName,
      metric,
      latestValue,
      previousValue,
      baseline,
      zScore,
      iqrDistance,
      isSpike,
      detectionMethod,
      marketContext,
    } = params

    const changePercent = previousValue > 0
      ? ((latestValue - previousValue) / previousValue) * 100
      : (latestValue > 0 ? 100 : 0)

    const trend = detectTrend([baseline.mean, previousValue, latestValue])

    return {
      id: this.generateAnomalyId(campaignId, metric, detectionMethod),
      campaignId,
      campaignName,
      type: this.determineAnomalyType(isSpike, trend, metric),
      severity: this.determineSeverity(metric, isSpike, Math.abs(zScore ?? iqrDistance ?? 0)),
      metric,
      currentValue: latestValue,
      previousValue,
      changePercent,
      message: this.generateMessage(metric, changePercent, detectionMethod, trend),
      detectedAt: new Date(),
      detail: {
        detectionMethod,
        zScore,
        iqrDistance,
        baseline,
        historicalTrend: trend,
      },
      marketContext: this.config.useKoreanCalendar ? marketContext : undefined,
      recommendations: this.generateRecommendations(metric, isSpike, trend),
    }
  }

  /**
   * 단순 임계값 기반 이상치 객체 생성
   */
  private createThresholdAnomaly(params: {
    campaignId: string
    campaignName: string
    metric: MetricName
    latestValue: number
    previousValue: number
    changePercent: number
    isSpike: boolean
    marketContext: MarketContext
  }): Anomaly {
    const {
      campaignId,
      campaignName,
      metric,
      latestValue,
      previousValue,
      changePercent,
      isSpike,
      marketContext,
    } = params

    return {
      id: this.generateAnomalyId(campaignId, metric, 'threshold'),
      campaignId,
      campaignName,
      type: isSpike ? 'spike' : 'drop',
      severity: this.determineSeverity(metric, isSpike, Math.abs(changePercent) / 10),
      metric,
      currentValue: latestValue,
      previousValue,
      changePercent,
      message: this.generateMessage(metric, changePercent, 'threshold'),
      detectedAt: new Date(),
      detail: {
        detectionMethod: 'threshold',
      },
      marketContext: this.config.useKoreanCalendar ? marketContext : undefined,
      recommendations: this.generateRecommendations(metric, isSpike),
    }
  }

  /**
   * 이상 유형 결정
   */
  private determineAnomalyType(
    isSpike: boolean,
    trend?: 'increasing' | 'decreasing' | 'stable' | 'volatile',
    metric?: MetricName
  ): AnomalyType {
    if (metric === 'spend') {
      return isSpike ? 'budget_anomaly' : 'drop'
    }

    if (trend === 'volatile') {
      return 'unusual_pattern'
    }

    if (
      (trend === 'increasing' && !isSpike) ||
      (trend === 'decreasing' && isSpike)
    ) {
      return 'trend_reversal'
    }

    return isSpike ? 'spike' : 'drop'
  }

  /**
   * 심각도 결정
   */
  private determineSeverity(
    metric: MetricName,
    isSpike: boolean,
    magnitude: number
  ): AnomalySeverity {
    const baseSeverity = isSpike
      ? SEVERITY_BY_METRIC[metric].spike
      : SEVERITY_BY_METRIC[metric].drop

    // 크기에 따라 심각도 상향 조정
    if (magnitude > 4) {
      if (baseSeverity === 'info') return 'warning'
      if (baseSeverity === 'warning') return 'critical'
    }

    return baseSeverity
  }

  /**
   * 메시지 생성
   */
  private generateMessage(
    metric: MetricName,
    changePercent: number,
    method: DetectionMethod,
    trend?: 'increasing' | 'decreasing' | 'stable' | 'volatile'
  ): string {
    const label = METRIC_LABELS[metric]
    const direction = changePercent > 0 ? '상승' : '하락'
    const absChange = Math.abs(changePercent).toFixed(0)

    let message = `${label}이(가) ${absChange}% ${direction}했습니다.`

    // 메트릭별 맞춤 메시지
    if (metric === 'cpa' && changePercent > 0) {
      message += ' 광고 효율성 점검이 필요합니다.'
    } else if (metric === 'roas' && changePercent < 0) {
      message += ' 타겟팅과 입찰 전략을 검토해주세요.'
    } else if (metric === 'ctr' && changePercent < 0) {
      message += ' 광고 소재를 검토해보세요.'
    } else if (metric === 'conversions' && changePercent < 0) {
      message += ' 랜딩 페이지와 타겟팅을 점검해주세요.'
    } else if (metric === 'roas' && changePercent > 0) {
      message += ' 이 전략을 유지하세요!'
    }

    // 트렌드 컨텍스트 추가
    if (trend === 'volatile') {
      message += ' (성과가 불안정합니다)'
    } else if (trend === 'increasing' && changePercent < 0) {
      message += ' (상승 추세에서의 하락)'
    } else if (trend === 'decreasing' && changePercent > 0) {
      message += ' (하락 추세에서의 반등)'
    }

    return message
  }

  /**
   * 추천 액션 생성
   */
  private generateRecommendations(
    metric: MetricName,
    isSpike: boolean,
    trend?: 'increasing' | 'decreasing' | 'stable' | 'volatile'
  ): string[] {
    const recommendations: string[] = []

    switch (metric) {
      case 'cpa':
        if (isSpike) {
          recommendations.push('타겟 오디언스 세분화를 검토하세요')
          recommendations.push('광고 소재 A/B 테스트를 진행하세요')
          recommendations.push('입찰 전략을 조정하세요')
        }
        break

      case 'roas':
        if (!isSpike) {
          recommendations.push('전환 추적 설정을 확인하세요')
          recommendations.push('랜딩 페이지 성능을 검토하세요')
          recommendations.push('경쟁사 활동을 모니터링하세요')
        } else {
          recommendations.push('성공 요인을 분석하세요')
          recommendations.push('유사 전략을 다른 캠페인에 적용하세요')
        }
        break

      case 'ctr':
        if (!isSpike) {
          recommendations.push('광고 소재를 새로 고침하세요')
          recommendations.push('타겟팅 설정을 검토하세요')
          recommendations.push('광고 피로도를 확인하세요')
        }
        break

      case 'conversions':
        if (!isSpike) {
          recommendations.push('픽셀/전환 추적을 확인하세요')
          recommendations.push('랜딩 페이지 로딩 속도를 점검하세요')
          recommendations.push('제품/서비스 가격 경쟁력을 검토하세요')
        }
        break

      case 'spend':
        if (isSpike) {
          recommendations.push('일일 예산 한도를 확인하세요')
          recommendations.push('입찰 한도를 점검하세요')
          recommendations.push('예상치 못한 경매 경쟁을 확인하세요')
        }
        break
    }

    // 트렌드 기반 추가 추천
    if (trend === 'volatile') {
      recommendations.push('일관된 캠페인 설정을 유지하세요')
      recommendations.push('외부 요인(계절성, 이벤트)을 확인하세요')
    }

    return recommendations.slice(0, 3) // 최대 3개
  }

  /**
   * 이상치 ID 생성
   */
  private generateAnomalyId(
    campaignId: string,
    metric: MetricName,
    method: DetectionMethod | string
  ): string {
    return `anomaly_${campaignId}_${metric}_${method}_${Date.now()}`
  }

  /**
   * 중복 이상치 확인
   */
  private isDuplicateAnomaly(anomalies: Anomaly[], candidate: Anomaly): boolean {
    return anomalies.some(
      (a) =>
        a.campaignId === candidate.campaignId &&
        a.metric === candidate.metric &&
        a.type === candidate.type
    )
  }

  /**
   * 심각도 순 정렬
   */
  private sortBySeverity(anomalies: Anomaly[]): Anomaly[] {
    const severityOrder: Record<AnomalySeverity, number> = {
      critical: 0,
      warning: 1,
      info: 2,
    }
    return anomalies.sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    )
  }
}

// ============================================================================
// Export utility functions for testing
// ============================================================================

export {
  calculateMean,
  calculateStdDev,
  calculatePercentile,
  calculateZScore,
  calculateIQRDistance,
  calculateMovingAverage,
  detectTrend,
}
