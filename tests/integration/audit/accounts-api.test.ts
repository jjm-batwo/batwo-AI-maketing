/**
 * GET /api/audit/accounts 통합 테스트
 *
 * 세션 캐시에서 광고 계정 목록을 반환하는 API 검증.
 * accessToken이 응답에 포함되지 않는지 확인 (보안).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/audit/accounts/route'
import { auditTokenCache } from '@/lib/cache/auditTokenCache'

// Rate Limit 우회
vi.mock('@/lib/middleware/rateLimit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, limit: 3, remaining: 2, reset: Date.now() + 86400000 }),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
  rateLimitExceededResponse: vi.fn(),
}))

const SAMPLE_ACCOUNTS = {
  accessToken: 'EAAtest_secret_token',
  adAccountId: '',
  adAccounts: [
    { id: 'act_111', name: '운영 계정', currency: 'KRW', accountStatus: 1 },
    { id: 'act_222', name: '비활성 계정', currency: 'USD', accountStatus: 2 },
    { id: 'act_333', name: '미결제 계정', currency: 'KRW', accountStatus: 3 },
  ],
}

function createRequest(sessionId?: string): NextRequest {
  const url = sessionId
    ? `http://localhost:3000/api/audit/accounts?session=${sessionId}`
    : 'http://localhost:3000/api/audit/accounts'
  return new NextRequest(url)
}

describe('GET /api/audit/accounts', () => {
  beforeEach(async () => {
    await auditTokenCache.clearAll()
  })

  it('유효한 sessionId → 200 + 계정 목록 반환', async () => {
    const sessionId = await auditTokenCache.set(SAMPLE_ACCOUNTS)
    const res = await GET(createRequest(sessionId))

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.accounts).toHaveLength(3)
    expect(data.accounts[0]).toEqual({
      id: 'act_111',
      name: '운영 계정',
      currency: 'KRW',
      accountStatus: 1,
    })
  })

  it('응답에 accessToken이 포함되지 않음 (보안)', async () => {
    const sessionId = await auditTokenCache.set(SAMPLE_ACCOUNTS)
    const res = await GET(createRequest(sessionId))
    const data = await res.json()

    // accessToken이 응답 어디에도 없어야 함
    const json = JSON.stringify(data)
    expect(json).not.toContain('EAAtest_secret_token')
    expect(json).not.toContain('accessToken')
  })

  it('accountStatus 필드가 응답에 포함됨', async () => {
    const sessionId = await auditTokenCache.set(SAMPLE_ACCOUNTS)
    const res = await GET(createRequest(sessionId))
    const data = await res.json()

    expect(data.accounts[0].accountStatus).toBe(1)
    expect(data.accounts[1].accountStatus).toBe(2)
    expect(data.accounts[2].accountStatus).toBe(3)
  })

  it('sessionId 미전달 → 400', async () => {
    const res = await GET(createRequest())

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.message).toContain('세션 ID')
  })

  it('존재하지 않는 sessionId → 404', async () => {
    const res = await GET(createRequest('00000000-0000-0000-0000-000000000000'))

    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.message).toContain('만료')
  })

  it('삭제된 세션 → 404', async () => {
    const sessionId = await auditTokenCache.set(SAMPLE_ACCOUNTS)
    await auditTokenCache.delete(sessionId)

    const res = await GET(createRequest(sessionId))
    expect(res.status).toBe(404)
  })
})
