import type { NextConfig } from 'next'

/**
 * 보안 헤더 설정
 * CSP는 런타임에 동적으로 구성되어야 하므로 여기서는 기본 보안 헤더만 설정
 */
const securityHeaders = [
  // DNS Prefetch Control
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  // HSTS (Strict Transport Security) - 1년
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  // Frame Options - 클릭재킹 방지
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  // Content Type Options - MIME 스니핑 방지
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // XSS Protection (레거시 브라우저용)
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  // Referrer Policy
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // Permissions Policy - 민감한 브라우저 API 제한
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
]

/**
 * Content Security Policy 생성
 * 개발/프로덕션 환경에 따라 다르게 설정
 */
function generateCSP(): string {
  const isDevelopment = process.env.NODE_ENV === 'development'

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],

    'script-src': [
      "'self'",
      // Next.js 개발 모드 지원
      ...(isDevelopment ? ["'unsafe-eval'", "'unsafe-inline'"] : ["'unsafe-inline'"]),
      // Vercel Analytics
      'https://va.vercel-scripts.com',
      // Google Analytics
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      // Sentry
      'https://browser.sentry-cdn.com',
      'https://*.sentry.io',
    ],

    'style-src': [
      "'self'",
      "'unsafe-inline'", // Tailwind CSS
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

const nextConfig: NextConfig = {
  // X-Powered-By 헤더 제거 (보안)
  poweredByHeader: false,

  // 보안 헤더 설정
  headers: async () => [
    {
      // 모든 경로에 보안 헤더 적용
      source: '/:path*',
      headers: [
        ...securityHeaders,
        {
          key: 'Content-Security-Policy',
          value: generateCSP(),
        },
      ],
    },
    {
      // API 경로 추가 보안
      source: '/api/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store, max-age=0',
        },
      ],
    },
  ],

  // 이미지 최적화 설정
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.facebook.com',
      },
      {
        protocol: 'https',
        hostname: '*.fbcdn.net',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },

  // 실험적 기능
  experimental: {
    // 서버 액션 최적화
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

export default nextConfig
