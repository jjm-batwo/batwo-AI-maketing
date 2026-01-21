/**
 * CampaignAnalyzer - 캠페인 성과 분석 서비스
 *
 * 캠페인 성과 데이터를 분석하여 최적화 인사이트를 생성합니다.
 * 예상 영향도 및 신뢰도 계산을 포함합니다.
 */

import type { Industry } from '@infrastructure/external/openai/prompts/adCopyGeneration'
import { INDUSTRY_BENCHMARKS } from '@infrastructure/external/openai/prompts/adCopyGeneration'
import { KoreanMarketCalendar } from '@domain/value-objects/KoreanMarketCalendar'

/**
 * 캠페인 성과 메트릭
 */
export interface CampaignMetrics {
  impressions: number
  clicks: number
  conversions: number
  spend: number
  revenue: number
  ctr: number
  cvr: number
  cpa: number
  roas: number
  cpc: number
}

/**
 * 최적화 인사이트
 */
export interface OptimizationInsight {
  category: 'budget' | 'targeting' | 'creative' | 'timing' | 'bidding'
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  currentValue: string
  targetValue: string
  expectedImpact: {
    metric: string
    improvement: number
    unit: 'percent' | 'absolute' | 'multiplier'
  }
  confidence: number // 0-1
  reasoning: string[]
  actionItems: string[]
}

/**
 * 분석 결과
 */
export interface AnalysisResult {
  industry: Industry
  metrics: CampaignMetrics
  performanceGrade: 'excellent' | 'good' | 'average' | 'below_average' | 'poor'
  insights: OptimizationInsight[]
  benchmarkComparison: {
    ctrVsBenchmark: number // 퍼센트 차이
    cvrVsBenchmark: number
    overallScore: number // 0-100
  }
  marketContext: {
    isSpecialPeriod: boolean
    periodName?: string
    seasonalTips: string[]
  }
  recommendedPriority: string[]
}

/**
 * 성과 등급 임계값
 */
const GRADE_THRESHOLDS = {
  excellent: 1.3, // 벤치마크 대비 130% 이상
  good: 1.1, // 벤치마크 대비 110% 이상
  average: 0.9, // 벤치마크 대비 90% 이상
  below_average: 0.7, // 벤치마크 대비 70% 이상
  // poor: 70% 미만
}

/**
 * 캠페인 분석 서비스
 */
export class CampaignAnalyzer {
  private calendar: KoreanMarketCalendar

  constructor() {
    this.calendar = new KoreanMarketCalendar()
  }

  /**
   * 캠페인 성과 분석
   */
  analyze(
    metrics: CampaignMetrics,
    industry: Industry,
    analysisDate: Date = new Date()
  ): AnalysisResult {
    const benchmark = INDUSTRY_BENCHMARKS[industry]
    const marketContext = this.calendar.getDateEventInfo(analysisDate)

    // 벤치마크 비교
    const ctrRatio = metrics.ctr / benchmark.avgCTR
    const cvrRatio = metrics.cvr / benchmark.avgCVR
    const overallScore = Math.round(((ctrRatio + cvrRatio) / 2) * 50) // 0-100 스케일

    // 성과 등급 결정
    const performanceGrade = this.determineGrade(ctrRatio, cvrRatio)

    // 인사이트 생성
    const insights = this.generateInsights(metrics, industry, benchmark, marketContext)

    // 시즌별 팁
    const seasonalTips = this.getSeasonalTips(industry, analysisDate)

    // 이벤트 이름 추출
    const eventNames = marketContext.events.map((e) => e.name)

    return {
      industry,
      metrics,
      performanceGrade,
      insights,
      benchmarkComparison: {
        ctrVsBenchmark: Math.round((ctrRatio - 1) * 100),
        cvrVsBenchmark: Math.round((cvrRatio - 1) * 100),
        overallScore: Math.min(100, Math.max(0, overallScore)),
      },
      marketContext: {
        isSpecialPeriod: marketContext.isSpecialDay,
        periodName: eventNames[0],
        seasonalTips,
      },
      recommendedPriority: this.prioritizeActions(insights),
    }
  }

  /**
   * 성과 등급 결정
   */
  private determineGrade(
    ctrRatio: number,
    cvrRatio: number
  ): AnalysisResult['performanceGrade'] {
    const avgRatio = (ctrRatio + cvrRatio) / 2

    if (avgRatio >= GRADE_THRESHOLDS.excellent) return 'excellent'
    if (avgRatio >= GRADE_THRESHOLDS.good) return 'good'
    if (avgRatio >= GRADE_THRESHOLDS.average) return 'average'
    if (avgRatio >= GRADE_THRESHOLDS.below_average) return 'below_average'
    return 'poor'
  }

  /**
   * 최적화 인사이트 생성
   */
  private generateInsights(
    metrics: CampaignMetrics,
    industry: Industry,
    benchmark: (typeof INDUSTRY_BENCHMARKS)[Industry],
    marketContext: ReturnType<KoreanMarketCalendar['getDateEventInfo']>
  ): OptimizationInsight[] {
    const insights: OptimizationInsight[] = []

    // 1. CTR 분석
    if (metrics.ctr < benchmark.avgCTR * 0.8) {
      insights.push(this.createCTRInsight(metrics, benchmark, industry))
    }

    // 2. CVR 분석
    if (metrics.cvr < benchmark.avgCVR * 0.8) {
      insights.push(this.createCVRInsight(metrics, benchmark, industry))
    }

    // 3. CPA 분석
    const industryCPA = this.getIndustryCPA(industry)
    if (metrics.cpa > industryCPA * 1.2) {
      insights.push(this.createCPAInsight(metrics, industryCPA, industry))
    }

    // 4. ROAS 분석
    if (metrics.roas < 1.5) {
      insights.push(this.createROASInsight(metrics, industry))
    }

    // 5. 시간대 최적화
    const currentHour = new Date().getHours()
    if (!benchmark.peakHours.includes(currentHour)) {
      insights.push(this.createTimingInsight(benchmark, industry))
    }

    // 6. 특수 기간 최적화
    if (marketContext.isSpecialDay) {
      insights.push(this.createSpecialPeriodInsight(marketContext, industry))
    }

    // 7. 예산 효율성 분석
    if (metrics.spend > 0 && metrics.conversions === 0) {
      insights.push(this.createBudgetEfficiencyInsight(metrics, industry))
    }

    // 우선순위로 정렬
    return insights.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }

  /**
   * CTR 인사이트 생성
   */
  private createCTRInsight(
    metrics: CampaignMetrics,
    benchmark: (typeof INDUSTRY_BENCHMARKS)[Industry],
    industry: Industry
  ): OptimizationInsight {
    const gap = benchmark.avgCTR - metrics.ctr
    const improvementPotential = (gap / metrics.ctr) * 100

    return {
      category: 'creative',
      priority: metrics.ctr < benchmark.avgCTR * 0.5 ? 'critical' : 'high',
      title: 'CTR 개선 필요',
      description: `현재 CTR ${metrics.ctr.toFixed(2)}%는 업종 평균 ${benchmark.avgCTR}%보다 낮습니다.`,
      currentValue: `${metrics.ctr.toFixed(2)}%`,
      targetValue: `${benchmark.avgCTR}%`,
      expectedImpact: {
        metric: 'CTR',
        improvement: Math.round(improvementPotential),
        unit: 'percent',
      },
      confidence: this.calculateConfidence(metrics.impressions, 1000),
      reasoning: [
        `업종 평균 대비 ${Math.round((1 - metrics.ctr / benchmark.avgCTR) * 100)}% 낮은 CTR`,
        `${industry} 업종 효과적인 키워드: ${benchmark.topKeywords.slice(0, 3).join(', ')}`,
        benchmark.characterTips.headline,
      ],
      actionItems: [
        '헤드라인에 숫자나 할인율 포함',
        '타겟 관심사 키워드 활용',
        'A/B 테스트로 크리에이티브 최적화',
      ],
    }
  }

  /**
   * CVR 인사이트 생성
   */
  private createCVRInsight(
    metrics: CampaignMetrics,
    benchmark: (typeof INDUSTRY_BENCHMARKS)[Industry],
    industry: Industry
  ): OptimizationInsight {
    return {
      category: 'targeting',
      priority: metrics.cvr < benchmark.avgCVR * 0.5 ? 'critical' : 'high',
      title: '전환율 개선 필요',
      description: `현재 CVR ${metrics.cvr.toFixed(2)}%는 업종 평균 ${benchmark.avgCVR}%보다 낮습니다.`,
      currentValue: `${metrics.cvr.toFixed(2)}%`,
      targetValue: `${benchmark.avgCVR}%`,
      expectedImpact: {
        metric: 'CVR',
        improvement: Math.round(((benchmark.avgCVR - metrics.cvr) / metrics.cvr) * 100),
        unit: 'percent',
      },
      confidence: this.calculateConfidence(metrics.clicks, 100),
      reasoning: [
        '클릭 후 이탈률이 높을 가능성',
        '랜딩 페이지와 광고 메시지 불일치 가능성',
        '타겟 오디언스 정밀도 점검 필요',
      ],
      actionItems: [
        '랜딩 페이지 로딩 속도 최적화',
        '광고-랜딩 페이지 메시지 일관성 확보',
        '유사 잠재고객 타겟팅 적용',
        '리타겟팅 캠페인 추가',
      ],
    }
  }

  /**
   * CPA 인사이트 생성
   */
  private createCPAInsight(
    metrics: CampaignMetrics,
    industryCPA: number,
    industry: Industry
  ): OptimizationInsight {
    return {
      category: 'budget',
      priority: metrics.cpa > industryCPA * 2 ? 'critical' : 'high',
      title: 'CPA 최적화 필요',
      description: `현재 CPA ₩${metrics.cpa.toLocaleString()}는 업종 기준 ₩${industryCPA.toLocaleString()}보다 높습니다.`,
      currentValue: `₩${metrics.cpa.toLocaleString()}`,
      targetValue: `₩${industryCPA.toLocaleString()}`,
      expectedImpact: {
        metric: 'CPA',
        improvement: Math.round(((metrics.cpa - industryCPA) / metrics.cpa) * 100),
        unit: 'percent',
      },
      confidence: this.calculateConfidence(metrics.conversions, 10),
      reasoning: [
        `목표 CPA 대비 ${Math.round((metrics.cpa / industryCPA - 1) * 100)}% 초과`,
        '전환 효율이 낮거나 경쟁이 치열한 상황',
        '입찰 전략 또는 예산 배분 점검 필요',
      ],
      actionItems: [
        '저성과 광고 세트 일시 중지',
        '전환 최적화 입찰 전략으로 전환',
        '일일 예산 재분배 (고성과 광고에 집중)',
        '타겟 오디언스 세분화',
      ],
    }
  }

  /**
   * ROAS 인사이트 생성
   */
  private createROASInsight(
    metrics: CampaignMetrics,
    industry: Industry
  ): OptimizationInsight {
    const targetROAS = this.getTargetROAS(industry)

    return {
      category: 'budget',
      priority: metrics.roas < 1 ? 'critical' : 'medium',
      title: 'ROAS 개선 필요',
      description: `현재 ROAS ${metrics.roas.toFixed(2)}x는 손익분기점 이하입니다.`,
      currentValue: `${metrics.roas.toFixed(2)}x`,
      targetValue: `${targetROAS}x`,
      expectedImpact: {
        metric: 'ROAS',
        improvement: targetROAS - metrics.roas,
        unit: 'multiplier',
      },
      confidence: this.calculateConfidence(metrics.conversions, 20),
      reasoning: [
        metrics.roas < 1 ? '광고비 대비 매출이 적자 상태' : '수익성 개선 여지 있음',
        '객단가 대비 CPA가 높을 가능성',
        '고가치 전환에 집중 필요',
      ],
      actionItems: [
        '고객 LTV 기반 입찰 최적화',
        '고가치 제품/서비스 중심 광고',
        '리타겟팅으로 재구매 유도',
        '카탈로그 광고 활용 (이커머스)',
      ],
    }
  }

  /**
   * 시간대 인사이트 생성
   */
  private createTimingInsight(
    benchmark: (typeof INDUSTRY_BENCHMARKS)[Industry],
    industry: Industry
  ): OptimizationInsight {
    const peakHoursStr = benchmark.peakHours.map((h) => `${h}시`).join(', ')

    return {
      category: 'timing',
      priority: 'medium',
      title: '광고 시간대 최적화',
      description: `${industry} 업종의 피크 타임에 예산을 집중하세요.`,
      currentValue: '전 시간대 균등 배분',
      targetValue: `피크 타임 집중 (${peakHoursStr})`,
      expectedImpact: {
        metric: 'CTR',
        improvement: 15,
        unit: 'percent',
      },
      confidence: 0.7,
      reasoning: [
        `${industry} 업종 피크 시간대: ${peakHoursStr}`,
        '피크 타임 예산 집중 시 효율 상승',
        '오프 피크 타임 예산 절감 가능',
      ],
      actionItems: [
        '광고 일정 설정에서 피크 타임 집중',
        '오프 피크 시간 입찰가 20-30% 낮춤',
        '주말/평일 성과 비교 분석',
      ],
    }
  }

  /**
   * 특수 기간 인사이트 생성
   */
  private createSpecialPeriodInsight(
    marketContext: ReturnType<KoreanMarketCalendar['getDateEventInfo']>,
    industry: Industry
  ): OptimizationInsight {
    const eventNames = marketContext.events.map((e) => e.name)
    const eventName = eventNames[0] || '특수 기간'

    return {
      category: 'creative',
      priority: 'high',
      title: `${eventName} 시즌 최적화`,
      description: `현재 ${eventName} 시즌입니다. 시즌 맞춤 크리에이티브를 활용하세요.`,
      currentValue: '일반 크리에이티브',
      targetValue: '시즌 맞춤 크리에이티브',
      expectedImpact: {
        metric: 'CTR',
        improvement: 25,
        unit: 'percent',
      },
      confidence: 0.8,
      reasoning: [
        `${eventName} 기간 소비자 구매 의향 상승`,
        '시즌 키워드 사용 시 관심도 증가',
        '한정 기간 프로모션 효과 극대화',
      ],
      actionItems: [
        `"${eventName}" 관련 키워드 헤드라인에 추가`,
        '긴급성/희소성 메시지 강화',
        '시즌 한정 혜택 강조',
        '예산 일시적 증액 고려',
      ],
    }
  }

  /**
   * 예산 효율성 인사이트 생성
   */
  private createBudgetEfficiencyInsight(
    metrics: CampaignMetrics,
    industry: Industry
  ): OptimizationInsight {
    return {
      category: 'budget',
      priority: 'critical',
      title: '전환 없이 예산 소진 중',
      description: `₩${metrics.spend.toLocaleString()} 지출 후에도 전환이 발생하지 않았습니다.`,
      currentValue: `₩${metrics.spend.toLocaleString()} / 0 전환`,
      targetValue: '예산 대비 전환 발생',
      expectedImpact: {
        metric: '전환',
        improvement: 100,
        unit: 'percent',
      },
      confidence: 0.9,
      reasoning: [
        '타겟 오디언스 또는 크리에이티브 문제 가능성 높음',
        '랜딩 페이지 또는 전환 추적 문제 점검 필요',
        '즉각적인 조치 필요',
      ],
      actionItems: [
        '캠페인 일시 중지 및 점검',
        '전환 픽셀 정상 작동 확인',
        '타겟 오디언스 재검토',
        '크리에이티브 전면 교체',
      ],
    }
  }

  /**
   * 신뢰도 계산 (샘플 크기 기반)
   */
  private calculateConfidence(sampleSize: number, minSampleSize: number): number {
    if (sampleSize < minSampleSize * 0.1) return 0.3
    if (sampleSize < minSampleSize * 0.5) return 0.5
    if (sampleSize < minSampleSize) return 0.7
    if (sampleSize < minSampleSize * 2) return 0.85
    return 0.95
  }

  /**
   * 업종별 CPA 기준값
   */
  private getIndustryCPA(industry: Industry): number {
    const cpaBenchmarks: Record<Industry, number> = {
      ecommerce: 15000,
      food_beverage: 8000,
      beauty: 12000,
      fashion: 18000,
      education: 50000,
      service: 30000,
      saas: 80000,
      health: 20000,
    }
    return cpaBenchmarks[industry]
  }

  /**
   * 업종별 타겟 ROAS
   */
  private getTargetROAS(industry: Industry): number {
    const roasTargets: Record<Industry, number> = {
      ecommerce: 3.0,
      food_beverage: 2.5,
      beauty: 2.8,
      fashion: 2.5,
      education: 2.0,
      service: 2.0,
      saas: 3.0,
      health: 2.5,
    }
    return roasTargets[industry]
  }

  /**
   * 시즌별 팁
   */
  private getSeasonalTips(industry: Industry, date: Date): string[] {
    const month = date.getMonth() + 1
    const tips: string[] = []

    // 공통 시즌 팁
    if (month === 12 || month === 1) {
      tips.push('연말연시 시즌: 선물/감사 메시지 활용')
      tips.push('새해 다짐 관련 프로모션 효과적')
    } else if (month === 2) {
      tips.push('설날 시즌: 가족/건강 메시지 활용')
    } else if (month >= 3 && month <= 5) {
      tips.push('봄 시즌: 새로움/시작 메시지 효과적')
    } else if (month >= 6 && month <= 8) {
      tips.push('여름 시즌: 휴가/시원함 관련 메시지')
    } else if (month >= 9 && month <= 11) {
      tips.push('가을 시즌: 추석/환절기 메시지 활용')
    }

    // 업종별 시즌 팁
    const industrySeasonalTips: Record<Industry, string[]> = {
      ecommerce: ['빼빼로데이(11/11), 블랙프라이데이 활용'],
      food_beverage: ['배달 성수기(주말, 저녁) 집중'],
      beauty: ['환절기 피부 관리 니즈 공략'],
      fashion: ['시즌 전환기 신상품 프로모션'],
      education: ['개강/방학 시즌 집중 공략'],
      service: ['연말 정산/봄맞이 대청소 시즌'],
      saas: ['분기말 예산 집행 시즌 공략'],
      health: ['새해/환절기 건강 관심 증가 시즌'],
    }

    tips.push(...(industrySeasonalTips[industry] || []))

    return tips
  }

  /**
   * 액션 우선순위 결정
   */
  private prioritizeActions(insights: OptimizationInsight[]): string[] {
    return insights
      .filter((i) => i.priority === 'critical' || i.priority === 'high')
      .slice(0, 3)
      .map((i) => i.actionItems[0])
  }
}
