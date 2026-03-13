import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// --- Mock instances that will be returned by new MetaAdsClient() ---
const mockListCampaigns = vi.fn()
const mockListAllAdSets = vi.fn()
const mockGetAccountInsights = vi.fn()
const mockGetMetaAccountForUser = vi.fn()

// --- vi.mock declarations (hoisted) ---

vi.mock('@/lib/auth', () => ({
    getAuthenticatedUser: vi.fn(),
}))

vi.mock('@/lib/meta/metaAccountHelper', () => ({
    getMetaAccountForUser: (...args: unknown[]) => mockGetMetaAccountForUser(...args),
}))

vi.mock('@/infrastructure/external/meta-ads/MetaAdsClient', () => {
    return {
        MetaAdsClient: vi.fn().mockImplementation(function (this: any) {
            this.listCampaigns = mockListCampaigns
            this.listAllAdSets = mockListAllAdSets
            this.getAccountInsights = mockGetAccountInsights
        }),
    }
})

// --- Static imports (after vi.mock) ---

import { getAuthenticatedUser } from '@/lib/auth'
import { MetaAdsApiError } from '@/infrastructure/external/errors'
import { GET } from '@/app/api/meta/all-adsets-with-insights/route'

// --- Typed mocks ---

const mockGetAuthenticatedUser = vi.mocked(getAuthenticatedUser)

function createRequest(datePreset?: string): NextRequest {
    const url = datePreset
        ? `http://localhost:3000/api/meta/all-adsets-with-insights?datePreset=${datePreset}`
        : 'http://localhost:3000/api/meta/all-adsets-with-insights'
    return new NextRequest(url)
}

// --- Test data ---

const mockUser = { id: 'user-1', name: 'Test User', email: 'test@test.com' }
const mockMetaAccountInfo = {
    id: 'account-1',
    metaAccountId: 'act_123',
    accessToken: 'decrypted-token',
    tokenExpiry: null,
    businessName: null,
}
const mockCampaigns = [
    { id: 'camp-1', name: 'Campaign 1', status: 'ACTIVE' },
    { id: 'camp-2', name: 'Campaign 2', status: 'PAUSED' },
]
const mockAdSetsData = [
    { id: 'adset-1', name: 'AdSet 1', status: 'ACTIVE', dailyBudget: 30000 },
    { id: 'adset-2', name: 'AdSet 2', status: 'PAUSED', dailyBudget: 20000 },
]
const mockInsightsMap = new Map([
    ['adset-1', {
        campaignId: 'camp-1',
        impressions: 5000,
        clicks: 200,
        spend: 50000,
        conversions: 10,
        revenue: 200000,
        reach: 4000,
        linkClicks: 180,
        dateStart: '2026-01-01',
        dateStop: '2026-01-07',
    }],
    ['adset-2', {
        campaignId: 'camp-1',
        impressions: 3000,
        clicks: 120,
        spend: 30000,
        conversions: 6,
        revenue: 120000,
        reach: 2500,
        linkClicks: 100,
        dateStart: '2026-01-01',
        dateStop: '2026-01-07',
    }],
])

describe('GET /api/meta/all-adsets-with-insights - Bulk Optimized', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Default happy path setup
        mockGetAuthenticatedUser.mockResolvedValue(mockUser as any)
        mockGetMetaAccountForUser.mockResolvedValue(mockMetaAccountInfo)
        mockListCampaigns.mockResolvedValue({ campaigns: mockCampaigns })
        mockListAllAdSets.mockResolvedValue(mockAdSetsData)
        mockGetAccountInsights.mockResolvedValue(mockInsightsMap)
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

    it('should return empty adSets when getMetaAccountForUser returns null (token decrypt fail)', async () => {
        mockGetMetaAccountForUser.mockResolvedValue(null)
        const response = await GET(createRequest())
        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body.adSets).toEqual([])
    })

    it('should return empty adSets when getMetaAccountForUser returns null (empty token)', async () => {
        mockGetMetaAccountForUser.mockResolvedValue(null)
        const response = await GET(createRequest())
        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body.adSets).toEqual([])
    })

    // --- Meta Account 없음 ---

    it('should return empty adSets when no Meta account exists', async () => {
        mockGetMetaAccountForUser.mockResolvedValue(null)
        const response = await GET(createRequest())
        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body.adSets).toEqual([])
    })

    it('should return empty adSets when Meta account has no metaAccountId', async () => {
        mockGetMetaAccountForUser.mockResolvedValue(null)
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
        expect(mockListAllAdSets).not.toHaveBeenCalled()
    })

    it('should return empty adSets when no adsets found across campaigns', async () => {
        mockListAllAdSets.mockResolvedValue([])
        const response = await GET(createRequest())
        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body.adSets).toEqual([])
        expect(mockGetAccountInsights).not.toHaveBeenCalled()
    })

    // --- Rate limit at bulk level ---

    it('should return _rateLimited flag when listAllAdSets hits rate limit', async () => {
        mockListAllAdSets.mockRejectedValue(
            new MetaAdsApiError('User request limit reached', 17, undefined, 429)
        )
        const response = await GET(createRequest())
        const body = await response.json()
        expect(response.status).toBe(200)
        expect(body._rateLimited).toBe(true)
        expect(body.adSets).toEqual([])
    })

    // --- Auth 에러 전파 ---

    it('should propagate auth error from listAllAdSets', async () => {
        mockListAllAdSets.mockRejectedValue(
            new MetaAdsApiError('Invalid OAuth access token.', 190, undefined, 401)
        )
        const response = await GET(createRequest())
        expect(response.status).toBe(401)
        const body = await response.json()
        expect(body.error).toContain('expired or revoked')
    })

    it('should propagate auth error from getAccountInsights', async () => {
        mockGetAccountInsights.mockRejectedValue(
            new MetaAdsApiError('Invalid OAuth access token.', 190, undefined, 401)
        )
        const response = await GET(createRequest())
        expect(response.status).toBe(401)
    })

    // --- Insights fallback ---

    it('should return zero insights for adsets when getAccountInsights hits rate limit', async () => {
        mockGetAccountInsights.mockRejectedValue(
            new MetaAdsApiError('User request limit reached', 17, undefined, 429)
        )
        const response = await GET(createRequest())
        const body = await response.json()
        expect(response.status).toBe(200)
        expect(body.adSets.length).toBe(2)
        expect(body.adSets[0].insights.impressions).toBe(0)
        expect(body.adSets[1].insights.impressions).toBe(0)
    })

    // --- Happy path ---

    it('should return adSets with insights on success', async () => {
        const response = await GET(createRequest())
        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body.adSets).toHaveLength(2)
        expect(body.adSets[0].insights.impressions).toBe(5000)
        expect(body.adSets[1].insights.impressions).toBe(3000)
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
