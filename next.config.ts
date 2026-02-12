import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// Bundle Analyzer 설정 (환경 변수로 활성화)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

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
      // Facebook SDK
      'https://connect.facebook.net',
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
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // 실험적 기능
  experimental: {
    // 서버 액션 최적화
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // React 컴파일러는 별도 설정 필요 (babel-plugin-react-compiler)
    // ppr: true,  // Partial Prerendering (Next.js 14+)
  },

  // 프로덕션 빌드 최적화
  compiler: {
    // 프로덕션에서 console.log 제거
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Webpack 최적화
  webpack: (config, { isServer }) => {
    // 서버 빌드가 아닐 때만 적용
    if (!isServer) {
      // Tree shaking 향상
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      }
    }
    return config
  },
}

/**
 * Sentry 설정 옵션
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
 */
const sentryWebpackPluginOptions = {
  // 조직 및 프로젝트 설정 (Sentry에서 확인)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // 인증 토큰 (Source Maps 업로드용)
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Source Maps 설정
  sourcemaps: {
    // 빌드 시에만 Source Maps 삭제 (프로덕션)
    deleteSourcemapsAfterUpload: process.env.NODE_ENV === 'production',
  },

  // 빌드 로그 숨김
  silent: !process.env.CI,

  // Sentry가 설정되지 않은 경우 빌드 실패 방지
  disableLogger: !process.env.SENTRY_DSN,

  // Turbopack 호환성 (Next.js 15)
  tunnelRoute: '/monitoring',

  // 클라이언트에서 Sentry 숨기기
  hideSourceMaps: true,

  // Webpack 플러그인 비활성화 (인증 토큰 없을 때)
  widenClientFileUpload: true,

  // React 컴포넌트 이름 표시
  reactComponentAnnotation: {
    enabled: true,
  },
}

// Sentry DSN이 있을 때만 Sentry 설정 적용
let config = withNextIntl(nextConfig)
config = withBundleAnalyzer(config)

export default process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(config, sentryWebpackPluginOptions)
  : config
