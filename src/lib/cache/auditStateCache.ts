/**
 * OAuth CSRF state 토큰 캐시
 *
 * CSRF 공격 방지를 위한 OAuth state 파라미터 임시 저장소.
 * - TTL: 5분 (OAuth 인증 완료에 충분한 시간)
 * - 1회 검증 후 즉시 삭제 (replay 방지)
 * - MAX_ENTRIES 초과 시 가장 오래된 항목부터 삭제
 */

// =============================================================================
// 상수
// =============================================================================

/** CSRF state TTL: 5분 */
const STATE_TTL_MS = 5 * 60 * 1000

/** 최대 저장 항목 수 (메모리 보호) */
const MAX_STATE_ENTRIES = 500

/** 만료 항목 정리 주기: 1분 */
const CLEANUP_INTERVAL_MS = 60 * 1000

// =============================================================================
// Types
// =============================================================================

interface StateEntry {
  /** 만료 시각 (Unix ms) */
  expiresAt: number
  /** 생성 시각 (Unix ms) - 오래된 항목 삭제 기준 */
  createdAt: number
}

// =============================================================================
// Cache Implementation
// =============================================================================

class AuditStateCache {
  private store = new Map<string, StateEntry>()

  constructor() {
    // 서버 환경에서만 주기적 정리 실행
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS)
    }
  }

  /**
   * CSRF state 토큰 저장
   * MAX_ENTRIES 초과 시 가장 오래된 항목을 삭제한다.
   */
  set(state: string): void {
    // 최대 항목 수 초과 시 가장 오래된 항목 삭제
    if (this.store.size >= MAX_STATE_ENTRIES) {
      this.evictOldest()
    }

    const now = Date.now()
    this.store.set(state, {
      expiresAt: now + STATE_TTL_MS,
      createdAt: now,
    })
  }

  /**
   * CSRF state 토큰 검증 및 삭제 (1회용)
   * 유효하면 true 반환 후 즉시 삭제, 만료되거나 없으면 false 반환.
   */
  verify(state: string): boolean {
    const entry = this.store.get(state)
    if (!entry) return false

    // 만료 검사
    if (Date.now() > entry.expiresAt) {
      this.store.delete(state)
      return false
    }

    // 1회용: 검증 즉시 삭제
    this.store.delete(state)
    return true
  }

  /**
   * 가장 오래된 항목 삭제 (createdAt 기준)
   */
  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, entry] of this.store.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt
        oldestKey = key
      }
    }

    if (oldestKey !== null) {
      this.store.delete(oldestKey)
    }
  }

  /**
   * 만료된 항목 일괄 정리
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key)
      }
    }
  }

  /**
   * 현재 저장된 항목 수 (테스트용)
   */
  size(): number {
    return this.store.size
  }

  /**
   * 전체 초기화 (테스트용)
   */
  clearAll(): void {
    this.store.clear()
  }
}

// 싱글턴 인스턴스
export const auditStateCache = new AuditStateCache()
