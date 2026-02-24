/**
 * Security Configuration
 *
 * 바투 AI 마케팅 솔루션의 보안 설정 중앙 관리
 * - 보안 헤더
 * - Content Security Policy
 * - CORS 설정
 * - Rate Limiting 설정
 */

// =============================================================================
// 환경 설정
// =============================================================================

const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

// =============================================================================
// 허용 도메인
// =============================================================================

export const ALLOWED_ORIGINS = isProduction
  ? [
      'https://batwo.ai',
      'https://www.batwo.ai',
      'https://staging.batwo.ai',
    ]
  : [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ]

// =============================================================================
// Content Security Policy
// =============================================================================

const CSP_DIRECTIVES = {
  // 기본 정책
  'default-src': ["'self'"],

  // 스크립트 소스
  'script-src': [
    "'self'",
    // Next.js 인라인 스크립트 (개발 모드)
    ...(isDevelopment ? ["'unsafe-eval'", "'unsafe-inline'"] : []),
    // Vercel Analytics
    'https://va.vercel-scripts.com',
    // Google Analytics (선택)
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    // Sentry
    'https://browser.sentry-cdn.com',
    'https://*.sentry.io',
  ],

  // 스타일 소스
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Tailwind CSS 인라인 스타일
    'https://fonts.googleapis.com',
  ],

  // 이미지 소스
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    // Meta/Facebook
    'https://*.facebook.com',
    'https://*.fbcdn.net',
    // Google
    'https://*.google.com',
    'https://*.googleusercontent.com',
    // Vercel
    'https://*.vercel.app',
    // Supabase Storage
    'https://*.supabase.co',
  ],

  // 폰트 소스
  'font-src': [
    "'self'",
    'data:',
    'https://fonts.gstatic.com',
  ],

  // API 연결
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
    // WebSocket (개발)
    ...(isDevelopment ? ['ws://localhost:3000', 'ws://127.0.0.1:3000'] : []),
  ],

  // 프레임 소스
  'frame-src': [
    "'self'",
    // Meta/Facebook OAuth
    'https://*.facebook.com',
    // Google OAuth
    'https://accounts.google.com',
    // Kakao OAuth
    'https://accounts.kakao.com',
  ],

  // 미디어 소스
  'media-src': [
    "'self'",
    'blob:',
  ],

  // Object 소스 (플러그인 등)
  'object-src': ["'none'"],

  // Base URI
  'base-uri': ["'self'"],

  // Form Action
  'form-action': [
    "'self'",
    'https://accounts.google.com',
    'https://accounts.kakao.com',
    'https://*.facebook.com',
  ],

  // Frame Ancestors (X-Frame-Options 대체)
  'frame-ancestors': ["'self'"],

  // 업그레이드 비보안 요청 (프로덕션)
  ...(isProduction ? { 'upgrade-insecure-requests': [] } : {}),
}

/**
 * CSP 문자열 생성
 */
export function buildCSP(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, values]) => {
      if (values.length === 0) {
        return directive
      }
      return `${directive} ${values.join(' ')}`
    })
    .join('; ')
}

// =============================================================================
// 보안 헤더
// =============================================================================

export const SECURITY_HEADERS = [
  // DNS Prefetch Control
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  // HSTS (Strict Transport Security)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  // Frame Options
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  // Content Type Options
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
  // Permissions Policy
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: buildCSP(),
  },
]

// =============================================================================
// Rate Limiting 설정
// =============================================================================

export const RATE_LIMIT_CONFIG = {
  // 일반 API (100 requests per minute)
  general: {
    tokens: 100,
    interval: 60 * 1000, // 1 minute
  },
  // AI 기능 (10 requests per minute)
  ai: {
    tokens: 10,
    interval: 60 * 1000,
  },
  // Auth 시도 (5 requests per minute)
  auth: {
    tokens: 5,
    interval: 60 * 1000,
  },
  // 캠페인 생성 (5 per hour)
  campaignCreate: {
    tokens: 5,
    interval: 60 * 60 * 1000, // 1 hour
  },
  // 무료 감사 (3 requests per day per IP)
  audit: {
    tokens: 3,
    interval: 24 * 60 * 60 * 1000, // 24 hours
  },
}

// =============================================================================
// CORS 설정
// =============================================================================

export const CORS_CONFIG = {
  allowedOrigins: ALLOWED_ORIGINS,
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
  ],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400, // 24 hours
  credentials: true,
}

/**
 * CORS 헤더 생성
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {}

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Access-Control-Allow-Credentials'] = 'true'
  }

  headers['Access-Control-Allow-Methods'] = CORS_CONFIG.allowedMethods.join(', ')
  headers['Access-Control-Allow-Headers'] = CORS_CONFIG.allowedHeaders.join(', ')
  headers['Access-Control-Expose-Headers'] = CORS_CONFIG.exposedHeaders.join(', ')
  headers['Access-Control-Max-Age'] = CORS_CONFIG.maxAge.toString()

  return headers
}

// =============================================================================
// Exports
// =============================================================================

const securityConfig = {
  securityHeaders: SECURITY_HEADERS,
  csp: buildCSP,
  cors: CORS_CONFIG,
  rateLimit: RATE_LIMIT_CONFIG,
  allowedOrigins: ALLOWED_ORIGINS,
}

export default securityConfig
