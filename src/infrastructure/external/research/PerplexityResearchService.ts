import type {
  IResearchService,
  ResearchQuery,
  ResearchResult,
  MarketTrendsResult,
  MarketTrend,
  CompetitorIntelligenceResult,
  CompetitorInsight,
} from '@/application/ports/IResearchService'

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour
const MAX_CACHE_SIZE = 100

/**
 * Perplexity Research Service
 *
 * Implements IResearchService using the Perplexity API.
 * Features in-memory LRU cache and graceful degradation.
 */
export class PerplexityResearchService implements IResearchService {
  private readonly apiKey: string | undefined
  private readonly baseUrl = 'https://api.perplexity.ai'
  private readonly cache = new Map<string, CacheEntry<unknown>>()

  constructor(apiKey?: string) {
    this.apiKey = apiKey
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey)
  }

  clearCache(): void {
    this.cache.clear()
  }

  async research(query: ResearchQuery): Promise<ResearchResult> {
    const cacheKey = `research:${JSON.stringify(query)}`
    const cached = this.getFromCache<ResearchResult>(cacheKey)
    if (cached) return { ...cached, cached: true }

    if (!this.isAvailable()) {
      return this.createEmptyResult()
    }

    try {
      const prompt = this.buildResearchPrompt(query)
      const response = await this.callPerplexity(prompt)

      const result: ResearchResult = {
        findings: this.extractFindings(response.content),
        sources: this.extractSources(response.citations),
        relevanceScore: this.calculateRelevance(response.content, query.topic),
        cached: false,
      }

      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.warn('[PerplexityResearchService] Research failed:', error instanceof Error ? error.message : String(error))
      return this.createEmptyResult()
    }
  }

  async getMarketTrends(industry: string, market: string): Promise<MarketTrendsResult> {
    const cacheKey = `trends:${industry}:${market}`
    const cached = this.getFromCache<MarketTrendsResult>(cacheKey)
    if (cached) return { ...cached, cached: true }

    if (!this.isAvailable()) {
      return { ...this.createEmptyResult(), trends: [] }
    }

    try {
      const isKorean = market === 'KR'
      const prompt = isKorean
        ? `${industry} 업계의 최신 마케팅 트렌드를 분석해주세요. 한국 시장 중심으로 상승 트렌드, 하락 트렌드, 안정적 트렌드를 구분하여 알려주세요. 각 트렌드의 마케팅 관련성을 포함해주세요.`
        : `Analyze the latest marketing trends in the ${industry} industry for the ${market} market. Categorize trends as rising, falling, or stable. Include marketing relevance for each trend.`

      const response = await this.callPerplexity(prompt)

      const result: MarketTrendsResult = {
        findings: this.extractFindings(response.content),
        sources: this.extractSources(response.citations),
        relevanceScore: 0.8,
        cached: false,
        trends: this.extractTrends(response.content),
      }

      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.warn('[PerplexityResearchService] Market trends failed:', error instanceof Error ? error.message : String(error))
      return { ...this.createEmptyResult(), trends: [] }
    }
  }

  async getCompetitorIntelligence(keywords: string[]): Promise<CompetitorIntelligenceResult> {
    const cacheKey = `competitors:${keywords.sort().join(',')}`
    const cached = this.getFromCache<CompetitorIntelligenceResult>(cacheKey)
    if (cached) return { ...cached, cached: true }

    if (!this.isAvailable()) {
      return { ...this.createEmptyResult(), insights: [] }
    }

    try {
      const prompt = `다음 키워드에 대한 경쟁사 및 시장 분석을 해주세요: ${keywords.join(', ')}. 각 키워드별 경쟁 현황, 주요 전략, 마케팅 인사이트를 포함해주세요.`

      const response = await this.callPerplexity(prompt)

      const result: CompetitorIntelligenceResult = {
        findings: this.extractFindings(response.content),
        sources: this.extractSources(response.citations),
        relevanceScore: 0.7,
        cached: false,
        insights: this.extractInsights(response.content, keywords),
      }

      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.warn('[PerplexityResearchService] Competitor intelligence failed:', error instanceof Error ? error.message : String(error))
      return { ...this.createEmptyResult(), insights: [] }
    }
  }

  // --- Private methods ---

  private async callPerplexity(prompt: string): Promise<{ content: string; citations: string[] }> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a marketing research analyst. Provide concise, factual findings with clear structure. Use numbered points for findings.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1024,
        temperature: 0.2,
        return_citations: true,
      }),
      signal: AbortSignal.timeout(15000), // 15 second timeout
    })

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const message = data.choices?.[0]?.message

    return {
      content: message?.content || '',
      citations: data.citations || [],
    }
  }

  private buildResearchPrompt(query: ResearchQuery): string {
    const recencyMap = {
      last_week: '지난 1주일',
      last_month: '지난 1개월',
      last_quarter: '지난 3개월',
      last_year: '지난 1년',
    }

    const marketMap = {
      KR: '한국',
      US: '미국',
      global: '글로벌',
    }

    return `${marketMap[query.market]} 시장에서 "${query.topic}"에 대한 ${recencyMap[query.recency]} 동안의 최신 마케팅 리서치 결과를 알려주세요. 주요 발견사항을 번호 목록으로 정리해주세요.`
  }

  private extractFindings(content: string): string[] {
    if (!content) return []

    // Extract numbered items or bullet points
    const lines = content.split('\n').filter(line => line.trim())
    const findings: string[] = []

    for (const line of lines) {
      const trimmed = line.trim()
      // Match numbered items (1. 2. etc.) or bullet points (- * •)
      const match = trimmed.match(/^(?:\d+[\.\)]\s*|[-*•]\s*)(.+)/)
      if (match) {
        findings.push(match[1].trim())
      }
    }

    // If no structured findings found, split into sentences
    if (findings.length === 0 && content.length > 0) {
      const sentences = content.split(/[.!?。]\s*/).filter(s => s.trim().length > 10)
      return sentences.slice(0, 5)
    }

    return findings.slice(0, 10) // Max 10 findings
  }

  private extractSources(citations: string[]): { title: string; url: string; date: string }[] {
    if (!citations || !Array.isArray(citations)) return []

    return citations.slice(0, 5).map((citation, index) => {
      // Perplexity returns URLs as citations
      const isUrl = citation.startsWith('http')
      return {
        title: isUrl ? `Source ${index + 1}` : citation,
        url: isUrl ? citation : '',
        date: new Date().toISOString().split('T')[0],
      }
    })
  }

  private extractTrends(content: string): MarketTrend[] {
    const findings = this.extractFindings(content)
    return findings.slice(0, 5).map(finding => {
      const direction = this.detectTrendDirection(finding)
      return {
        topic: finding.slice(0, 50),
        direction,
        description: finding,
        relevance: 0.7,
      }
    })
  }

  private detectTrendDirection(text: string): 'rising' | 'falling' | 'stable' {
    const risingWords = ['증가', '상승', '성장', '확대', 'growing', 'rising', 'increasing', '인기', '급등', '활성화']
    const fallingWords = ['감소', '하락', '축소', 'declining', 'falling', 'decreasing', '둔화', '위축']

    const lowerText = text.toLowerCase()
    const risingCount = risingWords.filter(w => lowerText.includes(w)).length
    const fallingCount = fallingWords.filter(w => lowerText.includes(w)).length

    if (risingCount > fallingCount) return 'rising'
    if (fallingCount > risingCount) return 'falling'
    return 'stable'
  }

  private extractInsights(content: string, keywords: string[]): CompetitorInsight[] {
    const findings = this.extractFindings(content)
    return findings.slice(0, 5).map((finding, index) => ({
      keyword: keywords[index % keywords.length],
      insight: finding,
      source: 'Perplexity AI Research',
    }))
  }

  private calculateRelevance(content: string, topic: string): number {
    if (!content || !topic) return 0

    const topicWords = topic.toLowerCase().split(/\s+/)
    const contentLower = content.toLowerCase()
    const matchCount = topicWords.filter(w => contentLower.includes(w)).length

    return Math.min(matchCount / Math.max(topicWords.length, 1), 1)
  }

  private createEmptyResult(): ResearchResult {
    return {
      findings: [],
      sources: [],
      relevanceScore: 0,
      cached: false,
    }
  }

  // --- Cache Management ---

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  private setCache<T>(key: string, data: T): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + CACHE_TTL_MS,
    })
  }
}
