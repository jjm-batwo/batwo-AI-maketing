import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import NextAuth from 'next-auth'
import { authConfig } from '@/infrastructure/auth/auth.config'
import {
  checkRateLimit,
  getClientIp,
  getRateLimitTypeForPath,
  addRateLimitHeaders,
  rateLimitExceededResponse,
} from '@/lib/middleware/rateLimit'
import { getCorsHeaders, ALLOWED_ORIGINS } from '@/lib/security/config'

// NextAuth 미들웨어
const { auth } = NextAuth(authConfig)

/**
 * CORS Preflight 처리
 */
function handleCorsPreflightRequest(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin')

  // OPTIONS 요청 (CORS preflight)
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 })

    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      const corsHeaders = getCorsHeaders(origin)
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
    }

    return response
  }

  return null
}

/**
 * CORS 헤더 추가
 */
function addCorsHeaders(response: NextResponse, origin: string | null): NextResponse {
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    const corsHeaders = getCorsHeaders(origin)
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
  }

  return response
}

/**
 * API 경로 체크
 */
function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/')
}

/**
 * Rate Limit 제외 경로 체크
 */
function isRateLimitExcluded(pathname: string): boolean {
  // 헬스체크, static 파일, auth callback 등은 제외
  const excludedPaths = [
    '/api/health',
    '/api/auth/callback',
    '/api/auth/session',
    '/api/auth/csrf',
    '/api/auth/providers',
  ]

  return excludedPaths.some((path) => pathname.startsWith(path))
}

// Rate limit 결과 저장용 WeakMap
const rateLimitResults = new WeakMap<NextRequest, { limit: number; remaining: number; reset: number }>()

/**
 * 메인 미들웨어
 */
export default auth(async function middleware(request) {
  const { pathname } = request.nextUrl
  const origin = request.headers.get('origin')

  // 1. CORS Preflight 처리
  const preflightResponse = handleCorsPreflightRequest(request)
  if (preflightResponse) {
    return preflightResponse
  }

  // 2. API 경로에 대한 Rate Limiting
  if (isApiRoute(pathname) && !isRateLimitExcluded(pathname)) {
    const clientIp = getClientIp(request)
    const rateLimitType = getRateLimitTypeForPath(pathname)

    const rateLimitResult = await checkRateLimit(clientIp, rateLimitType)

    if (!rateLimitResult.success) {
      const response = rateLimitExceededResponse(rateLimitResult)
      return addCorsHeaders(response, origin)
    }

    // Rate limit 통과 시 결과 저장
    rateLimitResults.set(request, {
      limit: rateLimitResult.limit,
      remaining: rateLimitResult.remaining,
      reset: rateLimitResult.reset,
    })
  }

  // 3. 기본 응답
  const response = NextResponse.next()

  // API 경로에 CORS 및 Rate Limit 헤더 추가
  if (isApiRoute(pathname)) {
    addCorsHeaders(response, origin)

    const rateLimitResult = rateLimitResults.get(request)
    if (rateLimitResult) {
      addRateLimitHeaders(response, { ...rateLimitResult, success: true })
    }
  }

  return response
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     * - Static assets (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
