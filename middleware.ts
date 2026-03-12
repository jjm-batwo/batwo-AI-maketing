import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * CSP(Content Security Policy) nonce 기반 미들웨어
 *
 * 매 요청마다 고유한 nonce를 생성하여 CSP 헤더에 적용합니다.
 * 이를 통해 'unsafe-inline'을 제거하고, nonce + strict-dynamic으로
 * XSS 공격 표면을 최소화합니다.
 *
 * Auth redirects는 기존대로 page/layout 레벨에서 처리:
 * - src/app/page.tsx (logged-in users: / → /campaigns)
 * - src/app/(auth)/layout.tsx (logged-in users: /login, /register → /campaigns)
 */

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

export function middleware(request: NextRequest) {
  // 매 요청마다 고유한 nonce 생성 (base64 인코딩)
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  const cspHeaderValue = generateCSPDirectives(nonce)

  // 요청 헤더에 nonce 전달 (Server Component에서 headers()로 읽을 수 있음)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', cspHeaderValue)
  // Server Component에서 현재 요청 경로를 읽을 수 있도록 헤더에 추가
  requestHeaders.set('x-pathname', request.nextUrl.pathname)
  requestHeaders.set('x-search', request.nextUrl.search)

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // 응답 헤더에 CSP 설정
  response.headers.set('Content-Security-Policy', cspHeaderValue)

  return response
}

export const config = {
  matcher: [
    // Skip internal paths (_next, api, static files)
    '/((?!_next|api|favicon.ico|.*\\..*).*)',
  ],
}
