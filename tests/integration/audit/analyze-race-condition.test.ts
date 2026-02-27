/**
 * analyze Race Condition 방어 통합 테스트
 *
 * auditTokenCache.getAndDelete()가 원자적으로 동작하는지 검증.
 * 동일 sessionId에 대해 동시 2회 호출 시 1회만 성공해야 한다.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { auditTokenCache } from '@/lib/cache/auditTokenCache'

describe('analyze Race Condition 방어', () => {
  beforeEach(async () => {
    await auditTokenCache.clearAll()
  })

  it('동일 sessionId 동시 2회 getAndDelete → 1회만 성공', async () => {
    const sessionId = await auditTokenCache.set({
      accessToken: 'test-token',
      adAccountId: 'act_123',
      adAccounts: [{ id: 'act_123', name: 'Test', currency: 'KRW', accountStatus: 1 }],
    })

    // 동시 2회 getAndDelete
    const [result1, result2] = await Promise.all([
      auditTokenCache.getAndDelete(sessionId),
      auditTokenCache.getAndDelete(sessionId),
    ])

    // 하나만 성공, 나머지는 null
    const successes = [result1, result2].filter((r) => r !== null)
    expect(successes).toHaveLength(1)
    expect(successes[0]?.accessToken).toBe('test-token')
  })

  it('사용된 세션 재사용 불가', async () => {
    const sessionId = await auditTokenCache.set({
      accessToken: 'test-token',
      adAccountId: 'act_123',
      adAccounts: [],
    })

    const first = await auditTokenCache.getAndDelete(sessionId)
    expect(first).not.toBeNull()

    const second = await auditTokenCache.getAndDelete(sessionId)
    expect(second).toBeNull()
  })
})
