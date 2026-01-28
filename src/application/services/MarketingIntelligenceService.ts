import type { IKnowledgeBaseService, AnalysisInput } from '@application/ports/IKnowledgeBaseService'
import type { GenerateAdCopyInput, GenerateOptimizationInput, GenerateCreativeVariantsInput } from '@application/ports/IAIService'
import type { CompositeScore } from '@domain/value-objects/MarketingScience'
import type { IResearchService, ResearchResult } from '@application/ports/IResearchService'

export interface ScienceBackedResult<T> {
  result: T
  scienceScore: CompositeScore
  knowledgeContext: string
}

export class MarketingIntelligenceService {
  constructor(
    private readonly knowledgeBase: IKnowledgeBaseService,
    private readonly researchService?: IResearchService,
  ) {}

  /**
   * Full analysis: run all 6 domain analyzers and return composite score + context
   */
  analyze(input: AnalysisInput): { compositeScore: CompositeScore; knowledgeContext: string } {
    const output = this.knowledgeBase.analyzeAll(input)
    return {
      compositeScore: output.compositeScore,
      knowledgeContext: output.knowledgeContext,
    }
  }

  /**
   * Quick score: get just the composite score without full context string
   */
  scoreContent(input: AnalysisInput): CompositeScore {
    const output = this.knowledgeBase.analyzeAll(input)
    return output.compositeScore
  }

  /**
   * Get knowledge context string for prompt injection
   */
  getKnowledgeContext(input: AnalysisInput): string {
    return this.knowledgeBase.getKnowledgeContext(input)
  }

  /**
   * Enhanced analysis with optional real-time research.
   * Falls back to standard analysis if research is unavailable.
   */
  async analyzeWithResearch(input: AnalysisInput): Promise<{
    compositeScore: CompositeScore
    knowledgeContext: string
    researchFindings?: ResearchResult
  }> {
    const baseResult = this.analyze(input)

    // Skip research if service not available
    if (!this.researchService?.isAvailable()) {
      return baseResult
    }

    try {
      const topic = this.buildResearchTopic(input)
      const researchResult = await this.researchService.research({
        topic,
        market: 'KR',
        recency: 'last_month',
      })

      // Append research findings to knowledge context
      const enhancedContext = this.appendResearchContext(
        baseResult.knowledgeContext,
        researchResult
      )

      return {
        compositeScore: baseResult.compositeScore,
        knowledgeContext: enhancedContext,
        researchFindings: researchResult,
      }
    } catch {
      // Graceful degradation: return base result if research fails
      return baseResult
    }
  }

  /**
   * Check if research service is available.
   */
  isResearchAvailable(): boolean {
    return this.researchService?.isAvailable() ?? false
  }

  private buildResearchTopic(input: AnalysisInput): string {
    const parts: string[] = []
    if (input.context?.industry) parts.push(input.context.industry)
    if (input.context?.targetAudience) parts.push(`타겟: ${input.context.targetAudience}`)
    if (input.content?.brand) parts.push(input.content.brand)
    if (input.context?.objective) parts.push(`목표: ${input.context.objective}`)
    return parts.length > 0 ? `${parts.join(', ')} 마케팅 전략` : '디지털 마케팅 전략'
  }

  private appendResearchContext(baseContext: string, research: ResearchResult): string {
    if (research.findings.length === 0) return baseContext

    const researchLines: string[] = [
      '',
      '=== 최신 리서치 인사이트 ===',
      '',
    ]

    for (let i = 0; i < Math.min(5, research.findings.length); i++) {
      researchLines.push(`${i + 1}. ${research.findings[i]}`)
    }

    if (research.sources.length > 0) {
      researchLines.push('')
      researchLines.push('출처:')
      for (const source of research.sources.slice(0, 3)) {
        researchLines.push(`- ${source.title}${source.url ? ` (${source.url})` : ''}`)
      }
    }

    return baseContext + '\n' + researchLines.join('\n')
  }

  /**
   * Map GenerateAdCopyInput → AnalysisInput
   */
  mapAdCopyToAnalysisInput(input: GenerateAdCopyInput): AnalysisInput {
    return {
      content: {
        headline: undefined,
        primaryText: undefined,
        description: input.productDescription,
        callToAction: undefined,
        brand: input.productName,
      },
      context: {
        targetAudience: input.targetAudience,
        objective: input.objective,
        tone: input.tone,
        keywords: input.keywords,
      },
    }
  }

  /**
   * Map GenerateOptimizationInput → AnalysisInput
   */
  mapOptimizationToAnalysisInput(input: GenerateOptimizationInput): AnalysisInput {
    // Parse objective if it matches known types, otherwise undefined
    const objectiveMap: Record<string, 'awareness' | 'consideration' | 'conversion'> = {
      awareness: 'awareness',
      consideration: 'consideration',
      conversion: 'conversion',
    }
    const objective = objectiveMap[input.objective.toLowerCase()] || undefined

    return {
      context: {
        industry: input.industry,
        objective,
        targetAudience: input.targetAudience?.ageRange,
      },
      metrics: {
        ctr: input.currentMetrics.ctr,
        cvr: input.currentMetrics.cvr,
        roas: input.currentMetrics.roas,
        cpa: input.currentMetrics.cpa,
      },
    }
  }

  /**
   * Map GenerateCreativeVariantsInput → AnalysisInput
   */
  mapCreativeToAnalysisInput(input: GenerateCreativeVariantsInput): AnalysisInput {
    const contentMap: Record<string, Partial<AnalysisInput['content']>> = {
      headline: { headline: input.currentText },
      primary_text: { primaryText: input.currentText },
      description: { description: input.currentText },
      cta: { callToAction: input.currentText },
    }

    return {
      content: {
        ...contentMap[input.element],
      } as AnalysisInput['content'],
      context: {
        targetAudience: input.targetAudience,
      },
    }
  }

  /**
   * Enrich an ad copy input with science context
   */
  enrichAdCopyInput(input: GenerateAdCopyInput): GenerateAdCopyInput {
    const analysisInput = this.mapAdCopyToAnalysisInput(input)
    const context = this.getKnowledgeContext(analysisInput)
    return { ...input, scienceContext: context }
  }

  /**
   * Enrich an ad copy input with science context and optional research
   */
  async enrichAdCopyInputWithResearch(input: GenerateAdCopyInput): Promise<GenerateAdCopyInput> {
    const analysisInput = this.mapAdCopyToAnalysisInput(input)
    const result = await this.analyzeWithResearch(analysisInput)
    return { ...input, scienceContext: result.knowledgeContext }
  }

  /**
   * Enrich an optimization input with science context
   */
  enrichOptimizationInput(input: GenerateOptimizationInput): GenerateOptimizationInput {
    const analysisInput = this.mapOptimizationToAnalysisInput(input)
    const context = this.getKnowledgeContext(analysisInput)
    return { ...input, scienceContext: context }
  }

  /**
   * Enrich a creative variants input with science context
   */
  enrichCreativeInput(input: GenerateCreativeVariantsInput): GenerateCreativeVariantsInput {
    const analysisInput = this.mapCreativeToAnalysisInput(input)
    const context = this.getKnowledgeContext(analysisInput)
    return { ...input, scienceContext: context }
  }
}
