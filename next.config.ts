import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// Bundle Analyzer 설정 (ANALYZE=true 일 때만 로드)
const withBundleAnalyzer = process.env.ANALYZE === 'true'
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ? require('@next/bundle-analyzer')({ enabled: true })
  : (config: NextConfig) => config

/**
 * 보안 헤더 설정
 *
 * CSP(Content Security Policy)는 nonce 기반으로 middleware.ts에서 동적 생성합니다.
 * 여기서는 nonce가 필요 없는 정적 보안 헤더만 설정합니다.
 *
 * @see middleware.ts — CSP nonce 생성 및 적용
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

const nextConfig: NextConfig = {
  // X-Powered-By 헤더 제거 (보안)
  poweredByHeader: false,

  // 서버 전용 패키지 - 클라이언트 번들에 포함되지 않도록 명시적으로 지정
  serverExternalPackages: ['@react-pdf/renderer'],

  // 보안 헤더 설정 (CSP는 middleware.ts에서 nonce와 함께 동적 생성)
  headers: async () => [
    {
      // 모든 경로에 정적 보안 헤더 적용
      source: '/:path*',
      headers: securityHeaders,
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
        pathname: '/v*/**',
      },
      {
        protocol: 'https',
        hostname: '*.fbcdn.net',
        pathname: '/v/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        pathname: '/a/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 3600,
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
