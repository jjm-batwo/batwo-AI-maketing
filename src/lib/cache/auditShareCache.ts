/**
 * 감사 결과 공유 토큰 캐시
 *
 * 감사 결과를 공유 링크로 전달하기 위한 인메모리 캐시.
 * 공유 토큰은 UUID v4, 만료 시간 7일.
 * DB에 저장하지 않으며, 서버 재시작 시 초기화된다.
 */

// =============================================================================
// Types
// =============================================================================

export interface AuditShareEntry {
  /** 감사 결과 데이터 */
  report: AuditReportDTO
  /** 만료 시각 (Unix ms) */
  expiresAt: number
  /** 생성 시각 (Unix ms) */
  createdAt: number
}

export interface AuditReportDTO {
  overall: number
  grade: string
  categories: {
    name: string
    score: number
    findings: { type: string; message: string }[]
    recommendations: { priority: string; message: string; estimatedImpact: string }[]
  }[]
  estimatedWaste: { amount: number; currency: string }
  estimatedImprovement: { amount: number; currency: string }
  totalCampaigns: number
  activeCampaigns: number
  analyzedAt: string
}

// =============================================================================
// Cache Implementation
// =============================================================================

/** 공유 토큰 TTL: 7일 */
const SHARE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

/** 최대 저장 항목 수 (메모리 보호) */
const MAX_SHARE_ENTRIES = 10_000

/** 만료 항목 정리 주기: 1시간 */
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000

class AuditShareCache {
  private store = new Map<string, AuditShareEntry>()

  constructor() {
    // 서버 환경에서만 주기적 정리 실행
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS)
    }
  }

  /**
   * 공유 토큰 저장
   * MAX_SHARE_ENTRIES 초과 시 가장 오래된 항목을 삭제한다.
   * @returns 생성된 공유 토큰 (UUID v4)
   */
  set(report: AuditReportDTO): string {
    // 최대 항목 수 초과 시 가장 오래된 항목 삭제
    if (this.store.size >= MAX_SHARE_ENTRIES) {
      this.evictOldest()
    }

    const token = crypto.randomUUID()
    const now = Date.now()
    this.store.set(token, {
      report,
      expiresAt: now + SHARE_TOKEN_TTL_MS,
      createdAt: now,
    })
    return token
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
   * 공유 토큰으로 감사 결과 조회 (만료 시 null 반환)
   */
  get(token: string): AuditShareEntry | null {
    const entry = this.store.get(token)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.store.delete(token)
      return null
    }

    return entry
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
export const auditShareCache = new AuditShareCache()
