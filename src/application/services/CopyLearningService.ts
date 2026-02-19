/**
 * CopyLearningService - 광고 카피 성과 학습 서비스
 *
 * 과거 성공 카피 패턴을 분석하고 업종/시즌별 최적 카피 스타일을 학습하여
 * 새로운 카피 생성 시 인사이트를 제공합니다.
 */

import type { CopyHookType, Industry } from '@domain/value-objects/Industry'
import { INDUSTRY_BENCHMARKS } from '@domain/value-objects/Industry'
import { KoreanMarketCalendar } from '@domain/value-objects/KoreanMarketCalendar'

/**
 * 카피 성과 데이터
 */
export interface CopyPerformanceData {
  id: string
  userId: string
  campaignId: string
  industry: Industry
  hook: CopyHookType
  headline: string
  primaryText: string
  description: string
  cta: string
  impressions: number
  clicks: number
  conversions: number
  spend: number
  revenue: number
  createdAt: Date
  endedAt?: Date
}

/**
 * 학습된 패턴
 */
export interface LearnedPattern {
  hook: CopyHookType
  avgCTR: number
  avgCVR: number
  avgROAS: number
  sampleSize: number
  confidence: number // 0-1, 샘플 크기 기반 신뢰도
  topKeywords: string[]
  optimalCharacterCounts: {
    headline: { min: number; max: number; optimal: number }
    primaryText: { min: number; max: number; optimal: number }
    description: { min: number; max: number; optimal: number }
  }
}

/**
 * 시즌별 패턴
 */
export interface SeasonalPattern {
  season: 'spring' | 'summer' | 'fall' | 'winter'
  bestHooks: CopyHookType[]
  avgCTRMultiplier: number // 평소 대비 CTR 배수
  recommendedKeywords: string[]
  avoidKeywords: string[]
}

/**
 * 학습 결과 리포트
 */
export interface LearningReport {
  industry: Industry
  totalSamples: number
  dateRange: { start: Date; end: Date }
  overallInsights: {
    bestPerformingHook: CopyHookType
    worstPerformingHook: CopyHookType
    avgCTR: number
    avgCVR: number
    avgROAS: number
  }
  hookPatterns: Record<CopyHookType, LearnedPattern | null>
  seasonalPatterns: SeasonalPattern[]
  recommendations: CopyRecommendation[]
}

/**
 * 카피 추천
 */
export interface CopyRecommendation {
  type: 'hook' | 'keyword' | 'length' | 'timing' | 'cta'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  expectedImpact: string
  basedOn: string // 추천 근거
}

/**
 * 카피 생성 힌트
 */
export interface CopyGenerationHint {
  industry: Industry
  currentSeason: string
  isSpecialPeriod: boolean
  specialPeriodName?: string
  recommendedHooks: Array<{
    hook: CopyHookType
    reason: string
    expectedCTR: number
    confidence: number
  }>
  avoidHooks: Array<{
    hook: CopyHookType
    reason: string
  }>
  keywordSuggestions: string[]
  characterGuidelines: {
    headline: string
    primaryText: string
    description: string
  }
  timingAdvice: string
  ctaRecommendations: string[]
}

/**
 * 최소 샘플 크기 (통계적 유의성)
 */
const MIN_SAMPLE_SIZE = 10
const HIGH_CONFIDENCE_SAMPLE_SIZE = 50

/**
 * 신뢰도 계산
 */
function calculateConfidence(sampleSize: number): number {
  if (sampleSize < MIN_SAMPLE_SIZE) return 0
  if (sampleSize >= HIGH_CONFIDENCE_SAMPLE_SIZE) return 1
  return (sampleSize - MIN_SAMPLE_SIZE) / (HIGH_CONFIDENCE_SAMPLE_SIZE - MIN_SAMPLE_SIZE)
}

/**
 * 시즌 판별
 */
function getSeason(date: Date): 'spring' | 'summer' | 'fall' | 'winter' {
  const month = date.getMonth() + 1
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'fall'
  return 'winter'
}

/**
 * 카피 성과 학습 서비스
 */
export class CopyLearningService {
  private performanceCache: Map<string, CopyPerformanceData[]> = new Map()
  private patternCache: Map<string, LearningReport> = new Map()
  private cacheExpiry: number = 1000 * 60 * 60 // 1시간

  /**
   * 성과 데이터 분석 및 패턴 학습
   */
  analyzePerformance(
    performanceData: CopyPerformanceData[],
    industry: Industry
  ): LearningReport {
    const cacheKey = `${industry}_${performanceData.length}`
    const cached = this.patternCache.get(cacheKey)
    if (cached) return cached

    // 업종별 필터링
    const industryData = performanceData.filter((d) => d.industry === industry)

    if (industryData.length === 0) {
      return this.createEmptyReport(industry)
    }

    // 날짜 범위 계산
    const dates = industryData.map((d) => d.createdAt.getTime())
    const dateRange = {
      start: new Date(Math.min(...dates)),
      end: new Date(Math.max(...dates)),
    }

    // 훅별 패턴 분석
    const hookPatterns = this.analyzeHookPatterns(industryData)

    // 시즌별 패턴 분석
    const seasonalPatterns = this.analyzeSeasonalPatterns(industryData)

    // 전체 인사이트 계산
    const overallInsights = this.calculateOverallInsights(industryData, hookPatterns)

    // 추천 생성
    const recommendations = this.generateRecommendations(
      industry,
      hookPatterns,
      seasonalPatterns,
      overallInsights
    )

    const report: LearningReport = {
      industry,
      totalSamples: industryData.length,
      dateRange,
      overallInsights,
      hookPatterns,
      seasonalPatterns,
      recommendations,
    }

    this.patternCache.set(cacheKey, report)
    return report
  }

  /**
   * 훅별 패턴 분석
   */
  private analyzeHookPatterns(
    data: CopyPerformanceData[]
  ): Record<CopyHookType, LearnedPattern | null> {
    const hooks: CopyHookType[] = [
      'benefit',
      'urgency',
      'social_proof',
      'curiosity',
      'fear_of_missing',
      'authority',
      'emotional',
    ]

    const result: Record<CopyHookType, LearnedPattern | null> = {} as Record<
      CopyHookType,
      LearnedPattern | null
    >

    for (const hook of hooks) {
      const hookData = data.filter((d) => d.hook === hook)

      if (hookData.length < MIN_SAMPLE_SIZE) {
        result[hook] = null
        continue
      }

      // 성과 지표 계산
      const totalImpressions = hookData.reduce((sum, d) => sum + d.impressions, 0)
      const totalClicks = hookData.reduce((sum, d) => sum + d.clicks, 0)
      const totalConversions = hookData.reduce((sum, d) => sum + d.conversions, 0)
      const totalSpend = hookData.reduce((sum, d) => sum + d.spend, 0)
      const totalRevenue = hookData.reduce((sum, d) => sum + d.revenue, 0)

      const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
      const avgCVR = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0
      const avgROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0

      // 키워드 분석 (간단한 빈도 분석)
      const topKeywords = this.extractTopKeywords(hookData)

      // 글자 수 분석
      const optimalCharacterCounts = this.analyzeCharacterCounts(hookData)

      result[hook] = {
        hook,
        avgCTR,
        avgCVR,
        avgROAS,
        sampleSize: hookData.length,
        confidence: calculateConfidence(hookData.length),
        topKeywords,
        optimalCharacterCounts,
      }
    }

    return result
  }

  /**
   * 시즌별 패턴 분석
   */
  private analyzeSeasonalPatterns(data: CopyPerformanceData[]): SeasonalPattern[] {
    const seasons: Array<'spring' | 'summer' | 'fall' | 'winter'> = [
      'spring',
      'summer',
      'fall',
      'winter',
    ]
    const patterns: SeasonalPattern[] = []

    // 전체 평균 CTR
    const totalImpressions = data.reduce((sum, d) => sum + d.impressions, 0)
    const totalClicks = data.reduce((sum, d) => sum + d.clicks, 0)
    const overallCTR = totalImpressions > 0 ? totalClicks / totalImpressions : 0

    for (const season of seasons) {
      const seasonData = data.filter((d) => getSeason(d.createdAt) === season)

      if (seasonData.length < MIN_SAMPLE_SIZE) {
        // 기본 패턴 제공
        patterns.push(this.getDefaultSeasonalPattern(season))
        continue
      }

      // 시즌 CTR 계산
      const seasonImpressions = seasonData.reduce((sum, d) => sum + d.impressions, 0)
      const seasonClicks = seasonData.reduce((sum, d) => sum + d.clicks, 0)
      const seasonCTR = seasonImpressions > 0 ? seasonClicks / seasonImpressions : 0

      // 훅별 성과 분석
      const hookPerformance = this.analyzeHookPerformanceForSeason(seasonData)
      const bestHooks = hookPerformance
        .filter((h) => h.ctr > seasonCTR)
        .sort((a, b) => b.ctr - a.ctr)
        .slice(0, 3)
        .map((h) => h.hook)

      patterns.push({
        season,
        bestHooks: bestHooks.length > 0 ? bestHooks : this.getDefaultSeasonalPattern(season).bestHooks,
        avgCTRMultiplier: overallCTR > 0 ? seasonCTR / overallCTR : 1,
        recommendedKeywords: this.extractTopKeywords(seasonData),
        avoidKeywords: [], // 추후 구현: 성과 낮은 키워드 분석
      })
    }

    return patterns
  }

  /**
   * 훅별 성과 분석 (시즌용)
   */
  private analyzeHookPerformanceForSeason(
    data: CopyPerformanceData[]
  ): Array<{ hook: CopyHookType; ctr: number }> {
    const hooks: CopyHookType[] = [
      'benefit',
      'urgency',
      'social_proof',
      'curiosity',
      'fear_of_missing',
      'authority',
      'emotional',
    ]

    return hooks.map((hook) => {
      const hookData = data.filter((d) => d.hook === hook)
      const impressions = hookData.reduce((sum, d) => sum + d.impressions, 0)
      const clicks = hookData.reduce((sum, d) => sum + d.clicks, 0)
      return {
        hook,
        ctr: impressions > 0 ? clicks / impressions : 0,
      }
    })
  }

  /**
   * 기본 시즌별 패턴
   */
  private getDefaultSeasonalPattern(season: 'spring' | 'summer' | 'fall' | 'winter'): SeasonalPattern {
    const patterns: Record<typeof season, SeasonalPattern> = {
      spring: {
        season: 'spring',
        bestHooks: ['benefit', 'curiosity', 'emotional'],
        avgCTRMultiplier: 1.0,
        recommendedKeywords: ['새로운', '시작', '봄맞이', '리뉴얼', '신상품'],
        avoidKeywords: [],
      },
      summer: {
        season: 'summer',
        bestHooks: ['urgency', 'benefit', 'fear_of_missing'],
        avgCTRMultiplier: 0.95,
        recommendedKeywords: ['시원한', '여름', '휴가', '특가', '쿨링'],
        avoidKeywords: [],
      },
      fall: {
        season: 'fall',
        bestHooks: ['social_proof', 'authority', 'benefit'],
        avgCTRMultiplier: 1.05,
        recommendedKeywords: ['가을', '준비', '환절기', '신상', '트렌드'],
        avoidKeywords: [],
      },
      winter: {
        season: 'winter',
        bestHooks: ['urgency', 'fear_of_missing', 'emotional'],
        avgCTRMultiplier: 1.15,
        recommendedKeywords: ['연말', '크리스마스', '신년', '선물', '따뜻한'],
        avoidKeywords: [],
      },
    }
    return patterns[season]
  }

  /**
   * 상위 키워드 추출
   */
  private extractTopKeywords(data: CopyPerformanceData[]): string[] {
    const keywordCounts = new Map<string, { count: number; totalCTR: number }>()

    // 한국어 키워드 추출을 위한 간단한 패턴
    const koreanWordPattern = /[가-힣]{2,}/g

    for (const item of data) {
      const text = `${item.headline} ${item.primaryText} ${item.description}`
      const words = text.match(koreanWordPattern) || []
      const ctr = item.impressions > 0 ? item.clicks / item.impressions : 0

      for (const word of words) {
        const existing = keywordCounts.get(word) || { count: 0, totalCTR: 0 }
        keywordCounts.set(word, {
          count: existing.count + 1,
          totalCTR: existing.totalCTR + ctr,
        })
      }
    }

    // 빈도와 CTR을 조합한 점수로 정렬
    const scored = Array.from(keywordCounts.entries())
      .filter(([_word, stats]) => stats.count >= 3) // 최소 3회 이상 사용
      .map(([word, stats]) => ({
        word,
        score: stats.count * (stats.totalCTR / stats.count),
      }))
      .sort((a, b) => b.score - a.score)

    return scored.slice(0, 10).map((s) => s.word)
  }

  /**
   * 글자 수 분석
   */
  private analyzeCharacterCounts(data: CopyPerformanceData[]): LearnedPattern['optimalCharacterCounts'] {
    // 성과 상위 25% 데이터 분석
    const sortedByCTR = [...data].sort((a, b) => {
      const ctrA = a.impressions > 0 ? a.clicks / a.impressions : 0
      const ctrB = b.impressions > 0 ? b.clicks / b.impressions : 0
      return ctrB - ctrA
    })

    const topPerformers = sortedByCTR.slice(0, Math.max(1, Math.floor(data.length * 0.25)))

    const headlineLengths = topPerformers.map((d) => d.headline.length)
    const primaryTextLengths = topPerformers.map((d) => d.primaryText.length)
    const descriptionLengths = topPerformers.map((d) => d.description.length)

    return {
      headline: {
        min: Math.min(...headlineLengths),
        max: Math.max(...headlineLengths),
        optimal: Math.round(headlineLengths.reduce((a, b) => a + b, 0) / headlineLengths.length),
      },
      primaryText: {
        min: Math.min(...primaryTextLengths),
        max: Math.max(...primaryTextLengths),
        optimal: Math.round(primaryTextLengths.reduce((a, b) => a + b, 0) / primaryTextLengths.length),
      },
      description: {
        min: Math.min(...descriptionLengths),
        max: Math.max(...descriptionLengths),
        optimal: Math.round(descriptionLengths.reduce((a, b) => a + b, 0) / descriptionLengths.length),
      },
    }
  }

  /**
   * 전체 인사이트 계산
   */
  private calculateOverallInsights(
    data: CopyPerformanceData[],
    hookPatterns: Record<CopyHookType, LearnedPattern | null>
  ): LearningReport['overallInsights'] {
    // 전체 성과 계산
    const totalImpressions = data.reduce((sum, d) => sum + d.impressions, 0)
    const totalClicks = data.reduce((sum, d) => sum + d.clicks, 0)
    const totalConversions = data.reduce((sum, d) => sum + d.conversions, 0)
    const totalSpend = data.reduce((sum, d) => sum + d.spend, 0)
    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0)

    // 최고/최저 훅 찾기
    const validPatterns = Object.entries(hookPatterns)
      .filter(([_hook, pattern]) => pattern !== null && pattern.sampleSize >= MIN_SAMPLE_SIZE)
      .map(([hook, pattern]) => ({ hook: hook as CopyHookType, pattern: pattern! }))

    let bestPerformingHook: CopyHookType = 'benefit'
    let worstPerformingHook: CopyHookType = 'benefit'

    if (validPatterns.length > 0) {
      const sortedByROAS = validPatterns.sort((a, b) => b.pattern.avgROAS - a.pattern.avgROAS)
      bestPerformingHook = sortedByROAS[0].hook
      worstPerformingHook = sortedByROAS[sortedByROAS.length - 1].hook
    }

    return {
      bestPerformingHook,
      worstPerformingHook,
      avgCTR: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      avgCVR: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
      avgROAS: totalSpend > 0 ? totalRevenue / totalSpend : 0,
    }
  }

  /**
   * 추천 생성
   */
  private generateRecommendations(
    industry: Industry,
    hookPatterns: Record<CopyHookType, LearnedPattern | null>,
    seasonalPatterns: SeasonalPattern[],
    overallInsights: LearningReport['overallInsights']
  ): CopyRecommendation[] {
    const recommendations: CopyRecommendation[] = []
    const benchmark = INDUSTRY_BENCHMARKS[industry]

    // 1. 훅 추천
    const bestHook = overallInsights.bestPerformingHook
    const bestPattern = hookPatterns[bestHook]
    if (bestPattern && bestPattern.confidence > 0.5) {
      recommendations.push({
        type: 'hook',
        priority: 'high',
        title: `"${this.getHookNameKorean(bestHook)}" 훅 적극 활용`,
        description: `분석 결과, ${this.getHookNameKorean(bestHook)} 훅이 가장 높은 ROAS(${bestPattern.avgROAS.toFixed(2)})를 기록했습니다.`,
        expectedImpact: `CTR ${(bestPattern.avgCTR - overallInsights.avgCTR).toFixed(2)}%p 상승 예상`,
        basedOn: `${bestPattern.sampleSize}개 샘플 분석 (신뢰도: ${(bestPattern.confidence * 100).toFixed(0)}%)`,
      })
    }

    // 2. 벤치마크 대비 분석
    if (overallInsights.avgCTR < benchmark.avgCTR) {
      recommendations.push({
        type: 'hook',
        priority: 'high',
        title: '업종 평균 CTR 미달',
        description: `현재 CTR ${overallInsights.avgCTR.toFixed(2)}%는 업종 평균 ${benchmark.avgCTR}%보다 낮습니다. ${benchmark.bestPerformingHooks.join(', ')} 훅 테스트를 권장합니다.`,
        expectedImpact: `CTR ${(benchmark.avgCTR - overallInsights.avgCTR).toFixed(2)}%p 상승 가능`,
        basedOn: `${industry} 업종 벤치마크 기준`,
      })
    }

    // 3. 시즌별 추천
    const currentSeason = getSeason(new Date())
    const currentSeasonPattern = seasonalPatterns.find((p) => p.season === currentSeason)
    if (currentSeasonPattern && currentSeasonPattern.recommendedKeywords.length > 0) {
      recommendations.push({
        type: 'keyword',
        priority: 'medium',
        title: `${this.getSeasonNameKorean(currentSeason)} 시즌 키워드 활용`,
        description: `현재 시즌에 효과적인 키워드: ${currentSeasonPattern.recommendedKeywords.slice(0, 5).join(', ')}`,
        expectedImpact: `CTR ${((currentSeasonPattern.avgCTRMultiplier - 1) * 100).toFixed(1)}% 변동 예상`,
        basedOn: '시즌별 성과 데이터 분석',
      })
    }

    // 4. 글자 수 최적화 추천
    if (bestPattern?.optimalCharacterCounts) {
      const charCounts = bestPattern.optimalCharacterCounts
      recommendations.push({
        type: 'length',
        priority: 'medium',
        title: '최적 글자 수 가이드',
        description: `헤드라인 ${charCounts.headline.optimal}자, 본문 ${charCounts.primaryText.optimal}자, 설명 ${charCounts.description.optimal}자가 최적입니다.`,
        expectedImpact: '읽기 편의성 및 전환율 향상',
        basedOn: '성과 상위 25% 카피 분석',
      })
    }

    // 5. CTA 추천
    recommendations.push({
      type: 'cta',
      priority: 'low',
      title: '효과적인 CTA 문구',
      description: `${industry} 업종에서 효과적인 CTA: ${benchmark.topKeywords.slice(0, 3).join(', ')} 관련 액션 유도`,
      expectedImpact: 'CVR 개선 기대',
      basedOn: '업종 벤치마크 데이터',
    })

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }

  /**
   * 카피 생성 힌트 제공
   */
  getGenerationHints(
    industry: Industry,
    performanceData: CopyPerformanceData[] = [],
    targetDate: Date = new Date()
  ): CopyGenerationHint {
    const calendar = new KoreanMarketCalendar()
    const marketContext = calendar.getDateEventInfo(targetDate)
    const currentSeason = getSeason(targetDate)
    const benchmark = INDUSTRY_BENCHMARKS[industry]

    // 성과 데이터가 있으면 학습 기반 추천
    let recommendedHooks: CopyGenerationHint['recommendedHooks'] = []
    const avoidHooks: CopyGenerationHint['avoidHooks'] = []

    if (performanceData.length >= MIN_SAMPLE_SIZE) {
      const report = this.analyzePerformance(performanceData, industry)

      // 학습 기반 추천
      const validPatterns = Object.entries(report.hookPatterns)
        .filter(([_hook, pattern]) => pattern !== null)
        .map(([hook, pattern]) => ({ hook: hook as CopyHookType, pattern: pattern! }))
        .sort((a, b) => b.pattern.avgROAS - a.pattern.avgROAS)

      recommendedHooks = validPatterns.slice(0, 3).map(({ hook, pattern }) => ({
        hook,
        reason: `ROAS ${pattern.avgROAS.toFixed(2)}, CTR ${pattern.avgCTR.toFixed(2)}% 기록`,
        expectedCTR: pattern.avgCTR,
        confidence: pattern.confidence,
      }))

      // 성과 낮은 훅 회피 권장
      if (validPatterns.length > 0) {
        const worstPattern = validPatterns[validPatterns.length - 1]
        if (worstPattern.pattern.avgROAS < 1) {
          avoidHooks.push({
            hook: worstPattern.hook,
            reason: `낮은 ROAS (${worstPattern.pattern.avgROAS.toFixed(2)}) 기록`,
          })
        }
      }
    } else {
      // 벤치마크 기반 기본 추천
      recommendedHooks = benchmark.bestPerformingHooks.map((hook) => ({
        hook,
        reason: `${industry} 업종 벤치마크 기준 우수 성과`,
        expectedCTR: benchmark.avgCTR,
        confidence: 0.6,
      }))
    }

    // 특수 기간 보정
    if (marketContext.isSpecialDay && marketContext.events.length > 0) {
      // 특수 기간에는 urgency, fear_of_missing 효과적
      const urgencyExists = recommendedHooks.some((h) => h.hook === 'urgency')
      const firstEventName = marketContext.events[0].name
      if (!urgencyExists) {
        recommendedHooks.unshift({
          hook: 'urgency',
          reason: `${firstEventName} 기간 - 긴박감 효과적`,
          expectedCTR: benchmark.avgCTR * 1.2,
          confidence: 0.7,
        })
      }
    }

    // 글자 수 가이드라인
    const characterGuidelines = {
      headline: `${benchmark.characterTips?.headline || '15-25자'} (핵심 메시지 전달)`,
      primaryText: `${benchmark.characterTips?.primaryText || '50-90자'} (상세 설명)`,
      description: '20-40자 (행동 유도)',
    }

    // 시간대 조언
    const peakHours = benchmark.peakHours || [10, 14, 20, 21]
    const timingAdvice = `${industry} 업종 최적 시간대: ${peakHours.map((h) => `${h}시`).join(', ')}`

    // CTA 추천
    const ctaRecommendations = this.getCTARecommendations(industry, marketContext.isSpecialDay)

    // 이벤트 이름 목록 추출
    const eventNames = marketContext.events.map((e) => e.name)

    return {
      industry,
      currentSeason: this.getSeasonNameKorean(currentSeason),
      isSpecialPeriod: marketContext.isSpecialDay,
      specialPeriodName: eventNames[0],
      recommendedHooks: recommendedHooks.slice(0, 3),
      avoidHooks,
      keywordSuggestions: [
        ...benchmark.topKeywords,
        ...eventNames,
      ].slice(0, 10),
      characterGuidelines,
      timingAdvice,
      ctaRecommendations,
    }
  }

  /**
   * CTA 추천
   */
  private getCTARecommendations(industry: Industry, isSpecialPeriod: boolean): string[] {
    const baseCTAs: Record<Industry, string[]> = {
      ecommerce: ['지금 구매하기', '장바구니 담기', '할인 혜택 받기', '무료배송 상품 보기'],
      food_beverage: ['주문하기', '메뉴 보기', '예약하기', '쿠폰 받기'],
      beauty: ['체험하기', '무료 샘플 받기', '베스트 상품 보기', '피부 진단 받기'],
      fashion: ['스타일 보기', '코디 추천 받기', '신상품 보기', '사이즈 찾기'],
      education: ['무료 체험하기', '커리큘럼 보기', '상담 신청', '수강 후기 보기'],
      service: ['상담 신청', '견적 받기', '무료 체험', '서비스 알아보기'],
      saas: ['무료로 시작하기', '데모 신청', '가격 보기', '기능 알아보기'],
      health: ['상담 예약', '건강 체크', '프로그램 보기', '후기 보기'],
    }

    const ctas = [...baseCTAs[industry]]

    if (isSpecialPeriod) {
      ctas.unshift('한정 특가 보기', '이벤트 참여하기')
    }

    return ctas.slice(0, 5)
  }

  /**
   * 훅 이름 한국어
   */
  private getHookNameKorean(hook: CopyHookType): string {
    const names: Record<CopyHookType, string> = {
      benefit: '혜택 강조',
      urgency: '긴박감 조성',
      social_proof: '사회적 증거',
      curiosity: '호기심 유발',
      fear_of_missing: 'FOMO',
      authority: '권위 활용',
      emotional: '감성 호소',
    }
    return names[hook]
  }

  /**
   * 시즌 이름 한국어
   */
  private getSeasonNameKorean(season: 'spring' | 'summer' | 'fall' | 'winter'): string {
    const names = { spring: '봄', summer: '여름', fall: '가을', winter: '겨울' }
    return names[season]
  }

  /**
   * 빈 리포트 생성
   */
  private createEmptyReport(industry: Industry): LearningReport {
    return {
      industry,
      totalSamples: 0,
      dateRange: { start: new Date(), end: new Date() },
      overallInsights: {
        bestPerformingHook: 'benefit',
        worstPerformingHook: 'benefit',
        avgCTR: 0,
        avgCVR: 0,
        avgROAS: 0,
      },
      hookPatterns: {
        benefit: null,
        urgency: null,
        social_proof: null,
        curiosity: null,
        fear_of_missing: null,
        authority: null,
        emotional: null,
      },
      seasonalPatterns: [
        this.getDefaultSeasonalPattern('spring'),
        this.getDefaultSeasonalPattern('summer'),
        this.getDefaultSeasonalPattern('fall'),
        this.getDefaultSeasonalPattern('winter'),
      ],
      recommendations: [],
    }
  }

  /**
   * 캐시 클리어
   */
  clearCache(): void {
    this.performanceCache.clear()
    this.patternCache.clear()
  }
}
