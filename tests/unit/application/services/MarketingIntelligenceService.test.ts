import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MarketingIntelligenceService } from '@/application/services/MarketingIntelligenceService'
import type { IKnowledgeBaseService, AnalysisInput } from '@/application/ports/IKnowledgeBaseService'
import type { GenerateAdCopyInput, GenerateOptimizationInput, GenerateCreativeVariantsInput } from '@/application/ports/IAIService'
import type { CompositeScore } from '@/domain/value-objects/MarketingScience'
import type { IResearchService, ResearchResult } from '@/application/ports/IResearchService'

describe('MarketingIntelligenceService', () => {
  let service: MarketingIntelligenceService
  let mockKnowledgeBase: IKnowledgeBaseService
  let mockResearchService: IResearchService

  const mockCompositeScore: CompositeScore = {
    overall: 75,
    grade: 'B+',
    domainScores: [],
    analyzedDomains: [],
    failedDomains: [],
    topRecommendations: [],
    totalCitations: [],
    summary: 'Test summary',
  }

  const mockResearchResult: ResearchResult = {
    findings: ['Finding 1: AI marketing is growing', 'Finding 2: Korean market is unique'],
    sources: [{ title: 'Source 1', url: 'https://example.com', date: '2024-01-01' }],
    relevanceScore: 0.8,
    cached: false,
  }

  beforeEach(() => {
    mockKnowledgeBase = {
      analyzeAll: vi.fn(),
      getKnowledgeContext: vi.fn(),
    }

    mockResearchService = {
      research: vi.fn().mockResolvedValue(mockResearchResult),
      getMarketTrends: vi.fn().mockResolvedValue({ ...mockResearchResult, trends: [] }),
      getCompetitorIntelligence: vi.fn().mockResolvedValue({ ...mockResearchResult, insights: [] }),
      isAvailable: vi.fn().mockReturnValue(true),
      clearCache: vi.fn(),
    }

    service = new MarketingIntelligenceService(mockKnowledgeBase)
  })

  describe('analyze', () => {
    it('knowledgeBase.analyzeAll을 호출하고 compositeScore와 knowledgeContext를 반환해야 한다', () => {
      const mockInput: AnalysisInput = {
        content: {
          headline: 'Test Headline',
          primaryText: 'Test Primary Text',
          description: 'Test Description',
          callToAction: 'Buy Now',
          brand: 'Test Brand',
        },
        context: {
          targetAudience: '25-40',
          objective: 'conversion',
          tone: 'professional',
          keywords: ['test', 'keyword'],
        },
      }

      const mockOutput = {
        compositeScore: mockCompositeScore,
        knowledgeContext: 'Test knowledge context',
      }

      vi.mocked(mockKnowledgeBase.analyzeAll).mockReturnValue(mockOutput)

      const result = service.analyze(mockInput)

      expect(mockKnowledgeBase.analyzeAll).toHaveBeenCalledWith(mockInput)
      expect(result).toEqual({
        compositeScore: mockCompositeScore,
        knowledgeContext: 'Test knowledge context',
      })
    })
  })

  describe('scoreContent', () => {
    it('compositeScore만 반환해야 한다', () => {
      const mockInput: AnalysisInput = {
        content: {
          headline: 'Test Headline',
          primaryText: 'Test Primary Text',
        },
      }

      const mockOutput = {
        compositeScore: mockCompositeScore,
        knowledgeContext: 'Test knowledge context',
      }

      vi.mocked(mockKnowledgeBase.analyzeAll).mockReturnValue(mockOutput)

      const result = service.scoreContent(mockInput)

      expect(mockKnowledgeBase.analyzeAll).toHaveBeenCalledWith(mockInput)
      expect(result).toEqual(mockCompositeScore)
    })
  })

  describe('getKnowledgeContext', () => {
    it('knowledgeBase.getKnowledgeContext를 호출해야 한다', () => {
      const mockInput: AnalysisInput = {
        content: {
          headline: 'Test Headline',
        },
      }

      vi.mocked(mockKnowledgeBase.getKnowledgeContext).mockReturnValue('Knowledge context string')

      const result = service.getKnowledgeContext(mockInput)

      expect(mockKnowledgeBase.getKnowledgeContext).toHaveBeenCalledWith(mockInput)
      expect(result).toBe('Knowledge context string')
    })
  })

  describe('mapAdCopyToAnalysisInput', () => {
    it('GenerateAdCopyInput을 AnalysisInput으로 올바르게 매핑해야 한다', () => {
      const input: GenerateAdCopyInput = {
        productName: 'Test Product',
        productDescription: 'A great product description',
        targetAudience: '25-35',
        objective: 'conversion',
        tone: 'friendly',
        keywords: ['test', 'product'],
      }

      const result = service.mapAdCopyToAnalysisInput(input)

      expect(result).toEqual({
        content: {
          headline: undefined,
          primaryText: undefined,
          description: 'A great product description',
          callToAction: undefined,
          brand: 'Test Product',
        },
        context: {
          targetAudience: '25-35',
          objective: 'conversion',
          tone: 'friendly',
          keywords: ['test', 'product'],
        },
      })
    })

    it('productDescription을 content.description에 매핑해야 한다', () => {
      const input: GenerateAdCopyInput = {
        productName: 'Product',
        productDescription: 'Description text',
        targetAudience: '25-35',
      }

      const result = service.mapAdCopyToAnalysisInput(input)

      expect(result.content.description).toBe('Description text')
    })

    it('productName을 content.brand에 매핑해야 한다', () => {
      const input: GenerateAdCopyInput = {
        productName: 'Brand Name',
        productDescription: 'Description',
        targetAudience: '25-35',
      }

      const result = service.mapAdCopyToAnalysisInput(input)

      expect(result.content.brand).toBe('Brand Name')
    })
  })

  describe('mapOptimizationToAnalysisInput', () => {
    it('GenerateOptimizationInput을 AnalysisInput으로 올바르게 매핑해야 한다', () => {
      const input: GenerateOptimizationInput = {
        industry: 'fashion',
        objective: 'awareness',
        targetAudience: {
          ageRange: '20-30',
          interests: ['fashion'],
        },
        currentMetrics: {
          ctr: 2.5,
          cvr: 1.5,
          roas: 3.0,
          cpa: 10000,
        },
      }

      const result = service.mapOptimizationToAnalysisInput(input)

      expect(result).toEqual({
        context: {
          industry: 'fashion',
          objective: 'awareness',
          targetAudience: '20-30',
        },
        metrics: {
          ctr: 2.5,
          cvr: 1.5,
          roas: 3.0,
          cpa: 10000,
        },
      })
    })

    it('알 수 없는 objective는 undefined로 처리해야 한다', () => {
      const input: GenerateOptimizationInput = {
        industry: 'tech',
        objective: 'unknown_objective',
        targetAudience: {
          ageRange: '25-40',
        },
        currentMetrics: {
          ctr: 2.0,
          cvr: 1.0,
          roas: 2.5,
          cpa: 15000,
        },
      }

      const result = service.mapOptimizationToAnalysisInput(input)

      expect(result.context.objective).toBeUndefined()
    })

    it('알려진 objective(awareness, consideration, conversion)는 올바르게 매핑해야 한다', () => {
      const testCases = ['awareness', 'consideration', 'conversion'] as const

      testCases.forEach((objective) => {
        const input: GenerateOptimizationInput = {
          industry: 'tech',
          objective,
          targetAudience: {
            ageRange: '25-40',
          },
          currentMetrics: {
            ctr: 2.0,
            cvr: 1.0,
            roas: 2.5,
            cpa: 15000,
          },
        }

        const result = service.mapOptimizationToAnalysisInput(input)

        expect(result.context.objective).toBe(objective)
      })
    })
  })

  describe('mapCreativeToAnalysisInput', () => {
    it('headline 요소를 content.headline에 매핑해야 한다', () => {
      const input: GenerateCreativeVariantsInput = {
        element: 'headline',
        currentText: 'Current Headline',
        targetAudience: '25-40',
        variantCount: 3,
      }

      const result = service.mapCreativeToAnalysisInput(input)

      expect(result.content.headline).toBe('Current Headline')
      expect(result.context.targetAudience).toBe('25-40')
    })

    it('primary_text 요소를 content.primaryText에 매핑해야 한다', () => {
      const input: GenerateCreativeVariantsInput = {
        element: 'primary_text',
        currentText: 'Current Primary Text',
        targetAudience: '30-50',
        variantCount: 5,
      }

      const result = service.mapCreativeToAnalysisInput(input)

      expect(result.content.primaryText).toBe('Current Primary Text')
      expect(result.context.targetAudience).toBe('30-50')
    })

    it('description 요소를 content.description에 매핑해야 한다', () => {
      const input: GenerateCreativeVariantsInput = {
        element: 'description',
        currentText: 'Current Description',
        targetAudience: '20-35',
        variantCount: 3,
      }

      const result = service.mapCreativeToAnalysisInput(input)

      expect(result.content.description).toBe('Current Description')
    })

    it('cta 요소를 content.callToAction에 매핑해야 한다', () => {
      const input: GenerateCreativeVariantsInput = {
        element: 'cta',
        currentText: 'Buy Now',
        targetAudience: '25-45',
        variantCount: 4,
      }

      const result = service.mapCreativeToAnalysisInput(input)

      expect(result.content.callToAction).toBe('Buy Now')
    })
  })

  describe('enrichAdCopyInput', () => {
    it('scienceContext를 추가해야 한다', () => {
      const input: GenerateAdCopyInput = {
        productName: 'Product',
        productDescription: 'Description',
        targetAudience: '25-35',
      }

      vi.mocked(mockKnowledgeBase.getKnowledgeContext).mockReturnValue('Science context for ad copy')

      const result = service.enrichAdCopyInput(input)

      expect(result).toEqual({
        ...input,
        scienceContext: 'Science context for ad copy',
      })
      expect(mockKnowledgeBase.getKnowledgeContext).toHaveBeenCalled()
    })

    it('원본 input을 변경하지 않아야 한다', () => {
      const input: GenerateAdCopyInput = {
        productName: 'Product',
        productDescription: 'Description',
        targetAudience: '25-35',
      }

      const originalInput = { ...input }

      vi.mocked(mockKnowledgeBase.getKnowledgeContext).mockReturnValue('Context')

      service.enrichAdCopyInput(input)

      expect(input).toEqual(originalInput)
    })
  })

  describe('enrichOptimizationInput', () => {
    it('scienceContext를 추가해야 한다', () => {
      const input: GenerateOptimizationInput = {
        industry: 'fashion',
        objective: 'conversion',
        targetAudience: {
          ageRange: '20-30',
        },
        currentMetrics: {
          ctr: 2.5,
          cvr: 1.5,
          roas: 3.0,
          cpa: 10000,
        },
      }

      vi.mocked(mockKnowledgeBase.getKnowledgeContext).mockReturnValue('Science context for optimization')

      const result = service.enrichOptimizationInput(input)

      expect(result).toEqual({
        ...input,
        scienceContext: 'Science context for optimization',
      })
      expect(mockKnowledgeBase.getKnowledgeContext).toHaveBeenCalled()
    })
  })

  describe('enrichCreativeInput', () => {
    it('scienceContext를 추가해야 한다', () => {
      const input: GenerateCreativeVariantsInput = {
        element: 'headline',
        currentText: 'Headline',
        targetAudience: '25-40',
        variantCount: 3,
      }

      vi.mocked(mockKnowledgeBase.getKnowledgeContext).mockReturnValue('Science context for creative')

      const result = service.enrichCreativeInput(input)

      expect(result).toEqual({
        ...input,
        scienceContext: 'Science context for creative',
      })
      expect(mockKnowledgeBase.getKnowledgeContext).toHaveBeenCalled()
    })
  })

  describe('isResearchAvailable', () => {
    it('research service가 제공되지 않으면 false를 반환해야 한다', () => {
      const serviceWithoutResearch = new MarketingIntelligenceService(mockKnowledgeBase)

      const result = serviceWithoutResearch.isResearchAvailable()

      expect(result).toBe(false)
    })

    it('research service가 제공되면 true를 반환해야 한다', () => {
      const serviceWithResearch = new MarketingIntelligenceService(mockKnowledgeBase, mockResearchService)

      const result = serviceWithResearch.isResearchAvailable()

      expect(result).toBe(true)
    })

    it('research service가 unavailable 상태면 false를 반환해야 한다', () => {
      vi.mocked(mockResearchService.isAvailable).mockReturnValue(false)
      const serviceWithResearch = new MarketingIntelligenceService(mockKnowledgeBase, mockResearchService)

      const result = serviceWithResearch.isResearchAvailable()

      expect(result).toBe(false)
    })
  })

  describe('analyzeWithResearch', () => {
    it('research service가 제공되지 않으면 기본 분석 결과만 반환해야 한다', async () => {
      const serviceWithoutResearch = new MarketingIntelligenceService(mockKnowledgeBase)
      const mockInput: AnalysisInput = {
        content: {
          headline: 'Test Headline',
          primaryText: 'Test Primary Text',
        },
        context: {
          targetAudience: '25-40',
          objective: 'conversion',
        },
      }

      vi.mocked(mockKnowledgeBase.analyzeAll).mockReturnValue({
        compositeScore: mockCompositeScore,
        knowledgeContext: 'Base context',
      })

      const result = await serviceWithoutResearch.analyzeWithResearch(mockInput)

      expect(result).toEqual({
        compositeScore: mockCompositeScore,
        knowledgeContext: 'Base context',
      })
    })

    it('research service가 unavailable 상태면 기본 분석 결과만 반환해야 한다', async () => {
      vi.mocked(mockResearchService.isAvailable).mockReturnValue(false)
      const serviceWithResearch = new MarketingIntelligenceService(mockKnowledgeBase, mockResearchService)
      const mockInput: AnalysisInput = {
        content: {
          headline: 'Test Headline',
        },
      }

      vi.mocked(mockKnowledgeBase.analyzeAll).mockReturnValue({
        compositeScore: mockCompositeScore,
        knowledgeContext: 'Base context',
      })

      const result = await serviceWithResearch.analyzeWithResearch(mockInput)

      expect(result.knowledgeContext).toBe('Base context')
      expect(mockResearchService.research).not.toHaveBeenCalled()
    })

    it('research service가 available하면 research findings를 knowledge context에 추가해야 한다', async () => {
      const serviceWithResearch = new MarketingIntelligenceService(mockKnowledgeBase, mockResearchService)
      const mockInput: AnalysisInput = {
        content: {
          headline: 'AI Marketing Solution',
          primaryText: 'Transform your business',
        },
        context: {
          targetAudience: '25-40',
          objective: 'conversion',
          keywords: ['AI', 'marketing'],
        },
      }

      vi.mocked(mockKnowledgeBase.analyzeAll).mockReturnValue({
        compositeScore: mockCompositeScore,
        knowledgeContext: 'Base context',
      })

      const result = await serviceWithResearch.analyzeWithResearch(mockInput)

      expect(result.knowledgeContext).toContain('Base context')
      expect(result.knowledgeContext).toContain('Finding 1: AI marketing is growing')
      expect(result.knowledgeContext).toContain('Finding 2: Korean market is unique')
      expect(result.compositeScore).toEqual(mockCompositeScore)
    })

    it('research service 오류 발생 시 기본 분석 결과를 반환해야 한다', async () => {
      const serviceWithResearch = new MarketingIntelligenceService(mockKnowledgeBase, mockResearchService)
      const mockInput: AnalysisInput = {
        content: {
          headline: 'Test',
        },
      }

      vi.mocked(mockKnowledgeBase.analyzeAll).mockReturnValue({
        compositeScore: mockCompositeScore,
        knowledgeContext: 'Base context',
      })

      vi.mocked(mockResearchService.research).mockRejectedValue(new Error('Research API failed'))

      const result = await serviceWithResearch.analyzeWithResearch(mockInput)

      expect(result).toEqual({
        compositeScore: mockCompositeScore,
        knowledgeContext: 'Base context',
      })
    })

    it('input context로부터 적절한 topic을 추출하여 research를 호출해야 한다', async () => {
      const serviceWithResearch = new MarketingIntelligenceService(mockKnowledgeBase, mockResearchService)
      const mockInput: AnalysisInput = {
        content: {
          headline: 'AI Marketing Solution',
          brand: 'TechBrand',
        },
        context: {
          industry: 'technology',
          objective: 'conversion',
          keywords: ['AI', 'automation', 'marketing'],
        },
      }

      vi.mocked(mockKnowledgeBase.analyzeAll).mockReturnValue({
        compositeScore: mockCompositeScore,
        knowledgeContext: 'Base context',
      })

      await serviceWithResearch.analyzeWithResearch(mockInput)

      expect(mockResearchService.research).toHaveBeenCalledWith({
        topic: 'technology, TechBrand, 목표: conversion 마케팅 전략',
        market: 'KR',
        recency: 'last_month',
      })
    })
  })

  describe('enrichAdCopyInputWithResearch', () => {
    it('research context를 포함하여 input을 enrichment 해야 한다', async () => {
      const serviceWithResearch = new MarketingIntelligenceService(mockKnowledgeBase, mockResearchService)
      const input: GenerateAdCopyInput = {
        productName: 'AI Product',
        productDescription: 'Amazing AI solution',
        targetAudience: '25-35',
        keywords: ['AI', 'automation'],
      }

      vi.mocked(mockKnowledgeBase.analyzeAll).mockReturnValue({
        compositeScore: mockCompositeScore,
        knowledgeContext: 'Science context',
      })

      const result = await serviceWithResearch.enrichAdCopyInputWithResearch(input)

      expect(result.scienceContext).toContain('Science context')
      expect(result.scienceContext).toContain('Finding 1: AI marketing is growing')
      expect(result.scienceContext).toContain('Finding 2: Korean market is unique')
      expect(mockResearchService.research).toHaveBeenCalledWith({
        topic: expect.stringContaining('AI'),
        market: 'KR',
        recency: 'last_month',
      })
    })

    it('research service가 unavailable하면 base context만 사용해야 한다', async () => {
      vi.mocked(mockResearchService.isAvailable).mockReturnValue(false)
      const serviceWithResearch = new MarketingIntelligenceService(mockKnowledgeBase, mockResearchService)
      const input: GenerateAdCopyInput = {
        productName: 'Product',
        productDescription: 'Description',
        targetAudience: '25-35',
      }

      vi.mocked(mockKnowledgeBase.analyzeAll).mockReturnValue({
        compositeScore: mockCompositeScore,
        knowledgeContext: 'Base science context',
      })

      const result = await serviceWithResearch.enrichAdCopyInputWithResearch(input)

      expect(result.scienceContext).toBe('Base science context')
      expect(mockResearchService.research).not.toHaveBeenCalled()
    })
  })
})
