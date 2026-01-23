/**
 * 예산 추천 서비스
 *
 * 업종별/규모별/객단가 기반 예산 추천 비즈니스 로직
 *
 * 추천 우선순위:
 * 1. 기존 광고 데이터가 있으면 → 데이터 기반 추천 + Meta AOV 사용
 * 2. 직접 입력한 객단가가 있으면 → 해당 값으로 ROAS 계산
 * 3. 그 외 → 업종별 기본 객단가 추정 + 300% ROAS 적용
 */

import {
  type Industry,
  type BusinessScale,
  type BudgetRecommendationInput,
  type BudgetRecommendation,
  type BudgetRange,
  type AOVSource,
  type BudgetRecommendationSource,
  type ExistingCampaignData,
  MINIMUM_DAILY_BUDGET,
  DEFAULT_MARGIN_RATE,
  TEST_PERIOD_DAYS,
  INDUSTRY_BUDGET_BENCHMARKS,
  calculateTargetROAS,
  calculateDailyBudgetFromMonthly,
  calculateBudgetRange,
  calculateTestBudget,
  calculateTargetCPA,
  getAOVTierLabel,
  formatBudget,
  formatROAS,
} from '@domain/value-objects/BudgetRecommendation'

/**
 * 예산 추천 서비스
 */
export class BudgetRecommendationService {
  /**
   * 종합 예산 추천 생성
   */
  generateRecommendation(input: BudgetRecommendationInput): BudgetRecommendation {
    const {
      industry,
      businessScale,
      monthlyMarketingBudget,
      averageOrderValue,
      marginRate = DEFAULT_MARGIN_RATE,
      existingCampaignData,
    } = input

    // 1. AOV 결정 (우선순위: 기존 데이터 > 직접 입력 > 업종 기본값)
    const { aov, aovSource } = this.determineAOV(
      averageOrderValue,
      existingCampaignData,
      industry
    )

    // 2. 목표 ROAS 계산
    const targetROAS = calculateTargetROAS(aov, marginRate)

    // 3. 목표 CPA 계산
    const targetCPA = calculateTargetCPA(aov, targetROAS)

    // 4. 예산 범위 결정 (우선순위: 기존 데이터 > 월예산 > 업종/규모)
    const { budgetRange, source } = this.determineBudgetRange(
      industry,
      businessScale,
      monthlyMarketingBudget,
      existingCampaignData
    )

    // 5. 추천 근거 생성
    const reasoning = this.generateReasoning(
      source,
      aov,
      aovSource,
      targetROAS,
      budgetRange,
      existingCampaignData
    )

    // 6. 팁 생성
    const tips = this.generateTips(industry, businessScale, targetROAS, existingCampaignData)

    // 7. 기존 데이터 비교 (있는 경우)
    const comparison = existingCampaignData
      ? this.generateComparison(existingCampaignData, budgetRange.recommended, targetROAS)
      : undefined

    return {
      dailyBudget: budgetRange,
      source,
      testBudget: calculateTestBudget(budgetRange.recommended),
      targetROAS,
      targetCPA,
      aovUsed: aov,
      aovSource,
      reasoning,
      tips,
      comparison,
    }
  }

  /**
   * AOV 결정 로직
   */
  private determineAOV(
    userInputAOV: number | undefined,
    existingData: ExistingCampaignData | undefined,
    industry: Industry
  ): { aov: number; aovSource: AOVSource } {
    // 우선순위 1: Meta 데이터에서 계산된 AOV
    if (existingData && existingData.avgAOV > 0) {
      return {
        aov: existingData.avgAOV,
        aovSource: 'meta_data',
      }
    }

    // 우선순위 2: 사용자 직접 입력
    if (userInputAOV && userInputAOV > 0) {
      return {
        aov: userInputAOV,
        aovSource: 'user_input',
      }
    }

    // 우선순위 3: 업종 기본값
    const industryBenchmark = INDUSTRY_BUDGET_BENCHMARKS[industry]
    return {
      aov: industryBenchmark.defaultAOV,
      aovSource: 'industry_default',
    }
  }

  /**
   * 예산 범위 결정 로직
   */
  private determineBudgetRange(
    industry: Industry,
    businessScale: BusinessScale,
    monthlyBudget: number | undefined,
    existingData: ExistingCampaignData | undefined
  ): { budgetRange: BudgetRange; source: BudgetRecommendationSource } {
    // 우선순위 1: 기존 광고 데이터 기반
    if (existingData && existingData.avgDailySpend > 0) {
      const budgetRange = this.calculateBudgetFromExistingData(existingData)
      return { budgetRange, source: 'existing_data' }
    }

    // 우선순위 2: 월 마케팅 예산 기반
    if (monthlyBudget && monthlyBudget > 0) {
      const dailyFromMonthly = calculateDailyBudgetFromMonthly(monthlyBudget)
      const budgetRange = this.adjustBudgetRange(dailyFromMonthly, industry)
      return { budgetRange, source: 'monthly_budget' }
    }

    // 우선순위 3: 업종 + 규모 기반
    const budgetRange = calculateBudgetRange(industry, businessScale)
    return { budgetRange, source: 'industry' }
  }

  /**
   * 기존 데이터 기반 예산 계산
   */
  private calculateBudgetFromExistingData(data: ExistingCampaignData): BudgetRange {
    const currentSpend = data.avgDailySpend
    const performanceRatio = data.avgROAS / 3.0 // 기준 ROAS 대비

    let recommended: number

    if (performanceRatio >= 1.2) {
      // ROAS가 목표의 120% 이상: 20% 증액 권장
      recommended = Math.round(currentSpend * 1.2)
    } else if (performanceRatio >= 0.9) {
      // ROAS가 목표의 90~120%: 10% 증액 권장
      recommended = Math.round(currentSpend * 1.1)
    } else if (performanceRatio >= 0.7) {
      // ROAS가 목표의 70~90%: 현상 유지
      recommended = currentSpend
    } else {
      // ROAS가 목표의 70% 미만: 감액 또는 유지 + 최적화
      recommended = currentSpend
    }

    // 최소 예산 보장
    recommended = Math.max(recommended, MINIMUM_DAILY_BUDGET)

    return {
      min: MINIMUM_DAILY_BUDGET,
      recommended,
      max: Math.round(recommended * 2),
    }
  }

  /**
   * 월 예산 기반 범위 조정
   */
  private adjustBudgetRange(dailyBudget: number, industry: Industry): BudgetRange {
    const industryBenchmark = INDUSTRY_BUDGET_BENCHMARKS[industry]

    return {
      min: MINIMUM_DAILY_BUDGET,
      recommended: Math.max(dailyBudget, MINIMUM_DAILY_BUDGET),
      max: Math.max(dailyBudget * 1.5, industryBenchmark.dailyBudget.max),
    }
  }

  /**
   * 추천 근거 생성
   */
  private generateReasoning(
    source: BudgetRecommendationSource,
    aov: number,
    aovSource: AOVSource,
    targetROAS: number,
    budgetRange: BudgetRange,
    existingData?: ExistingCampaignData
  ): string {
    const aovLabel = getAOVTierLabel(aov)
    const aovSourceLabel = {
      user_input: '직접 입력',
      meta_data: 'Meta 데이터',
      industry_default: '업종 기본값',
    }[aovSource]

    switch (source) {
      case 'existing_data':
        if (existingData) {
          const performanceRatio = existingData.avgROAS / targetROAS
          if (performanceRatio >= 1.0) {
            return `현재 ROAS ${formatROAS(existingData.avgROAS)}로 목표(${formatROAS(targetROAS)})를 달성 중입니다. 예산 증액으로 더 많은 전환을 기대할 수 있습니다.`
          } else {
            return `현재 ROAS ${formatROAS(existingData.avgROAS)}가 목표(${formatROAS(targetROAS)})에 미달합니다. 예산 증액 전 광고 최적화를 권장합니다.`
          }
        }
        return `기존 광고 성과 데이터를 기반으로 추천합니다.`

      case 'monthly_budget':
        return `월 마케팅 예산 기준으로 일일 ${formatBudget(budgetRange.recommended)}을 추천합니다. 객단가 ${formatBudget(aov)}(${aovLabel}) 기준 목표 ROAS는 ${formatROAS(targetROAS)}입니다.`

      case 'industry':
      default:
        return `${aovSourceLabel} 객단가 ${formatBudget(aov)}(${aovLabel}) 기준으로 목표 ROAS ${formatROAS(targetROAS)}를 권장합니다.`
    }
  }

  /**
   * 실행 팁 생성
   */
  private generateTips(
    industry: Industry,
    businessScale: BusinessScale,
    targetROAS: number,
    existingData?: ExistingCampaignData
  ): string[] {
    const tips: string[] = []

    // 공통 팁
    tips.push(`첫 ${TEST_PERIOD_DAYS}일은 권장 예산의 50%로 시작하여 데이터를 수집하세요`)

    // 업종별 팁
    const industryTips: Record<Industry, string> = {
      ecommerce: '리타겟팅 캠페인을 활용해 장바구니 이탈자를 타겟팅하세요',
      food_beverage: '식사 시간대(11-13시, 17-20시)에 노출을 집중하세요',
      beauty: '리뷰와 비포/애프터 이미지를 크리에이티브에 활용하세요',
      fashion: '시즌별 트렌드에 맞춰 크리에이티브를 업데이트하세요',
      education: '무료 체험/상담 신청을 전환 목표로 설정하세요',
      service: 'B2B의 경우 평일 업무시간에 노출을 집중하세요',
      saas: '무료 트라이얼 또는 데모 신청을 전환 목표로 설정하세요',
      other: '타겟 오디언스의 활동 시간대를 분석하세요',
    }
    tips.push(industryTips[industry])

    // 성과 기반 팁
    if (existingData) {
      if (existingData.avgROAS >= targetROAS) {
        tips.push('현재 성과가 좋습니다. 유사 타겟 확장을 고려하세요')
      } else {
        tips.push('ROAS 개선을 위해 크리에이티브 A/B 테스트를 실행하세요')
      }
    } else {
      tips.push('성과가 안정화되면 20% 단위로 점진적으로 예산을 증액하세요')
    }

    // 규모별 팁
    if (businessScale === 'individual' || businessScale === 'small') {
      tips.push('소규모 예산에서는 타겟을 좁게 설정하여 효율을 높이세요')
    }

    return tips.slice(0, 4) // 최대 4개
  }

  /**
   * 기존 데이터 비교 분석 생성
   */
  private generateComparison(
    existingData: ExistingCampaignData,
    recommendedBudget: number,
    targetROAS: number
  ): { currentVsRecommended: string; potentialImpact: string } {
    const budgetDiff = recommendedBudget - existingData.avgDailySpend
    const budgetChangePercent = (budgetDiff / existingData.avgDailySpend) * 100
    const performanceRatio = existingData.avgROAS / targetROAS

    let currentVsRecommended: string
    let potentialImpact: string

    if (budgetDiff > 0) {
      currentVsRecommended = `현재 ${formatBudget(existingData.avgDailySpend)} → 권장 ${formatBudget(recommendedBudget)} (+${budgetChangePercent.toFixed(0)}%)`

      if (performanceRatio >= 1.0) {
        const estimatedConversionIncrease = budgetChangePercent * 0.7 // 보수적 추정
        potentialImpact = `예산 증액 시 전환 약 ${estimatedConversionIncrease.toFixed(0)}% 증가 예상`
      } else {
        potentialImpact = `먼저 ROAS를 ${formatROAS(targetROAS)}까지 개선 후 증액을 권장합니다`
      }
    } else if (budgetDiff < 0) {
      currentVsRecommended = `현재 ${formatBudget(existingData.avgDailySpend)} → 권장 ${formatBudget(recommendedBudget)} (${budgetChangePercent.toFixed(0)}%)`
      potentialImpact = '예산 최적화로 ROAS 개선 후 재증액을 권장합니다'
    } else {
      currentVsRecommended = `현재 예산 ${formatBudget(existingData.avgDailySpend)} 유지 권장`
      potentialImpact = performanceRatio >= 1.0
        ? '성과 안정화 후 점진적 증액을 고려하세요'
        : 'ROAS 개선에 집중하세요'
    }

    return { currentVsRecommended, potentialImpact }
  }

  /**
   * 간단한 예산 유효성 검사
   */
  validateBudget(dailyBudget: number): { valid: boolean; message?: string } {
    if (dailyBudget < MINIMUM_DAILY_BUDGET) {
      return {
        valid: false,
        message: `최소 일일 예산은 ${formatBudget(MINIMUM_DAILY_BUDGET)}입니다`,
      }
    }

    if (dailyBudget > 10000000) {
      return {
        valid: false,
        message: '일일 예산이 너무 높습니다. 입력값을 확인해주세요',
      }
    }

    return { valid: true }
  }

  /**
   * 업종 기본 객단가 조회
   */
  getIndustryDefaultAOV(industry: Industry): number {
    return INDUSTRY_BUDGET_BENCHMARKS[industry].defaultAOV
  }

  /**
   * 업종 기본 CPA 조회
   */
  getIndustryDefaultCPA(industry: Industry): number {
    return INDUSTRY_BUDGET_BENCHMARKS[industry].averageCPA
  }
}
