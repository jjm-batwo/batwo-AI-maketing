/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ScienceAIService } from '@infrastructure/external/openai/ScienceAIService'
import type {
  IAIService,
  GenerateAdCopyInput,
  GenerateOptimizationInput,
  GenerateReportInsightInput,
  GenerateBudgetRecommendationInput,
  GenerateCreativeVariantsInput,
} from '@application/ports/IAIService'
import type { MarketingIntelligenceService } from '@application/services/MarketingIntelligenceService'

describe('ScienceAIService', () => {
  let mockInner: IAIService
  let mockIntelligence: any
  let service: ScienceAIService

  const mockCompositeScore = {
    overall: 80,
    grade: 'A' as const,
    domainScores: [],
    analyzedDomains: [],
    failedDomains: [],
    topRecommendations: [],
    totalCitations: [],
    summary: 'Test summary',
  }

  const mockAdCopyVariants = [
    {
      headline: 'Test Headline',
      primaryText: 'Test Primary Text',
      description: 'Test Description',
      callToAction: 'CTA',
    },
  ]

  const mockOptimizationSuggestions = [
    {
      category: 'budget' as const,
      suggestion: 'Test Suggestion',
      impact: 'high' as const,
      priority: 1,
    },
  ]

  const mockKnowledgeContext = [
    {
      domain: 'psychology' as const,
      principles: ['Principle 1'],
      citations: ['Citation 1'],
      relevanceScore: 0.8,
    },
  ]

  beforeEach(() => {
    // Mock inner IAIService
    mockInner = {
      generateCampaignOptimization: vi.fn().mockResolvedValue(mockOptimizationSuggestions),
      generateReportInsights: vi.fn().mockResolvedValue({ summary: 'Test' }),
      generateAdCopy: vi.fn().mockResolvedValue(mockAdCopyVariants),
      generateBudgetRecommendation: vi.fn().mockResolvedValue({ recommendation: 'Test' }),
      generateCreativeVariants: vi.fn().mockResolvedValue([]),
      chatCompletion: vi.fn().mockResolvedValue('Chat response'),
    }

    // Mock MarketingIntelligenceService
    mockIntelligence = {
      enrichOptimizationInput: vi.fn((input) => ({ ...input, scienceContext: 'enriched' })),
      enrichAdCopyInput: vi.fn((input) => ({ ...input, scienceContext: 'enriched' })),
      enrichCreativeInput: vi.fn((input) => ({ ...input, scienceContext: 'enriched' })),
      mapAdCopyToAnalysisInput: vi.fn().mockReturnValue({}),
      mapOptimizationToAnalysisInput: vi.fn().mockReturnValue({}),
      analyze: vi.fn().mockReturnValue({
        compositeScore: mockCompositeScore,
        knowledgeContext: mockKnowledgeContext,
      }),
    }

    service = new ScienceAIService(
      mockInner,
      mockIntelligence as unknown as MarketingIntelligenceService
    )
  })

  describe('generateCampaignOptimization', () => {
    it('intelligence.enrichOptimizationInput을 호출해야 한다', async () => {
      const input: GenerateOptimizationInput = {
        campaignData: {
          id: 'test-campaign',
          name: 'Test Campaign',
          objective: 'CONVERSIONS',
          status: 'ACTIVE',
          budget: 100000,
          spend: 50000,
          impressions: 10000,
          clicks: 500,
          conversions: 50,
        },
      }

      await service.generateCampaignOptimization(input)

      expect(mockIntelligence.enrichOptimizationInput).toHaveBeenCalledWith(input)
    })

    it('강화된 입력으로 inner.generateCampaignOptimization을 호출해야 한다', async () => {
      const input: GenerateOptimizationInput = {
        campaignData: {
          id: 'test-campaign',
          name: 'Test Campaign',
          objective: 'CONVERSIONS',
          status: 'ACTIVE',
          budget: 100000,
          spend: 50000,
          impressions: 10000,
          clicks: 500,
          conversions: 50,
        },
      }

      const result = await service.generateCampaignOptimization(input)

      expect(mockInner.generateCampaignOptimization).toHaveBeenCalledWith({
        ...input,
        scienceContext: 'enriched',
      })
      expect(result).toEqual(mockOptimizationSuggestions)
    })
  })

  describe('generateAdCopy', () => {
    it('intelligence.enrichAdCopyInput을 호출해야 한다', async () => {
      const input: GenerateAdCopyInput = {
        productName: 'Test Product',
        targetAudience: 'Young Adults',
        objective: 'CONVERSIONS',
      }

      await service.generateAdCopy(input)

      expect(mockIntelligence.enrichAdCopyInput).toHaveBeenCalledWith(input)
    })

    it('강화된 입력으로 inner.generateAdCopy를 호출해야 한다', async () => {
      const input: GenerateAdCopyInput = {
        productName: 'Test Product',
        targetAudience: 'Young Adults',
        objective: 'CONVERSIONS',
      }

      const result = await service.generateAdCopy(input)

      expect(mockInner.generateAdCopy).toHaveBeenCalledWith({
        ...input,
        scienceContext: 'enriched',
      })
      expect(result).toEqual(mockAdCopyVariants)
    })
  })

  describe('generateReportInsights', () => {
    it('intelligence를 사용하지 않고 inner에 직접 위임해야 한다', async () => {
      const input: GenerateReportInsightInput = {
        reportData: {
          period: { start: new Date(), end: new Date() },
          metrics: { impressions: 1000, clicks: 50, conversions: 5 },
        },
      }

      const result = await service.generateReportInsights(input)

      expect(mockIntelligence.enrichOptimizationInput).not.toHaveBeenCalled()
      expect(mockIntelligence.enrichAdCopyInput).not.toHaveBeenCalled()
      expect(mockInner.generateReportInsights).toHaveBeenCalledWith(input)
      expect(result).toEqual({ summary: 'Test' })
    })
  })

  describe('generateBudgetRecommendation', () => {
    it('intelligence를 사용하지 않고 inner에 직접 위임해야 한다', async () => {
      const input: GenerateBudgetRecommendationInput = {
        campaignData: {
          id: 'test-campaign',
          name: 'Test Campaign',
          objective: 'CONVERSIONS',
          status: 'ACTIVE',
          budget: 100000,
          spend: 50000,
          impressions: 10000,
          clicks: 500,
          conversions: 50,
        },
      }

      const result = await service.generateBudgetRecommendation(input)

      expect(mockIntelligence.enrichOptimizationInput).not.toHaveBeenCalled()
      expect(mockIntelligence.enrichAdCopyInput).not.toHaveBeenCalled()
      expect(mockInner.generateBudgetRecommendation).toHaveBeenCalledWith(input)
      expect(result).toEqual({ recommendation: 'Test' })
    })
  })

  describe('generateCreativeVariants', () => {
    it('intelligence.enrichCreativeInput을 호출해야 한다', async () => {
      const input: GenerateCreativeVariantsInput = {
        baseCreative: {
          headline: 'Original Headline',
          primaryText: 'Original Text',
        },
        variations: 3,
      }

      await service.generateCreativeVariants(input)

      expect(mockIntelligence.enrichCreativeInput).toHaveBeenCalledWith(input)
    })

    it('강화된 입력으로 inner.generateCreativeVariants를 호출해야 한다', async () => {
      const input: GenerateCreativeVariantsInput = {
        baseCreative: {
          headline: 'Original Headline',
          primaryText: 'Original Text',
        },
        variations: 3,
      }

      const result = await service.generateCreativeVariants(input)

      expect(mockInner.generateCreativeVariants).toHaveBeenCalledWith({
        ...input,
        scienceContext: 'enriched',
      })
      expect(result).toEqual([])
    })
  })

  describe('chatCompletion', () => {
    it('inner.chatCompletion에 직접 위임해야 한다', async () => {
      const systemPrompt = 'System prompt'
      const userPrompt = 'User prompt'
      const config = { temperature: 0.7, maxTokens: 1000 }

      const result = await service.chatCompletion(systemPrompt, userPrompt, config)

      expect(mockInner.chatCompletion).toHaveBeenCalledWith(systemPrompt, userPrompt, config)
      expect(result).toBe('Chat response')
    })

    it('config 없이도 동작해야 한다', async () => {
      const systemPrompt = 'System prompt'
      const userPrompt = 'User prompt'

      const result = await service.chatCompletion(systemPrompt, userPrompt)

      expect(mockInner.chatCompletion).toHaveBeenCalledWith(systemPrompt, userPrompt, undefined)
      expect(result).toBe('Chat response')
    })
  })

  describe('generateScienceBackedAdCopy', () => {
    it('mapAdCopyToAnalysisInput과 analyze를 호출해야 한다', async () => {
      const input: GenerateAdCopyInput = {
        productName: 'Test Product',
        targetAudience: 'Young Adults',
        objective: 'CONVERSIONS',
      }

      await service.generateScienceBackedAdCopy(input)

      expect(mockIntelligence.mapAdCopyToAnalysisInput).toHaveBeenCalledWith(input)
      expect(mockIntelligence.analyze).toHaveBeenCalled()
    })

    it('과학 점수와 함께 결과를 반환해야 한다', async () => {
      const input: GenerateAdCopyInput = {
        productName: 'Test Product',
        targetAudience: 'Young Adults',
        objective: 'CONVERSIONS',
      }

      const result = await service.generateScienceBackedAdCopy(input)

      expect(result).toEqual({
        result: mockAdCopyVariants,
        scienceScore: mockCompositeScore,
        knowledgeContext: mockKnowledgeContext,
      })
    })

    it('result, scienceScore, knowledgeContext를 포함해야 한다', async () => {
      const input: GenerateAdCopyInput = {
        productName: 'Test Product',
        targetAudience: 'Young Adults',
        objective: 'CONVERSIONS',
      }

      const result = await service.generateScienceBackedAdCopy(input)

      expect(result).toHaveProperty('result')
      expect(result).toHaveProperty('scienceScore')
      expect(result).toHaveProperty('knowledgeContext')
      expect(result.result).toEqual(mockAdCopyVariants)
      expect(result.scienceScore).toEqual(mockCompositeScore)
      expect(result.knowledgeContext).toEqual(mockKnowledgeContext)
    })

    it('formatScienceContextBlock이 적용된 enrichedInput으로 inner를 호출해야 한다', async () => {
      const input: GenerateAdCopyInput = {
        productName: 'Test Product',
        targetAudience: 'Young Adults',
        objective: 'CONVERSIONS',
      }

      await service.generateScienceBackedAdCopy(input)

      const callArgs = (mockInner.generateAdCopy as any).mock.calls[0][0]
      expect(callArgs).toHaveProperty('scienceContext')
      expect(typeof callArgs.scienceContext).toBe('string')
    })
  })

  describe('generateScienceBackedOptimization', () => {
    it('mapOptimizationToAnalysisInput과 analyze를 호출해야 한다', async () => {
      const input: GenerateOptimizationInput = {
        campaignData: {
          id: 'test-campaign',
          name: 'Test Campaign',
          objective: 'CONVERSIONS',
          status: 'ACTIVE',
          budget: 100000,
          spend: 50000,
          impressions: 10000,
          clicks: 500,
          conversions: 50,
        },
      }

      await service.generateScienceBackedOptimization(input)

      expect(mockIntelligence.mapOptimizationToAnalysisInput).toHaveBeenCalledWith(input)
      expect(mockIntelligence.analyze).toHaveBeenCalled()
    })

    it('과학 점수와 함께 결과를 반환해야 한다', async () => {
      const input: GenerateOptimizationInput = {
        campaignData: {
          id: 'test-campaign',
          name: 'Test Campaign',
          objective: 'CONVERSIONS',
          status: 'ACTIVE',
          budget: 100000,
          spend: 50000,
          impressions: 10000,
          clicks: 500,
          conversions: 50,
        },
      }

      const result = await service.generateScienceBackedOptimization(input)

      expect(result).toEqual({
        result: mockOptimizationSuggestions,
        scienceScore: mockCompositeScore,
        knowledgeContext: mockKnowledgeContext,
      })
    })

    it('result, scienceScore, knowledgeContext를 포함해야 한다', async () => {
      const input: GenerateOptimizationInput = {
        campaignData: {
          id: 'test-campaign',
          name: 'Test Campaign',
          objective: 'CONVERSIONS',
          status: 'ACTIVE',
          budget: 100000,
          spend: 50000,
          impressions: 10000,
          clicks: 500,
          conversions: 50,
        },
      }

      const result = await service.generateScienceBackedOptimization(input)

      expect(result).toHaveProperty('result')
      expect(result).toHaveProperty('scienceScore')
      expect(result).toHaveProperty('knowledgeContext')
      expect(result.result).toEqual(mockOptimizationSuggestions)
      expect(result.scienceScore).toEqual(mockCompositeScore)
      expect(result.knowledgeContext).toEqual(mockKnowledgeContext)
    })

    it('formatScienceContextBlock이 적용된 enrichedInput으로 inner를 호출해야 한다', async () => {
      const input: GenerateOptimizationInput = {
        campaignData: {
          id: 'test-campaign',
          name: 'Test Campaign',
          objective: 'CONVERSIONS',
          status: 'ACTIVE',
          budget: 100000,
          spend: 50000,
          impressions: 10000,
          clicks: 500,
          conversions: 50,
        },
      }

      await service.generateScienceBackedOptimization(input)

      const callArgs = (mockInner.generateCampaignOptimization as any).mock.calls[0][0]
      expect(callArgs).toHaveProperty('scienceContext')
      expect(typeof callArgs.scienceContext).toBe('string')
    })
  })
})
