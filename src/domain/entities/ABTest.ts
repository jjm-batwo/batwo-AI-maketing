import { Money } from '@domain/value-objects/Money'

/**
 * A/B Test Status
 */
export type ABTestStatus = 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED'

/**
 * A/B Test Variant
 */
export interface ABTestVariant {
  id: string
  name: string
  description?: string
  trafficPercent: number // 0-100
  impressions: number
  clicks: number
  conversions: number
  spend: Money
  revenue: Money
  isControl: boolean
}

/**
 * A/B Test Props
 */
export interface ABTestProps {
  id?: string
  campaignId: string
  name: string
  description?: string
  status: ABTestStatus
  variants: ABTestVariant[]
  startDate: Date
  endDate?: Date | null
  confidenceLevel: number // Default 95
  minimumSampleSize: number
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Statistical Result
 */
export interface StatisticalResult {
  winner: ABTestVariant | null
  isSignificant: boolean
  confidence: number
  uplift: number // Percentage improvement
  pValue: number
}

/**
 * ABTest Entity
 *
 * A/B 테스트 실험을 관리하는 도메인 엔티티
 */
export class ABTest {
  readonly id: string
  readonly campaignId: string
  readonly name: string
  readonly description: string
  readonly status: ABTestStatus
  readonly variants: ABTestVariant[]
  readonly startDate: Date
  readonly endDate: Date | null
  readonly confidenceLevel: number
  readonly minimumSampleSize: number
  readonly createdAt: Date
  readonly updatedAt: Date

  private constructor(props: Required<Omit<ABTestProps, 'endDate'>> & { endDate: Date | null }) {
    this.id = props.id
    this.campaignId = props.campaignId
    this.name = props.name
    this.description = props.description || ''
    this.status = props.status
    this.variants = props.variants
    this.startDate = props.startDate
    this.endDate = props.endDate
    this.confidenceLevel = props.confidenceLevel
    this.minimumSampleSize = props.minimumSampleSize
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt

    Object.freeze(this)
  }

  /**
   * 새 A/B 테스트 생성
   */
  static create(props: ABTestProps): ABTest {
    const now = new Date()

    if (props.variants.length < 2) {
      throw new Error('A/B 테스트는 최소 2개의 변형이 필요합니다')
    }

    const totalTraffic = props.variants.reduce((sum, v) => sum + v.trafficPercent, 0)
    if (totalTraffic !== 100) {
      throw new Error('트래픽 비율의 합은 100%여야 합니다')
    }

    const controlCount = props.variants.filter((v) => v.isControl).length
    if (controlCount !== 1) {
      throw new Error('정확히 하나의 컨트롤 그룹이 필요합니다')
    }

    return new ABTest({
      id: props.id || crypto.randomUUID(),
      campaignId: props.campaignId,
      name: props.name,
      description: props.description || '',
      status: props.status || 'DRAFT',
      variants: props.variants,
      startDate: props.startDate,
      endDate: props.endDate ?? null,
      confidenceLevel: props.confidenceLevel || 95,
      minimumSampleSize: props.minimumSampleSize || 1000,
      createdAt: props.createdAt || now,
      updatedAt: props.updatedAt || now,
    })
  }

  /**
   * 테스트 시작
   */
  start(): ABTest {
    if (this.status !== 'DRAFT' && this.status !== 'PAUSED') {
      throw new Error('DRAFT 또는 PAUSED 상태의 테스트만 시작할 수 있습니다')
    }

    return new ABTest({
      ...this.toProps(),
      status: 'RUNNING',
      updatedAt: new Date(),
    })
  }

  /**
   * 테스트 일시정지
   */
  pause(): ABTest {
    if (this.status !== 'RUNNING') {
      throw new Error('RUNNING 상태의 테스트만 일시정지할 수 있습니다')
    }

    return new ABTest({
      ...this.toProps(),
      status: 'PAUSED',
      updatedAt: new Date(),
    })
  }

  /**
   * 테스트 완료
   */
  complete(): ABTest {
    return new ABTest({
      ...this.toProps(),
      status: 'COMPLETED',
      endDate: new Date(),
      updatedAt: new Date(),
    })
  }

  /**
   * 변형 성과 업데이트
   */
  updateVariantMetrics(
    variantId: string,
    metrics: {
      impressions?: number
      clicks?: number
      conversions?: number
      spend?: Money
      revenue?: Money
    }
  ): ABTest {
    const variants = this.variants.map((v) => {
      if (v.id !== variantId) return v
      return {
        ...v,
        impressions: metrics.impressions ?? v.impressions,
        clicks: metrics.clicks ?? v.clicks,
        conversions: metrics.conversions ?? v.conversions,
        spend: metrics.spend ?? v.spend,
        revenue: metrics.revenue ?? v.revenue,
      }
    })

    return new ABTest({
      ...this.toProps(),
      variants,
      updatedAt: new Date(),
    })
  }

  /**
   * 컨트롤 그룹 조회
   */
  getControl(): ABTestVariant {
    const control = this.variants.find((v) => v.isControl)
    if (!control) {
      throw new Error('컨트롤 그룹을 찾을 수 없습니다')
    }
    return control
  }

  /**
   * 트리트먼트 그룹 조회
   */
  getTreatments(): ABTestVariant[] {
    return this.variants.filter((v) => !v.isControl)
  }

  /**
   * 전환율 계산
   */
  getConversionRate(variant: ABTestVariant): number {
    if (variant.clicks === 0) return 0
    return (variant.conversions / variant.clicks) * 100
  }

  /**
   * 통계적 유의성 계산 (Z-test)
   */
  calculateStatisticalSignificance(): StatisticalResult {
    const control = this.getControl()
    const treatments = this.getTreatments()

    if (treatments.length === 0) {
      return {
        winner: null,
        isSignificant: false,
        confidence: 0,
        uplift: 0,
        pValue: 1,
      }
    }

    const controlRate = this.getConversionRate(control)
    let bestTreatment: ABTestVariant | null = null
    let bestPValue = 1
    let bestUplift = 0

    for (const treatment of treatments) {
      const treatmentRate = this.getConversionRate(treatment)

      // Z-test for two proportions
      const n1 = control.clicks
      const n2 = treatment.clicks
      const p1 = controlRate / 100
      const p2 = treatmentRate / 100

      if (n1 === 0 || n2 === 0) continue

      const pooledP = (p1 * n1 + p2 * n2) / (n1 + n2)
      const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2))

      if (se === 0) continue

      const z = (p2 - p1) / se
      const pValue = 2 * (1 - this.normalCDF(Math.abs(z)))

      if (pValue < bestPValue && treatmentRate > controlRate) {
        bestTreatment = treatment
        bestPValue = pValue
        bestUplift = controlRate > 0 ? ((treatmentRate - controlRate) / controlRate) * 100 : 0
      }
    }

    const confidence = (1 - bestPValue) * 100
    const requiredConfidence = this.confidenceLevel
    const isSignificant = confidence >= requiredConfidence

    // Check minimum sample size
    const totalSamples = this.variants.reduce((sum, v) => sum + v.clicks, 0)
    const hasEnoughSamples = totalSamples >= this.minimumSampleSize

    return {
      winner: isSignificant && hasEnoughSamples ? bestTreatment : null,
      isSignificant: isSignificant && hasEnoughSamples,
      confidence,
      uplift: bestUplift,
      pValue: bestPValue,
    }
  }

  /**
   * Normal CDF approximation
   */
  private normalCDF(x: number): number {
    const a1 = 0.254829592
    const a2 = -0.284496736
    const a3 = 1.421413741
    const a4 = -1.453152027
    const a5 = 1.061405429
    const p = 0.3275911

    const sign = x < 0 ? -1 : 1
    x = Math.abs(x) / Math.sqrt(2)

    const t = 1.0 / (1.0 + p * x)
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

    return 0.5 * (1.0 + sign * y)
  }

  /**
   * Props 반환
   */
  private toProps(): Required<Omit<ABTestProps, 'endDate'>> & { endDate: Date | null } {
    return {
      id: this.id,
      campaignId: this.campaignId,
      name: this.name,
      description: this.description,
      status: this.status,
      variants: this.variants,
      startDate: this.startDate,
      endDate: this.endDate,
      confidenceLevel: this.confidenceLevel,
      minimumSampleSize: this.minimumSampleSize,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
