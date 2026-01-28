import type {
  IAIService,
  CampaignOptimizationSuggestion,
  ReportInsight,
  AdCopyVariant,
  GenerateOptimizationInput,
  GenerateReportInsightInput,
  GenerateAdCopyInput,
  GenerateBudgetRecommendationInput,
  BudgetRecommendationResult,
  AIConfig,
  GenerateCreativeVariantsInput,
  CreativeVariant,
} from '@application/ports/IAIService'
import { OpenAIApiError } from '../errors'
import { withRetry } from '@lib/utils/retry'
import { fetchWithTimeout } from '@lib/utils/timeout'
import { withSpan } from '@infrastructure/telemetry'
import {
  buildCampaignOptimizationPrompt,
  CAMPAIGN_OPTIMIZATION_SYSTEM_PROMPT,
  CAMPAIGN_OPTIMIZATION_AI_CONFIG,
} from './prompts/campaignOptimization'
import {
  buildReportInsightPrompt,
  REPORT_INSIGHT_SYSTEM_PROMPT,
  REPORT_INSIGHT_AI_CONFIG,
} from './prompts/reportInsight'
import {
  buildAdCopyPrompt,
  AD_COPY_SYSTEM_PROMPT,
  AD_COPY_AI_CONFIG,
} from './prompts/adCopyGeneration'
import {
  buildBudgetRecommendationPrompt,
  BUDGET_RECOMMENDATION_SYSTEM_PROMPT,
} from './prompts/budgetRecommendation'
import {
  buildCreativeTestDesignPrompt,
  CREATIVE_TEST_DESIGN_SYSTEM_PROMPT,
  CREATIVE_TEST_DESIGN_AI_CONFIG,
} from './prompts/creativeTestDesign'
import {
  buildCompetitorTrendsPrompt,
  buildCompetitorInsightsPrompt,
  COMPETITOR_TRENDS_AI_CONFIG,
  COMPETITOR_INSIGHTS_AI_CONFIG,
} from './prompts/competitorAnalysis'
import type { CompetitorAd } from '@application/services/CompetitorAnalysisService'

const OPENAI_API_BASE = 'https://api.openai.com/v1'
const OPENAI_TIMEOUT_MS = 60000 // 60 seconds for LLM responses

const BUDGET_RECOMMENDATION_AI_CONFIG: AIConfig = {
  model: 'gpt-4o-mini',
  temperature: 0.5,
  maxTokens: 2000,
}

interface OpenAIError {
  error: {
    message: string
    type?: string
    code?: string
  }
}

interface ChatCompletionResponse {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class AIService implements IAIService {
  private readonly apiKey: string
  private readonly model: string

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    this.apiKey = apiKey
    this.model = model
  }

  async chatCompletion(
    systemPrompt: string,
    userPrompt: string,
    config?: AIConfig
  ): Promise<string> {
    // 설정값 적용: config > 기본값
    const finalModel = config?.model ?? this.model
    const finalTemperature = config?.temperature ?? 0.7
    const finalMaxTokens = config?.maxTokens ?? 2000
    const finalTopP = config?.topP ?? 1

    const response = await this.requestWithRetry<ChatCompletionResponse>(
      '/chat/completions',
      {
        method: 'POST',
        body: JSON.stringify({
          model: finalModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: finalTemperature,
          max_tokens: finalMaxTokens,
          top_p: finalTopP,
        }),
      }
    )

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new OpenAIApiError('Empty response from OpenAI', 'empty_response')
    }

    return content
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${OPENAI_API_BASE}${endpoint}`
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    }

    const response = await fetchWithTimeout(url, { ...options, headers }, OPENAI_TIMEOUT_MS)
    const data = await response.json()

    if (!response.ok || (data as OpenAIError).error) {
      const error = (data as OpenAIError).error
      throw new OpenAIApiError(
        error?.message || 'Unknown OpenAI API error',
        error?.type,
        response.status
      )
    }

    return data as T
  }

  private async requestWithRetry<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    return withRetry(() => this.request<T>(endpoint, options), {
      maxAttempts: 3,
      initialDelayMs: 100,
      shouldRetry: (error) => {
        if (error instanceof OpenAIApiError) {
          return OpenAIApiError.isTransientError(error)
        }
        return false
      },
    })
  }

  private parseJsonResponse<T>(content: string): T {
    // Extract JSON from potential markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim()

    try {
      return JSON.parse(jsonStr) as T
    } catch {
      throw new OpenAIApiError(
        `Failed to parse response as JSON: ${content.substring(0, 100)}...`,
        'parse_error'
      )
    }
  }

  async generateCampaignOptimization(
    input: GenerateOptimizationInput
  ): Promise<CampaignOptimizationSuggestion[]> {
    return withSpan(
      'openai.generateCampaignOptimization',
      async () => {
        const prompt = buildCampaignOptimizationPrompt(input)
        const response = await this.chatCompletion(
          CAMPAIGN_OPTIMIZATION_SYSTEM_PROMPT,
          prompt,
          CAMPAIGN_OPTIMIZATION_AI_CONFIG
        )

        return this.parseJsonResponse<CampaignOptimizationSuggestion[]>(response)
      },
      {
        'openai.model': CAMPAIGN_OPTIMIZATION_AI_CONFIG.model || this.model,
        'openai.operation': 'campaign_optimization',
      }
    )
  }

  async generateReportInsights(
    input: GenerateReportInsightInput
  ): Promise<ReportInsight> {
    return withSpan(
      'openai.generateReportInsights',
      async () => {
        const prompt = buildReportInsightPrompt(input)
        const response = await this.chatCompletion(
          REPORT_INSIGHT_SYSTEM_PROMPT,
          prompt,
          REPORT_INSIGHT_AI_CONFIG
        )

        return this.parseJsonResponse<ReportInsight>(response)
      },
      {
        'openai.model': REPORT_INSIGHT_AI_CONFIG.model || this.model,
        'openai.operation': 'report_insights',
      }
    )
  }

  async generateAdCopy(input: GenerateAdCopyInput): Promise<AdCopyVariant[]> {
    return withSpan(
      'openai.generateAdCopy',
      async () => {
        const prompt = buildAdCopyPrompt(input)
        const response = await this.chatCompletion(
          AD_COPY_SYSTEM_PROMPT,
          prompt,
          AD_COPY_AI_CONFIG
        )

        return this.parseJsonResponse<AdCopyVariant[]>(response)
      },
      {
        'openai.model': AD_COPY_AI_CONFIG.model || this.model,
        'openai.operation': 'ad_copy',
      }
    )
  }

  async generateBudgetRecommendation(
    input: GenerateBudgetRecommendationInput
  ): Promise<BudgetRecommendationResult> {
    return withSpan(
      'openai.generateBudgetRecommendation',
      async () => {
        const prompt = buildBudgetRecommendationPrompt(input)
        const response = await this.chatCompletion(
          BUDGET_RECOMMENDATION_SYSTEM_PROMPT,
          prompt,
          BUDGET_RECOMMENDATION_AI_CONFIG
        )

        return this.parseJsonResponse<BudgetRecommendationResult>(response)
      },
      {
        'openai.model': BUDGET_RECOMMENDATION_AI_CONFIG.model || this.model,
        'openai.operation': 'budget_recommendation',
      }
    )
  }

  async generateCreativeVariants(
    input: GenerateCreativeVariantsInput
  ): Promise<CreativeVariant[]> {
    const prompt = buildCreativeTestDesignPrompt(input)
    const response = await this.chatCompletion(
      CREATIVE_TEST_DESIGN_SYSTEM_PROMPT,
      prompt,
      CREATIVE_TEST_DESIGN_AI_CONFIG
    )

    return this.parseJsonResponse<CreativeVariant[]>(response)
  }

  async analyzeCompetitorTrends(input: {
    ads: CompetitorAd[]
    industry?: string
  }): Promise<{
    popularHooks: string[]
    commonOffers: string[]
    formatDistribution: { format: string; percentage: number }[]
  }> {
    const prompt = buildCompetitorTrendsPrompt(input)
    const response = await this.chatCompletion(
      'You are an expert ad analyst specializing in Korean commerce market.',
      prompt,
      COMPETITOR_TRENDS_AI_CONFIG
    )

    return this.parseJsonResponse<{
      popularHooks: string[]
      commonOffers: string[]
      formatDistribution: { format: string; percentage: number }[]
    }>(response)
  }

  async generateCompetitorInsights(input: {
    competitors: Array<{
      pageName: string
      adCount: number
      dominantFormats: string[]
      commonHooks: string[]
      averageAdLifespan: number
    }>
    trends: {
      popularHooks: string[]
      commonOffers: string[]
      formatDistribution: { format: string; percentage: number }[]
    }
    industry?: string
  }): Promise<string[]> {
    const prompt = buildCompetitorInsightsPrompt(input)
    const response = await this.chatCompletion(
      'You are an expert ad strategist specializing in Korean commerce market.',
      prompt,
      COMPETITOR_INSIGHTS_AI_CONFIG
    )

    return this.parseJsonResponse<string[]>(response)
  }
}
