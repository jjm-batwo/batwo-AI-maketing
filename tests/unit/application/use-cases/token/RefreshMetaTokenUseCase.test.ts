import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RefreshMetaTokenUseCase } from '@application/use-cases/token/RefreshMetaTokenUseCase'

// prisma 모킹
vi.mock('@/lib/prisma', () => ({
  prisma: {
    metaAdAccount: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}))

// fetch 모킹
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// 환경변수 설정
vi.stubEnv('META_APP_ID', 'test-app-id')
vi.stubEnv('META_APP_SECRET', 'test-app-secret')

import { prisma } from '@/lib/prisma'

describe('RefreshMetaTokenUseCase', () => {
  let useCase: RefreshMetaTokenUseCase
  const mockPrismaMetaAdAccount = prisma.metaAdAccount as {
    findMany: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useCase = new RefreshMetaTokenUseCase()
  })

  describe('execute', () => {
    it('should_refresh_token_successfully_when_account_has_expiring_token', async () => {
      // 7일 이내 만료 토큰
      const expiringDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5일 후
      const mockAccount = {
        id: 'account-1',
        userId: 'user-1',
        accessToken: 'old-access-token',
        tokenExpiry: expiringDate,
        metaAccountId: 'meta-account-1',
      }

      mockPrismaMetaAdAccount.findMany.mockResolvedValue([mockAccount])

      const newToken = 'new-long-lived-token'
      const newExpiresIn = 60 * 24 * 60 * 60 // 60일(초)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: newToken,
          token_type: 'bearer',
          expires_in: newExpiresIn,
        }),
      })

      mockPrismaMetaAdAccount.update.mockResolvedValue({})

      const result = await useCase.execute()

      expect(result.refreshed).toBe(1)
      expect(result.failed).toBe(0)
      expect(result.skipped).toBe(0)

      // Meta API 호출 확인
      expect(mockFetch).toHaveBeenCalledOnce()
      const fetchCall = mockFetch.mock.calls[0][0] as string
      expect(fetchCall).toContain('graph.facebook.com/v25.0/oauth/access_token')
      expect(fetchCall).toContain('grant_type=fb_exchange_token')
      expect(fetchCall).toContain('fb_exchange_token=old-access-token')

      // DB 업데이트 확인
      expect(mockPrismaMetaAdAccount.update).toHaveBeenCalledOnce()
      const updateCall = mockPrismaMetaAdAccount.update.mock.calls[0][0]
      expect(updateCall.where.id).toBe('account-1')
      expect(updateCall.data.accessToken).toBe(newToken)
      expect(updateCall.data.tokenExpiry).toBeInstanceOf(Date)
    })

    it('should_skip_account_when_token_expiry_is_null', async () => {
      const mockAccount = {
        id: 'account-1',
        userId: 'user-1',
        accessToken: 'some-token',
        tokenExpiry: null,
        metaAccountId: 'meta-account-1',
      }

      mockPrismaMetaAdAccount.findMany.mockResolvedValue([mockAccount])

      const result = await useCase.execute()

      expect(result.refreshed).toBe(0)
      expect(result.failed).toBe(0)
      expect(result.skipped).toBe(1)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should_return_failed_count_when_meta_api_returns_error', async () => {
      const expiringDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3일 후
      const mockAccount = {
        id: 'account-1',
        userId: 'user-1',
        accessToken: 'old-access-token',
        tokenExpiry: expiringDate,
        metaAccountId: 'meta-account-1',
      }

      mockPrismaMetaAdAccount.findMany.mockResolvedValue([mockAccount])

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          error: {
            message: 'Invalid OAuth access token',
            type: 'OAuthException',
            code: 190,
          },
        }),
      })

      const result = await useCase.execute()

      expect(result.refreshed).toBe(0)
      expect(result.failed).toBe(1)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('user-1')
      expect(mockPrismaMetaAdAccount.update).not.toHaveBeenCalled()
    })

    it('should_handle_already_expired_token_as_failure', async () => {
      // 이미 만료된 토큰 (tokenExpiry가 과거)
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000) // 1일 전
      const mockAccount = {
        id: 'account-1',
        userId: 'user-1',
        accessToken: 'expired-token',
        tokenExpiry: expiredDate,
        metaAccountId: 'meta-account-1',
      }

      mockPrismaMetaAdAccount.findMany.mockResolvedValue([mockAccount])

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          error: {
            message: 'Error validating access token: Session has expired',
            type: 'OAuthException',
            code: 190,
          },
        }),
      })

      const result = await useCase.execute()

      expect(result.refreshed).toBe(0)
      expect(result.failed).toBe(1)
    })

    it('should_process_multiple_accounts_and_aggregate_results', async () => {
      const expiringDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      const mockAccounts = [
        {
          id: 'account-1',
          userId: 'user-1',
          accessToken: 'token-1',
          tokenExpiry: expiringDate,
          metaAccountId: 'meta-1',
        },
        {
          id: 'account-2',
          userId: 'user-2',
          accessToken: 'token-2',
          tokenExpiry: null, // 스킵 대상
          metaAccountId: 'meta-2',
        },
        {
          id: 'account-3',
          userId: 'user-3',
          accessToken: 'token-3',
          tokenExpiry: expiringDate,
          metaAccountId: 'meta-3',
        },
      ]

      mockPrismaMetaAdAccount.findMany.mockResolvedValue(mockAccounts)

      // account-1: 성공, account-3: Meta API 에러
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'new-token-1',
            token_type: 'bearer',
            expires_in: 5184000,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            error: { message: 'Token expired', type: 'OAuthException', code: 190 },
          }),
        })

      mockPrismaMetaAdAccount.update.mockResolvedValue({})

      const result = await useCase.execute()

      expect(result.refreshed).toBe(1)
      expect(result.skipped).toBe(1)
      expect(result.failed).toBe(1)
      expect(result.errors).toHaveLength(1)
    })

    it('should_return_empty_result_when_no_expiring_accounts_found', async () => {
      mockPrismaMetaAdAccount.findMany.mockResolvedValue([])

      const result = await useCase.execute()

      expect(result.refreshed).toBe(0)
      expect(result.failed).toBe(0)
      expect(result.skipped).toBe(0)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should_correctly_calculate_new_token_expiry_from_expires_in', async () => {
      const expiringDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
      const mockAccount = {
        id: 'account-1',
        userId: 'user-1',
        accessToken: 'old-token',
        tokenExpiry: expiringDate,
        metaAccountId: 'meta-1',
      }

      mockPrismaMetaAdAccount.findMany.mockResolvedValue([mockAccount])

      const expiresInSeconds = 60 * 24 * 60 * 60 // 60일
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'new-token',
          token_type: 'bearer',
          expires_in: expiresInSeconds,
        }),
      })

      mockPrismaMetaAdAccount.update.mockResolvedValue({})

      const before = Date.now()
      await useCase.execute()
      const after = Date.now()

      const updateCall = mockPrismaMetaAdAccount.update.mock.calls[0][0]
      const savedExpiry: Date = updateCall.data.tokenExpiry
      const expectedExpiry = before + expiresInSeconds * 1000

      // 60일 후 ± 1초 허용
      expect(savedExpiry.getTime()).toBeGreaterThanOrEqual(expectedExpiry - 1000)
      expect(savedExpiry.getTime()).toBeLessThanOrEqual(after + expiresInSeconds * 1000 + 1000)
    })
  })
})
