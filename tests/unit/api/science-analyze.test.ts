import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { POST } from '@/app/api/ai/science-analyze/route'

// ============================================================================
// Mocks
// ============================================================================

vi.mock('@/lib/auth', () => ({
  getAuthenticatedUser: vi.fn(),
  unauthorizedResponse: vi.fn(() =>
    NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  ),
}))

vi.mock('@/lib/di/container', () => ({
  getMarketingIntelligenceService: vi.fn(),
  getQuotaService: vi.fn(),
}))

vi.mock('@/lib/middleware/rateLimit', () => ({
  checkRateLimit: vi.fn(),
  getClientIp: vi.fn(() => '127.0.0.1'),
  addRateLimitHeaders: vi.fn((response) => response),
  rateLimitExceededResponse: vi.fn((result) =>
    NextResponse.json({ message: 'Rate limit exceeded' }, { status: 429 })
  ),
}))

import { getAuthenticatedUser } from '@/lib/auth'
import { getMarketingIntelligenceService, getQuotaService } from '@/lib/di/container'
import { checkRateLimit } from '@/lib/middleware/rateLimit'

// ============================================================================
// Test Data
// ============================================================================

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
}

const mockCompositeScore = {
  overall: 8.5,
  grade: 'A' as const,
  domainScores: [
    {
      domain: 'persuasion',
      score: 9.0,
      weight: 0.3,
      evidence: ['Strong urgency cues', 'Social proof elements'],
      recommendations: [
        {
          domain: 'persuasion',
          priority: 'high' as const,
          recommendation: 'Add more testimonials',
          impact: 'Increase trust by 15%',
          evidence: ['Social proof increases conversion by 10-15%'],
          actionable: true,
        },
      ],
    },
  ],
  topRecommendations: [],
  analyzedDomains: 5,
  totalDomains: 5,
  summary: 'Strong science-backed messaging',
}

const mockAnalysisResult = {
  compositeScore: mockCompositeScore,
  knowledgeContext: 'Applied principles from persuasion, behavioral economics',
}

const mockAnalysisResultWithResearch = {
  ...mockAnalysisResult,
  researchFindings: {
    findings: ['AI 광고 급등 중', '비디오 광고 ROI 증가'],
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
}

const mockQuotaStatus = {
  AI_COPY: { limit: 20, used: 5, remaining: 15, resetAt: new Date() },
  AI_ANALYSIS: { limit: 5, used: 2, remaining: 3, resetAt: new Date() },
  AI_SCIENCE: { limit: 10, used: 1, remaining: 9, resetAt: new Date() },
  CAMPAIGN_CREATE: { limit: 5, used: 1, remaining: 4, resetAt: new Date() },
  BUDGET_CHECK: { limit: 10, used: 2, remaining: 8, resetAt: new Date() },
}

// ============================================================================
// Helper Functions
// ============================================================================

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/ai/science-analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

// ============================================================================
// Tests
// ============================================================================

describe('POST /api/ai/science-analyze', () => {
  let mockIntelligenceService: {
    analyze: ReturnType<typeof vi.fn>
    analyzeWithResearch: ReturnType<typeof vi.fn>
  }
  let mockQuotaService: {
    checkQuota: ReturnType<typeof vi.fn>
    logUsage: ReturnType<typeof vi.fn>
    getRemainingQuota: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mocks
    mockIntelligenceService = {
      analyze: vi.fn().mockReturnValue(mockAnalysisResult),
      analyzeWithResearch: vi.fn().mockResolvedValue(mockAnalysisResultWithResearch),
    }

    mockQuotaService = {
      checkQuota: vi.fn().mockResolvedValue(true),
      logUsage: vi.fn().mockResolvedValue(undefined),
      getRemainingQuota: vi.fn().mockResolvedValue(mockQuotaStatus),
    }

    vi.mocked(getMarketingIntelligenceService).mockReturnValue(mockIntelligenceService as any)
    vi.mocked(getQuotaService).mockReturnValue(mockQuotaService as any)
    vi.mocked(checkRateLimit).mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60000,
    })
  })

  describe('authentication', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue(null)

      const request = createRequest({
        content: { headline: 'Test' },
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.message).toBe('Unauthorized')
    })
  })

  describe('validation', () => {
    beforeEach(() => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue(mockUser)
    })

    it('returns 400 when no content/context/metrics/creative provided', async () => {
      const request = createRequest({})

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.message).toContain('최소 하나 이상의 분석 데이터가 필요합니다')
    })

    it('accepts request with content only', async () => {
      const request = createRequest({
        content: { headline: 'Test headline' },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('accepts request with context only', async () => {
      const request = createRequest({
        context: { industry: 'SaaS' },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('accepts request with metrics only', async () => {
      const request = createRequest({
        metrics: { ctr: 2.5 },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('accepts request with creative only', async () => {
      const request = createRequest({
        creative: { format: 'video' },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('rate limiting', () => {
    beforeEach(() => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue(mockUser)
    })

    it('returns 429 when rate limited', async () => {
      vi.mocked(checkRateLimit).mockResolvedValue({
        success: false,
        limit: 10,
        remaining: 0,
        reset: Date.now() + 60000,
      })

      const request = createRequest({
        content: { headline: 'Test' },
      })

      const response = await POST(request)

      expect(response.status).toBe(429)
      const data = await response.json()
      expect(data.message).toBe('Rate limit exceeded')
    })
  })

  describe('quota management', () => {
    beforeEach(() => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue(mockUser)
    })

    it('returns 429 when quota exceeded', async () => {
      mockQuotaService.checkQuota.mockResolvedValue(false)

      const request = createRequest({
        content: { headline: 'Test' },
      })

      const response = await POST(request)

      expect(response.status).toBe(429)
      const data = await response.json()
      expect(data.message).toContain('AI 과학 분석 쿼터가 초과되었습니다')

      expect(mockQuotaService.checkQuota).toHaveBeenCalledWith(mockUser.id, 'AI_SCIENCE')
    })

    it('checks AI_SCIENCE quota before analysis', async () => {
      const request = createRequest({
        content: { headline: 'Test' },
      })

      await POST(request)

      expect(mockQuotaService.checkQuota).toHaveBeenCalledWith(mockUser.id, 'AI_SCIENCE')
    })
  })

  describe('successful analysis', () => {
    beforeEach(() => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue(mockUser)
    })

    it('returns successful analysis result', async () => {
      const request = createRequest({
        content: {
          headline: '지금 바로 구매하면 50% 할인!',
          primaryText: '검증된 전문가가 추천하는 제품',
        },
        context: {
          industry: 'SaaS',
          targetAudience: '중소기업',
          objective: 'conversion',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.compositeScore).toBeDefined()
      expect(data.compositeScore.overall).toBe(8.5)
      expect(data.compositeScore.grade).toBe('A')
      expect(data.knowledgeContext).toBe('Applied principles from persuasion, behavioral economics')
      expect(data.remainingQuota).toBe(9)
      expect(data.researchFindings).toBeUndefined()
    })

    it('returns analysis with research when includeResearch=true', async () => {
      const request = createRequest({
        content: { headline: 'AI 마케팅 트렌드' },
        includeResearch: true,
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.researchFindings).toBeDefined()
      expect(data.researchFindings.findings).toHaveLength(2)
      expect(data.researchFindings.findings[0]).toBe('AI 광고 급등 중')
      expect(data.researchFindings.sources).toHaveLength(1)
      expect(data.researchFindings.relevanceScore).toBe(0.85)

      expect(mockIntelligenceService.analyzeWithResearch).toHaveBeenCalled()
      expect(mockIntelligenceService.analyze).not.toHaveBeenCalled()
    })

    it('uses analyze() when includeResearch=false', async () => {
      const request = createRequest({
        content: { headline: 'Test' },
        includeResearch: false,
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.researchFindings).toBeUndefined()

      expect(mockIntelligenceService.analyze).toHaveBeenCalled()
      expect(mockIntelligenceService.analyzeWithResearch).not.toHaveBeenCalled()
    })

    it('uses analyze() when includeResearch is omitted', async () => {
      const request = createRequest({
        content: { headline: 'Test' },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)

      expect(mockIntelligenceService.analyze).toHaveBeenCalled()
      expect(mockIntelligenceService.analyzeWithResearch).not.toHaveBeenCalled()
    })

    it('passes correct input to intelligence service', async () => {
      const requestBody = {
        content: {
          headline: 'Test headline',
          primaryText: 'Test primary text',
        },
        context: {
          industry: 'E-commerce',
          targetAudience: '25-34세 여성',
        },
        metrics: {
          ctr: 2.5,
          cvr: 1.2,
        },
        creative: {
          format: 'video' as const,
          hasVideo: true,
        },
      }

      const request = createRequest(requestBody)

      await POST(request)

      expect(mockIntelligenceService.analyze).toHaveBeenCalledWith({
        content: requestBody.content,
        context: requestBody.context,
        metrics: requestBody.metrics,
        creative: requestBody.creative,
      })
    })
  })

  describe('usage logging', () => {
    beforeEach(() => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue(mockUser)
    })

    it('logs usage on successful analysis', async () => {
      const request = createRequest({
        content: { headline: 'Test' },
      })

      await POST(request)

      expect(mockQuotaService.logUsage).toHaveBeenCalledWith(mockUser.id, 'AI_SCIENCE')
    })

    it('does not log usage on validation error', async () => {
      const request = createRequest({}) // No content/context/metrics/creative

      await POST(request)

      expect(mockQuotaService.logUsage).not.toHaveBeenCalled()
    })

    it('does not log usage on quota exceeded', async () => {
      mockQuotaService.checkQuota.mockResolvedValue(false)

      const request = createRequest({
        content: { headline: 'Test' },
      })

      await POST(request)

      expect(mockQuotaService.logUsage).not.toHaveBeenCalled()
    })

    it('returns correct remaining quota after logging', async () => {
      const request = createRequest({
        content: { headline: 'Test' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.remainingQuota).toBe(9)
      expect(mockQuotaService.getRemainingQuota).toHaveBeenCalledWith(mockUser.id)
    })

    it('handles missing AI_SCIENCE quota gracefully', async () => {
      const quotaStatusWithoutScience = {
        ...mockQuotaStatus,
        AI_SCIENCE: undefined,
      }
      mockQuotaService.getRemainingQuota.mockResolvedValue(quotaStatusWithoutScience)

      const request = createRequest({
        content: { headline: 'Test' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.remainingQuota).toBe(0)
    })
  })

  describe('error handling', () => {
    beforeEach(() => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue(mockUser)
    })

    it('returns 500 on internal error', async () => {
      mockIntelligenceService.analyze.mockImplementation(() => {
        throw new Error('Internal error')
      })

      const request = createRequest({
        content: { headline: 'Test' },
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.message).toBe('과학 분석에 실패했습니다')
    })

    it('returns 500 on analyzeWithResearch error', async () => {
      mockIntelligenceService.analyzeWithResearch.mockRejectedValue(new Error('Research error'))

      const request = createRequest({
        content: { headline: 'Test' },
        includeResearch: true,
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.message).toBe('과학 분석에 실패했습니다')
    })

    it('returns 500 on quota service error', async () => {
      mockQuotaService.checkQuota.mockRejectedValue(new Error('Quota service error'))

      const request = createRequest({
        content: { headline: 'Test' },
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })

    it('returns 500 on getRemainingQuota error', async () => {
      mockQuotaService.getRemainingQuota.mockRejectedValue(new Error('Get quota error'))

      const request = createRequest({
        content: { headline: 'Test' },
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })

  describe('comprehensive integration', () => {
    beforeEach(() => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue(mockUser)
    })

    it('handles full analysis workflow with all sections', async () => {
      const request = createRequest({
        content: {
          headline: '지금 바로 구매하면 50% 할인!',
          primaryText: '검증된 전문가가 추천하는 제품',
          description: 'AI 마케팅 자동화 솔루션',
          callToAction: '무료 체험 시작',
          brand: '바투',
        },
        context: {
          industry: 'SaaS',
          targetAudience: '중소기업 대표',
          objective: 'conversion' as const,
          tone: 'professional' as const,
          keywords: ['AI', '마케팅', '자동화'],
        },
        metrics: {
          ctr: 2.5,
          cvr: 1.2,
          roas: 3.5,
          cpa: 5000,
          frequency: 2.0,
        },
        creative: {
          format: 'video' as const,
          dominantColors: ['#FF0000', '#00FF00'],
          hasVideo: true,
          videoDuration: 15,
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.compositeScore).toBeDefined()
      expect(data.knowledgeContext).toBeDefined()
      expect(data.remainingQuota).toBeDefined()

      expect(mockQuotaService.checkQuota).toHaveBeenCalled()
      expect(mockIntelligenceService.analyze).toHaveBeenCalled()
      expect(mockQuotaService.logUsage).toHaveBeenCalled()
      expect(mockQuotaService.getRemainingQuota).toHaveBeenCalled()
    })

    it('handles analysis with research workflow', async () => {
      const request = createRequest({
        content: { headline: 'AI 마케팅 트렌드' },
        context: { industry: 'Marketing' },
        includeResearch: true,
      })

      const response = await POST(request)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.compositeScore).toBeDefined()
      expect(data.knowledgeContext).toBeDefined()
      expect(data.researchFindings).toBeDefined()
      expect(data.researchFindings.findings).toBeInstanceOf(Array)
      expect(data.researchFindings.sources).toBeInstanceOf(Array)
      expect(data.remainingQuota).toBeDefined()

      expect(mockIntelligenceService.analyzeWithResearch).toHaveBeenCalled()
    })
  })
})
