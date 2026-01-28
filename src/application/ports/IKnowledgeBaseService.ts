import type {
  KnowledgeDomain,
  CompositeScore,
  DomainScore,
  DomainRecommendation,
} from '@domain/value-objects/MarketingScience'

// --- DTOs (Application Layer) ---

export interface AnalysisInput {
  content?: {
    headline?: string
    primaryText?: string
    description?: string
    callToAction?: string
    brand?: string
  }
  context?: {
    industry?: string
    targetAudience?: string
    objective?: 'awareness' | 'consideration' | 'conversion'
    tone?: 'professional' | 'casual' | 'playful' | 'urgent'
    keywords?: string[]
  }
  metrics?: {
    ctr?: number
    cvr?: number
    roas?: number
    cpa?: number
    frequency?: number
  }
  creative?: {
    format?: 'image' | 'video' | 'carousel'
    dominantColors?: string[]
    hasVideo?: boolean
    videoDuration?: number
  }
}

export interface AnalysisOutput {
  compositeScore: CompositeScore
  knowledgeContext: string
}

export interface KnowledgeContext {
  domain: KnowledgeDomain
  findings: string[]
  score: DomainScore
  contextString: string
}

// --- Domain Analyzer Interface ---

export interface DomainAnalyzer {
  domain: KnowledgeDomain
  analyze(input: AnalysisInput): DomainScore
}

// --- Port ---

export interface IKnowledgeBaseService {
  /**
   * Run all 6 domain analyzers and aggregate results.
   * Handles partial failures: logs warning, excludes failed domain.
   * Throws InsufficientAnalysisError if fewer than 3 domains succeed.
   */
  analyzeAll(input: AnalysisInput): AnalysisOutput

  /**
   * Run specific domains only (for cost/performance optimization)
   */
  analyzeSpecific(input: AnalysisInput, domains: KnowledgeDomain[]): AnalysisOutput

  /**
   * Get relevant knowledge for prompt injection.
   * Returns formatted string for system prompt enhancement.
   */
  getKnowledgeContext(input: AnalysisInput): string

  /**
   * Get domain-specific recommendations only.
   */
  getRecommendations(input: AnalysisInput): DomainRecommendation[]
}
