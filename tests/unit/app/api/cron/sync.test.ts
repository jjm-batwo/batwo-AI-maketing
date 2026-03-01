/**
 * Cron Sync Route 테스트
 *
 * 비즈니스 요구사항:
 * - Meta 계정이 연결된 모든 사용자의 캠페인 + KPI를 자동 동기화
 * - 개별 사용자 실패가 전체 작업을 중단하지 않아야 함
 * - 동기화 후 ISR 캐시와 인메모리 캐시 모두 무효화
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock 모듈 설정
vi.mock('@/lib/middleware/cronAuth', () => ({
  validateCronAuth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    metaAdAccount: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/di/container', () => ({
  container: {
    resolve: vi.fn(),
  },
  DI_TOKENS: {
    SyncCampaignsUseCase: Symbol('SyncCampaignsUseCase'),
    SyncAllInsightsUseCase: Symbol('SyncAllInsightsUseCase'),
  },
}))

vi.mock('@/lib/cache/kpiCache', () => ({
  invalidateCache: vi.fn(),
  getUserPattern: vi.fn((userId: string) => `kpi:${userId}:`),
}))

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}))

import { validateCronAuth } from '@/lib/middleware/cronAuth'
import { prisma } from '@/lib/prisma'
import { container, DI_TOKENS } from '@/lib/di/container'
import { invalidateCache } from '@/lib/cache/kpiCache'
import { revalidateTag } from 'next/cache'

// Route import는 mock 이후에
import { GET } from '@/app/api/cron/sync/route'

const mockValidateCronAuth = vi.mocked(validateCronAuth)
const mockFindMany = vi.mocked(prisma.metaAdAccount.findMany)
const mockResolve = vi.mocked(container.resolve)
const mockInvalidateCache = vi.mocked(invalidateCache)
const mockRevalidateTag = vi.mocked(revalidateTag)

function createCronRequest(): NextRequest {
  return new NextRequest('http://localhost:3000/api/cron/sync', {
    headers: { authorization: 'Bearer test-cron-secret' },
  })
}

describe('GET /api/cron/sync', () => {
  const mockSyncCampaigns = { execute: vi.fn() }
  const mockSyncInsights = { execute: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
    mockValidateCronAuth.mockReturnValue({ authorized: true })
    mockResolve.mockImplementation((token: symbol) => {
      if (token === DI_TOKENS.SyncCampaignsUseCase) return mockSyncCampaigns
      if (token === DI_TOKENS.SyncAllInsightsUseCase) return mockSyncInsights
      throw new Error(`Unknown token: ${token.toString()}`)
    })
  })

  it('should_reject_unauthorized_requests', async () => {
    const { NextResponse } = await import('next/server')
    mockValidateCronAuth.mockReturnValue({
      authorized: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    })

    const response = await GET(createCronRequest())
    expect(response.status).toBe(401)
  })

  it('should_return_success_when_no_meta_accounts_found', async () => {
    mockFindMany.mockResolvedValue([])

    const response = await GET(createCronRequest())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.processed).toBe(0)
  })

  it('should_sync_campaigns_and_insights_for_each_user', async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 'acc1',
        userId: 'user1',
        metaAccountId: 'act_111',
        accessToken: 'token1',
        tokenExpiry: null,
        businessName: null,
        currency: 'KRW',
        timezone: 'Asia/Seoul',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'acc2',
        userId: 'user2',
        metaAccountId: 'act_222',
        accessToken: 'token2',
        tokenExpiry: null,
        businessName: null,
        currency: 'KRW',
        timezone: 'Asia/Seoul',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as never)

    mockSyncCampaigns.execute.mockResolvedValue({
      created: 1,
      updated: 2,
      archived: 0,
      total: 3,
    })
    mockSyncInsights.execute.mockResolvedValue({
      synced: 5,
      failed: 0,
      total: 5,
    })

    const response = await GET(createCronRequest())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.processed).toBe(2)

    // SyncCampaignsUseCase가 각 사용자별로 호출됨
    expect(mockSyncCampaigns.execute).toHaveBeenCalledTimes(2)
    expect(mockSyncCampaigns.execute).toHaveBeenCalledWith({ userId: 'user1' })
    expect(mockSyncCampaigns.execute).toHaveBeenCalledWith({ userId: 'user2' })

    // SyncAllInsightsUseCase가 각 사용자별로 호출됨
    expect(mockSyncInsights.execute).toHaveBeenCalledTimes(2)
    expect(mockSyncInsights.execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user1', datePreset: 'last_7d' })
    )
  })

  it('should_invalidate_caches_after_sync', async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 'acc1',
        userId: 'user1',
        metaAccountId: 'act_111',
        accessToken: 'token1',
        tokenExpiry: null,
        businessName: null,
        currency: 'KRW',
        timezone: 'Asia/Seoul',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as never)

    mockSyncCampaigns.execute.mockResolvedValue({ created: 0, updated: 0, archived: 0, total: 0 })
    mockSyncInsights.execute.mockResolvedValue({ synced: 0, failed: 0, total: 0 })

    await GET(createCronRequest())

    // 인메모리 KPI 캐시 무효화
    expect(mockInvalidateCache).toHaveBeenCalledWith('kpi:user1:')

    // ISR 캐시 무효화
    expect(mockRevalidateTag).toHaveBeenCalledWith('campaigns', 'default')
    expect(mockRevalidateTag).toHaveBeenCalledWith('kpi', 'default')
  })

  it('should_skip_expired_tokens_and_continue', async () => {
    const pastDate = new Date('2020-01-01')
    mockFindMany.mockResolvedValue([
      {
        id: 'acc1',
        userId: 'user1',
        metaAccountId: 'act_111',
        accessToken: 'token1',
        tokenExpiry: pastDate,
        businessName: null,
        currency: 'KRW',
        timezone: 'Asia/Seoul',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'acc2',
        userId: 'user2',
        metaAccountId: 'act_222',
        accessToken: 'token2',
        tokenExpiry: null,
        businessName: null,
        currency: 'KRW',
        timezone: 'Asia/Seoul',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as never)

    mockSyncCampaigns.execute.mockResolvedValue({ created: 0, updated: 0, archived: 0, total: 0 })
    mockSyncInsights.execute.mockResolvedValue({ synced: 0, failed: 0, total: 0 })

    const response = await GET(createCronRequest())
    const body = await response.json()

    expect(body.success).toBe(true)
    // 만료된 토큰은 스킵, 유효한 사용자만 처리
    expect(body.processed).toBe(1)
    expect(body.skipped).toBe(1)
    expect(mockSyncCampaigns.execute).toHaveBeenCalledTimes(1)
    expect(mockSyncCampaigns.execute).toHaveBeenCalledWith({ userId: 'user2' })
  })

  it('should_continue_processing_when_one_user_fails', async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 'acc1',
        userId: 'user1',
        metaAccountId: 'act_111',
        accessToken: 'token1',
        tokenExpiry: null,
        businessName: null,
        currency: 'KRW',
        timezone: 'Asia/Seoul',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'acc2',
        userId: 'user2',
        metaAccountId: 'act_222',
        accessToken: 'token2',
        tokenExpiry: null,
        businessName: null,
        currency: 'KRW',
        timezone: 'Asia/Seoul',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as never)

    // user1 동기화 실패
    mockSyncCampaigns.execute
      .mockRejectedValueOnce(new Error('Meta API error'))
      .mockResolvedValueOnce({ created: 1, updated: 0, archived: 0, total: 1 })

    mockSyncInsights.execute.mockResolvedValue({ synced: 1, failed: 0, total: 1 })

    const response = await GET(createCronRequest())
    const body = await response.json()

    expect(body.success).toBe(true)
    expect(body.processed).toBe(1)
    expect(body.errors).toHaveLength(1)
    expect(body.errors[0]).toContain('user1')
  })

  it('should_return_500_on_fatal_error', async () => {
    mockFindMany.mockRejectedValue(new Error('Database connection failed'))

    const response = await GET(createCronRequest())
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.success).toBe(false)
  })
})
