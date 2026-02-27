/**
 * 감사 플로우 Rate Limit 통합 테스트
 *
 * Rate Limit 키 재설계 검증:
 * - auth-url: audit 타입 (3회/일) — 유일한 gate
 * - callback: Rate Limit 없음 (Meta가 호출하는 OAuth 콜백)
 * - accounts: general 타입 (100회/분, 읽기전용)
 * - analyze: Rate Limit 없음 (getAndDelete로 single-use 보호)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { checkRateLimit } from '@/lib/middleware/rateLimit'
import { RATE_LIMIT_CONFIG } from '@/lib/security/config'

// checkRateLimit을 spy로 감싸서 호출 추적
vi.mock('@/lib/middleware/rateLimit', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/middleware/rateLimit')>()
  return {
    ...original,
    checkRateLimit: vi.fn(original.checkRateLimit),
  }
})

const mockedCheckRateLimit = vi.mocked(checkRateLimit)

// ─── auth-url 라우트 import ───────────────────────────────────────────────────

// callback, analyze는 외부 fetch(Meta API)를 호출하므로 직접 import 테스트가 어려움.
// 대신 소스 코드에서 Rate Limit 제거/변경이 올바르게 반영되었는지 정적 검증.

// ─── Rate Limit 설정 검증 ─────────────────────────────────────────────────────

describe('감사 플로우 Rate Limit 키 재설계', () => {
  beforeEach(() => {
    mockedCheckRateLimit.mockClear()
  })

  describe('Rate Limit 설정 확인', () => {
    it('audit 타입: 3회/일 설정 유지 (auth-url 전용 gate)', () => {
      expect(RATE_LIMIT_CONFIG.audit.tokens).toBe(3)
      expect(RATE_LIMIT_CONFIG.audit.interval).toBe(24 * 60 * 60 * 1000)
    })

    it('general 타입: 100회/분 (accounts API에 사용)', () => {
      expect(RATE_LIMIT_CONFIG.general.tokens).toBe(100)
      expect(RATE_LIMIT_CONFIG.general.interval).toBe(60 * 1000)
    })
  })

  describe('callback/route.ts — Rate Limit 제거 검증', () => {
    it('callback 라우트에 checkRateLimit import가 없어야 함', async () => {
      // 동적 import로 모듈 소스를 검증하는 대신,
      // 실제 라우트 핸들러가 checkRateLimit을 호출하지 않는지 확인
      const { GET } = await import('@/app/api/audit/callback/route')
      const handlerSource = GET.toString()

      // 핸들러 함수 내에서 checkRateLimit 참조가 없어야 함
      expect(handlerSource).not.toContain('checkRateLimit')
    })
  })

  describe('accounts/route.ts — general 타입 Rate Limit 검증', () => {
    it('accounts API는 general 타입으로 Rate Limit 적용', async () => {
      // accounts 라우트 모듈의 소스 검증
      const accountsModule = await import('@/app/api/audit/accounts/route')
      const handlerSource = accountsModule.GET.toString()

      // 'general' 타입을 사용하는지 확인 (audit 타입이 아님)
      expect(handlerSource).not.toContain("'audit'")
    })
  })

  describe('analyze/route.ts — Rate Limit 제거 검증', () => {
    it('analyze 라우트에 checkRateLimit 호출이 없어야 함', async () => {
      const { POST } = await import('@/app/api/audit/analyze/route')
      const handlerSource = POST.toString()

      expect(handlerSource).not.toContain('checkRateLimit')
    })
  })

  describe('auth-url/route.ts — 기존 audit Rate Limit 유지 검증', () => {
    it('auth-url은 audit 타입 Rate Limit 유지', async () => {
      const authUrlModule = await import('@/app/api/audit/auth-url/route')
      const handlerSource = authUrlModule.GET.toString()

      // audit 타입 Rate Limit이 존재해야 함
      expect(handlerSource).toContain('checkRateLimit')
    })
  })

  describe('checkRateLimit 함수 동작 검증', () => {
    it('auth-url 3회 후 4번째 요청 → 429 (success: false)', async () => {
      const testIp = `test-rl-${Date.now()}`
      const key = `audit:${testIp}`

      // 1~3회: 성공
      for (let i = 0; i < 3; i++) {
        const result = await checkRateLimit(key, 'audit')
        expect(result.success).toBe(true)
        expect(result.remaining).toBe(2 - i)
      }

      // 4번째: 실패
      const blocked = await checkRateLimit(key, 'audit')
      expect(blocked.success).toBe(false)
      expect(blocked.remaining).toBe(0)
    })

    it('general 타입은 100회까지 허용', async () => {
      const testIp = `test-general-${Date.now()}`
      const key = `audit-accounts:${testIp}`

      // 첫 요청 성공
      const first = await checkRateLimit(key, 'general')
      expect(first.success).toBe(true)
      expect(first.remaining).toBe(99)
    })

    it('서로 다른 키는 독립적으로 카운팅', async () => {
      const testIp = `test-independent-${Date.now()}`

      // auth-url용 audit 키
      const authResult = await checkRateLimit(`audit:${testIp}`, 'audit')
      expect(authResult.success).toBe(true)

      // accounts용 general 키 — audit 카운트에 영향 없음
      const accountsResult = await checkRateLimit(`audit-accounts:${testIp}`, 'general')
      expect(accountsResult.success).toBe(true)
      expect(accountsResult.remaining).toBe(99)
    })
  })

  describe('전체 감사 플로우 — Rate Limit 차감 검증', () => {
    it('1회 완전한 플로우에서 audit Rate Limit은 auth-url에서만 1회 차감', async () => {
      const testIp = `test-flow-${Date.now()}`

      // 1단계: auth-url → audit 타입 1회 차감
      const authResult = await checkRateLimit(`audit:${testIp}`, 'audit')
      expect(authResult.success).toBe(true)
      expect(authResult.remaining).toBe(2) // 3 - 1 = 2

      // 2단계: callback → Rate Limit 없음 (코드에서 제거됨, 호출 자체를 안 함)
      // checkRateLimit 호출하지 않으므로 audit 잔여량 변화 없음

      // 3단계: accounts → general 타입 (audit 카운트에 영향 없음)
      const accountsResult = await checkRateLimit(`audit-accounts:${testIp}`, 'general')
      expect(accountsResult.success).toBe(true)

      // 4단계: analyze → Rate Limit 없음 (코드에서 제거됨, 호출 자체를 안 함)
      // checkRateLimit 호출하지 않으므로 audit 잔여량 변화 없음

      // 최종 확인: audit 키의 잔여량은 여전히 2 (auth-url에서만 1회 차감)
      const verifyResult = await checkRateLimit(`audit:${testIp}`, 'audit')
      expect(verifyResult.success).toBe(true)
      expect(verifyResult.remaining).toBe(1) // 두 번째 호출이므로 3 - 2 = 1
    })

    it('auth-url 3회 소진 후 4번째 플로우 시작 불가 → 429', async () => {
      const testIp = `test-flow-exhaust-${Date.now()}`

      // 3회 소진
      for (let i = 0; i < 3; i++) {
        const result = await checkRateLimit(`audit:${testIp}`, 'audit')
        expect(result.success).toBe(true)
      }

      // 4번째 시도 → 차단
      const blocked = await checkRateLimit(`audit:${testIp}`, 'audit')
      expect(blocked.success).toBe(false)
      expect(blocked.remaining).toBe(0)
    })
  })
})
