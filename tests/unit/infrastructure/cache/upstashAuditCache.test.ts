/**
 * IAuditCache 어댑터 단위 테스트
 *
 * - MemoryAuditCache: 실제 구현 테스트 (케이스 1~8)
 * - UpstashAuditCache: Redis mock 기반 테스트 (케이스 9)
 * - auditCacheFactory: 환경변수 분기 테스트 (케이스 10)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryAuditCache } from '@infrastructure/cache/audit/MemoryAuditCache'
import { UpstashAuditCache } from '@infrastructure/cache/audit/UpstashAuditCache'
import { createAuditCache } from '@infrastructure/cache/audit/auditCacheFactory'

// ---------------------------------------------------------------------------
// MemoryAuditCache 테스트
// ---------------------------------------------------------------------------

describe('MemoryAuditCache', () => {
  let cache: MemoryAuditCache<string>

  beforeEach(() => {
    vi.useFakeTimers()
    cache = new MemoryAuditCache<string>({ maxEntries: 3 })
  })

  afterEach(() => {
    cache.destroy()
    vi.useRealTimers()
  })

  // 케이스 1: set 후 get으로 조회 가능
  it('1. set() 후 get()으로 값을 조회할 수 있다', async () => {
    await cache.set('key1', 'hello', 60_000)
    const result = await cache.get('key1')
    expect(result).toBe('hello')
  })

  // 케이스 2: 존재하지 않는 키 → null
  it('2. 존재하지 않는 키를 get()하면 null을 반환한다', async () => {
    const result = await cache.get('nonexistent')
    expect(result).toBeNull()
  })

  // 케이스 3: getAndDelete — 조회 후 재조회 시 null (원자적)
  it('3. getAndDelete()는 값을 반환하고 재조회 시 null을 반환한다', async () => {
    await cache.set('key2', 'one-time', 60_000)

    const first = await cache.getAndDelete('key2')
    expect(first).toBe('one-time')

    const second = await cache.getAndDelete('key2')
    expect(second).toBeNull()
  })

  // 케이스 4: TTL 만료 시 get() → null
  it('4. TTL이 만료된 항목은 get()에서 null을 반환한다', async () => {
    await cache.set('key3', 'expiring', 5_000)

    // TTL 이전에는 조회 가능
    expect(await cache.get('key3')).toBe('expiring')

    // 5초 경과 후 만료
    vi.advanceTimersByTime(6_000)
    expect(await cache.get('key3')).toBeNull()
  })

  // 케이스 5: delete() 후 get() → null
  it('5. delete() 후 해당 키를 get()하면 null을 반환한다', async () => {
    await cache.set('key4', 'deletable', 60_000)
    await cache.delete('key4')
    const result = await cache.get('key4')
    expect(result).toBeNull()
  })

  // 케이스 6: MAX_ENTRIES 초과 시 eviction 동작
  it('6. maxEntries 초과 시 가장 오래된 항목이 제거된다', async () => {
    // maxEntries=3인 캐시에 4개 삽입
    await cache.set('old1', 'v1', 60_000)
    await cache.set('old2', 'v2', 60_000)
    await cache.set('old3', 'v3', 60_000)
    await cache.set('new1', 'v4', 60_000) // 이 시점에 old1이 제거됨

    const sizeAfter = await cache.size()
    expect(sizeAfter).toBe(3)

    // 가장 오래된 항목(old1)은 삭제됨
    expect(await cache.get('old1')).toBeNull()
    // 나머지는 유지
    expect(await cache.get('old2')).toBe('v2')
    expect(await cache.get('new1')).toBe('v4')
  })

  // 케이스 7: clearAll() — 모든 항목 삭제
  it('7. clearAll() 호출 후 size()는 0이 된다', async () => {
    await cache.set('a', 'v1', 60_000)
    await cache.set('b', 'v2', 60_000)
    await cache.clearAll()

    const size = await cache.size()
    expect(size).toBe(0)
    expect(await cache.get('a')).toBeNull()
  })

  // 케이스 8: size() — 정확한 항목 수 반환
  it('8. size()는 현재 저장된 항목 수를 정확히 반환한다', async () => {
    expect(await cache.size()).toBe(0)

    await cache.set('x', '1', 60_000)
    expect(await cache.size()).toBe(1)

    await cache.set('y', '2', 60_000)
    expect(await cache.size()).toBe(2)

    await cache.delete('x')
    expect(await cache.size()).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// UpstashAuditCache 테스트 (Redis mock 사용)
// ---------------------------------------------------------------------------

describe('UpstashAuditCache', () => {
  // 케이스 9: Redis mock으로 set/get/getAndDelete 검증
  it('9. Redis mock을 통해 set/get/getAndDelete가 올바르게 동작한다', async () => {
    // 인메모리 store로 Redis 동작을 흉내내는 mock
    const store = new Map<string, string>()

    const redisMock = {
      set: vi.fn(async (key: string, value: string, _opts?: unknown) => {
        store.set(key, value)
        return 'OK'
      }),
      get: vi.fn(async (key: string) => {
        return store.get(key) ?? null
      }),
      getdel: vi.fn(async (key: string) => {
        const val = store.get(key) ?? null
        store.delete(key)
        return val
      }),
      del: vi.fn(async (key: string) => {
        store.delete(key)
        return 1
      }),
      dbsize: vi.fn(async () => store.size),
      flushdb: vi.fn(async () => {
        store.clear()
        return 'OK'
      }),
    }

    const cache = new UpstashAuditCache<{ value: string }>(
      'test',
      redisMock as unknown as import('@upstash/redis').Redis,
    )

    // set
    await cache.set('mykey', { value: 'data' }, 60_000)
    expect(redisMock.set).toHaveBeenCalledOnce()

    // get
    const got = await cache.get('mykey')
    expect(got).toEqual({ value: 'data' })
    expect(redisMock.get).toHaveBeenCalledOnce()

    // getAndDelete — 조회 후 삭제
    const fetched = await cache.getAndDelete('mykey')
    expect(fetched).toEqual({ value: 'data' })
    expect(redisMock.getdel).toHaveBeenCalledOnce()

    // 삭제 확인
    const afterDelete = await cache.get('mykey')
    expect(afterDelete).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// auditCacheFactory 테스트
// ---------------------------------------------------------------------------

describe('auditCacheFactory', () => {
  const ORIGINAL_ENV = { ...process.env }

  afterEach(() => {
    // 환경변수 복원
    process.env = { ...ORIGINAL_ENV }
  })

  // 케이스 10: 환경변수에 따른 올바른 어댑터 생성
  it('10. 환경변수 미설정 시 MemoryAuditCache를 반환한다', () => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN

    const cache = createAuditCache<string>('test-ns')
    expect(cache).toBeInstanceOf(MemoryAuditCache)
  })

  it('10b. UPSTASH 환경변수 설정 시 UpstashAuditCache를 반환한다', () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token'

    const cache = createAuditCache<string>('test-ns')
    expect(cache).toBeInstanceOf(UpstashAuditCache)
  })
})
