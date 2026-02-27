/**
 * 인메모리 감사 캐시 어댑터
 *
 * IAuditCache<T>를 Map 기반으로 구현한다.
 * - TTL 만료 시 자동 삭제 (setInterval 정리)
 * - MAX_ENTRIES 초과 시 가장 오래된 항목 eviction
 * - getAndDelete()는 동기 Map 연산으로 원자성 보장
 */
import type { IAuditCache } from '@application/ports/IAuditCache'

// ---------------------------------------------------------------------------
// 내부 타입
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  /** 저장된 값 */
  value: T
  /** 만료 시각 (Unix ms) */
  expiresAt: number
  /** 생성 시각 (Unix ms) — eviction 기준 */
  createdAt: number
}

// ---------------------------------------------------------------------------
// 옵션
// ---------------------------------------------------------------------------

export interface MemoryAuditCacheOptions {
  /** 최대 저장 항목 수 (기본값: 1000) */
  maxEntries?: number
  /** 만료 항목 정리 주기 ms (기본값: 60_000) */
  cleanupIntervalMs?: number
}

// ---------------------------------------------------------------------------
// 구현
// ---------------------------------------------------------------------------

export class MemoryAuditCache<T> implements IAuditCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>()
  private readonly maxEntries: number
  private readonly intervalId: ReturnType<typeof setInterval> | null = null

  constructor(options: MemoryAuditCacheOptions = {}) {
    this.maxEntries = options.maxEntries ?? 1_000
    const cleanupIntervalMs = options.cleanupIntervalMs ?? 60_000

    // 서버 환경에서만 주기적 정리 실행
    if (typeof setInterval !== 'undefined') {
      this.intervalId = setInterval(() => this.cleanup(), cleanupIntervalMs)
    }
  }

  /**
   * 값을 저장한다.
   * MAX_ENTRIES 초과 시 가장 오래된 항목을 먼저 제거한다.
   */
  async set(key: string, value: T, ttlMs: number): Promise<void> {
    if (this.store.size >= this.maxEntries) {
      this.evictOldest()
    }

    const now = Date.now()
    this.store.set(key, {
      value,
      expiresAt: now + ttlMs,
      createdAt: now,
    })
  }

  /**
   * 값을 조회한다. 만료된 항목은 삭제 후 null 반환.
   */
  async get(key: string): Promise<T | null> {
    const entry = this.store.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }

    return entry.value
  }

  /**
   * 값을 원자적으로 조회하고 즉시 삭제한다 (1회용 토큰 패턴).
   * 동기 Map 연산으로 원자성을 보장한다.
   */
  async getAndDelete(key: string): Promise<T | null> {
    const entry = this.store.get(key)
    if (!entry) return null

    // 만료 검사 후 조회와 삭제를 연속 실행 (원자적)
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }

    this.store.delete(key)
    return entry.value
  }

  /**
   * 값을 삭제한다.
   */
  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }

  /**
   * 현재 저장된 항목 수를 반환한다.
   */
  async size(): Promise<number> {
    return this.store.size
  }

  /**
   * 모든 항목을 삭제한다.
   */
  async clearAll(): Promise<void> {
    this.store.clear()
  }

  /**
   * setInterval을 정리한다 (테스트 및 graceful shutdown 시 호출).
   */
  destroy(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
    }
  }

  // ---------------------------------------------------------------------------
  // private
  // ---------------------------------------------------------------------------

  /** createdAt 기준으로 가장 오래된 항목 삭제 */
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

  /** 만료된 항목 일괄 정리 */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key)
      }
    }
  }
}
