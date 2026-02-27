/**
 * Upstash Redis 감사 캐시 어댑터
 *
 * IAuditCache<T>를 Upstash Redis로 구현한다.
 * - 키 형식: `audit:{namespace}:{key}`
 * - TTL: Redis EX 옵션 (초 단위 변환)
 * - getAndDelete: GETDEL 커맨드로 원자적 조회+삭제
 * - 직렬화: JSON.stringify / JSON.parse
 */
import type { Redis } from '@upstash/redis'
import type { IAuditCache } from '@application/ports/IAuditCache'

export class UpstashAuditCache<T> implements IAuditCache<T> {
  private readonly namespace: string
  private readonly redis: Redis

  /**
   * @param namespace 캐시 키 네임스페이스 (예: "token", "state", "share")
   * @param redis Upstash Redis 클라이언트 인스턴스
   */
  constructor(namespace: string, redis: Redis) {
    this.namespace = namespace
    this.redis = redis
  }

  /**
   * Redis 키 생성: `audit:{namespace}:{key}`
   */
  private buildKey(key: string): string {
    return `audit:${this.namespace}:${key}`
  }

  /**
   * 값을 저장한다.
   * @param ttlMs TTL 밀리초 → Redis EX 초로 변환 (최솟값 1초)
   */
  async set(key: string, value: T, ttlMs: number): Promise<void> {
    const redisKey = this.buildKey(key)
    const serialized = JSON.stringify(value)
    const ttlSec = Math.max(1, Math.ceil(ttlMs / 1_000))

    await this.redis.set(redisKey, serialized, { ex: ttlSec })
  }

  /**
   * 값을 조회한다. 존재하지 않으면 null 반환.
   */
  async get(key: string): Promise<T | null> {
    const redisKey = this.buildKey(key)
    const raw = await this.redis.get(redisKey)

    if (raw === null || raw === undefined) return null

    return JSON.parse(raw as string) as T
  }

  /**
   * GETDEL 커맨드로 원자적 조회+삭제를 수행한다.
   * Redis 6.2+ 지원; Upstash Redis는 GETDEL을 지원한다.
   */
  async getAndDelete(key: string): Promise<T | null> {
    const redisKey = this.buildKey(key)
    // GETDEL: 값을 반환하고 동시에 키를 삭제 (원자적)
    const raw = await this.redis.getdel(redisKey)

    if (raw === null || raw === undefined) return null

    return JSON.parse(raw as string) as T
  }

  /**
   * 값을 삭제한다.
   */
  async delete(key: string): Promise<void> {
    const redisKey = this.buildKey(key)
    await this.redis.del(redisKey)
  }

  /**
   * DB 전체 키 수를 반환한다 (네임스페이스 필터 없음 — 관리용).
   */
  async size(): Promise<number> {
    return this.redis.dbsize()
  }

  /**
   * DB 전체를 초기화한다 (테스트 전용 — 프로덕션에서 사용 금지).
   */
  async clearAll(): Promise<void> {
    await this.redis.flushdb()
  }
}
