import type {
  IAIService,
  AIConfig,
  CampaignOptimizationSuggestion,
  ReportInsight,
  AdCopyVariant,
  GenerateOptimizationInput,
  GenerateReportInsightInput,
  GenerateAdCopyInput,
  GenerateBudgetRecommendationInput,
  BudgetRecommendationResult,
  GenerateCreativeVariantsInput,
  CreativeVariant,
} from '@application/ports/IAIService'
import { formatScienceContextBlock } from './prompts/science'
import { MarketingIntelligenceService, ScienceBackedResult } from '@application/services/MarketingIntelligenceService'

/**
 * ScienceAIService - Decorator Pattern
 *
 * Wraps an existing IAIService implementation and enriches inputs
 * with science-based marketing intelligence before delegating.
 *
 * INPUT ENRICHMENT approach:
 * - Populates `scienceContext` field on input DTOs
 * - The prompt builders then inject this context into prompts
 * - The inner IAIService processes the enriched prompt as normal
 */
export class ScienceAIService implements IAIService {
  constructor(
    private readonly inner: IAIService,
    private readonly intelligence: MarketingIntelligenceService
  ) {}

  async generateCampaignOptimization(
    input: GenerateOptimizationInput
  ): Promise<CampaignOptimizationSuggestion[]> {
    const enriched = this.intelligence.enrichOptimizationInput(input)
    return this.inner.generateCampaignOptimization(enriched)
  }

  async generateReportInsights(
    input: GenerateReportInsightInput
  ): Promise<ReportInsight> {
    // Report insights don't benefit from science context (they're data-driven)
    return this.inner.generateReportInsights(input)
  }

  async generateAdCopy(input: GenerateAdCopyInput): Promise<AdCopyVariant[]> {
    const enriched = this.intelligence.enrichAdCopyInput(input)
    return this.inner.generateAdCopy(enriched)
  }

  async generateBudgetRecommendation(
    input: GenerateBudgetRecommendationInput
  ): Promise<BudgetRecommendationResult> {
    // Budget recommendations don't benefit from science context
    return this.inner.generateBudgetRecommendation(input)
  }

  async generateCreativeVariants(
    input: GenerateCreativeVariantsInput
  ): Promise<CreativeVariant[]> {
    const enriched = this.intelligence.enrichCreativeInput(input)
    return this.inner.generateCreativeVariants(enriched)
  }

  async chatCompletion(
    systemPrompt: string,
    userPrompt: string,
    config?: AIConfig
  ): Promise<string> {
    // Pass through - chatCompletion is a low-level method
    return this.inner.chatCompletion(systemPrompt, userPrompt, config)
  }

  /**
   * Science-backed ad copy generation with full analysis results
   * Returns both the generated copy AND the science analysis score
   */
  async generateScienceBackedAdCopy(
    input: GenerateAdCopyInput
  ): Promise<ScienceBackedResult<AdCopyVariant[]>> {
    const analysisInput = this.intelligence.mapAdCopyToAnalysisInput(input)
    const { compositeScore, knowledgeContext } = this.intelligence.analyze(analysisInput)

    const enrichedInput: GenerateAdCopyInput = {
      ...input,
      scienceContext: formatScienceContextBlock(knowledgeContext),
    }

    const result = await this.inner.generateAdCopy(enrichedInput)

    return {
      result,
      scienceScore: compositeScore,
      knowledgeContext,
    }
  }

  /**
   * Science-backed campaign optimization with full analysis results
   */
  async generateScienceBackedOptimization(
    input: GenerateOptimizationInput
  ): Promise<ScienceBackedResult<CampaignOptimizationSuggestion[]>> {
    const analysisInput = this.intelligence.mapOptimizationToAnalysisInput(input)
    const { compositeScore, knowledgeContext } = this.intelligence.analyze(analysisInput)

    const enrichedInput: GenerateOptimizationInput = {
      ...input,
      scienceContext: formatScienceContextBlock(knowledgeContext),
    }

    const result = await this.inner.generateCampaignOptimization(enrichedInput)

    return {
      result,
      scienceScore: compositeScore,
      knowledgeContext,
    }
  }
}
