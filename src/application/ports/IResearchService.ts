/**
 * Research Service Port
 *
 * Defines the interface for external research capabilities.
 * Implementations may use Perplexity, Tavily, or similar APIs.
 *
 * Phase 3: Research Enhancement Layer (Optional)
 * - Research is opt-in via RESEARCH_ENABLED env var
 * - Graceful degradation when API unavailable
 * - Results cached (in-memory, 1 hour TTL)
 */

// --- DTOs ---

export interface ResearchQuery {
  /** Research topic or question */
  topic: string
  /** Target market for research */
  market: 'KR' | 'US' | 'global'
  /** How recent the research should be */
  recency: 'last_week' | 'last_month' | 'last_quarter' | 'last_year'
}

export interface ResearchSource {
  /** Source title */
  title: string
  /** Source URL */
  url: string
  /** Publication date (ISO 8601) */
  date: string
}

export interface ResearchResult {
  /** Key findings from research */
  findings: string[]
  /** Sources of the findings */
  sources: ResearchSource[]
  /** Relevance score (0-1) indicating how relevant findings are to the query */
  relevanceScore: number
  /** Whether the result was served from cache */
  cached: boolean
}

export interface MarketTrend {
  /** Trend topic */
  topic: string
  /** Direction of the trend */
  direction: 'rising' | 'falling' | 'stable'
  /** Brief description */
  description: string
  /** Relevance to marketing (0-1) */
  relevance: number
}

export interface MarketTrendsResult extends ResearchResult {
  /** Extracted trends */
  trends: MarketTrend[]
}

export interface CompetitorInsight {
  /** Competitor or keyword */
  keyword: string
  /** Insight description */
  insight: string
  /** Source of the insight */
  source: string
}

export interface CompetitorIntelligenceResult extends ResearchResult {
  /** Extracted competitor insights */
  insights: CompetitorInsight[]
}

// --- Port ---

export interface IResearchService {
  /**
   * Perform general research on a topic.
   * Returns findings with sources and relevance scoring.
   *
   * @throws ResearchUnavailableError if API is not configured or unavailable
   */
  research(query: ResearchQuery): Promise<ResearchResult>

  /**
   * Get current market trends for a given industry.
   * Focuses on marketing-relevant trends.
   *
   * @param industry - Industry sector (e.g., 'ecommerce', 'fashion', 'beauty')
   * @param market - Target market ('KR', 'US', 'global')
   */
  getMarketTrends(industry: string, market: string): Promise<MarketTrendsResult>

  /**
   * Get competitive intelligence based on keywords.
   * Analyzes competitor strategies and market positioning.
   *
   * @param keywords - Keywords to research (brand names, product categories)
   */
  getCompetitorIntelligence(keywords: string[]): Promise<CompetitorIntelligenceResult>

  /**
   * Check if the research service is available and configured.
   * Used for graceful degradation.
   */
  isAvailable(): boolean

  /**
   * Clear the research cache.
   * Useful for forcing fresh results.
   */
  clearCache(): void
}
