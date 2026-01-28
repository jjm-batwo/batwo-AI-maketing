import type {
  IKnowledgeBaseService,
  AnalysisInput,
  AnalysisOutput,
  DomainAnalyzer,
} from '@application/ports/IKnowledgeBaseService'
import type {
  KnowledgeDomain,
  DomainScore,
  DomainRecommendation,
} from '@domain/value-objects/MarketingScience'
import {
  buildCompositeScore,
  MIN_REQUIRED_DOMAINS,
  rankRecommendations,
} from '@domain/value-objects/MarketingScience'
import { InsufficientAnalysisError } from '@domain/errors/InsufficientAnalysisError'
import { NeuromarketingAnalyzer } from './analyzers/NeuromarketingAnalyzer'
import { MarketingPsychologyAnalyzer } from './analyzers/MarketingPsychologyAnalyzer'
import { CrowdPsychologyAnalyzer } from './analyzers/CrowdPsychologyAnalyzer'
import { MetaBestPracticesAnalyzer } from './analyzers/MetaBestPracticesAnalyzer'
import { ColorPsychologyAnalyzer } from './analyzers/ColorPsychologyAnalyzer'
import { CopywritingPsychologyAnalyzer } from './analyzers/CopywritingPsychologyAnalyzer'

/**
 * Knowledge Base Service - Orchestrates all domain analyzers
 *
 * Implements IKnowledgeBaseService port from application layer.
 * Coordinates 6 domain analyzers and aggregates results into composite scores.
 *
 * Handles partial failures gracefully:
 * - Logs warnings for failed analyzers
 * - Throws InsufficientAnalysisError if fewer than MIN_REQUIRED_DOMAINS succeed
 */
export class KnowledgeBaseService implements IKnowledgeBaseService {
  private readonly analyzers: DomainAnalyzer[]

  constructor() {
    this.analyzers = [
      new NeuromarketingAnalyzer(),
      new MarketingPsychologyAnalyzer(),
      new CrowdPsychologyAnalyzer(),
      new MetaBestPracticesAnalyzer(),
      new ColorPsychologyAnalyzer(),
      new CopywritingPsychologyAnalyzer(),
    ]
  }

  analyzeAll(input: AnalysisInput): AnalysisOutput {
    return this.runAnalysis(input, this.analyzers)
  }

  analyzeSpecific(input: AnalysisInput, domains: KnowledgeDomain[]): AnalysisOutput {
    const selectedAnalyzers = this.analyzers.filter(a => domains.includes(a.domain))
    return this.runAnalysis(input, selectedAnalyzers)
  }

  getKnowledgeContext(input: AnalysisInput): string {
    const output = this.analyzeAll(input)
    return output.knowledgeContext
  }

  getRecommendations(input: AnalysisInput): DomainRecommendation[] {
    const output = this.analyzeAll(input)
    return rankRecommendations(
      output.compositeScore.domainScores.flatMap(ds => ds.recommendations)
    )
  }

  /**
   * Core analysis orchestration logic.
   * Runs analyzers, collects results, handles failures.
   */
  private runAnalysis(input: AnalysisInput, analyzers: DomainAnalyzer[]): AnalysisOutput {
    const domainScores: DomainScore[] = []
    const failedDomains: KnowledgeDomain[] = []

    // Run each analyzer with error handling
    for (const analyzer of analyzers) {
      try {
        const score = analyzer.analyze(input)
        domainScores.push(score)
      } catch (error) {
        console.warn(
          `[KnowledgeBaseService] ${analyzer.domain} analyzer failed:`,
          error instanceof Error ? error.message : String(error)
        )
        failedDomains.push(analyzer.domain)
      }
    }

    // Validate minimum required domains
    if (domainScores.length < MIN_REQUIRED_DOMAINS) {
      throw new InsufficientAnalysisError(
        domainScores.length,
        MIN_REQUIRED_DOMAINS,
        failedDomains
      )
    }

    // Build composite score
    const compositeScore = buildCompositeScore(domainScores, failedDomains)

    // Format knowledge context for prompt injection
    const knowledgeContext = this.formatKnowledgeContext(compositeScore)

    return {
      compositeScore,
      knowledgeContext,
    }
  }

  /**
   * Format composite score into AI prompt-friendly string.
   *
   * Target: ~2000 tokens
   * Format:
   * - Overall score and grade
   * - Each domain's score and top finding
   * - Top 5 recommendations with citations
   */
  private formatKnowledgeContext(composite: typeof buildCompositeScore extends (...args: any[]) => infer R ? R : never): string {
    const lines: string[] = []

    // Header
    lines.push(`=== 마케팅 사이언스 분석 (등급: ${composite.grade}, 점수: ${composite.overall}/100) ===\n`)

    // Domain scores
    for (const ds of composite.domainScores) {
      const domainName = this.getDomainNameKorean(ds.domain)
      lines.push(`[${domainName}] 점수: ${ds.score}/100 (등급: ${ds.grade})`)

      // Top finding (highest weighted factor)
      if (ds.factors.length > 0) {
        const topFactor = ds.factors.reduce((prev, curr) =>
          (curr.score * curr.weight) > (prev.score * prev.weight) ? curr : prev
        )
        lines.push(`- ${topFactor.name} (${topFactor.score}점): ${topFactor.explanation}`)
        if (topFactor.citation) {
          lines.push(`  근거: ${topFactor.citation.finding}`)
        }
      }

      lines.push('') // Blank line
    }

    // Top recommendations
    if (composite.topRecommendations.length > 0) {
      lines.push('상위 권장사항:')
      for (let i = 0; i < Math.min(5, composite.topRecommendations.length); i++) {
        const rec = composite.topRecommendations[i]
        const domainName = this.getDomainNameKorean(rec.domain)
        lines.push(
          `${i + 1}. [${rec.priority}] ${rec.recommendation} - ${domainName}`
        )
        if (rec.citations.length > 0) {
          const citation = rec.citations[0]
          lines.push(`   근거: ${citation.source}`)
        }
      }
      lines.push('')
    }

    // Failed domains warning
    if (composite.failedDomains.length > 0) {
      lines.push(
        `경고: 다음 도메인 분석 실패 - ${composite.failedDomains.map(d => this.getDomainNameKorean(d)).join(', ')}`
      )
    }

    return lines.join('\n')
  }

  /**
   * Map domain enum to Korean display name
   */
  private getDomainNameKorean(domain: KnowledgeDomain): string {
    const names: Record<KnowledgeDomain, string> = {
      neuromarketing: '뉴로마케팅',
      marketing_psychology: '마케팅 심리학',
      crowd_psychology: '군중 심리학',
      meta_best_practices: 'Meta 베스트 프랙티스',
      color_psychology: '색채 심리학',
      copywriting_psychology: '카피라이팅 심리학',
    }
    return names[domain]
  }
}
