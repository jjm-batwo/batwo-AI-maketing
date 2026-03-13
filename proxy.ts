import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authConfig } from '@/infrastructure/auth/auth.config'

/**
 * Next.js 16 Proxy (기존 middleware.ts → proxy.ts 마이그레이션)
 *
 * 1. CSP(Content Security Policy) nonce 기반 보안 헤더 생성
 * 2. NextAuth v5 `authorized` 콜백을 통한 인증 기반 라우트 보호
 *
 * NextAuth의 `authorized` 콜백(auth.config.ts)이 자동으로 실행되어
 * - 대시보드: 로그인 필수
 * - 관리자: ADMIN/SUPER_ADMIN
 * - 퍼블릭: 누구나 접근 가능
 * - 랜딩: 로그인 사용자 → /campaigns 리다이렉트
 */

// NextAuth auth 함수 (authConfig의 authorized 콜백 실행)
const { auth } = NextAuth(authConfig)

/**
 * CSP directive 목록 생성
 * 환경(개발/프로덕션)에 따라 달라지는 정책을 nonce 기반으로 구성
 */
function generateCSPDirectives(nonce: string): string {
  const isDevelopment = process.env.NODE_ENV === 'development'

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],

    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      // 개발 모드: Next.js HMR, React DevTools 지원
      ...(isDevelopment ? ["'unsafe-eval'"] : []),
      // Vercel Analytics
      'https://va.vercel-scripts.com',
      // Google Analytics
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      // Sentry
      'https://browser.sentry-cdn.com',
      'https://*.sentry.io',
      // Facebook SDK
      'https://connect.facebook.net',
    ],

    'style-src': [
      "'self'",
      `'nonce-${nonce}'`,
      // NOTE: Tailwind CSS는 <style> 태그에 인라인 스타일을 삽입하므로
      // nonce가 적용되지 않는 경우 'unsafe-inline'을 fallback으로 유지.
      // strict-dynamic은 style에는 적용되지 않으므로, unsafe-inline을
      // fallback으로 포함 (nonce를 지원하는 브라우저는 nonce를 우선 사용)
      "'unsafe-inline'",
      'https://fonts.googleapis.com',
    ],

    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https://*.facebook.com',
      'https://*.fbcdn.net',
      'https://*.google.com',
      'https://*.googleusercontent.com',
      'https://*.vercel.app',
      'https://*.supabase.co',
      'https://ui-avatars.com',
    ],

    'font-src': [
      "'self'",
      'data:',
      'https://fonts.gstatic.com',
    ],

    'connect-src': [
      "'self'",
      // Supabase
      'https://*.supabase.co',
      // Meta Ads API
      'https://graph.facebook.com',
      'https://*.facebook.com',
      // OpenAI
      'https://api.openai.com',
      // Sentry
      'https://*.sentry.io',
      'https://*.ingest.sentry.io',
      // Vercel
      'https://vitals.vercel-insights.com',
      'https://va.vercel-scripts.com',
      // WebSocket (개발 모드)
      ...(isDevelopment ? ['ws://localhost:3000', 'ws://127.0.0.1:3000'] : []),
    ],

    'frame-src': [
      "'self'",
      // OAuth 프로바이더
      'https://*.facebook.com',
      'https://accounts.google.com',
      'https://accounts.kakao.com',
    ],

    'media-src': ["'self'", 'blob:'],

    'object-src': ["'none'"],

    'base-uri': ["'self'"],

    'form-action': [
      "'self'",
      'https://accounts.google.com',
      'https://accounts.kakao.com',
      'https://*.facebook.com',
    ],

    'frame-ancestors': ["'self'"],
  }

  // 프로덕션에서는 비보안 요청 업그레이드
  if (!isDevelopment) {
    directives['upgrade-insecure-requests'] = []
  }

  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) return key
      return `${key} ${values.join(' ')}`
    })
    .join('; ')
}

/**
 * CSP 헤더를 요청/응답에 적용하는 헬퍼
 */
function applyCSPHeaders(request: NextRequest, response: NextResponse): NextResponse {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const cspHeaderValue = generateCSPDirectives(nonce)

  // 요청 헤더에 nonce + CSP 전달 (Server Component에서 headers()로 읽기 가능)
  request.headers.set('x-nonce', nonce)
  request.headers.set('Content-Security-Policy', cspHeaderValue)
  // Server Component에서 현재 요청 경로를 읽을 수 있도록 헤더에 추가
  request.headers.set('x-pathname', request.nextUrl.pathname)
  request.headers.set('x-search', request.nextUrl.search)

  // 응답 헤더에 CSP 설정
  response.headers.set('Content-Security-Policy', cspHeaderValue)
  response.headers.set('x-nonce', nonce)

  return response
}

/**
 * Next.js 16 Proxy 함수
 *
 * NextAuth auth()가 authorized 콜백을 실행한 후,
 * 그 응답에 CSP 헤더를 추가합니다.
 */
export const proxy = auth((request) => {
  // auth()가 authorized 콜백을 실행하여:
  // - 인증 필요 페이지 → 리다이렉트 (auth.config.ts에서 처리)
  // - 허용된 페이지 → 계속 진행
  // 여기 도달하면 authorized 콜백이 true를 반환한 경우

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  return applyCSPHeaders(request, response)
})

export const config = {
  matcher: [
    // Skip internal paths (_next, api, static files)
    '/((?!_next|api|favicon.ico|.*\\..*).*)',
  ],
}
