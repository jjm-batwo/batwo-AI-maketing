import type {
  IAIService,
  CampaignOptimizationSuggestion,
  ReportInsight,
  AdCopyVariant,
  GenerateOptimizationInput,
  GenerateReportInsightInput,
  GenerateAdCopyInput,
  AIConfig,
} from '@application/ports/IAIService'
import { OpenAIApiError } from '../errors'
import { withRetry } from '@lib/utils/retry'
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

const OPENAI_API_BASE = 'https://api.openai.com/v1'

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

  private async chatCompletion(
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

    const response = await fetch(url, { ...options, headers })
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
    const prompt = buildCampaignOptimizationPrompt(input)
    const response = await this.chatCompletion(
      CAMPAIGN_OPTIMIZATION_SYSTEM_PROMPT,
      prompt,
      CAMPAIGN_OPTIMIZATION_AI_CONFIG
    )

    return this.parseJsonResponse<CampaignOptimizationSuggestion[]>(response)
  }

  async generateReportInsights(
    input: GenerateReportInsightInput
  ): Promise<ReportInsight> {
    const prompt = buildReportInsightPrompt(input)
    const response = await this.chatCompletion(
      REPORT_INSIGHT_SYSTEM_PROMPT,
      prompt,
      REPORT_INSIGHT_AI_CONFIG
    )

    return this.parseJsonResponse<ReportInsight>(response)
  }

  async generateAdCopy(input: GenerateAdCopyInput): Promise<AdCopyVariant[]> {
    const prompt = buildAdCopyPrompt(input)
    const response = await this.chatCompletion(
      AD_COPY_SYSTEM_PROMPT,
      prompt,
      AD_COPY_AI_CONFIG
    )

    return this.parseJsonResponse<AdCopyVariant[]>(response)
  }
}
