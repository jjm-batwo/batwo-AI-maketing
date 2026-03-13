import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth', () => ({
  getAuthenticatedUser: vi.fn(),
  unauthorizedResponse: vi.fn(() => new Response(null, { status: 401 })),
}))

vi.mock('@/lib/di/container', () => ({
  container: {
    resolve: vi.fn(),
  },
  DI_TOKENS: {
    MetaAdsService: Symbol('MetaAdsService'),
  },
}))

const mockGetMetaAccountForUser = vi.fn()
vi.mock('@/lib/meta/metaAccountHelper', () => ({
  getMetaAccountForUser: (...args: unknown[]) => mockGetMetaAccountForUser(...args),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    campaign: {
      findFirst: vi.fn(),
    },
  },
}))

import { getAuthenticatedUser } from '@/lib/auth'
import { container } from '@/lib/di/container'
import { prisma } from '@/lib/prisma'
import { GET } from '@/app/api/campaigns/[id]/adsets-with-insights/route'

const mockGetAuthenticatedUser = vi.mocked(getAuthenticatedUser)
const mockResolve = vi.mocked(container.resolve)
const mockFindCampaign = vi.mocked(prisma.campaign.findFirst)

function createRequest() {
  return new NextRequest(
    'http://localhost:3000/api/campaigns/cmp_db_1/adsets-with-insights?datePreset=last_7d'
  )
}

describe('GET /api/campaigns/[id]/adsets-with-insights', () => {
  const mockMetaAdsService = {
    listAdSets: vi.fn(),
    getAdSetInsights: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAuthenticatedUser.mockResolvedValue({ id: 'user-1' } as never)
    mockResolve.mockReturnValue(mockMetaAdsService as never)
    mockGetMetaAccountForUser.mockResolvedValue({
      id: 'account-1',
      metaAccountId: 'act_123',
      accessToken: 'encrypted-token',
      tokenExpiry: null,
      businessName: null,
    })
  })

  it('should_use_meta_campaign_id_instead_of_internal_campaign_id', async () => {
    mockFindCampaign.mockResolvedValue({ metaCampaignId: '120000000000001' } as never)
    mockMetaAdsService.listAdSets.mockResolvedValue([])

    await GET(createRequest(), { params: Promise.resolve({ id: 'cmp_db_1' }) })

    expect(mockMetaAdsService.listAdSets).toHaveBeenCalledWith('encrypted-token', '120000000000001')
  })

  it('should_return_empty_adsets_when_meta_campaign_id_is_missing', async () => {
    mockFindCampaign.mockResolvedValue({ metaCampaignId: null } as never)

    const response = await GET(createRequest(), { params: Promise.resolve({ id: 'cmp_db_1' }) })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ adSets: [] })
    expect(mockMetaAdsService.listAdSets).not.toHaveBeenCalled()
  })
})
