/**
 * 경쟁사 벤치마킹 서비스
 *
 * 업종별 평균 성과 지표 비교 및 개선 우선순위 도출
 */

import type { Industry } from '@infrastructure/external/openai/prompts/adCopyGeneration'
import { INDUSTRY_BENCHMARKS } from '@infrastructure/external/openai/prompts/adCopyGeneration'

/**
 * 업종별 상세 벤치마크 데이터
 */
export interface IndustryBenchmark {
  industry: Industry
  metrics: {
    ctr: { min: number; avg: number; max: number; top10: number }
    cvr: { min: number; avg: number; max: number; top10: number }
    cpa: { min: number; avg: number; max: number; top10: number }
    roas: { min: number; avg: number; max: number; top10: number }
    cpc: { min: number; avg: number; max: number; top10: number }
  }
  seasonalMultipliers: {
    spring: number
    summer: number
    fall: number
    winter: number
  }
  peakHours: number[]
  weekendMultiplier: number
}

/**
 * 벤치마크 비교 결과
 */
export interface BenchmarkComparison {
  metric: 'ctr' | 'cvr' | 'cpa' | 'roas' | 'cpc'
  currentValue: number
  industryAvg: number
  industryTop10: number
  percentile: number // 0-100, 업계 내 위치
  gap: number // 업계 평균 대비 차이 (%)
  gapToTop10: number // 상위 10% 대비 차이 (%)
  status: 'excellent' | 'above_average' | 'average' | 'below_average' | 'poor'
  statusKo: string
}

/**
 * 개선 우선순위
 */
export interface ImprovementPriority {
  rank: number
  metric: 'ctr' | 'cvr' | 'cpa' | 'roas' | 'cpc'
  priority: 'critical' | 'high' | 'medium' | 'low'
  currentPercentile: number
  potentialImpact: number // 예상 매출 영향 (%)
  effort: 'low' | 'medium' | 'high'
  recommendations: string[]
  quickWins: string[]
}

/**
 * 전체 벤치마킹 보고서
 */
export interface BenchmarkReport {
  industry: Industry
  industryNameKo: string
  generatedAt: Date
  overallScore: number // 0-100
  overallGrade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F'
  comparisons: BenchmarkComparison[]
  priorities: ImprovementPriority[]
  summary: {
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
    threats: string[]
  }
  actionPlan: {
    immediate: string[] // 즉시 실행 (1주 이내)
    shortTerm: string[] // 단기 (1개월 이내)
    midTerm: string[] // 중기 (3개월 이내)
  }
}

/**
 * 캠페인 성과 입력
 */
export interface CampaignPerformance {
  ctr: number
  cvr: number
  cpa: number
  roas: number
  cpc: number
  spend: number
  revenue: number
}

/**
 * 업종별 상세 벤치마크 데이터베이스
 * 한국 광고 시장 기준 (2024년 데이터 기반)
 */
const DETAILED_BENCHMARKS: Record<Industry, IndustryBenchmark> = {
  ecommerce: {
    industry: 'ecommerce',
    metrics: {
      ctr: { min: 0.5, avg: 1.5, max: 4.0, top10: 3.2 },
      cvr: { min: 1.0, avg: 3.5, max: 8.0, top10: 6.5 },
      cpa: { min: 5000, avg: 15000, max: 40000, top10: 8000 },
      roas: { min: 1.5, avg: 3.5, max: 8.0, top10: 6.0 },
      cpc: { min: 200, avg: 500, max: 1500, top10: 350 },
    },
    seasonalMultipliers: { spring: 0.95, summer: 1.1, fall: 1.15, winter: 1.25 },
    peakHours: [10, 11, 14, 15, 21, 22],
    weekendMultiplier: 1.15,
  },
  food_beverage: {
    industry: 'food_beverage',
    metrics: {
      ctr: { min: 0.8, avg: 2.0, max: 5.0, top10: 4.0 },
      cvr: { min: 2.0, avg: 5.0, max: 12.0, top10: 9.5 },
      cpa: { min: 3000, avg: 10000, max: 25000, top10: 5000 },
      roas: { min: 2.0, avg: 4.5, max: 10.0, top10: 7.5 },
      cpc: { min: 150, avg: 400, max: 1000, top10: 280 },
    },
    seasonalMultipliers: { spring: 1.0, summer: 1.2, fall: 1.1, winter: 1.15 },
    peakHours: [11, 12, 17, 18, 19, 20],
    weekendMultiplier: 1.25,
  },
  beauty: {
    industry: 'beauty',
    metrics: {
      ctr: { min: 0.6, avg: 1.8, max: 4.5, top10: 3.5 },
      cvr: { min: 1.5, avg: 4.0, max: 9.0, top10: 7.0 },
      cpa: { min: 8000, avg: 20000, max: 50000, top10: 12000 },
      roas: { min: 1.8, avg: 4.0, max: 9.0, top10: 6.5 },
      cpc: { min: 250, avg: 600, max: 1800, top10: 420 },
    },
    seasonalMultipliers: { spring: 1.1, summer: 0.9, fall: 1.15, winter: 1.2 },
    peakHours: [10, 11, 20, 21, 22, 23],
    weekendMultiplier: 1.1,
  },
  fashion: {
    industry: 'fashion',
    metrics: {
      ctr: { min: 0.5, avg: 1.6, max: 4.0, top10: 3.0 },
      cvr: { min: 1.2, avg: 3.0, max: 7.0, top10: 5.5 },
      cpa: { min: 10000, avg: 25000, max: 60000, top10: 15000 },
      roas: { min: 1.5, avg: 3.2, max: 7.0, top10: 5.5 },
      cpc: { min: 300, avg: 700, max: 2000, top10: 500 },
    },
    seasonalMultipliers: { spring: 1.2, summer: 0.85, fall: 1.25, winter: 1.1 },
    peakHours: [10, 11, 13, 14, 21, 22],
    weekendMultiplier: 1.2,
  },
  education: {
    industry: 'education',
    metrics: {
      ctr: { min: 0.4, avg: 1.2, max: 3.0, top10: 2.4 },
      cvr: { min: 0.8, avg: 2.5, max: 6.0, top10: 4.5 },
      cpa: { min: 20000, avg: 50000, max: 150000, top10: 30000 },
      roas: { min: 1.2, avg: 2.5, max: 5.0, top10: 4.0 },
      cpc: { min: 400, avg: 1000, max: 3000, top10: 700 },
    },
    seasonalMultipliers: { spring: 1.3, summer: 0.7, fall: 1.2, winter: 1.0 },
    peakHours: [9, 10, 19, 20, 21, 22],
    weekendMultiplier: 0.85,
  },
  service: {
    industry: 'service',
    metrics: {
      ctr: { min: 0.5, avg: 1.4, max: 3.5, top10: 2.8 },
      cvr: { min: 1.0, avg: 3.0, max: 7.0, top10: 5.5 },
      cpa: { min: 15000, avg: 35000, max: 100000, top10: 22000 },
      roas: { min: 1.3, avg: 2.8, max: 6.0, top10: 4.5 },
      cpc: { min: 350, avg: 800, max: 2500, top10: 550 },
    },
    seasonalMultipliers: { spring: 1.0, summer: 0.95, fall: 1.05, winter: 1.0 },
    peakHours: [9, 10, 11, 14, 15, 16],
    weekendMultiplier: 0.7,
  },
  saas: {
    industry: 'saas',
    metrics: {
      ctr: { min: 0.3, avg: 1.0, max: 2.5, top10: 2.0 },
      cvr: { min: 0.5, avg: 2.0, max: 5.0, top10: 3.8 },
      cpa: { min: 30000, avg: 80000, max: 250000, top10: 50000 },
      roas: { min: 1.0, avg: 2.2, max: 5.0, top10: 3.8 },
      cpc: { min: 500, avg: 1200, max: 4000, top10: 850 },
    },
    seasonalMultipliers: { spring: 1.1, summer: 0.85, fall: 1.15, winter: 0.95 },
    peakHours: [9, 10, 11, 14, 15, 16],
    weekendMultiplier: 0.6,
  },
  health: {
    industry: 'health',
    metrics: {
      ctr: { min: 0.4, avg: 1.3, max: 3.2, top10: 2.5 },
      cvr: { min: 1.0, avg: 2.8, max: 6.5, top10: 5.0 },
      cpa: { min: 12000, avg: 30000, max: 80000, top10: 18000 },
      roas: { min: 1.4, avg: 3.0, max: 6.5, top10: 5.0 },
      cpc: { min: 300, avg: 750, max: 2200, top10: 520 },
    },
    seasonalMultipliers: { spring: 1.2, summer: 1.0, fall: 1.0, winter: 0.9 },
    peakHours: [7, 8, 9, 19, 20, 21],
    weekendMultiplier: 1.1,
  },
}

/**
 * 업종명 한국어 매핑
 */
const INDUSTRY_NAMES_KO: Record<Industry, string> = {
  ecommerce: '이커머스',
  food_beverage: '식품/음료',
  beauty: '뷰티/화장품',
  fashion: '패션/의류',
  education: '교육',
  service: '서비스',
  saas: 'SaaS/B2B',
  health: '건강/웰니스',
}

/**
 * 경쟁사 벤치마킹 서비스
 */
export class CompetitorBenchmarkService {
  /**
   * 업종별 벤치마크 데이터 조회
   */
  getBenchmark(industry: Industry): IndustryBenchmark {
    return DETAILED_BENCHMARKS[industry]
  }

  /**
   * 모든 업종 벤치마크 조회
   */
  getAllBenchmarks(): Record<Industry, IndustryBenchmark> {
    return { ...DETAILED_BENCHMARKS }
  }

  /**
   * 캠페인 성과와 업종 벤치마크 비교
   */
  compare(performance: CampaignPerformance, industry: Industry): BenchmarkComparison[] {
    const benchmark = DETAILED_BENCHMARKS[industry]
    const metrics: Array<'ctr' | 'cvr' | 'cpa' | 'roas' | 'cpc'> = ['ctr', 'cvr', 'cpa', 'roas', 'cpc']

    return metrics.map((metric) => {
      const current = performance[metric]
      const benchmarkData = benchmark.metrics[metric]

      // CPA, CPC는 낮을수록 좋음 (역방향 계산)
      const isLowerBetter = metric === 'cpa' || metric === 'cpc'

      const percentile = this.calculatePercentile(current, benchmarkData, isLowerBetter)
      const gap = this.calculateGap(current, benchmarkData.avg, isLowerBetter)
      const gapToTop10 = this.calculateGap(current, benchmarkData.top10, isLowerBetter)
      const status = this.determineStatus(percentile)

      return {
        metric,
        currentValue: current,
        industryAvg: benchmarkData.avg,
        industryTop10: benchmarkData.top10,
        percentile,
        gap,
        gapToTop10,
        status,
        statusKo: this.getStatusKo(status),
      }
    })
  }

  /**
   * 개선 우선순위 도출
   */
  getPriorities(performance: CampaignPerformance, industry: Industry): ImprovementPriority[] {
    const comparisons = this.compare(performance, industry)

    // 점수가 낮은 순으로 정렬 (개선이 필요한 순)
    const sorted = [...comparisons].sort((a, b) => a.percentile - b.percentile)

    return sorted.map((comparison, index) => {
      const priority = this.determinePriority(comparison.percentile)
      const effort = this.estimateEffort(comparison.metric)
      const potentialImpact = this.estimatePotentialImpact(comparison, performance)

      return {
        rank: index + 1,
        metric: comparison.metric,
        priority,
        currentPercentile: comparison.percentile,
        potentialImpact,
        effort,
        recommendations: this.getRecommendations(comparison.metric, comparison.status, industry),
        quickWins: this.getQuickWins(comparison.metric, industry),
      }
    })
  }

  /**
   * 전체 벤치마킹 보고서 생성
   */
  generateReport(performance: CampaignPerformance, industry: Industry): BenchmarkReport {
    const comparisons = this.compare(performance, industry)
    const priorities = this.getPriorities(performance, industry)

    const overallScore = this.calculateOverallScore(comparisons)
    const overallGrade = this.determineGrade(overallScore)
    const summary = this.generateSWOT(comparisons, industry)
    const actionPlan = this.generateActionPlan(priorities, industry)

    return {
      industry,
      industryNameKo: INDUSTRY_NAMES_KO[industry],
      generatedAt: new Date(),
      overallScore,
      overallGrade,
      comparisons,
      priorities,
      summary,
      actionPlan,
    }
  }

  /**
   * 업종 평균 대비 성과 요약
   */
  getPerformanceSummary(performance: CampaignPerformance, industry: Industry): string {
    const report = this.generateReport(performance, industry)

    const strengths = report.comparisons.filter((c) => c.percentile >= 70).map((c) => c.metric)
    const weaknesses = report.comparisons.filter((c) => c.percentile < 30).map((c) => c.metric)

    let summary = `[${report.industryNameKo}] 종합 등급: ${report.overallGrade} (${report.overallScore}점)\n`

    if (strengths.length > 0) {
      summary += `✅ 강점: ${strengths.join(', ')} (업계 상위)\n`
    }
    if (weaknesses.length > 0) {
      summary += `⚠️ 개선필요: ${weaknesses.join(', ')} (업계 하위)\n`
    }

    const topPriority = report.priorities[0]
    if (topPriority) {
      summary += `🎯 최우선 과제: ${topPriority.metric} 개선 (예상 효과: +${topPriority.potentialImpact.toFixed(1)}%)`
    }

    return summary
  }

  /**
   * 시즌별 조정 계수 조회
   */
  getSeasonalMultiplier(
    industry: Industry,
    season: 'spring' | 'summer' | 'fall' | 'winter'
  ): number {
    return DETAILED_BENCHMARKS[industry].seasonalMultipliers[season]
  }

  /**
   * 피크 시간대 조회
   */
  getPeakHours(industry: Industry): number[] {
    return DETAILED_BENCHMARKS[industry].peakHours
  }

  // ============ Private Methods ============

  private calculatePercentile(
    value: number,
    benchmark: { min: number; avg: number; max: number; top10: number },
    isLowerBetter: boolean
  ): number {
    if (isLowerBetter) {
      // CPA, CPC: 낮을수록 좋음
      if (value <= benchmark.top10) return 95
      if (value <= benchmark.avg) return 50 + ((benchmark.avg - value) / (benchmark.avg - benchmark.top10)) * 45
      if (value <= benchmark.max) return 10 + ((benchmark.max - value) / (benchmark.max - benchmark.avg)) * 40
      return 5
    } else {
      // CTR, CVR, ROAS: 높을수록 좋음
      if (value >= benchmark.top10) return 95
      if (value >= benchmark.avg) return 50 + ((value - benchmark.avg) / (benchmark.top10 - benchmark.avg)) * 45
      if (value >= benchmark.min) return 10 + ((value - benchmark.min) / (benchmark.avg - benchmark.min)) * 40
      return 5
    }
  }

  private calculateGap(current: number, target: number, isLowerBetter: boolean): number {
    if (target === 0) return 0
    const gap = ((current - target) / target) * 100
    return isLowerBetter ? -gap : gap
  }

  private determineStatus(
    percentile: number
  ): 'excellent' | 'above_average' | 'average' | 'below_average' | 'poor' {
    if (percentile >= 80) return 'excellent'
    if (percentile >= 60) return 'above_average'
    if (percentile >= 40) return 'average'
    if (percentile >= 20) return 'below_average'
    return 'poor'
  }

  private getStatusKo(
    status: 'excellent' | 'above_average' | 'average' | 'below_average' | 'poor'
  ): string {
    const statusMap = {
      excellent: '우수',
      above_average: '평균 이상',
      average: '평균',
      below_average: '평균 이하',
      poor: '개선 필요',
    }
    return statusMap[status]
  }

  private determinePriority(percentile: number): 'critical' | 'high' | 'medium' | 'low' {
    if (percentile < 20) return 'critical'
    if (percentile < 40) return 'high'
    if (percentile < 60) return 'medium'
    return 'low'
  }

  private estimateEffort(metric: 'ctr' | 'cvr' | 'cpa' | 'roas' | 'cpc'): 'low' | 'medium' | 'high' {
    const effortMap: Record<typeof metric, 'low' | 'medium' | 'high'> = {
      ctr: 'low', // 크리에이티브 변경으로 빠른 개선 가능
      cpc: 'low', // 입찰 조정으로 빠른 개선 가능
      cvr: 'medium', // 랜딩페이지, 상품 페이지 개선 필요
      cpa: 'medium', // 타겟팅, 크리에이티브 종합 개선
      roas: 'high', // 전체 퍼널 최적화 필요
    }
    return effortMap[metric]
  }

  private estimatePotentialImpact(
    comparison: BenchmarkComparison,
    performance: CampaignPerformance
  ): number {
    // 업계 평균까지 개선했을 때 예상 매출 영향
    const gap = Math.abs(comparison.gapToTop10)
    const weightMap = { ctr: 0.2, cvr: 0.3, cpa: 0.15, roas: 0.25, cpc: 0.1 }
    return gap * (weightMap[comparison.metric] || 0.1)
  }

  private calculateOverallScore(comparisons: BenchmarkComparison[]): number {
    // 가중 평균 (ROAS, CVR 가중치 높음)
    const weights = { ctr: 0.15, cvr: 0.25, cpa: 0.2, roas: 0.3, cpc: 0.1 }
    let totalWeight = 0
    let weightedSum = 0

    for (const comparison of comparisons) {
      const weight = weights[comparison.metric] || 0.1
      weightedSum += comparison.percentile * weight
      totalWeight += weight
    }

    return Math.round(weightedSum / totalWeight)
  }

  private determineGrade(score: number): 'S' | 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'S'
    if (score >= 80) return 'A'
    if (score >= 70) return 'B'
    if (score >= 60) return 'C'
    if (score >= 50) return 'D'
    return 'F'
  }

  private generateSWOT(
    comparisons: BenchmarkComparison[],
    industry: Industry
  ): BenchmarkReport['summary'] {
    const strengths: string[] = []
    const weaknesses: string[] = []
    const opportunities: string[] = []
    const threats: string[] = []

    for (const c of comparisons) {
      if (c.percentile >= 70) {
        strengths.push(`${c.metric.toUpperCase()} ${c.statusKo} (상위 ${Math.round(100 - c.percentile)}%)`)
      } else if (c.percentile < 30) {
        weaknesses.push(`${c.metric.toUpperCase()} ${c.statusKo} (하위 ${Math.round(c.percentile)}%)`)
      }
    }

    // 업종별 기회 요인
    const benchmark = DETAILED_BENCHMARKS[industry]
    const currentSeason = this.getCurrentSeason()
    const seasonMultiplier = benchmark.seasonalMultipliers[currentSeason]

    if (seasonMultiplier >= 1.1) {
      opportunities.push(`현재 시즌(${this.getSeasonKo(currentSeason)}) 성수기 - 광고 효율 상승 기대`)
    }

    opportunities.push(`피크 타임(${benchmark.peakHours.join(', ')}시) 집중 운영 권장`)

    // 위협 요인
    if (seasonMultiplier < 0.9) {
      threats.push(`현재 시즌(${this.getSeasonKo(currentSeason)}) 비수기 - 경쟁 심화 예상`)
    }

    const weakMetrics = comparisons.filter((c) => c.percentile < 40)
    if (weakMetrics.length >= 2) {
      threats.push('복수 지표 부진 - 종합적 캠페인 점검 필요')
    }

    return { strengths, weaknesses, opportunities, threats }
  }

  private generateActionPlan(
    priorities: ImprovementPriority[],
    _industry: Industry
  ): BenchmarkReport['actionPlan'] {
    const immediate: string[] = []
    const shortTerm: string[] = []
    const midTerm: string[] = []

    for (const priority of priorities.slice(0, 3)) {
      // 상위 3개 우선순위만
      if (priority.effort === 'low') {
        immediate.push(...priority.quickWins.slice(0, 2))
      } else if (priority.effort === 'medium') {
        shortTerm.push(...priority.recommendations.slice(0, 2))
      } else {
        midTerm.push(...priority.recommendations.slice(0, 2))
      }
    }

    return {
      immediate: immediate.slice(0, 3),
      shortTerm: shortTerm.slice(0, 3),
      midTerm: midTerm.slice(0, 3),
    }
  }

  private getRecommendations(
    metric: 'ctr' | 'cvr' | 'cpa' | 'roas' | 'cpc',
    _status: string,
    _industry: Industry
  ): string[] {
    const recommendations: Record<typeof metric, string[]> = {
      ctr: [
        '광고 크리에이티브 A/B 테스트 실시',
        '타겟 오디언스 세그먼트 재검토',
        '광고 문구 후크 다양화 (혜택, 긴급성, 사회적 증거)',
        '이미지/영상 품질 개선',
      ],
      cvr: [
        '랜딩페이지 로딩 속도 최적화',
        '전환 퍼널 단계 간소화',
        '상품 페이지 신뢰 요소 강화',
        '모바일 UX 개선',
      ],
      cpa: [
        '저성과 광고 세트 중단',
        '유사 타겟 확장 테스트',
        '리타겟팅 캠페인 강화',
        '전환 이벤트 최적화',
      ],
      roas: [
        '고객 생애 가치(LTV) 기반 타겟팅',
        '상향 판매/교차 판매 캠페인 추가',
        '수익성 높은 상품 광고 집중',
        '전체 마케팅 퍼널 최적화',
      ],
      cpc: [
        '입찰 전략 조정 (자동 → 수동 또는 반대)',
        '품질 점수 개선을 위한 관련성 향상',
        '경쟁 키워드 분석 및 롱테일 키워드 발굴',
        '게재 위치 최적화',
      ],
    }
    return recommendations[metric] || []
  }

  private getQuickWins(metric: 'ctr' | 'cvr' | 'cpa' | 'roas' | 'cpc', _industry: Industry): string[] {
    const quickWins: Record<typeof metric, string[]> = {
      ctr: ['눈에 띄는 CTA 버튼 색상 변경', '숫자/할인율 강조 문구 추가'],
      cvr: ['긴급성 메시지 추가 (재고 한정, 시간 제한)', '리뷰/평점 노출 강화'],
      cpa: ['저성과 키워드/타겟 일시 중지', '예산을 고성과 광고로 재배분'],
      roas: ['평균 주문 금액(AOV) 높은 상품 광고 강화', '할인 쿠폰 전략 조정'],
      cpc: ['야간 시간대 입찰 감소', '모바일/데스크톱 입찰 분리 조정'],
    }
    return quickWins[metric] || []
  }

  private getCurrentSeason(): 'spring' | 'summer' | 'fall' | 'winter' {
    const month = new Date().getMonth() + 1
    if (month >= 3 && month <= 5) return 'spring'
    if (month >= 6 && month <= 8) return 'summer'
    if (month >= 9 && month <= 11) return 'fall'
    return 'winter'
  }

  private getSeasonKo(season: 'spring' | 'summer' | 'fall' | 'winter'): string {
    const seasonMap = { spring: '봄', summer: '여름', fall: '가을', winter: '겨울' }
    return seasonMap[season]
  }
}
