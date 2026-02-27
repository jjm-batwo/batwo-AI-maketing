/**
 * OAuth CSRF state 토큰 캐시
 *
 * CSRF 공격 방지를 위한 OAuth state 파라미터 임시 저장소.
 * IAuditCache 어댑터 기반으로 구현 — getAndDelete()로 1회용 보장.
 * - TTL: 5분 (OAuth 인증 완료에 충분한 시간)
 * - verify() 호출 시 조회 + 즉시 삭제 (replay 방지)
 */
import { createAuditCache } from '@/infrastructure/cache/audit/auditCacheFactory'
import type { IAuditCache } from '@/application/ports/IAuditCache'

// =============================================================================
// 상수
// =============================================================================

/** CSRF state TTL: 5분 */
const STATE_TTL_MS = 5 * 60 * 1000

/** 최대 저장 항목 수 (메모리 보호) */
const MAX_STATE_ENTRIES = 500

// =============================================================================
// 내부 저장 타입 (state 토큰 자체가 키이므로 값은 더미 마커)
// =============================================================================

/** 존재 여부만 확인하면 되므로 true 마커를 저장 */
type StateMarker = true

// =============================================================================
// Cache Wrapper
// =============================================================================

class AuditStateCacheWrapper {
  private cache: IAuditCache<StateMarker>

  constructor() {
    this.cache = createAuditCache<StateMarker>('state', { maxEntries: MAX_STATE_ENTRIES })
  }

  /**
   * CSRF state 토큰 저장
   */
  async set(state: string): Promise<void> {
    await this.cache.set(state, true, STATE_TTL_MS)
  }

  /**
   * CSRF state 토큰 검증 및 삭제 (1회용)
   * 유효하면 true 반환 후 즉시 삭제 (getAndDelete 패턴으로 replay 방지).
   * 만료되거나 없으면 false 반환.
   */
  async verify(state: string): Promise<boolean> {
    const result = await this.cache.getAndDelete(state)
    return result !== null
  }

  /**
   * 현재 저장된 항목 수 (테스트용)
   */
  async size(): Promise<number> {
    return this.cache.size()
  }

  /**
   * 전체 초기화 (테스트용)
   */
  async clearAll(): Promise<void> {
    await this.cache.clearAll()
  }
}

// Hot-reload 시 중복 setInterval 방지를 위한 globalThis 싱글턴 패턴
const globalKey = '__auditStateCache' as const
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auditStateCache: AuditStateCacheWrapper = (globalThis as any)[globalKey] ??
  ((globalThis as any)[globalKey] = new AuditStateCacheWrapper())
