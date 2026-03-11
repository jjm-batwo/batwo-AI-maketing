import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// --- Mock instances that will be returned by new MetaAdsClient() ---
const mockListCampaigns = vi.fn()
const mockListAdSets = vi.fn()
const mockGetAdSetInsights = vi.fn()

// --- vi.mock declarations (hoisted) ---

vi.mock('@/lib/auth', () => ({
    getAuthenticatedUser: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
    prisma: {
        metaAdAccount: {
            findFirst: vi.fn(),
        },
    },
}))

vi.mock('@/infrastructure/external/meta-ads/MetaAdsClient', () => {
    return {
        MetaAdsClient: vi.fn().mockImplementation(function (this: any) {
            this.listCampaigns = mockListCampaigns
            this.listAdSets = mockListAdSets
            this.getAdSetInsights = mockGetAdSetInsights
        }),
    }
})

vi.mock('@application/utils/TokenEncryption', () => ({
    safeDecryptToken: vi.fn((token: string) => token),
}))

// --- Static imports (after vi.mock) ---

import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { safeDecryptToken } from '@application/utils/TokenEncryption'
import { MetaAdsApiError } from '@/infrastructure/external/errors'
import { GET } from '@/app/api/meta/all-adsets-with-insights/route'

// --- Typed mocks ---

const mockGetAuthenticatedUser = vi.mocked(getAuthenticatedUser)
const mockFindFirst = vi.mocked(prisma.metaAdAccount.findFirst)
const mockSafeDecryptToken = vi.mocked(safeDecryptToken)

function createRequest(datePreset?: string): NextRequest {
    const url = datePreset
        ? `http://localhost:3000/api/meta/all-adsets-with-insights?datePreset=${datePreset}`
        : 'http://localhost:3000/api/meta/all-adsets-with-insights'
    return new NextRequest(url)
}

// --- Test data ---

const mockUser = { id: 'user-1', name: 'Test User', email: 'test@test.com' }
const mockMetaAccount = {
    id: 'account-1',
    userId: 'user-1',
    accessToken: 'encrypted-token',
    metaAccountId: 'act_123',
    createdAt: new Date(),
}
const mockCampaigns = [
    { id: 'camp-1', name: 'Campaign 1', status: 'ACTIVE' },
    { id: 'camp-2', name: 'Campaign 2', status: 'PAUSED' },
]
const mockAdSetsData = [
    { id: 'adset-1', name: 'AdSet 1', status: 'ACTIVE', dailyBudget: 30000 },
    { id: 'adset-2', name: 'AdSet 2', status: 'PAUSED', dailyBudget: 20000 },
]
const mockInsightsData = {
    campaignId: 'adset-1',
    impressions: 5000,
    clicks: 200,
    spend: 50000,
    conversions: 10,
    revenue: 200000,
    reach: 4000,
    linkClicks: 180,
    dateStart: '2026-01-01',
    dateStop: '2026-01-07',
}

describe('GET /api/meta/all-adsets-with-insights - Edge Cases', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Default happy path setup
        mockGetAuthenticatedUser.mockResolvedValue(mockUser as any)
        mockFindFirst.mockResolvedValue(mockMetaAccount as any)
        mockSafeDecryptToken.mockImplementation((token: string) => `decrypted-${token}`)
        mockListCampaigns.mockResolvedValue({ campaigns: mockCampaigns })
        mockListAdSets.mockResolvedValue(mockAdSetsData)
        mockGetAdSetInsights.mockResolvedValue(mockInsightsData)
    })

    // --- 인증 ---

    it('should return 401 when user is not authenticated', async () => {
        mockGetAuthenticatedUser.mockResolvedValue(null as any)
        const response = await GET(createRequest())
        expect(response.status).toBe(401)
        const body = await response.json()
        expect(body.adSets).toEqual([])
    })

    // --- safeDecryptToken 실패 ---

    it('should return 401 when safeDecryptToken throws', async () => {
        mockSafeDecryptToken.mockImplementation(() => {
            throw new Error('Decryption failed: invalid auth tag')
        })
        const response = await GET(createRequest())
        expect(response.status).toBe(401)
        const body = await response.json()
        expect(body.error).toContain('Token decryption failed')
        expect(body.adSets).toEqual([])
    })

    it('should return 401 when safeDecryptToken returns empty string', async () => {
        mockSafeDecryptToken.mockReturnValue('')
        const response = await GET(createRequest())
        expect(response.status).toBe(401)
        const body = await response.json()
        expect(body.error).toContain('Invalid access token')
    })

    // --- Meta Account 없음 ---

    it('should return empty adSets when no Meta account exists', async () => {
        mockFindFirst.mockResolvedValue(null as any)
        const response = await GET(createRequest())
        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body.adSets).toEqual([])
    })

    it('should return empty adSets when Meta account has no metaAccountId', async () => {
        mockFindFirst.mockResolvedValue({ ...mockMetaAccount, metaAccountId: null } as any)
        const response = await GET(createRequest())
        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body.adSets).toEqual([])
    })

    // --- 권한 박탈 (ErrorCode 190, 102) ---

    it('should return 401 when listCampaigns returns auth error (token expired, code 190)', async () => {
        mockListCampaigns.mockRejectedValue(
            new MetaAdsApiError('Invalid OAuth access token.', 190, undefined, 401)
        )
        const response = await GET(createRequest())
        expect(response.status).toBe(401)
        const body = await response.json()
        expect(body.error).toContain('expired or revoked')
        expect(body.adSets).toEqual([])
    })

    it('should return 401 when listCampaigns returns auth error (session expired, code 102)', async () => {
        mockListCampaigns.mockRejectedValue(
            new MetaAdsApiError('Session has expired.', 102, undefined, 401)
        )
        const response = await GET(createRequest())
        expect(response.status).toBe(401)
    })

    // --- Rate Limit (ErrorCode 17, 4) ---

    it('should return 429 when listCampaigns hits rate limit (code 17)', async () => {
        mockListCampaigns.mockRejectedValue(
            new MetaAdsApiError('User request limit reached', 17, undefined, 429)
        )
        const response = await GET(createRequest())
        expect(response.status).toBe(429)
        const body = await response.json()
        expect(body.error).toContain('rate limit')
        expect(body._rateLimited).toBe(true)
    })

    it('should return 429 when listCampaigns hits rate limit (code 4)', async () => {
        mockListCampaigns.mockRejectedValue(
            new MetaAdsApiError('Application request limit reached', 4, undefined, 429)
        )
        const response = await GET(createRequest())
        expect(response.status).toBe(429)
    })

    // --- 빈 결과 ---

    it('should return empty adSets when campaigns list is empty', async () => {
        mockListCampaigns.mockResolvedValue({ campaigns: [] })
        const response = await GET(createRequest())
        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body.adSets).toEqual([])
        expect(mockListAdSets).not.toHaveBeenCalled()
    })

    it('should return empty adSets when no adsets found across campaigns', async () => {
        mockListAdSets.mockResolvedValue([])
        const response = await GET(createRequest())
        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body.adSets).toEqual([])
        expect(mockGetAdSetInsights).not.toHaveBeenCalled()
    })

    // --- Rate limit partial 결과 ---

    it('should include _rateLimited flag when rate limit hits during adset fetch', async () => {
        let callCount = 0
        mockListAdSets.mockImplementation(async () => {
            callCount++
            if (callCount === 2) {
                throw new MetaAdsApiError('User request limit reached', 17, undefined, 429)
            }
            return mockAdSetsData
        })
        const response = await GET(createRequest())
        const body = await response.json()
        expect(response.status).toBe(200)
        expect(body._rateLimited).toBe(true)
        expect(body.adSets.length).toBeGreaterThan(0)
    })

    // --- Auth 에러 전파 ---

    it('should propagate auth error from adset-level mapWithConcurrency', async () => {
        mockListAdSets.mockRejectedValue(
            new MetaAdsApiError('Invalid OAuth access token.', 190, undefined, 401)
        )
        const response = await GET(createRequest())
        expect(response.status).toBe(401)
        const body = await response.json()
        expect(body.error).toContain('expired or revoked')
    })

    it('should propagate auth error from insights fetch', async () => {
        mockGetAdSetInsights.mockRejectedValue(
            new MetaAdsApiError('Invalid OAuth access token.', 190, undefined, 401)
        )
        const response = await GET(createRequest())
        expect(response.status).toBe(401)
    })

    // --- Insights fallback ---

    it('should return zero insights for adsets that hit rate limit during insights fetch', async () => {
        let insightCallCount = 0
        mockGetAdSetInsights.mockImplementation(async () => {
            insightCallCount++
            if (insightCallCount === 2) {
                throw new MetaAdsApiError('User request limit reached', 17, undefined, 429)
            }
            return mockInsightsData
        })
        const response = await GET(createRequest())
        const body = await response.json()
        expect(response.status).toBe(200)
        expect(body._rateLimited).toBe(true)
        const adSetWithZeroInsights = body.adSets.find((as: any) => as.insights.impressions === 0)
        expect(adSetWithZeroInsights).toBeDefined()
    })

    // --- Happy path ---

    it('should return adSets with insights on success', async () => {
        const response = await GET(createRequest())
        expect(response.status).toBe(200)
        const body = await response.json()
        // 2 campaigns × 2 adsets each = 4 adsets
        expect(body.adSets).toHaveLength(4)
        expect(body.adSets[0].insights.impressions).toBe(5000)
        expect(body._rateLimited).toBeUndefined()
    })

    // --- Unknown error → 500 ---

    it('should return 500 on unexpected errors', async () => {
        mockListCampaigns.mockRejectedValue(new Error('Network error'))
        const response = await GET(createRequest())
        expect(response.status).toBe(500)
        const body = await response.json()
        expect(body.adSets).toEqual([])
    })
})
