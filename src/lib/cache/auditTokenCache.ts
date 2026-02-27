/**
 * 무료 감사 임시 토큰 캐시
 *
 * 비로그인 사용자의 Meta OAuth 토큰을 IAuditCache 어댑터 기반으로 15분간 보관.
 * DB에 저장하지 않으며, getAndDelete()로 Race Condition을 방어한다.
 */
import { createAuditCache } from '@/infrastructure/cache/audit/auditCacheFactory'
import type { IAuditCache } from '@/application/ports/IAuditCache'

// =============================================================================
// Types
// =============================================================================

export interface AuditSession {
  /** Meta 단기 액세스 토큰 */
  accessToken: string
  /** 기본 광고 계정 ID */
  adAccountId: string
  /** 사용자 보유 광고 계정 목록 */
  adAccounts: { id: string; name: string; currency: string; accountStatus: number }[]
  /** 만료 시각 (Unix ms) — 레거시 호환용, IAuditCache가 TTL을 관리 */
  expiresAt: number
}

// =============================================================================
// 내부 저장 타입 (expiresAt은 IAuditCache TTL로 관리하므로 별도 보관)
// =============================================================================

interface AuditTokenData {
  accessToken: string
  adAccountId: string
  adAccounts: { id: string; name: string; currency: string; accountStatus: number }[]
  /** 소비자가 expiresAt을 참조할 수 있으므로 저장 시 계산해서 보관 */
  expiresAt: number
}

// =============================================================================
// 상수
// =============================================================================

/** 세션 TTL: 15분 */
const SESSION_TTL_MS = 15 * 60 * 1000

/** 최대 저장 항목 수 (메모리 보호) */
const MAX_TOKEN_ENTRIES = 1_000

// =============================================================================
// Cache Wrapper
// =============================================================================

class AuditTokenCacheWrapper {
  private cache: IAuditCache<AuditTokenData>

  constructor() {
    this.cache = createAuditCache<AuditTokenData>('token', { maxEntries: MAX_TOKEN_ENTRIES })
  }

  /**
   * 세션 저장
   * @returns 생성된 sessionId (UUID v4)
   */
  async set(data: Omit<AuditSession, 'expiresAt'>): Promise<string> {
    const sessionId = crypto.randomUUID()
    const expiresAt = Date.now() + SESSION_TTL_MS
    await this.cache.set(sessionId, { ...data, expiresAt }, SESSION_TTL_MS)
    return sessionId
  }

  /**
   * 세션 조회 (만료 시 null 반환)
   */
  async get(sessionId: string): Promise<AuditSession | null> {
    const data = await this.cache.get(sessionId)
    if (!data) return null
    return data
  }

  /**
   * 세션 원자적 조회 후 즉시 삭제 (Race Condition 방어용, 1회용)
   */
  async getAndDelete(sessionId: string): Promise<AuditSession | null> {
    const data = await this.cache.getAndDelete(sessionId)
    if (!data) return null
    return data
  }

  /**
   * 세션 삭제
   */
  async delete(sessionId: string): Promise<void> {
    await this.cache.delete(sessionId)
  }

  /**
   * 현재 저장된 세션 수 (테스트용)
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
const globalKey = '__auditTokenCache' as const
const globalCache = globalThis as typeof globalThis & {
  __auditTokenCache?: AuditTokenCacheWrapper
}
export const auditTokenCache: AuditTokenCacheWrapper =
  globalCache[globalKey] ?? (globalCache[globalKey] = new AuditTokenCacheWrapper())
