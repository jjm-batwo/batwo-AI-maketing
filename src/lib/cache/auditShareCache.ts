/**
 * 감사 결과 공유 토큰 캐시
 *
 * 감사 결과를 공유 링크로 전달하기 위한 IAuditCache 어댑터 기반 캐시.
 * 공유 토큰은 UUID v4, 만료 시간 7일.
 * DB에 저장하지 않으며, 서버 재시작 시 초기화된다.
 */
import { createAuditCache } from '@/infrastructure/cache/audit/auditCacheFactory'
import type { IAuditCache } from '@/application/ports/IAuditCache'

// =============================================================================
// Types
// =============================================================================

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

export interface AuditShareEntry {
  /** 감사 결과 데이터 */
  report: AuditReportDTO
  /** 만료 시각 (Unix ms) */
  expiresAt: number
  /** 생성 시각 (Unix ms) */
  createdAt: number
}

// =============================================================================
// 상수
// =============================================================================

/** 공유 토큰 TTL: 7일 */
const SHARE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

/** 최대 저장 항목 수 (메모리 보호) */
const MAX_SHARE_ENTRIES = 10_000

// =============================================================================
// Cache Wrapper
// =============================================================================

class AuditShareCacheWrapper {
  private cache: IAuditCache<AuditShareEntry>

  constructor() {
    this.cache = createAuditCache<AuditShareEntry>('share', { maxEntries: MAX_SHARE_ENTRIES })
  }

  /**
   * 공유 토큰 저장
   * @returns 생성된 공유 토큰 (UUID v4)
   */
  async set(report: AuditReportDTO): Promise<string> {
    const token = crypto.randomUUID()
    const now = Date.now()
    const entry: AuditShareEntry = {
      report,
      expiresAt: now + SHARE_TOKEN_TTL_MS,
      createdAt: now,
    }
    await this.cache.set(token, entry, SHARE_TOKEN_TTL_MS)
    return token
  }

  /**
   * 공유 토큰으로 감사 결과 조회 (만료 시 null 반환)
   */
  async get(token: string): Promise<AuditShareEntry | null> {
    return this.cache.get(token)
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
const globalKey = '__auditShareCache' as const
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auditShareCache: AuditShareCacheWrapper = (globalThis as any)[globalKey] ??
  ((globalThis as any)[globalKey] = new AuditShareCacheWrapper())
