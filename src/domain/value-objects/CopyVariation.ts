/**
 * 광고 카피 변형 값 객체
 *
 * A/B 테스트를 위한 카피 변형 및 성과 추적
 */

/**
 * 카피 훅 타입 - 심리적 접근법
 */
export type CopyHookType =
  | 'benefit' // 혜택 강조
  | 'urgency' // 긴급성/희소성
  | 'social_proof' // 사회적 증거
  | 'curiosity' // 호기심 유발
  | 'fear_of_missing' // FOMO
  | 'authority' // 권위/전문성
  | 'emotional' // 감정적 연결

/**
 * A/B 테스트 변형 타입
 */
export type VariantType = 'A' | 'B' | 'C' | 'D' | 'control'

/**
 * 카피 변형 성과 메트릭
 */
export interface CopyPerformanceMetrics {
  impressions: number
  clicks: number
  conversions: number
  spend: number
  ctr: number
  cvr: number
  cpc: number
  cpa: number
  roas?: number
}

/**
 * 카피 변형 인터페이스
 */
export interface ICopyVariation {
  id: string
  campaignId: string
  variantType: VariantType
  hookType: CopyHookType
  headline: string
  primaryText: string
  description: string
  callToAction: string
  targetAudience: string
  predictedCTR: number
  rationale: string
  createdAt: Date
  status: 'draft' | 'active' | 'paused' | 'completed'
  metrics?: CopyPerformanceMetrics
}

/**
 * 카피 변형 생성 입력
 */
export interface CreateCopyVariationInput {
  campaignId: string
  variantType?: VariantType
  hookType: CopyHookType
  headline: string
  primaryText: string
  description: string
  callToAction: string
  targetAudience: string
  predictedCTR?: number
  rationale?: string
}

/**
 * 훅 타입 설명
 */
export const HOOK_TYPE_DESCRIPTIONS: Record<CopyHookType, { name: string; description: string }> = {
  benefit: {
    name: '혜택 강조',
    description: '고객이 얻는 구체적인 혜택과 가치를 직접적으로 전달합니다.',
  },
  urgency: {
    name: '긴급성',
    description: '시간 제한이나 수량 한정을 통해 즉각적인 행동을 유도합니다.',
  },
  social_proof: {
    name: '사회적 증거',
    description: '다른 고객들의 선택, 리뷰, 구매 수를 활용하여 신뢰를 구축합니다.',
  },
  curiosity: {
    name: '호기심 유발',
    description: '질문이나 미완결 정보로 클릭 욕구를 자극합니다.',
  },
  fear_of_missing: {
    name: 'FOMO',
    description: '놓치면 후회할 것 같은 느낌을 주어 행동을 촉진합니다.',
  },
  authority: {
    name: '권위/전문성',
    description: '전문가 추천, 인증, 수상 경력 등으로 신뢰성을 강조합니다.',
  },
  emotional: {
    name: '감정적 연결',
    description: '공감, 스토리텔링, 가치관 호소를 통해 정서적 유대를 형성합니다.',
  },
}

/**
 * 카피 변형 값 객체
 */
export class CopyVariation implements ICopyVariation {
  readonly id: string
  readonly campaignId: string
  readonly variantType: VariantType
  readonly hookType: CopyHookType
  readonly headline: string
  readonly primaryText: string
  readonly description: string
  readonly callToAction: string
  readonly targetAudience: string
  readonly predictedCTR: number
  readonly rationale: string
  readonly createdAt: Date
  readonly status: 'draft' | 'active' | 'paused' | 'completed'
  readonly metrics?: CopyPerformanceMetrics

  private constructor(props: ICopyVariation) {
    this.id = props.id
    this.campaignId = props.campaignId
    this.variantType = props.variantType
    this.hookType = props.hookType
    this.headline = props.headline
    this.primaryText = props.primaryText
    this.description = props.description
    this.callToAction = props.callToAction
    this.targetAudience = props.targetAudience
    this.predictedCTR = props.predictedCTR
    this.rationale = props.rationale
    this.createdAt = props.createdAt
    this.status = props.status
    this.metrics = props.metrics
  }

  /**
   * 새 카피 변형 생성
   */
  static create(input: CreateCopyVariationInput): CopyVariation {
    const validationErrors = this.validate(input)
    if (validationErrors.length > 0) {
      throw new Error(`카피 변형 유효성 검사 실패: ${validationErrors.join(', ')}`)
    }

    return new CopyVariation({
      id: `copy_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      campaignId: input.campaignId,
      variantType: input.variantType ?? 'A',
      hookType: input.hookType,
      headline: input.headline,
      primaryText: input.primaryText,
      description: input.description,
      callToAction: input.callToAction,
      targetAudience: input.targetAudience,
      predictedCTR: input.predictedCTR ?? 1.0,
      rationale: input.rationale ?? '',
      createdAt: new Date(),
      status: 'draft',
    })
  }

  /**
   * 기존 데이터에서 복원
   */
  static fromData(data: ICopyVariation): CopyVariation {
    return new CopyVariation(data)
  }

  /**
   * 입력 데이터 유효성 검사
   */
  static validate(input: CreateCopyVariationInput): string[] {
    const errors: string[] = []

    // 필수 필드 검사
    if (!input.campaignId) {
      errors.push('campaignId는 필수입니다')
    }

    if (!input.hookType) {
      errors.push('hookType은 필수입니다')
    }

    // 글자 수 제한 검사 (한글 기준)
    if (input.headline && input.headline.length > 40) {
      errors.push(`헤드라인이 너무 깁니다 (${input.headline.length}/40자)`)
    }

    if (input.primaryText && input.primaryText.length > 125) {
      errors.push(`본문이 너무 깁니다 (${input.primaryText.length}/125자)`)
    }

    if (input.description && input.description.length > 30) {
      errors.push(`설명이 너무 깁니다 (${input.description.length}/30자)`)
    }

    // 훅 타입 유효성 검사
    const validHookTypes: CopyHookType[] = [
      'benefit',
      'urgency',
      'social_proof',
      'curiosity',
      'fear_of_missing',
      'authority',
      'emotional',
    ]

    if (input.hookType && !validHookTypes.includes(input.hookType)) {
      errors.push(`유효하지 않은 hookType: ${input.hookType}`)
    }

    return errors
  }

  /**
   * 성과 메트릭 업데이트
   */
  updateMetrics(metrics: CopyPerformanceMetrics): CopyVariation {
    return new CopyVariation({
      ...this,
      metrics,
    })
  }

  /**
   * 상태 업데이트
   */
  updateStatus(status: 'draft' | 'active' | 'paused' | 'completed'): CopyVariation {
    return new CopyVariation({
      ...this,
      status,
    })
  }

  /**
   * 실제 CTR 계산
   */
  get actualCTR(): number | null {
    if (!this.metrics || this.metrics.impressions === 0) {
      return null
    }
    return (this.metrics.clicks / this.metrics.impressions) * 100
  }

  /**
   * 실제 CVR 계산
   */
  get actualCVR(): number | null {
    if (!this.metrics || this.metrics.clicks === 0) {
      return null
    }
    return (this.metrics.conversions / this.metrics.clicks) * 100
  }

  /**
   * CTR 예측 정확도 계산
   */
  get ctrPredictionAccuracy(): number | null {
    const actual = this.actualCTR
    if (actual === null || this.predictedCTR === 0) {
      return null
    }
    return 100 - Math.abs((actual - this.predictedCTR) / this.predictedCTR) * 100
  }

  /**
   * 성과 점수 계산 (0-100)
   */
  get performanceScore(): number | null {
    if (!this.metrics) {
      return null
    }

    // 가중치 기반 점수 계산
    const ctrScore = Math.min(100, (this.metrics.ctr / 2.0) * 100) // 2% CTR = 100점
    const cvrScore = Math.min(100, (this.metrics.cvr / 3.0) * 100) // 3% CVR = 100점
    const volumeScore = Math.min(100, (this.metrics.impressions / 10000) * 100) // 10K = 100점

    // 가중 평균 (CTR 40%, CVR 40%, Volume 20%)
    return ctrScore * 0.4 + cvrScore * 0.4 + volumeScore * 0.2
  }

  /**
   * 훅 타입 설명 가져오기
   */
  get hookTypeDescription(): string {
    return HOOK_TYPE_DESCRIPTIONS[this.hookType]?.description ?? ''
  }

  /**
   * 훅 타입 이름 가져오기
   */
  get hookTypeName(): string {
    return HOOK_TYPE_DESCRIPTIONS[this.hookType]?.name ?? this.hookType
  }

  /**
   * 요약 정보
   */
  toSummary(): {
    id: string
    variantType: VariantType
    hookType: CopyHookType
    hookTypeName: string
    headline: string
    predictedCTR: number
    actualCTR: number | null
    performanceScore: number | null
    status: string
  } {
    return {
      id: this.id,
      variantType: this.variantType,
      hookType: this.hookType,
      hookTypeName: this.hookTypeName,
      headline: this.headline,
      predictedCTR: this.predictedCTR,
      actualCTR: this.actualCTR,
      performanceScore: this.performanceScore,
      status: this.status,
    }
  }
}

/**
 * A/B 테스트 결과 분석
 */
export interface ABTestResult {
  winner: CopyVariation | null
  confidence: number // 0-100
  sampleSize: number
  testDuration: number // 일
  insights: string[]
  recommendations: string[]
}

/**
 * A/B 테스트 분석기
 */
export class ABTestAnalyzer {
  private readonly minimumSampleSize = 1000 // 최소 노출 수
  private readonly minimumConfidence = 95 // 최소 신뢰도

  /**
   * A/B 테스트 결과 분석
   */
  analyze(variations: CopyVariation[]): ABTestResult {
    const activeVariations = variations.filter(
      (v) => v.status === 'active' || v.status === 'completed'
    )

    if (activeVariations.length < 2) {
      return {
        winner: null,
        confidence: 0,
        sampleSize: 0,
        testDuration: 0,
        insights: ['A/B 테스트를 위해 최소 2개의 활성 변형이 필요합니다.'],
        recommendations: ['추가 카피 변형을 생성하고 테스트를 시작하세요.'],
      }
    }

    const totalImpressions = activeVariations.reduce(
      (sum, v) => sum + (v.metrics?.impressions ?? 0),
      0
    )

    // 최소 샘플 크기 확인
    if (totalImpressions < this.minimumSampleSize) {
      return {
        winner: null,
        confidence: 0,
        sampleSize: totalImpressions,
        testDuration: this.calculateTestDuration(activeVariations),
        insights: [
          `현재 ${totalImpressions}회 노출. 통계적 유의성을 위해 최소 ${this.minimumSampleSize}회 필요.`,
        ],
        recommendations: ['테스트를 계속 진행하여 더 많은 데이터를 수집하세요.'],
      }
    }

    // 성과 점수 기준 정렬
    const rankedVariations = [...activeVariations].sort((a, b) => {
      const scoreA = a.performanceScore ?? 0
      const scoreB = b.performanceScore ?? 0
      return scoreB - scoreA
    })

    const winner = rankedVariations[0]
    const runnerUp = rankedVariations[1]

    // 신뢰도 계산 (간소화된 버전)
    const confidence = this.calculateConfidence(winner, runnerUp)

    // 인사이트 생성
    const insights = this.generateInsights(rankedVariations)

    // 추천 생성
    const recommendations = this.generateRecommendations(rankedVariations, confidence)

    return {
      winner: confidence >= this.minimumConfidence ? winner : null,
      confidence,
      sampleSize: totalImpressions,
      testDuration: this.calculateTestDuration(activeVariations),
      insights,
      recommendations,
    }
  }

  /**
   * 신뢰도 계산 (간소화된 Z-test 기반)
   */
  private calculateConfidence(winner: CopyVariation, runnerUp: CopyVariation): number {
    const winnerMetrics = winner.metrics
    const runnerUpMetrics = runnerUp.metrics

    if (!winnerMetrics || !runnerUpMetrics) {
      return 0
    }

    const n1 = winnerMetrics.impressions
    const n2 = runnerUpMetrics.impressions

    if (n1 === 0 || n2 === 0) {
      return 0
    }

    const p1 = winnerMetrics.ctr / 100
    const p2 = runnerUpMetrics.ctr / 100

    // Pooled proportion
    const p = (p1 * n1 + p2 * n2) / (n1 + n2)

    // Standard error
    const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2))

    if (se === 0) {
      return p1 > p2 ? 100 : 0
    }

    // Z-score
    const z = Math.abs(p1 - p2) / se

    // Z-score to confidence (간소화)
    // z=1.96 -> 95%, z=2.58 -> 99%
    const confidence = Math.min(100, (1 - 2 * (1 - this.normalCDF(z))) * 100)

    return Math.round(confidence * 10) / 10
  }

  /**
   * 정규 분포 CDF (근사)
   */
  private normalCDF(z: number): number {
    const a1 = 0.254829592
    const a2 = -0.284496736
    const a3 = 1.421413741
    const a4 = -1.453152027
    const a5 = 1.061405429
    const p = 0.3275911

    const sign = z < 0 ? -1 : 1
    z = Math.abs(z) / Math.sqrt(2)

    const t = 1.0 / (1.0 + p * z)
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-z * z)

    return 0.5 * (1.0 + sign * y)
  }

  /**
   * 테스트 기간 계산
   */
  private calculateTestDuration(variations: CopyVariation[]): number {
    if (variations.length === 0) {
      return 0
    }

    const earliest = Math.min(...variations.map((v) => v.createdAt.getTime()))
    const now = Date.now()

    return Math.ceil((now - earliest) / (1000 * 60 * 60 * 24))
  }

  /**
   * 인사이트 생성
   */
  private generateInsights(variations: CopyVariation[]): string[] {
    const insights: string[] = []

    if (variations.length === 0) {
      return insights
    }

    // 최고 성과 훅 타입
    const topHook = variations[0].hookType
    const topHookName = HOOK_TYPE_DESCRIPTIONS[topHook]?.name ?? topHook
    insights.push(`'${topHookName}' 훅 유형이 가장 높은 성과를 보였습니다.`)

    // CTR 비교
    const topCTR = variations[0].actualCTR
    const bottomCTR = variations[variations.length - 1].actualCTR

    if (topCTR !== null && bottomCTR !== null && bottomCTR > 0) {
      const improvement = ((topCTR - bottomCTR) / bottomCTR) * 100
      insights.push(
        `최고 성과 변형이 최저 대비 CTR ${improvement.toFixed(1)}% 높습니다.`
      )
    }

    // 예측 정확도
    const avgAccuracy =
      variations
        .map((v) => v.ctrPredictionAccuracy)
        .filter((a): a is number => a !== null)
        .reduce((sum, a) => sum + a, 0) / variations.length

    if (!isNaN(avgAccuracy)) {
      insights.push(`CTR 예측 평균 정확도: ${avgAccuracy.toFixed(1)}%`)
    }

    return insights
  }

  /**
   * 추천 생성
   */
  private generateRecommendations(
    variations: CopyVariation[],
    confidence: number
  ): string[] {
    const recommendations: string[] = []

    if (confidence >= this.minimumConfidence) {
      recommendations.push(
        '통계적으로 유의미한 결과입니다. 우승 변형을 메인 광고로 적용하세요.'
      )

      const winnerHook = variations[0].hookType
      recommendations.push(
        `'${HOOK_TYPE_DESCRIPTIONS[winnerHook]?.name}' 훅을 활용한 추가 변형 테스트를 권장합니다.`
      )
    } else if (confidence >= 80) {
      recommendations.push('결과가 유망하지만 더 많은 데이터가 필요합니다.')
      recommendations.push('테스트를 1-2일 더 진행하세요.')
    } else {
      recommendations.push('아직 명확한 승자가 없습니다.')
      recommendations.push('새로운 훅 유형의 변형을 추가하여 테스트 범위를 확장하세요.')
    }

    // 저성과 변형 처리
    const lowPerformers = variations.filter((v) => (v.performanceScore ?? 0) < 30)
    if (lowPerformers.length > 0) {
      recommendations.push(
        `${lowPerformers.length}개의 저성과 변형을 중단하고 예산을 재분배하세요.`
      )
    }

    return recommendations
  }
}

/**
 * 카피 변형 비교 유틸리티
 */
export function compareCopyVariations(
  a: CopyVariation,
  b: CopyVariation
): {
  ctrDiff: number | null
  cvrDiff: number | null
  winner: 'a' | 'b' | 'tie' | 'insufficient_data'
  summary: string
} {
  const ctrA = a.actualCTR
  const ctrB = b.actualCTR

  if (ctrA === null || ctrB === null) {
    return {
      ctrDiff: null,
      cvrDiff: null,
      winner: 'insufficient_data',
      summary: '두 변형 모두 충분한 데이터가 없습니다.',
    }
  }

  const ctrDiff = ctrA - ctrB
  const cvrA = a.actualCVR
  const cvrB = b.actualCVR
  const cvrDiff = cvrA !== null && cvrB !== null ? cvrA - cvrB : null

  let winner: 'a' | 'b' | 'tie'
  if (Math.abs(ctrDiff) < 0.1) {
    winner = 'tie'
  } else {
    winner = ctrDiff > 0 ? 'a' : 'b'
  }

  const winnerVariant = winner === 'a' ? a : winner === 'b' ? b : null
  const summary = winnerVariant
    ? `${winnerVariant.hookTypeName} 훅을 사용한 변형 ${winner.toUpperCase()}가 CTR ${Math.abs(ctrDiff).toFixed(2)}% 우위`
    : '두 변형의 성과가 비슷합니다.'

  return { ctrDiff, cvrDiff, winner, summary }
}
