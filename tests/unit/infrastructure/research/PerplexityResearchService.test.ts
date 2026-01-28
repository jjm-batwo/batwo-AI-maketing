import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { PerplexityResearchService } from '@/infrastructure/external/research/PerplexityResearchService'
import type { ResearchQuery } from '@/application/ports/IResearchService'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function createMockResponse(content: string, citations: string[] = []) {
  return {
    ok: true,
    json: () => Promise.resolve({
      choices: [{ message: { content } }],
      citations,
    }),
  }
}

describe('PerplexityResearchService', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('isAvailable', () => {
    it('returns false when no API key provided', () => {
      const service = new PerplexityResearchService()
      expect(service.isAvailable()).toBe(false)
    })

    it('returns true when API key provided', () => {
      const service = new PerplexityResearchService('test-api-key')
      expect(service.isAvailable()).toBe(true)
    })
  })

  describe('research', () => {
    it('returns empty result when not available', async () => {
      const service = new PerplexityResearchService()
      const query: ResearchQuery = {
        topic: 'test topic',
        market: 'KR',
        recency: 'last_month',
      }

      const result = await service.research(query)

      expect(result).toEqual({
        findings: [],
        sources: [],
        relevanceScore: 0,
        cached: false,
      })
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('calls Perplexity API with correct parameters', async () => {
      const service = new PerplexityResearchService('test-api-key')
      const query: ResearchQuery = {
        topic: 'AI marketing trends',
        market: 'KR',
        recency: 'last_month',
      }

      mockFetch.mockResolvedValueOnce(
        createMockResponse('1. First finding\n2. Second finding')
      )

      await service.research(query)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.perplexity.ai/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bearer test-api-key',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-sonar-small-128k-online',
            messages: [
              {
                role: 'system',
                content: 'You are a marketing research analyst. Provide concise, factual findings with clear structure. Use numbered points for findings.',
              },
              {
                role: 'user',
                content: '한국 시장에서 "AI marketing trends"에 대한 지난 1개월 동안의 최신 마케팅 리서치 결과를 알려주세요. 주요 발견사항을 번호 목록으로 정리해주세요.',
              },
            ],
            max_tokens: 1024,
            temperature: 0.2,
            return_citations: true,
          }),
          signal: expect.any(AbortSignal),
        })
      )
    })

    it('extracts numbered findings from response', async () => {
      const service = new PerplexityResearchService('test-api-key')
      const query: ResearchQuery = {
        topic: 'test topic',
        market: 'KR',
        recency: 'last_week',
      }

      mockFetch.mockResolvedValueOnce(
        createMockResponse(
          '1. First finding\n2. Second finding\n3. Third finding',
          ['https://source1.com', 'https://source2.com']
        )
      )

      const result = await service.research(query)

      expect(result.findings).toEqual([
        'First finding',
        'Second finding',
        'Third finding',
      ])
      expect(result.sources).toEqual([
        expect.objectContaining({
          title: 'Source 1',
          url: 'https://source1.com',
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        }),
        expect.objectContaining({
          title: 'Source 2',
          url: 'https://source2.com',
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        }),
      ])
      expect(result.relevanceScore).toBeGreaterThanOrEqual(0)
      expect(result.relevanceScore).toBeLessThanOrEqual(1)
      expect(result.cached).toBe(false)
    })

    it('caches results and returns cached:true', async () => {
      const service = new PerplexityResearchService('test-api-key')
      const query: ResearchQuery = {
        topic: 'cached query',
        market: 'global',
        recency: 'last_quarter',
      }

      mockFetch.mockResolvedValueOnce(
        createMockResponse('1. First finding')
      )

      // First call - fresh
      const result1 = await service.research(query)
      expect(result1.cached).toBe(false)
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Second call - cached
      const result2 = await service.research(query)
      expect(result2.cached).toBe(true)
      expect(result2.findings).toEqual(result1.findings)
      expect(mockFetch).toHaveBeenCalledTimes(1) // Still only 1 call
    })

    it('clearCache forces fresh call', async () => {
      const service = new PerplexityResearchService('test-api-key')
      const query: ResearchQuery = {
        topic: 'test query',
        market: 'US',
        recency: 'last_year',
      }

      mockFetch.mockResolvedValue(
        createMockResponse('1. Finding')
      )

      // First call
      await service.research(query)
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Clear cache
      service.clearCache()

      // Second call - should fetch again
      const result = await service.research(query)
      expect(result.cached).toBe(false)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('returns empty result on API error', async () => {
      const service = new PerplexityResearchService('test-api-key')
      const query: ResearchQuery = {
        topic: 'error query',
        market: 'KR',
        recency: 'last_month',
      }

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await service.research(query)

      expect(result).toEqual({
        findings: [],
        sources: [],
        relevanceScore: 0,
        cached: false,
      })
    })

    it('returns empty result on non-ok response', async () => {
      const service = new PerplexityResearchService('test-api-key')
      const query: ResearchQuery = {
        topic: 'error query',
        market: 'KR',
        recency: 'last_month',
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      const result = await service.research(query)

      expect(result).toEqual({
        findings: [],
        sources: [],
        relevanceScore: 0,
        cached: false,
      })
    })
  })

  describe('getMarketTrends', () => {
    it('returns empty trends when not available', async () => {
      const service = new PerplexityResearchService()

      const result = await service.getMarketTrends('fashion', 'KR')

      expect(result).toEqual({
        findings: [],
        sources: [],
        relevanceScore: 0,
        cached: false,
        trends: [],
      })
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('uses Korean prompt for KR market', async () => {
      const service = new PerplexityResearchService('test-api-key')

      mockFetch.mockResolvedValueOnce(
        createMockResponse('1. 트렌드 증가')
      )

      await service.getMarketTrends('fashion', 'KR')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.perplexity.ai/chat/completions',
        expect.objectContaining({
          body: expect.stringContaining('fashion 업계의 최신 마케팅 트렌드를 분석해주세요'),
        })
      )
    })

    it('extracts trends with direction detection', async () => {
      const service = new PerplexityResearchService('test-api-key')

      mockFetch.mockResolvedValueOnce(
        createMockResponse('1. AI 광고 급등\n2. 검색 광고 감소\n3. 디스플레이 광고 유지')
      )

      const result = await service.getMarketTrends('tech', 'KR')

      expect(result.trends).toHaveLength(3)
      expect(result.trends[0]).toMatchObject({
        topic: 'AI 광고 급등',
        direction: 'rising',
        description: 'AI 광고 급등',
        relevance: 0.7,
      })
      expect(result.trends[1]).toMatchObject({
        topic: '검색 광고 감소',
        direction: 'falling',
        description: '검색 광고 감소',
        relevance: 0.7,
      })
      expect(result.trends[2]).toMatchObject({
        topic: '디스플레이 광고 유지',
        direction: 'stable',
        description: '디스플레이 광고 유지',
        relevance: 0.7,
      })
    })

    it('detects rising trends from Korean keywords', async () => {
      const service = new PerplexityResearchService('test-api-key')

      mockFetch.mockResolvedValueOnce(
        createMockResponse(
          '1. 증가하는 비디오 광고\n2. growing influencer marketing\n3. 상승 중인 모바일'
        )
      )

      const result = await service.getMarketTrends('marketing', 'KR')

      expect(result.trends[0].direction).toBe('rising')
      expect(result.trends[1].direction).toBe('rising')
      expect(result.trends[2].direction).toBe('rising')
    })

    it('detects falling trends', async () => {
      const service = new PerplexityResearchService('test-api-key')

      mockFetch.mockResolvedValueOnce(
        createMockResponse(
          '1. 감소하는 TV 광고\n2. declining print ads\n3. 하락 중인 라디오'
        )
      )

      const result = await service.getMarketTrends('traditional', 'KR')

      expect(result.trends[0].direction).toBe('falling')
      expect(result.trends[1].direction).toBe('falling')
      expect(result.trends[2].direction).toBe('falling')
    })
  })

  describe('getCompetitorIntelligence', () => {
    it('returns empty insights when not available', async () => {
      const service = new PerplexityResearchService()

      const result = await service.getCompetitorIntelligence(['brand1'])

      expect(result).toEqual({
        findings: [],
        sources: [],
        relevanceScore: 0,
        cached: false,
        insights: [],
      })
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('creates sorted cache key from keywords', async () => {
      const service = new PerplexityResearchService('test-api-key')

      mockFetch.mockResolvedValue(
        createMockResponse('1. Insight')
      )

      // Call with different order
      await service.getCompetitorIntelligence(['brand2', 'brand1'])
      const result1 = await service.getCompetitorIntelligence(['brand2', 'brand1'])
      expect(result1.cached).toBe(true)

      // Call with same keywords in different order - should be cached
      const result2 = await service.getCompetitorIntelligence(['brand1', 'brand2'])
      expect(result2.cached).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('extracts insights from response', async () => {
      const service = new PerplexityResearchService('test-api-key')

      mockFetch.mockResolvedValueOnce(
        createMockResponse(
          '1. First insight about competitor\n2. Second insight\n3. Third insight',
          ['https://competitor.com']
        )
      )

      const result = await service.getCompetitorIntelligence(['competitor1', 'competitor2'])

      expect(result.insights).toEqual([
        {
          keyword: 'competitor1',
          insight: 'First insight about competitor',
          source: 'Perplexity AI Research',
        },
        {
          keyword: 'competitor2',
          insight: 'Second insight',
          source: 'Perplexity AI Research',
        },
        {
          keyword: 'competitor1',
          insight: 'Third insight',
          source: 'Perplexity AI Research',
        },
      ])
      expect(result.cached).toBe(false)
    })
  })

  describe('cache management', () => {
    it('evicts oldest entry when cache is full (MAX_CACHE_SIZE=100)', async () => {
      const service = new PerplexityResearchService('test-api-key')

      mockFetch.mockResolvedValue(
        createMockResponse('1. Finding')
      )

      // Fill cache with 100 entries
      for (let i = 0; i < 100; i++) {
        await service.research({
          topic: `topic-${i}`,
          market: 'KR',
          recency: 'last_month',
        })
      }

      expect(mockFetch).toHaveBeenCalledTimes(100)

      // First query should be cached
      const firstQuery = await service.research({
        topic: 'topic-0',
        market: 'KR',
        recency: 'last_month',
      })
      expect(firstQuery.cached).toBe(true)

      // Add one more - should evict oldest (topic-0)
      await service.research({
        topic: 'topic-100',
        market: 'KR',
        recency: 'last_month',
      })

      expect(mockFetch).toHaveBeenCalledTimes(101)

      // First query should no longer be cached
      const firstQueryAgain = await service.research({
        topic: 'topic-0',
        market: 'KR',
        recency: 'last_month',
      })
      expect(firstQueryAgain.cached).toBe(false)
      expect(mockFetch).toHaveBeenCalledTimes(102)
    })

    it('expired entries are not returned', async () => {
      const service = new PerplexityResearchService('test-api-key')

      mockFetch.mockResolvedValue(
        createMockResponse('1. Finding')
      )

      const query: ResearchQuery = {
        topic: 'test topic',
        market: 'KR',
        recency: 'last_month',
      }

      // First call
      await service.research(query)
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Mock time forward by 2 hours (TTL is 1 hour)
      const now = Date.now()
      vi.spyOn(Date, 'now').mockReturnValue(now + 2 * 60 * 60 * 1000)

      // Second call - cache expired, should fetch again
      const result = await service.research(query)
      expect(result.cached).toBe(false)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })
})
