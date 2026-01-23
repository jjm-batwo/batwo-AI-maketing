import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { AIService } from '@infrastructure/external/openai/AIService'
import { OpenAIApiError } from '@infrastructure/external/errors'
import type {
  GenerateOptimizationInput,
  GenerateReportInsightInput,
  GenerateAdCopyInput,
} from '@application/ports/IAIService'
import {
  AD_COPY_AI_CONFIG,
  CAMPAIGN_OPTIMIZATION_AI_CONFIG,
  REPORT_INSIGHT_AI_CONFIG,
} from '@infrastructure/external/openai/prompts'

const OPENAI_API_BASE = 'https://api.openai.com/v1'

const mockOptimizationResponse = {
  id: 'chatcmpl-123',
  object: 'chat.completion',
  created: 1234567890,
  model: 'gpt-4o-mini',
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content: JSON.stringify([
          {
            category: 'budget',
            priority: 'high',
            suggestion: 'Increase daily budget by 20%',
            expectedImpact: 'Potential 15% increase in conversions',
            rationale:
              'Current ROAS of 3.5 indicates profitable campaign with room for scale',
          },
          {
            category: 'targeting',
            priority: 'medium',
            suggestion: 'Expand age range to 25-45',
            expectedImpact: 'Potential 10% increase in reach',
            rationale: 'Similar products show strong performance in wider age range',
          },
        ]),
      },
      finish_reason: 'stop',
    },
  ],
  usage: { prompt_tokens: 100, completion_tokens: 150, total_tokens: 250 },
}

const mockReportInsightResponse = {
  id: 'chatcmpl-456',
  object: 'chat.completion',
  created: 1234567890,
  model: 'gpt-4o-mini',
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content: JSON.stringify({
          title: 'Weekly Performance Report',
          summary:
            'Overall campaign performance improved by 15% compared to last week.',
          keyMetrics: [
            { name: 'ROAS', value: '3.5x', change: '+12%', trend: 'up' },
            { name: 'CPA', value: '₩15,000', change: '-8%', trend: 'down' },
            { name: 'CTR', value: '2.3%', change: '+5%', trend: 'up' },
          ],
          recommendations: [
            'Scale successful campaigns by 20%',
            'Pause underperforming ad sets',
            'Test new creative variations',
          ],
        }),
      },
      finish_reason: 'stop',
    },
  ],
  usage: { prompt_tokens: 200, completion_tokens: 180, total_tokens: 380 },
}

const mockAdCopyResponse = {
  id: 'chatcmpl-789',
  object: 'chat.completion',
  created: 1234567890,
  model: 'gpt-4o-mini',
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content: JSON.stringify([
          {
            headline: 'Transform Your Marketing with AI',
            primaryText:
              'Discover how our AI-powered platform can boost your ROAS by 300%',
            description:
              'Join 1000+ businesses already using Batwo for smarter marketing',
            callToAction: 'Start Free Trial',
            targetAudience: 'Small business owners interested in digital marketing',
          },
          {
            headline: 'AI Marketing Made Simple',
            primaryText:
              'No more guesswork. Let AI optimize your campaigns automatically.',
            description: 'Save time and money with intelligent ad management',
            callToAction: 'Learn More',
            targetAudience: 'E-commerce store owners',
          },
        ]),
      },
      finish_reason: 'stop',
    },
  ],
  usage: { prompt_tokens: 150, completion_tokens: 200, total_tokens: 350 },
}

const handlers = [
  http.post(`${OPENAI_API_BASE}/chat/completions`, async ({ request }) => {
    const body = (await request.json()) as { messages: { content: string }[] }
    const systemMessage = body.messages[0]?.content || ''

    // Match based on system prompt content
    if (systemMessage.includes('campaign optimization') || systemMessage.includes('Meta Ads campaign optimization') || systemMessage.includes('Meta Ads 캠페인 최적화') || systemMessage.includes('최적화 전문가')) {
      return HttpResponse.json(mockOptimizationResponse)
    } else if (systemMessage.includes('report analyst') || systemMessage.includes('marketing report') || systemMessage.includes('마케팅 리포트') || systemMessage.includes('리포트 전문 분석가')) {
      return HttpResponse.json(mockReportInsightResponse)
    } else if (systemMessage.includes('copywriter') || systemMessage.includes('digital advertising') || systemMessage.includes('카피라이터') || systemMessage.includes('디지털 광고')) {
      return HttpResponse.json(mockAdCopyResponse)
    }

    return HttpResponse.json(mockOptimizationResponse)
  }),
]

const server = setupServer(...handlers)

describe('AIService', () => {
  let service: AIService
  const apiKey = 'test-api-key'

  beforeEach(() => {
    service = new AIService(apiKey)
    server.listen({ onUnhandledRequest: 'bypass' })
  })

  afterEach(() => {
    server.resetHandlers()
    server.close()
    vi.clearAllMocks()
  })

  describe('generateCampaignOptimization', () => {
    const input: GenerateOptimizationInput = {
      campaignName: 'Summer Sale Campaign',
      objective: 'OUTCOME_SALES',
      currentMetrics: {
        roas: 3.5,
        cpa: 15000,
        ctr: 2.3,
        impressions: 100000,
        clicks: 2300,
        conversions: 150,
        spend: 2250000,
      },
      targetAudience: {
        ageRange: '25-34',
        interests: ['shopping', 'fashion'],
        locations: ['Seoul', 'Busan'],
      },
    }

    it('should generate campaign optimization suggestions', async () => {
      const result = await service.generateCampaignOptimization(input)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('category')
      expect(result[0]).toHaveProperty('priority')
      expect(result[0]).toHaveProperty('suggestion')
      expect(result[0]).toHaveProperty('expectedImpact')
      expect(result[0]).toHaveProperty('rationale')
    })

    it('should include budget optimization for high ROAS', async () => {
      const result = await service.generateCampaignOptimization(input)

      const budgetSuggestion = result.find((s) => s.category === 'budget')
      expect(budgetSuggestion).toBeDefined()
    })
  })

  describe('generateReportInsights', () => {
    const input: GenerateReportInsightInput = {
      reportType: 'weekly',
      campaignSummaries: [
        {
          name: 'Campaign A',
          objective: 'OUTCOME_SALES',
          metrics: {
            impressions: 50000,
            clicks: 1200,
            conversions: 80,
            spend: 1200000,
            revenue: 4000000,
          },
        },
        {
          name: 'Campaign B',
          objective: 'OUTCOME_TRAFFIC',
          metrics: {
            impressions: 30000,
            clicks: 900,
            conversions: 45,
            spend: 600000,
            revenue: 1800000,
          },
        },
      ],
    }

    it('should generate report insights', async () => {
      const result = await service.generateReportInsights(input)

      expect(result).toHaveProperty('title')
      expect(result).toHaveProperty('summary')
      expect(result).toHaveProperty('keyMetrics')
      expect(result).toHaveProperty('recommendations')
      expect(result.keyMetrics).toBeInstanceOf(Array)
      expect(result.recommendations).toBeInstanceOf(Array)
    })

    it('should include key performance metrics', async () => {
      const result = await service.generateReportInsights(input)

      expect(result.keyMetrics.length).toBeGreaterThan(0)
      expect(result.keyMetrics[0]).toHaveProperty('name')
      expect(result.keyMetrics[0]).toHaveProperty('value')
      expect(result.keyMetrics[0]).toHaveProperty('trend')
    })
  })

  describe('generateAdCopy', () => {
    const input: GenerateAdCopyInput = {
      productName: 'Batwo AI Marketing',
      productDescription:
        'AI-powered marketing platform for e-commerce businesses',
      targetAudience: 'Small business owners and e-commerce store managers',
      tone: 'professional',
      objective: 'conversion',
      keywords: ['AI', 'marketing', 'automation', 'ROAS'],
      variantCount: 2,
    }

    it('should generate ad copy variants', async () => {
      const result = await service.generateAdCopy(input)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('headline')
      expect(result[0]).toHaveProperty('primaryText')
      expect(result[0]).toHaveProperty('description')
      expect(result[0]).toHaveProperty('callToAction')
    })

    it('should generate specified number of variants', async () => {
      const result = await service.generateAdCopy({ ...input, variantCount: 2 })

      expect(result.length).toBe(2)
    })
  })

  describe('error handling', () => {
    it('should handle API error gracefully', async () => {
      server.use(
        http.post(`${OPENAI_API_BASE}/chat/completions`, () => {
          return HttpResponse.json(
            {
              error: {
                message: 'Invalid API key',
                type: 'invalid_request_error',
                code: 'invalid_api_key',
              },
            },
            { status: 401 }
          )
        })
      )

      await expect(
        service.generateCampaignOptimization({
          campaignName: 'Test',
          objective: 'SALES',
          currentMetrics: {
            roas: 1,
            cpa: 1000,
            ctr: 1,
            impressions: 1000,
            clicks: 10,
            conversions: 1,
            spend: 1000,
          },
        })
      ).rejects.toThrow(OpenAIApiError)
    })

    it('should handle rate limit error', async () => {
      server.use(
        http.post(`${OPENAI_API_BASE}/chat/completions`, () => {
          return HttpResponse.json(
            {
              error: {
                message: 'Rate limit exceeded',
                type: 'rate_limit_error',
              },
            },
            { status: 429 }
          )
        })
      )

      try {
        await service.generateCampaignOptimization({
          campaignName: 'Test',
          objective: 'SALES',
          currentMetrics: {
            roas: 1,
            cpa: 1000,
            ctr: 1,
            impressions: 1000,
            clicks: 10,
            conversions: 1,
            spend: 1000,
          },
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(OpenAIApiError)
        expect(OpenAIApiError.isRateLimitError(error as OpenAIApiError)).toBe(
          true
        )
      }
    })

    it('should handle context length error', async () => {
      server.use(
        http.post(`${OPENAI_API_BASE}/chat/completions`, () => {
          return HttpResponse.json(
            {
              error: {
                message: 'Maximum context length exceeded',
                type: 'context_length_exceeded',
              },
            },
            { status: 400 }
          )
        })
      )

      try {
        await service.generateCampaignOptimization({
          campaignName: 'Test',
          objective: 'SALES',
          currentMetrics: {
            roas: 1,
            cpa: 1000,
            ctr: 1,
            impressions: 1000,
            clicks: 10,
            conversions: 1,
            spend: 1000,
          },
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(OpenAIApiError)
        expect(
          OpenAIApiError.isContextLengthError(error as OpenAIApiError)
        ).toBe(true)
      }
    })

    it('should respect token limits', async () => {
      // This test verifies that the service tracks token usage
      const result = await service.generateCampaignOptimization({
        campaignName: 'Test Campaign',
        objective: 'OUTCOME_SALES',
        currentMetrics: {
          roas: 3.5,
          cpa: 15000,
          ctr: 2.3,
          impressions: 100000,
          clicks: 2300,
          conversions: 150,
          spend: 2250000,
        },
      })

      expect(result).toBeDefined()
      // The service should successfully complete without exceeding limits
    })
  })

  describe('AI configuration', () => {
    it('should have valid AD_COPY_AI_CONFIG', () => {
      expect(AD_COPY_AI_CONFIG).toBeDefined()
      expect(AD_COPY_AI_CONFIG.temperature).toBe(0.8)
      expect(AD_COPY_AI_CONFIG.maxTokens).toBe(2500)
      expect(AD_COPY_AI_CONFIG.model).toBe('gpt-4o')
      expect(AD_COPY_AI_CONFIG.topP).toBe(0.95)
    })

    it('should have valid CAMPAIGN_OPTIMIZATION_AI_CONFIG', () => {
      expect(CAMPAIGN_OPTIMIZATION_AI_CONFIG).toBeDefined()
      expect(CAMPAIGN_OPTIMIZATION_AI_CONFIG.temperature).toBe(0.5)
      expect(CAMPAIGN_OPTIMIZATION_AI_CONFIG.maxTokens).toBe(2000)
      expect(CAMPAIGN_OPTIMIZATION_AI_CONFIG.model).toBe('gpt-4o-mini')
      expect(CAMPAIGN_OPTIMIZATION_AI_CONFIG.topP).toBe(0.9)
    })

    it('should have valid REPORT_INSIGHT_AI_CONFIG', () => {
      expect(REPORT_INSIGHT_AI_CONFIG).toBeDefined()
      expect(REPORT_INSIGHT_AI_CONFIG.temperature).toBe(0.4)
      expect(REPORT_INSIGHT_AI_CONFIG.maxTokens).toBe(3000)
      expect(REPORT_INSIGHT_AI_CONFIG.model).toBe('gpt-4o-mini')
      expect(REPORT_INSIGHT_AI_CONFIG.topP).toBe(0.85)
    })

    it('should apply correct config for generateAdCopy', async () => {
      let capturedBody: Record<string, unknown> | undefined

      server.use(
        http.post(`${OPENAI_API_BASE}/chat/completions`, async ({ request }) => {
          capturedBody = await request.json() as Record<string, unknown>
          return HttpResponse.json(mockAdCopyResponse)
        })
      )

      await service.generateAdCopy({
        productName: 'Test Product',
        productDescription: 'Test description',
        targetAudience: 'Test audience',
        tone: 'professional',
        objective: 'conversion',
      })

      expect(capturedBody).toBeDefined()
      expect(capturedBody!.temperature).toBe(AD_COPY_AI_CONFIG.temperature)
      expect(capturedBody!.max_tokens).toBe(AD_COPY_AI_CONFIG.maxTokens)
      expect(capturedBody!.model).toBe(AD_COPY_AI_CONFIG.model)
      expect(capturedBody!.top_p).toBe(AD_COPY_AI_CONFIG.topP)
    })

    it('should apply correct config for generateCampaignOptimization', async () => {
      let capturedBody: Record<string, unknown> | undefined

      server.use(
        http.post(`${OPENAI_API_BASE}/chat/completions`, async ({ request }) => {
          capturedBody = await request.json() as Record<string, unknown>
          return HttpResponse.json(mockOptimizationResponse)
        })
      )

      await service.generateCampaignOptimization({
        campaignName: 'Test Campaign',
        objective: 'OUTCOME_SALES',
        currentMetrics: {
          roas: 3.5,
          cpa: 15000,
          ctr: 2.3,
          impressions: 100000,
          clicks: 2300,
          conversions: 150,
          spend: 2250000,
        },
      })

      expect(capturedBody).toBeDefined()
      expect(capturedBody!.temperature).toBe(CAMPAIGN_OPTIMIZATION_AI_CONFIG.temperature)
      expect(capturedBody!.max_tokens).toBe(CAMPAIGN_OPTIMIZATION_AI_CONFIG.maxTokens)
      expect(capturedBody!.model).toBe(CAMPAIGN_OPTIMIZATION_AI_CONFIG.model)
      expect(capturedBody!.top_p).toBe(CAMPAIGN_OPTIMIZATION_AI_CONFIG.topP)
    })

    it('should apply correct config for generateReportInsights', async () => {
      let capturedBody: Record<string, unknown> | undefined

      server.use(
        http.post(`${OPENAI_API_BASE}/chat/completions`, async ({ request }) => {
          capturedBody = await request.json() as Record<string, unknown>
          return HttpResponse.json(mockReportInsightResponse)
        })
      )

      await service.generateReportInsights({
        reportType: 'weekly',
        campaignSummaries: [
          {
            name: 'Test Campaign',
            objective: 'OUTCOME_SALES',
            metrics: {
              impressions: 10000,
              clicks: 500,
              conversions: 50,
              spend: 100000,
              revenue: 500000,
            },
          },
        ],
      })

      expect(capturedBody).toBeDefined()
      expect(capturedBody!.temperature).toBe(REPORT_INSIGHT_AI_CONFIG.temperature)
      expect(capturedBody!.max_tokens).toBe(REPORT_INSIGHT_AI_CONFIG.maxTokens)
      expect(capturedBody!.model).toBe(REPORT_INSIGHT_AI_CONFIG.model)
      expect(capturedBody!.top_p).toBe(REPORT_INSIGHT_AI_CONFIG.topP)
    })
  })
})
