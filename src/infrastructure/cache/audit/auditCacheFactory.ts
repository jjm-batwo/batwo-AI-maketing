/**
 * 감사 캐시 팩토리
 *
 * 환경변수를 기준으로 적절한 캐시 어댑터를 생성한다.
 * - UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN 존재 → UpstashAuditCache
 * - 없으면 → MemoryAuditCache (개발/테스트 환경)
 */
import { Redis } from '@upstash/redis'
import type { IAuditCache } from '@application/ports/IAuditCache'
import { MemoryAuditCache, type MemoryAuditCacheOptions } from './MemoryAuditCache'
import { UpstashAuditCache } from './UpstashAuditCache'

export interface AuditCacheFactoryOptions extends MemoryAuditCacheOptions {
  // 향후 확장을 위한 여백
}

/**
 * 환경변수에 따라 IAuditCache 구현체를 생성한다.
 *
 * @param namespace 캐시 키 네임스페이스 (예: "token", "state", "share")
 * @param options 인메모리 어댑터 옵션 (Upstash 사용 시 무시됨)
 */
export function createAuditCache<T>(
  namespace: string,
  options: AuditCacheFactoryOptions = {},
): IAuditCache<T> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (url && token) {
    const redis = new Redis({ url, token })
    return new UpstashAuditCache<T>(namespace, redis)
  }

  return new MemoryAuditCache<T>(options)
}
