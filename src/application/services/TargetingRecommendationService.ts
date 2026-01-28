/**
 * TargetingRecommendationService - 타겟팅 최적화 추천 서비스
 *
 * 오디언스 포화도를 분석하고 타겟팅 확장/축소 권장사항을 제공합니다.
 * 광고 피로도 감지 및 타겟팅 전략 제안을 포함합니다.
 */

export interface AudienceSaturationAnalysis {
  frequency: number // Average frequency
  saturationLevel: 'low' | 'moderate' | 'high' | 'critical'
  fatigueIndicators: {
    ctrDecline: number // % decline over time
    cpaIncrease: number // % increase over time
    frequencyTrend: 'increasing' | 'stable' | 'decreasing'
  }
}

export interface TargetingRecommendation {
  type: 'expand' | 'reduce' | 'maintain' | 'refresh'
  priority: 'high' | 'medium' | 'low'
  category: 'lookalike' | 'interest' | 'geographic' | 'demographic'
  currentState: string
  recommendation: string
  expectedImpact: string
  rationale: string
}

export interface TargetingAnalysis {
  saturation: AudienceSaturationAnalysis
  recommendations: TargetingRecommendation[]
  summary: string
}

export interface MetricsTimeSeries {
  date: Date
  ctr: number
  cpa: number
  frequency: number
  impressions: number
  reach: number
}

export interface CurrentMetrics {
  frequency: number
  reach: number
  impressions: number
  ctr: number
  cpa: number
  clicks: number
  conversions: number
  spend: number
}

/**
 * 타겟팅 추천 서비스
 */
export class TargetingRecommendationService {
  /**
   * 타겟팅 분석 수행
   */
  analyzeTargeting(
    campaignId: string,
    currentMetrics: CurrentMetrics,
    metricsTimeSeries: MetricsTimeSeries[]
  ): TargetingAnalysis {
    // 1. 오디언스 포화도 분석
    const saturation = this.analyzeSaturation(campaignId, currentMetrics, metricsTimeSeries)

    // 2. 광고 피로도 감지
    const fatigue = this.detectAdFatigue(metricsTimeSeries)

    // 3. 포화도와 피로도 기반 권장사항 생성
    const recommendations = this.generateRecommendations(saturation, fatigue, currentMetrics)

    // 4. 요약 생성
    const summary = this.generateSummary(saturation, recommendations)

    return {
      saturation,
      recommendations,
      summary,
    }
  }

  /**
   * 오디언스 포화도 분석
   */
  analyzeSaturation(
    _campaignId: string,
    currentMetrics: CurrentMetrics,
    metricsTimeSeries: MetricsTimeSeries[]
  ): AudienceSaturationAnalysis {
    const frequency = currentMetrics.frequency

    // 포화도 레벨 결정
    let saturationLevel: AudienceSaturationAnalysis['saturationLevel']
    if (frequency > 7) {
      saturationLevel = 'critical'
    } else if (frequency > 5) {
      saturationLevel = 'high'
    } else if (frequency > 3) {
      saturationLevel = 'moderate'
    } else {
      saturationLevel = 'low'
    }

    // 피로도 지표 계산
    const fatigueIndicators = this.calculateFatigueIndicators(metricsTimeSeries)

    return {
      frequency,
      saturationLevel,
      fatigueIndicators,
    }
  }

  /**
   * 피로도 지표 계산
   */
  private calculateFatigueIndicators(
    metricsTimeSeries: MetricsTimeSeries[]
  ): AudienceSaturationAnalysis['fatigueIndicators'] {
    if (metricsTimeSeries.length < 2) {
      return {
        ctrDecline: 0,
        cpaIncrease: 0,
        frequencyTrend: 'stable',
      }
    }

    // 최근 7일 vs 이전 7일 비교
    const recent7Days = metricsTimeSeries.slice(-7)
    const previous7Days = metricsTimeSeries.slice(-14, -7)

    const recentAvgCTR = this.average(recent7Days.map((m) => m.ctr))
    const previousAvgCTR = this.average(previous7Days.map((m) => m.ctr))

    const recentAvgCPA = this.average(recent7Days.map((m) => m.cpa))
    const previousAvgCPA = this.average(previous7Days.map((m) => m.cpa))

    const recentAvgFreq = this.average(recent7Days.map((m) => m.frequency))
    const previousAvgFreq = this.average(previous7Days.map((m) => m.frequency))

    // CTR 감소율 계산
    const ctrDecline =
      previousAvgCTR > 0 ? ((previousAvgCTR - recentAvgCTR) / previousAvgCTR) * 100 : 0

    // CPA 증가율 계산
    const cpaIncrease =
      previousAvgCPA > 0 ? ((recentAvgCPA - previousAvgCPA) / previousAvgCPA) * 100 : 0

    // 빈도수 트렌드
    let frequencyTrend: AudienceSaturationAnalysis['fatigueIndicators']['frequencyTrend']
    const freqChange = recentAvgFreq - previousAvgFreq
    if (freqChange > 0.5) {
      frequencyTrend = 'increasing'
    } else if (freqChange < -0.5) {
      frequencyTrend = 'decreasing'
    } else {
      frequencyTrend = 'stable'
    }

    return {
      ctrDecline: Math.round(ctrDecline),
      cpaIncrease: Math.round(cpaIncrease),
      frequencyTrend,
    }
  }

  /**
   * 광고 피로도 감지
   */
  detectAdFatigue(metricsTimeSeries: MetricsTimeSeries[]): {
    hasFatigue: boolean
    severity: 'none' | 'mild' | 'moderate' | 'severe'
    indicators: string[]
  } {
    if (metricsTimeSeries.length < 7) {
      return {
        hasFatigue: false,
        severity: 'none',
        indicators: [],
      }
    }

    const indicators: string[] = []
    let fatigueScore = 0

    // 최근 7일 vs 이전 7일
    const recent = metricsTimeSeries.slice(-7)
    const previous = metricsTimeSeries.slice(-14, -7)

    const recentCTR = this.average(recent.map((m) => m.ctr))
    const previousCTR = this.average(previous.map((m) => m.ctr))

    const recentCPA = this.average(recent.map((m) => m.cpa))
    const previousCPA = this.average(previous.map((m) => m.cpa))

    const recentFreq = this.average(recent.map((m) => m.frequency))

    // 1. CTR 하락 체크
    if (previousCTR > 0) {
      const ctrDecline = ((previousCTR - recentCTR) / previousCTR) * 100
      if (ctrDecline > 20) {
        indicators.push(`CTR이 ${ctrDecline.toFixed(0)}% 감소했습니다`)
        fatigueScore += 3
      } else if (ctrDecline > 10) {
        indicators.push(`CTR이 ${ctrDecline.toFixed(0)}% 감소했습니다`)
        fatigueScore += 2
      }
    }

    // 2. CPA 상승 체크 (전환이 있고 규모가 있는 경우에만)
    if (previousCPA > 0 && recentCPA > 0) {
      const cpaIncrease = ((recentCPA - previousCPA) / previousCPA) * 100
      if (cpaIncrease > 30) {
        indicators.push(`CPA가 ${cpaIncrease.toFixed(0)}% 증가했습니다`)
        fatigueScore += 3
      } else if (cpaIncrease > 15) {
        indicators.push(`CPA가 ${cpaIncrease.toFixed(0)}% 증가했습니다`)
        fatigueScore += 1
      }
    }

    // 3. 높은 빈도수 체크
    if (recentFreq > 5) {
      indicators.push(`평균 빈도수가 ${recentFreq.toFixed(1)}로 높습니다`)
      fatigueScore += 2
    } else if (recentFreq > 3) {
      indicators.push(`평균 빈도수가 ${recentFreq.toFixed(1)}로 증가 중입니다`)
      fatigueScore += 1
    }

    // 심각도 결정
    let severity: 'none' | 'mild' | 'moderate' | 'severe'
    if (fatigueScore >= 6) {
      severity = 'severe'
    } else if (fatigueScore >= 4) {
      severity = 'moderate'
    } else if (fatigueScore >= 2) {
      severity = 'mild'
    } else {
      severity = 'none'
    }

    return {
      hasFatigue: fatigueScore > 0,
      severity,
      indicators,
    }
  }

  /**
   * 타겟팅 권장사항 생성
   */
  generateRecommendations(
    saturation: AudienceSaturationAnalysis,
    fatigue: ReturnType<typeof this.detectAdFatigue>,
    currentMetrics: CurrentMetrics
  ): TargetingRecommendation[] {
    const recommendations: TargetingRecommendation[] = []

    // 1. 포화도 기반 권장사항
    if (saturation.saturationLevel === 'critical' || saturation.saturationLevel === 'high') {
      // Critical/High 포화도 - 확장 또는 새로고침 필요
      if (fatigue.severity === 'severe' || fatigue.severity === 'moderate') {
        recommendations.push({
          type: 'refresh',
          priority: 'high',
          category: 'interest',
          currentState: `빈도수 ${saturation.frequency.toFixed(1)}, 오디언스 피로도 높음`,
          recommendation: '크리에이티브를 새로고침하고 타겟 오디언스를 확장하세요',
          expectedImpact: 'CTR 회복 및 CPA 절감 예상',
          rationale:
            '오디언스가 광고에 지쳐있습니다. 새로운 소재와 함께 타겟을 확장하여 신규 잠재고객에게 도달해야 합니다.',
        })
      }

      recommendations.push({
        type: 'expand',
        priority: saturation.saturationLevel === 'critical' ? 'high' : 'medium',
        category: 'lookalike',
        currentState: `현재 도달 ${currentMetrics.reach.toLocaleString()}명, 빈도수 ${saturation.frequency.toFixed(1)}`,
        recommendation: '유사 잠재고객(Lookalike) 1-2%를 추가하여 타겟을 확장하세요',
        expectedImpact: '도달 범위 30-50% 증가 예상',
        rationale:
          '현재 오디언스가 포화 상태입니다. 기존 전환 고객과 유사한 특성을 가진 신규 오디언스를 발굴해야 합니다.',
      })

      recommendations.push({
        type: 'expand',
        priority: 'medium',
        category: 'interest',
        currentState: '현재 타겟 관심사 범위 협소',
        recommendation: '관련 관심사 카테고리를 2-3개 추가하세요',
        expectedImpact: '노출 기회 증가 및 빈도수 분산',
        rationale: '관심사 범위를 확장하면 더 많은 잠재고객에게 도달하고 광고 피로도를 낮출 수 있습니다.',
      })
    } else if (saturation.saturationLevel === 'moderate') {
      // Moderate 포화도 - 모니터링 또는 점진적 확장
      if (saturation.fatigueIndicators.frequencyTrend === 'increasing') {
        recommendations.push({
          type: 'expand',
          priority: 'medium',
          category: 'demographic',
          currentState: `빈도수 ${saturation.frequency.toFixed(1)}, 증가 추세`,
          recommendation: '인접 연령대나 지역으로 타겟을 확장하세요',
          expectedImpact: '빈도수 안정화 및 도달 범위 확대',
          rationale:
            '빈도수가 증가 중입니다. 타겟을 확장하여 더 많은 사용자에게 분산 노출하는 것이 좋습니다.',
        })
      } else {
        recommendations.push({
          type: 'maintain',
          priority: 'low',
          category: 'interest',
          currentState: `빈도수 ${saturation.frequency.toFixed(1)}, 안정적`,
          recommendation: '현재 타겟팅을 유지하되 성과를 모니터링하세요',
          expectedImpact: '안정적인 성과 유지',
          rationale: '현재 타겟팅이 적절한 수준입니다. 급격한 변경 없이 지속 모니터링하세요.',
        })
      }
    } else {
      // Low 포화도 - 타겟팅이 너무 넓을 수 있음
      if (currentMetrics.ctr < 1.0 || currentMetrics.cpa > 50000) {
        recommendations.push({
          type: 'reduce',
          priority: 'medium',
          category: 'interest',
          currentState: `빈도수 ${saturation.frequency.toFixed(1)}, CTR ${currentMetrics.ctr.toFixed(2)}%`,
          recommendation: '타겟을 더 정밀하게 세분화하여 관련성을 높이세요',
          expectedImpact: 'CTR 및 전환율 개선 예상',
          rationale:
            '빈도수가 낮고 CTR이 낮다면 타겟이 너무 넓어서 관련성이 떨어지는 것일 수 있습니다.',
        })
      } else {
        recommendations.push({
          type: 'maintain',
          priority: 'low',
          category: 'interest',
          currentState: `빈도수 ${saturation.frequency.toFixed(1)}, 성과 양호`,
          recommendation: '현재 타겟팅 전략을 유지하세요',
          expectedImpact: '현재 성과 수준 유지',
          rationale: '오디언스 규모와 성과가 모두 양호합니다. 현재 전략을 지속하세요.',
        })
      }
    }

    // 2. 지역 타겟팅 권장사항
    if (saturation.saturationLevel === 'high' || saturation.saturationLevel === 'critical') {
      recommendations.push({
        type: 'expand',
        priority: 'low',
        category: 'geographic',
        currentState: '현재 주요 도시 중심 타겟팅',
        recommendation: '중소 도시나 인접 지역으로 지역 타겟을 확장하세요',
        expectedImpact: '신규 지역 잠재고객 발굴',
        rationale: '주요 도시에서 포화 상태라면 인접 지역으로 확장하여 신규 수요를 찾을 수 있습니다.',
      })
    }

    // 우선순위로 정렬
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }

  /**
   * 요약 생성
   */
  private generateSummary(
    saturation: AudienceSaturationAnalysis,
    recommendations: TargetingRecommendation[]
  ): string {
    const saturationText = {
      low: '오디언스 포화도가 낮습니다',
      moderate: '오디언스 포화도가 적정 수준입니다',
      high: '오디언스 포화도가 높습니다',
      critical: '오디언스 포화도가 심각한 수준입니다',
    }[saturation.saturationLevel]

    const topRecommendation = recommendations[0]
    const actionText = topRecommendation
      ? `${topRecommendation.recommendation}`
      : '현재 타겟팅을 유지하세요'

    let fatigueText = ''
    if (saturation.fatigueIndicators.ctrDecline > 20) {
      fatigueText = ` CTR이 ${saturation.fatigueIndicators.ctrDecline}% 감소하여 광고 피로도가 감지되었습니다.`
    }

    return `${saturationText} (평균 빈도수 ${saturation.frequency.toFixed(1)}).${fatigueText} 권장: ${actionText}`
  }

  /**
   * 평균 계산 헬퍼
   */
  private average(values: number[]): number {
    if (values.length === 0) return 0
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }
}

// Export singleton instance
export const targetingRecommendationService = new TargetingRecommendationService()
