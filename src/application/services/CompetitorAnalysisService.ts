/**
 * 경쟁사 광고 분석 서비스
 *
 * Meta Ad Library API를 통해 경쟁사 광고 수집 및 AI 분석
 */

export interface CompetitorAd {
  id: string
  pageId: string
  pageName: string
  adCreativeBody: string
  adCreativeLinkTitle?: string
  adCreativeLinkDescription?: string
  adSnapshotUrl: string
  impressionsRange?: { lower: number; upper: number }
  startDate: string
  endDate?: string
  platforms: string[]
}

export interface CompetitorAnalysis {
  competitors: {
    pageName: string
    pageId: string
    adCount: number
    dominantFormats: string[]
    commonHooks: string[]
    averageAdLifespan: number
  }[]
  trends: {
    popularHooks: string[]
    commonOffers: string[]
    formatDistribution: { format: string; percentage: number }[]
  }
  recommendations: string[]
}

export interface SearchCompetitorAdsInput {
  keywords: string[]
  countries: string[]
  limit?: number
}

export interface AnalyzeCompetitorCreativesInput {
  ads: CompetitorAd[]
  industry?: string
}

export interface GenerateCompetitiveInsightsInput {
  userId: string
  industry: string
  keywords?: string[]
  trackedPageIds?: string[]
}

/**
 * 경쟁사 광고 분석 서비스
 */
export class CompetitorAnalysisService {
  constructor(
    private readonly adLibraryClient: IAdLibraryClient,
    private readonly aiService: ICompetitorAIService
  ) {}

  /**
   * 경쟁사 광고 검색
   */
  async searchCompetitorAds(
    accessToken: string,
    input: SearchCompetitorAdsInput
  ): Promise<CompetitorAd[]> {
    const ads: CompetitorAd[] = []

    for (const keyword of input.keywords) {
      const results = await this.adLibraryClient.searchAds(accessToken, {
        searchTerms: keyword,
        adReachedCountries: input.countries,
        limit: input.limit || 50,
      })

      ads.push(...results)
    }

    // 중복 제거 (id 기준)
    const uniqueAds = Array.from(new Map(ads.map((ad) => [ad.id, ad])).values())

    return uniqueAds
  }

  /**
   * 경쟁사 크리에이티브 분석 (AI)
   */
  async analyzeCompetitorCreatives(
    input: AnalyzeCompetitorCreativesInput
  ): Promise<CompetitorAnalysis> {
    // 페이지별로 그룹화
    const pageGroups = this.groupByPage(input.ads)

    const competitors = Object.entries(pageGroups).map(([pageId, ads]) => ({
      pageName: ads[0].pageName,
      pageId,
      adCount: ads.length,
      dominantFormats: this.extractDominantFormats(ads),
      commonHooks: this.extractCommonHooks(ads),
      averageAdLifespan: this.calculateAverageAdLifespan(ads),
    }))

    // AI를 통한 트렌드 분석
    const trends = await this.aiService.analyzeCompetitorTrends({
      ads: input.ads,
      industry: input.industry,
    })

    // AI를 통한 추천 생성
    const recommendations = await this.aiService.generateCompetitorInsights({
      competitors,
      trends,
      industry: input.industry,
    })

    return {
      competitors,
      trends,
      recommendations,
    }
  }

  /**
   * 전체 경쟁사 인사이트 생성
   */
  async generateCompetitiveInsights(
    accessToken: string,
    input: GenerateCompetitiveInsightsInput
  ): Promise<CompetitorAnalysis> {
    // 1. 광고 검색
    const searchInput: SearchCompetitorAdsInput = {
      keywords: input.keywords || [input.industry],
      countries: ['KR'],
      limit: 100,
    }

    const ads = await this.searchCompetitorAds(accessToken, searchInput)

    // 2. 추적 중인 페이지 광고 추가
    if (input.trackedPageIds && input.trackedPageIds.length > 0) {
      for (const pageId of input.trackedPageIds) {
        const pageAds = await this.adLibraryClient.getPageAds(accessToken, pageId)
        ads.push(...pageAds)
      }
    }

    // 3. 분석
    return this.analyzeCompetitorCreatives({
      ads,
      industry: input.industry,
    })
  }

  // ============ Private Methods ============

  private groupByPage(ads: CompetitorAd[]): Record<string, CompetitorAd[]> {
    return ads.reduce(
      (groups, ad) => {
        if (!groups[ad.pageId]) {
          groups[ad.pageId] = []
        }
        groups[ad.pageId].push(ad)
        return groups
      },
      {} as Record<string, CompetitorAd[]>
    )
  }

  private extractDominantFormats(ads: CompetitorAd[]): string[] {
    const formatCounts: Record<string, number> = {}

    for (const ad of ads) {
      const format = this.detectAdFormat(ad)
      formatCounts[format] = (formatCounts[format] || 0) + 1
    }

    return Object.entries(formatCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([format]) => format)
  }

  private detectAdFormat(ad: CompetitorAd): string {
    if (ad.adCreativeLinkTitle && ad.adCreativeLinkDescription) {
      return 'carousel' // 추정
    }
    if (ad.adCreativeBody.length > 200) {
      return 'single_image_long_copy'
    }
    if (ad.adCreativeBody.length > 100) {
      return 'single_image_medium_copy'
    }
    return 'single_image_short_copy'
  }

  private extractCommonHooks(ads: CompetitorAd[]): string[] {
    // 간단한 키워드 빈도 분석
    const hookPatterns = [
      { pattern: /무료|프리|free/gi, label: '무료 혜택' },
      { pattern: /할인|세일|sale/gi, label: '할인 프로모션' },
      { pattern: /신규|new|런칭/gi, label: '신제품 출시' },
      { pattern: /한정|limited|품절/gi, label: '희소성 강조' },
      { pattern: /보장|guarantee|안심/gi, label: '보장/신뢰' },
      { pattern: /후기|리뷰|만족도/gi, label: '사회적 증거' },
    ]

    const hookCounts: Record<string, number> = {}

    for (const ad of ads) {
      for (const { pattern, label } of hookPatterns) {
        if (pattern.test(ad.adCreativeBody)) {
          hookCounts[label] = (hookCounts[label] || 0) + 1
        }
      }
    }

    return Object.entries(hookCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([label]) => label)
  }

  private calculateAverageAdLifespan(ads: CompetitorAd[]): number {
    let totalDays = 0
    let count = 0

    for (const ad of ads) {
      const startDate = new Date(ad.startDate)
      const endDate = ad.endDate ? new Date(ad.endDate) : new Date()

      const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

      if (days > 0 && days < 365) {
        // 비정상 값 제외
        totalDays += days
        count++
      }
    }

    return count > 0 ? Math.round(totalDays / count) : 0
  }
}

/**
 * AdLibraryClient 인터페이스
 */
export interface IAdLibraryClient {
  searchAds(
    accessToken: string,
    params: {
      searchTerms: string
      adReachedCountries: string[]
      limit?: number
    }
  ): Promise<CompetitorAd[]>

  getPageAds(accessToken: string, pageId: string): Promise<CompetitorAd[]>
}

/**
 * ICompetitorAIService 인터페이스
 * AIService에서 구현하는 경쟁사 분석 메서드
 */
export interface ICompetitorAIService {
  analyzeCompetitorTrends(input: {
    ads: CompetitorAd[]
    industry?: string
  }): Promise<{
    popularHooks: string[]
    commonOffers: string[]
    formatDistribution: { format: string; percentage: number }[]
  }>

  generateCompetitorInsights(input: {
    competitors: CompetitorAnalysis['competitors']
    trends: CompetitorAnalysis['trends']
    industry?: string
  }): Promise<string[]>
}
