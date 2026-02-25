/**
 * 무료 감사 임시 토큰 캐시
 *
 * 비로그인 사용자의 Meta OAuth 토큰을 인메모리로 15분간 보관.
 * DB에 저장하지 않으며, 1회 사용 후 즉시 삭제한다.
 */

// =============================================================================
// Types
// =============================================================================

export interface AuditSession {
  /** Meta 단기 액세스 토큰 */
  accessToken: string
  /** 기본 광고 계정 ID */
  adAccountId: string
  /** 사용자 보유 광고 계정 목록 */
  adAccounts: { id: string; name: string; currency: string }[]
  /** 만료 시각 (Unix ms) */
  expiresAt: number
}

// =============================================================================
// Cache Implementation
// =============================================================================

/** 세션 TTL: 15분 */
const SESSION_TTL_MS = 15 * 60 * 1000

/** 최대 저장 항목 수 (메모리 보호) */
const MAX_TOKEN_ENTRIES = 1_000

/** 만료 항목 정리 주기: 1분 */
const CLEANUP_INTERVAL_MS = 60 * 1000

class AuditTokenCache {
  private store = new Map<string, AuditSession>()

  constructor() {
    // 서버 환경에서만 주기적 정리 실행
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS)
    }
  }

  /**
   * 세션 저장
   * MAX_TOKEN_ENTRIES 초과 시 가장 오래된 항목을 삭제한다.
   * @returns 생성된 sessionId (UUID)
   */
  set(data: Omit<AuditSession, 'expiresAt'>): string {
    // 최대 항목 수 초과 시 가장 오래된 항목 삭제
    if (this.store.size >= MAX_TOKEN_ENTRIES) {
      this.evictOldest()
    }

    const sessionId = crypto.randomUUID()
    this.store.set(sessionId, {
      ...data,
      expiresAt: Date.now() + SESSION_TTL_MS,
    })
    return sessionId
  }

  /**
   * 가장 오래된 항목 삭제 (expiresAt 기준 — 가장 먼저 만료될 항목)
   */
  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, session] of this.store.entries()) {
      if (session.expiresAt < oldestTime) {
        oldestTime = session.expiresAt
        oldestKey = key
      }
    }

    if (oldestKey !== null) {
      this.store.delete(oldestKey)
    }
  }

  /**
   * 세션 조회 (만료 시 null 반환)
   */
  get(sessionId: string): AuditSession | null {
    const session = this.store.get(sessionId)
    if (!session) return null

    if (Date.now() > session.expiresAt) {
      this.store.delete(sessionId)
      return null
    }

    return session
  }

  /**
   * 세션 삭제 (1회용 사용 후 호출)
   */
  delete(sessionId: string): void {
    this.store.delete(sessionId)
  }

  /**
   * 만료된 항목 일괄 정리
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, session] of this.store.entries()) {
      if (now > session.expiresAt) {
        this.store.delete(key)
      }
    }
  }

  /**
   * 현재 저장된 세션 수 (테스트용)
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
export const auditTokenCache = new AuditTokenCache()
