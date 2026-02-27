/**
 * Rate Limiting Middleware
 *
 * API 보호를 위한 Rate Limiting 구현
 * - Upstash Redis 지원 (프로덕션 권장)
 * - 메모리 기반 폴백 (개발/테스트용)
 */

import { NextRequest, NextResponse } from 'next/server'
import { RATE_LIMIT_CONFIG } from '@/lib/security/config'

// =============================================================================
// Types
// =============================================================================

export type RateLimitType = keyof typeof RATE_LIMIT_CONFIG

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

interface RateLimitStore {
  count: number
  resetTime: number
}

// =============================================================================
// In-Memory Rate Limiter (Development/Fallback)
// =============================================================================

const memoryStore = new Map<string, RateLimitStore>()

// 메모리 정리 (1분마다)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of memoryStore.entries()) {
      if (value.resetTime < now) {
        memoryStore.delete(key)
      }
    }
  }, 60 * 1000)
}

async function memoryRateLimit(
  identifier: string,
  config: { tokens: number; interval: number }
): Promise<RateLimitResult> {
  const now = Date.now()
  const key = identifier
  const stored = memoryStore.get(key)

  // 새 윈도우 시작
  if (!stored || stored.resetTime < now) {
    memoryStore.set(key, {
      count: 1,
      resetTime: now + config.interval,
    })
    return {
      success: true,
      limit: config.tokens,
      remaining: config.tokens - 1,
      reset: now + config.interval,
    }
  }

  // 기존 윈도우 내
  if (stored.count >= config.tokens) {
    return {
      success: false,
      limit: config.tokens,
      remaining: 0,
      reset: stored.resetTime,
    }
  }

  // 카운트 증가
  stored.count++
  memoryStore.set(key, stored)

  return {
    success: true,
    limit: config.tokens,
    remaining: config.tokens - stored.count,
    reset: stored.resetTime,
  }
}

// =============================================================================
// Upstash Redis Rate Limiter
// =============================================================================

let upstashRatelimit: unknown = null
let upstashInitialized = false

async function initUpstash(): Promise<boolean> {
  if (upstashInitialized) return upstashRatelimit !== null

  upstashInitialized = true

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!redisUrl || !redisToken) {
    // 개발 환경에서는 경고 로그 출력, 프로덕션은 에러로 처리
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[RateLimit] Upstash not configured in development, using memory fallback. ' +
        'For production, set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN'
      )
    } else {
      console.error('[RateLimit] Upstash not configured in production - Rate limiting may not work correctly')
    }
    return false
  }

  try {
    // 동적 import (번들 사이즈 최적화)
    // Note: @upstash/ratelimit, @upstash/redis 패키지 설치 필요
    // npm install @upstash/ratelimit @upstash/redis

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let upstashRatelimitModule: any = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let upstashRedisModule: any = null

    try {
      // @ts-expect-error - 옵셔널 의존성, 설치되지 않을 수 있음
      upstashRatelimitModule = await import('@upstash/ratelimit')
      upstashRedisModule = await import('@upstash/redis')
    } catch {
      // 패키지 미설치 시 무시
    }

    if (!upstashRatelimitModule || !upstashRedisModule) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[RateLimit] Upstash packages not installed, using memory fallback')
      } else {
        console.error('[RateLimit] Upstash packages not installed in production')
      }
      return false
    }

    const { Ratelimit } = upstashRatelimitModule
    const { Redis } = upstashRedisModule

    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
    })

    upstashRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
    })

    console.info('[RateLimit] Upstash Redis initialized')
    return true
  } catch {
    console.warn('[RateLimit] Failed to initialize Upstash, using memory fallback')
    return false
  }
}

async function upstashRateLimitCheck(
  identifier: string,
  config: { tokens: number; interval: number }
): Promise<RateLimitResult> {
  if (!upstashRatelimit) {
    return memoryRateLimit(identifier, config)
  }

  try {
    // Upstash Ratelimit 사용
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ratelimit = upstashRatelimit as any
    const result = await ratelimit.limit(identifier)

    return {
      success: result.success,
      limit: config.tokens,
      remaining: result.remaining ?? config.tokens - (result.success ? 1 : 0),
      reset: result.resetAfter ?? Date.now() + config.interval,
    }
  } catch (error) {
    console.error('[RateLimit] Upstash check failed, falling back to memory', error)
    return memoryRateLimit(identifier, config)
  }
}

// =============================================================================
// Rate Limit Check
// =============================================================================

/**
 * Rate Limit 체크
 * @param identifier 고유 식별자 (IP, userId 등)
 * @param type Rate Limit 타입 (general, ai, auth 등)
 */
export async function checkRateLimit(
  identifier: string,
  type: RateLimitType = 'general'
): Promise<RateLimitResult> {
  const config = RATE_LIMIT_CONFIG[type]

  // Upstash 초기화 시도
  await initUpstash()

  // Rate Limit 체크
  const key = `ratelimit:${type}:${identifier}`

  if (upstashRatelimit) {
    return upstashRateLimitCheck(key, config)
  }

  return memoryRateLimit(key, config)
}

// =============================================================================
// Middleware Helper
// =============================================================================

/**
 * 클라이언트 IP 추출
 */
export function getClientIp(request: NextRequest): string {
  // Vercel/Cloudflare 프록시 헤더
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  // Cloudflare
  const cfConnecting = request.headers.get('cf-connecting-ip')
  if (cfConnecting) {
    return cfConnecting
  }

  // Vercel
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  return 'unknown'
}

/**
 * Rate Limit 헤더 추가
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString())
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  response.headers.set('X-RateLimit-Reset', result.reset.toString())

  return response
}

/**
 * Rate Limit 초과 응답
 */
export function rateLimitExceededResponse(result: RateLimitResult): NextResponse {
  const response = NextResponse.json(
    {
      error: 'Too Many Requests',
      message: '요청 횟수가 제한을 초과했습니다. 잠시 후 다시 시도해주세요.',
      retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
    },
    { status: 429 }
  )

  addRateLimitHeaders(response, result)
  response.headers.set('Retry-After', Math.ceil((result.reset - Date.now()) / 1000).toString())

  return response
}

// =============================================================================
// Route-based Rate Limit Type Detection
// =============================================================================

/**
 * URL 경로에 따른 Rate Limit 타입 결정
 */
export function getRateLimitTypeForPath(pathname: string): RateLimitType {
  // AI 관련 엔드포인트
  if (
    pathname.includes('/api/ai/') ||
    pathname.includes('/api/openai') ||
    pathname.includes('/api/generate')
  ) {
    return 'ai'
  }

  // 인증 관련 엔드포인트
  if (pathname.includes('/api/auth/')) {
    return 'auth'
  }

  // 캠페인 생성
  if (pathname.includes('/api/campaigns') && pathname.includes('create')) {
    return 'campaignCreate'
  }

  // 기본값
  return 'general'
}
