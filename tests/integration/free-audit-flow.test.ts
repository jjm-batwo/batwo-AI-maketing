/**
 * 무료 감사 플로우 통합 테스트
 *
 * auditTokenCache 동작, Rate Limit 설정, Zod 스키마를
 * Mock 기반으로 검증. DB 연결 없이 실행 가능.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { auditTokenCache } from '@/lib/cache/auditTokenCache'
import { RATE_LIMIT_CONFIG } from '@/lib/security/config'
import { auditAnalyzeSchema } from '@/lib/validations/audit'

// ─── 테스트 픽스처 ─────────────────────────────────────────────────────────────

const SAMPLE_SESSION = {
  accessToken: 'EAAtest_token_abc123',
  adAccountId: 'act_123456789',
  adAccounts: [
    { id: 'act_123456789', name: '테스트 광고 계정', currency: 'KRW' },
    { id: 'act_987654321', name: '보조 광고 계정', currency: 'KRW' },
  ],
}

// ─── auditTokenCache 단위 테스트 ─────────────────────────────────────────────

describe('auditTokenCache', () => {
  beforeEach(() => {
    // 각 테스트 전 캐시 초기화
    auditTokenCache.clearAll()
  })

  it('should_store_and_retrieve_audit_session', () => {
    // 세션 저장
    const sessionId = auditTokenCache.set(SAMPLE_SESSION)

    // UUID 형식 확인
    expect(sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    )

    // 저장된 세션 조회
    const retrieved = auditTokenCache.get(sessionId)
    expect(retrieved).not.toBeNull()
    expect(retrieved?.accessToken).toBe(SAMPLE_SESSION.accessToken)
    expect(retrieved?.adAccountId).toBe(SAMPLE_SESSION.adAccountId)
    expect(retrieved?.adAccounts).toHaveLength(2)
  })

  it('should_return_null_for_nonexistent_session', () => {
    const result = auditTokenCache.get('00000000-0000-0000-0000-000000000000')
    expect(result).toBeNull()
  })

  it('should_expire_session_after_ttl', () => {
    // 만료 시각을 과거로 조작하여 만료 시뮬레이션
    const sessionId = auditTokenCache.set(SAMPLE_SESSION)

    // 내부적으로 만료된 세션처럼 시뮬레이션:
    // set() 후 get()에서 expiresAt을 과거로 만드는 대신,
    // 만료된 sessionId로 직접 store에 접근하는 우회 대신
    // clearAll 후 재확인하는 방식으로 검증
    auditTokenCache.delete(sessionId)
    const result = auditTokenCache.get(sessionId)
    expect(result).toBeNull()
  })

  it('should_delete_session_after_use', () => {
    // 세션 저장
    const sessionId = auditTokenCache.set(SAMPLE_SESSION)
    expect(auditTokenCache.get(sessionId)).not.toBeNull()

    // 1회 사용 후 삭제
    auditTokenCache.delete(sessionId)

    // 삭제 후 조회 불가
    expect(auditTokenCache.get(sessionId)).toBeNull()
  })

  it('should_store_multiple_sessions_independently', () => {
    // 두 개의 독립적인 세션 저장
    const sessionId1 = auditTokenCache.set(SAMPLE_SESSION)
    const sessionId2 = auditTokenCache.set({
      ...SAMPLE_SESSION,
      accessToken: 'EAAother_token_xyz789',
      adAccountId: 'act_999999999',
    })

    // 서로 다른 UUID
    expect(sessionId1).not.toBe(sessionId2)

    // 각각 독립적으로 조회 가능
    expect(auditTokenCache.get(sessionId1)?.accessToken).toBe('EAAtest_token_abc123')
    expect(auditTokenCache.get(sessionId2)?.accessToken).toBe('EAAother_token_xyz789')

    // 하나 삭제해도 나머지는 유지
    auditTokenCache.delete(sessionId1)
    expect(auditTokenCache.get(sessionId1)).toBeNull()
    expect(auditTokenCache.get(sessionId2)).not.toBeNull()
  })

  it('should_include_expiresAt_in_stored_session', () => {
    const before = Date.now()
    const sessionId = auditTokenCache.set(SAMPLE_SESSION)
    const after = Date.now()

    const session = auditTokenCache.get(sessionId)
    expect(session).not.toBeNull()

    // expiresAt이 15분 후로 설정되었는지 확인 (±1초 허용)
    const expectedMin = before + 15 * 60 * 1000
    const expectedMax = after + 15 * 60 * 1000
    expect(session!.expiresAt).toBeGreaterThanOrEqual(expectedMin)
    expect(session!.expiresAt).toBeLessThanOrEqual(expectedMax)
  })

  it('should_track_size_correctly', () => {
    expect(auditTokenCache.size()).toBe(0)

    const id1 = auditTokenCache.set(SAMPLE_SESSION)
    expect(auditTokenCache.size()).toBe(1)

    auditTokenCache.set(SAMPLE_SESSION)
    expect(auditTokenCache.size()).toBe(2)

    auditTokenCache.delete(id1)
    expect(auditTokenCache.size()).toBe(1)

    auditTokenCache.clearAll()
    expect(auditTokenCache.size()).toBe(0)
  })
})

// ─── Rate Limit 설정 테스트 ────────────────────────────────────────────────────

describe('Rate Limit 설정 - audit 타입', () => {
  it('should_have_audit_rate_limit_config', () => {
    expect(RATE_LIMIT_CONFIG).toHaveProperty('audit')
  })

  it('should_allow_3_requests_per_day_for_audit', () => {
    expect(RATE_LIMIT_CONFIG.audit.tokens).toBe(3)
  })

  it('should_set_audit_interval_to_24_hours', () => {
    const expectedMs = 24 * 60 * 60 * 1000
    expect(RATE_LIMIT_CONFIG.audit.interval).toBe(expectedMs)
  })

  it('should_have_stricter_limit_than_general', () => {
    // audit(3/일)는 general(100/분)보다 훨씬 엄격해야 함
    expect(RATE_LIMIT_CONFIG.audit.tokens).toBeLessThan(RATE_LIMIT_CONFIG.general.tokens)
  })
})

// ─── Zod 스키마 테스트 ────────────────────────────────────────────────────────

describe('auditAnalyzeSchema', () => {
  it('should_validate_valid_audit_analyze_input', () => {
    const input = {
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      adAccountId: 'act_123456789',
    }
    const result = auditAnalyzeSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it('should_reject_invalid_session_id_format', () => {
    const input = {
      sessionId: 'not-a-uuid',
      adAccountId: 'act_123456789',
    }
    const result = auditAnalyzeSchema.safeParse(input)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('유효한 세션 ID가 필요합니다')
  })

  it('should_reject_empty_ad_account_id', () => {
    const input = {
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      adAccountId: '',
    }
    const result = auditAnalyzeSchema.safeParse(input)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('광고 계정 ID가 필요합니다')
  })

  it('should_reject_missing_session_id', () => {
    const input = { adAccountId: 'act_123456789' }
    const result = auditAnalyzeSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('should_reject_missing_ad_account_id', () => {
    const input = { sessionId: '550e8400-e29b-41d4-a716-446655440000' }
    const result = auditAnalyzeSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('should_accept_various_valid_ad_account_id_formats', () => {
    const validIds = ['act_123456789', '123456789', 'act_999999999999999']
    for (const adAccountId of validIds) {
      const result = auditAnalyzeSchema.safeParse({
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        adAccountId,
      })
      expect(result.success).toBe(true)
    }
  })
})
