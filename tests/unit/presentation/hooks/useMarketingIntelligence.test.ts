import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ============================================================================
// Mock Setup
// ============================================================================

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function createMockResponse(data: unknown, status = 200, ok = true) {
  return {
    ok,
    status,
    json: () => Promise.resolve(data),
  }
}

// ============================================================================
// Test Imports (after mocks)
// ============================================================================

interface ScienceScoreInput {
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

interface ScienceAnalyzeInput extends ScienceScoreInput {
  includeResearch?: boolean
}

interface CompositeScore {
  overall: number
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F'
  domainScores: Array<{
    domain: string
    score: number
    weight: number
    evidence: string[]
    recommendations: Array<{
      domain: string
      priority: 'critical' | 'high' | 'medium' | 'low'
      recommendation: string
      impact: string
      evidence: string[]
      actionable: boolean
    }>
  }>
  topRecommendations: Array<{
    domain: string
    priority: 'critical' | 'high' | 'medium' | 'low'
    recommendation: string
    impact: string
    evidence: string[]
    actionable: boolean
  }>
  analyzedDomains: number
  totalDomains: number
  summary: string
}

interface ScienceAnalyzeResponse {
  compositeScore: CompositeScore
  knowledgeContext: string
  researchFindings?: {
    findings: string[]
    sources: Array<{ title: string; url: string; date: string }>
    relevanceScore: number
    cached: boolean
  }
  remainingQuota: number
}

// ============================================================================
// Fetch Function (mirroring hook implementation)
// ============================================================================

async function fetchScienceAnalyze(input: ScienceAnalyzeInput): Promise<ScienceAnalyzeResponse> {
  const response = await fetch('/api/ai/science-analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to perform science analysis' }))
    throw new Error(error.message || 'Failed to perform science analysis')
  }

  return response.json()
}

// ============================================================================
// Tests
// ============================================================================

describe('fetchScienceAnalyze', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('successful requests', () => {
    it('calls /api/ai/science-analyze with correct body', async () => {
      const input: ScienceAnalyzeInput = {
        content: {
          headline: '지금 바로 구매하면 50% 할인!',
          primaryText: '검증된 전문가가 추천하는 제품',
          description: 'AI 마케팅 자동화 솔루션',
          callToAction: '무료 체험 시작',
        },
        context: {
          industry: 'SaaS',
          targetAudience: '중소기업',
          objective: 'conversion',
          tone: 'professional',
          keywords: ['AI', '마케팅', '자동화'],
        },
      }

      const mockResponse: ScienceAnalyzeResponse = {
        compositeScore: {
          overall: 8.5,
          grade: 'A',
          domainScores: [
            {
              domain: 'persuasion',
              score: 9.0,
              weight: 0.3,
              evidence: ['Strong urgency cues', 'Social proof elements'],
              recommendations: [],
            },
          ],
          topRecommendations: [],
          analyzedDomains: 5,
          totalDomains: 5,
          summary: 'Strong science-backed messaging',
        },
        knowledgeContext: 'Applied principles from persuasion, behavioral economics',
        remainingQuota: 9,
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse))

      const result = await fetchScienceAnalyze(input)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/ai/science-analyze',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })
      )

      expect(result).toEqual(mockResponse)
    })

    it('handles successful response with compositeScore and knowledgeContext', async () => {
      const input: ScienceAnalyzeInput = {
        content: {
          headline: 'Test headline',
        },
      }

      const mockResponse: ScienceAnalyzeResponse = {
        compositeScore: {
          overall: 7.2,
          grade: 'B+',
          domainScores: [],
          topRecommendations: [],
          analyzedDomains: 3,
          totalDomains: 5,
          summary: 'Moderate science score',
        },
        knowledgeContext: 'Applied cognitive psychology principles',
        remainingQuota: 8,
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse))

      const result = await fetchScienceAnalyze(input)

      expect(result.compositeScore).toBeDefined()
      expect(result.compositeScore.overall).toBe(7.2)
      expect(result.compositeScore.grade).toBe('B+')
      expect(result.knowledgeContext).toBe('Applied cognitive psychology principles')
      expect(result.remainingQuota).toBe(8)
    })

    it('handles response with researchFindings when includeResearch=true', async () => {
      const input: ScienceAnalyzeInput = {
        content: {
          headline: 'AI 마케팅 트렌드',
        },
        includeResearch: true,
      }

      const mockResponse: ScienceAnalyzeResponse = {
        compositeScore: {
          overall: 8.0,
          grade: 'A',
          domainScores: [],
          topRecommendations: [],
          analyzedDomains: 4,
          totalDomains: 5,
          summary: 'Research-backed analysis',
        },
        knowledgeContext: 'Applied neuroscience and persuasion principles',
        researchFindings: {
          findings: [
            'AI 광고 급등 중',
            '비디오 광고 ROI 증가',
            '모바일 최적화 필수',
          ],
          sources: [
            {
              title: 'Marketing Trends 2024',
              url: 'https://example.com/trends',
              date: '2024-01-15',
            },
          ],
          relevanceScore: 0.85,
          cached: false,
        },
        remainingQuota: 7,
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse))

      const result = await fetchScienceAnalyze(input)

      expect(result.researchFindings).toBeDefined()
      expect(result.researchFindings?.findings).toHaveLength(3)
      expect(result.researchFindings?.findings[0]).toBe('AI 광고 급등 중')
      expect(result.researchFindings?.sources).toHaveLength(1)
      expect(result.researchFindings?.relevanceScore).toBe(0.85)
      expect(result.researchFindings?.cached).toBe(false)
    })

    it('handles response with all input sections', async () => {
      const input: ScienceAnalyzeInput = {
        content: {
          headline: 'Test headline',
          primaryText: 'Test primary text',
          description: 'Test description',
          callToAction: 'Test CTA',
          brand: 'Test Brand',
        },
        context: {
          industry: 'E-commerce',
          targetAudience: '25-34세 여성',
          objective: 'awareness',
          tone: 'casual',
          keywords: ['패션', '트렌드'],
        },
        metrics: {
          ctr: 2.5,
          cvr: 1.2,
          roas: 3.5,
          cpa: 5000,
          frequency: 2.0,
        },
        creative: {
          format: 'video',
          dominantColors: ['#FF0000', '#00FF00'],
          hasVideo: true,
          videoDuration: 15,
        },
      }

      const mockResponse: ScienceAnalyzeResponse = {
        compositeScore: {
          overall: 9.0,
          grade: 'A+',
          domainScores: [],
          topRecommendations: [],
          analyzedDomains: 5,
          totalDomains: 5,
          summary: 'Excellent comprehensive analysis',
        },
        knowledgeContext: 'All domains applied successfully',
        remainingQuota: 6,
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse))

      const result = await fetchScienceAnalyze(input)

      expect(result.compositeScore.overall).toBe(9.0)
      expect(result.compositeScore.grade).toBe('A+')
    })
  })

  describe('error handling', () => {
    it('handles API errors gracefully', async () => {
      const input: ScienceAnalyzeInput = {
        content: {
          headline: 'Test',
        },
      }

      mockFetch.mockResolvedValueOnce(
        createMockResponse(
          { message: 'Internal server error' },
          500,
          false
        )
      )

      await expect(fetchScienceAnalyze(input)).rejects.toThrow('Internal server error')
    })

    it('handles validation errors (400)', async () => {
      const input: ScienceAnalyzeInput = {
        // Empty input - no content/context/metrics/creative
      }

      mockFetch.mockResolvedValueOnce(
        createMockResponse(
          { message: '최소 하나 이상의 분석 데이터가 필요합니다' },
          400,
          false
        )
      )

      await expect(fetchScienceAnalyze(input)).rejects.toThrow(
        '최소 하나 이상의 분석 데이터가 필요합니다'
      )
    })

    it('handles rate limit (429) responses', async () => {
      const input: ScienceAnalyzeInput = {
        content: {
          headline: 'Test',
        },
      }

      mockFetch.mockResolvedValueOnce(
        createMockResponse(
          { message: 'Rate limit exceeded' },
          429,
          false
        )
      )

      await expect(fetchScienceAnalyze(input)).rejects.toThrow('Rate limit exceeded')
    })

    it('handles quota exceeded (429) responses', async () => {
      const input: ScienceAnalyzeInput = {
        content: {
          headline: 'Test',
        },
      }

      mockFetch.mockResolvedValueOnce(
        createMockResponse(
          { message: 'AI 과학 분석 쿼터가 초과되었습니다. 다음 주에 다시 시도해주세요.' },
          429,
          false
        )
      )

      await expect(fetchScienceAnalyze(input)).rejects.toThrow(
        'AI 과학 분석 쿼터가 초과되었습니다'
      )
    })

    it('handles network errors', async () => {
      const input: ScienceAnalyzeInput = {
        content: {
          headline: 'Test',
        },
      }

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(fetchScienceAnalyze(input)).rejects.toThrow('Network error')
    })

    it('handles malformed JSON response', async () => {
      const input: ScienceAnalyzeInput = {
        content: {
          headline: 'Test',
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON')),
      })

      await expect(fetchScienceAnalyze(input)).rejects.toThrow('Failed to perform science analysis')
    })
  })

  describe('request payload', () => {
    it('includes includeResearch flag in request', async () => {
      const input: ScienceAnalyzeInput = {
        content: {
          headline: 'Test',
        },
        includeResearch: true,
      }

      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          compositeScore: {
            overall: 7.0,
            grade: 'B+',
            domainScores: [],
            topRecommendations: [],
            analyzedDomains: 3,
            totalDomains: 5,
            summary: 'Test',
          },
          knowledgeContext: 'Test',
          researchFindings: {
            findings: [],
            sources: [],
            relevanceScore: 0,
            cached: false,
          },
          remainingQuota: 5,
        })
      )

      await fetchScienceAnalyze(input)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/ai/science-analyze',
        expect.objectContaining({
          body: expect.stringContaining('"includeResearch":true'),
        })
      )
    })

    it('excludes includeResearch when false', async () => {
      const input: ScienceAnalyzeInput = {
        content: {
          headline: 'Test',
        },
        includeResearch: false,
      }

      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          compositeScore: {
            overall: 7.0,
            grade: 'B+',
            domainScores: [],
            topRecommendations: [],
            analyzedDomains: 3,
            totalDomains: 5,
            summary: 'Test',
          },
          knowledgeContext: 'Test',
          remainingQuota: 5,
        })
      )

      await fetchScienceAnalyze(input)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/ai/science-analyze',
        expect.objectContaining({
          body: expect.stringContaining('"includeResearch":false'),
        })
      )
    })
  })
})
