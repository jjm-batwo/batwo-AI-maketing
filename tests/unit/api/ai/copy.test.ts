import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock auth
const mockGetAuthenticatedUser = vi.fn()
vi.mock('@/lib/auth', () => ({
  getAuthenticatedUser: () => mockGetAuthenticatedUser(),
  unauthorizedResponse: () =>
    new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 }),
}))

// Mock DI container
const mockAIService = {
  generateAdCopy: vi.fn(),
}
const mockQuotaService = {
  checkQuota: vi.fn(),
  logUsage: vi.fn(),
  getRemainingQuota: vi.fn().mockResolvedValue({
    AI_COPY_GEN: { used: 1, limit: 20, remaining: 19, period: 'day' },
    AI_ANALYSIS: { used: 0, limit: 5, remaining: 5, period: 'week' },
    CAMPAIGN_CREATE: { used: 0, limit: 5, remaining: 5, period: 'week' },
  }),
}
const mockCopyLearningService = {
  getGenerationHints: vi.fn().mockReturnValue({
    industry: 'ecommerce',
    currentSeason: '겨울',
    isSpecialPeriod: false,
    specialPeriodName: undefined,
    recommendedHooks: [
      { hook: 'benefit', reason: 'ecommerce 업종 벤치마크 기준 우수 성과', expectedCTR: 2.1, confidence: 0.6 },
    ],
    avoidHooks: [],
    keywordSuggestions: ['할인', '특가', '무료배송'],
    characterGuidelines: {
      headline: '15-25자 (핵심 메시지 전달)',
      primaryText: '50-90자 (상세 설명)',
      description: '20-40자 (행동 유도)',
    },
    timingAdvice: 'ecommerce 업종 최적 시간대: 10시, 14시, 20시, 21시',
    ctaRecommendations: ['지금 구매하기', '장바구니 담기'],
  }),
  analyzePerformance: vi.fn(),
}

vi.mock('@/lib/di/container', () => ({
  getAIService: () => mockAIService,
  getQuotaService: () => mockQuotaService,
  getCopyLearningService: () => mockCopyLearningService,
}))

// Import after mocks
const { POST } = await import('@/app/api/ai/copy/route')

describe('POST /api/ai/copy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    mockGetAuthenticatedUser.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/ai/copy', {
      method: 'POST',
      body: JSON.stringify({
        productName: 'Test Product',
        productDescription: 'A test product',
        targetAudience: '25-34세 여성',
        tone: 'professional',
        objective: 'conversion',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('should return 400 when required fields are missing', async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })

    const request = new NextRequest('http://localhost/api/ai/copy', {
      method: 'POST',
      body: JSON.stringify({
        productName: 'Test Product',
        // Missing required fields
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.message).toContain('필수')
  })

  it('should return 429 when quota is exceeded', async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })
    mockQuotaService.checkQuota.mockResolvedValue(false)

    const request = new NextRequest('http://localhost/api/ai/copy', {
      method: 'POST',
      body: JSON.stringify({
        productName: 'Test Product',
        productDescription: 'A test product',
        targetAudience: '25-34세 여성',
        tone: 'professional',
        objective: 'conversion',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(429)

    const data = await response.json()
    expect(data.message).toContain('쿼터')
  })

  it('should generate ad copy successfully', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' }
    mockGetAuthenticatedUser.mockResolvedValue(mockUser)
    mockQuotaService.checkQuota.mockResolvedValue(true)

    const mockCopyVariants = [
      {
        headline: '테스트 헤드라인',
        primaryText: '테스트 본문입니다',
        description: '설명',
        callToAction: '지금 구매',
        targetAudience: '25-34세 여성',
      },
      {
        headline: '두번째 헤드라인',
        primaryText: '두번째 본문입니다',
        description: '설명2',
        callToAction: '더 알아보기',
        targetAudience: '25-34세 여성',
      },
    ]
    mockAIService.generateAdCopy.mockResolvedValue(mockCopyVariants)

    const request = new NextRequest('http://localhost/api/ai/copy', {
      method: 'POST',
      body: JSON.stringify({
        productName: 'Test Product',
        productDescription: 'A test product for testing',
        targetAudience: '25-34세 여성',
        tone: 'professional',
        objective: 'conversion',
        keywords: ['할인', '프로모션'],
        variantCount: 2,
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.variants).toHaveLength(2)
    expect(data.variants[0]).toHaveProperty('headline')
    expect(data.variants[0]).toHaveProperty('primaryText')
    expect(data.variants[0]).toHaveProperty('callToAction')

    // Verify quota was logged
    expect(mockQuotaService.logUsage).toHaveBeenCalledWith(mockUser.id, 'AI_COPY_GEN')
  })

  it('should validate tone parameter', async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })

    const request = new NextRequest('http://localhost/api/ai/copy', {
      method: 'POST',
      body: JSON.stringify({
        productName: 'Test Product',
        productDescription: 'A test product',
        targetAudience: '25-34세 여성',
        tone: 'invalid_tone', // Invalid
        objective: 'conversion',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.message).toContain('tone')
  })

  it('should validate objective parameter', async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })

    const request = new NextRequest('http://localhost/api/ai/copy', {
      method: 'POST',
      body: JSON.stringify({
        productName: 'Test Product',
        productDescription: 'A test product',
        targetAudience: '25-34세 여성',
        tone: 'professional',
        objective: 'invalid_objective', // Invalid
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.message).toContain('objective')
  })

  it('should handle AI service errors gracefully', async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })
    mockQuotaService.checkQuota.mockResolvedValue(true)
    mockAIService.generateAdCopy.mockRejectedValue(new Error('OpenAI API Error'))

    const request = new NextRequest('http://localhost/api/ai/copy', {
      method: 'POST',
      body: JSON.stringify({
        productName: 'Test Product',
        productDescription: 'A test product',
        targetAudience: '25-34세 여성',
        tone: 'professional',
        objective: 'conversion',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(500)

    const data = await response.json()
    expect(data.message).toContain('실패')

    // Quota should NOT be logged on failure
    expect(mockQuotaService.logUsage).not.toHaveBeenCalled()
  })

  it('should use default variantCount of 3', async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: 'user-1', email: 'test@example.com' })
    mockQuotaService.checkQuota.mockResolvedValue(true)
    mockAIService.generateAdCopy.mockResolvedValue([])

    const request = new NextRequest('http://localhost/api/ai/copy', {
      method: 'POST',
      body: JSON.stringify({
        productName: 'Test Product',
        productDescription: 'A test product',
        targetAudience: '25-34세 여성',
        tone: 'professional',
        objective: 'conversion',
        // variantCount not specified
      }),
    })

    await POST(request)

    expect(mockAIService.generateAdCopy).toHaveBeenCalledWith(
      expect.objectContaining({
        variantCount: 3,
      })
    )
  })
})
