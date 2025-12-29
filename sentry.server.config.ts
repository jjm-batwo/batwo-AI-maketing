/**
 * Sentry Server Configuration
 *
 * 서버 사이드 에러 추적 및 성능 모니터링
 * API Routes, Server Components에서 발생하는 에러를 추적합니다.
 */

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.SENTRY_DSN

// DSN이 설정되어 있을 때만 Sentry 초기화
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // 환경 구분
    environment: process.env.NODE_ENV,

    // 앱 버전
    release: process.env.SENTRY_RELEASE,

    // 성능 모니터링 (서버 사이드)
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // 디버그 모드 비활성화
    debug: false,

    // 민감한 데이터 필터링
    beforeSend(event, hint) {
      // 개발 모드에서는 전송하지 않음
      if (process.env.NODE_ENV === 'development') {
        console.log('[Sentry Server] Event captured (dev mode, not sent):', {
          message: event.message,
          exception: event.exception?.values?.[0]?.value,
        })
        return null
      }

      // 요청 헤더에서 민감한 정보 제거
      if (event.request?.headers) {
        const sensitiveHeaders = [
          'authorization',
          'cookie',
          'x-api-key',
          'x-auth-token',
          'x-access-token',
          'x-refresh-token',
        ]
        for (const header of sensitiveHeaders) {
          delete event.request.headers[header]
        }
      }

      // 환경변수에서 민감한 값 제거
      if (event.contexts?.runtime) {
        const runtimeContext = event.contexts.runtime as Record<string, unknown>
        if (runtimeContext.env && typeof runtimeContext.env === 'object') {
          const envVars = runtimeContext.env as Record<string, unknown>
          const sensitiveEnvVars = [
            'DATABASE_URL',
            'NEXTAUTH_SECRET',
            'OPENAI_API_KEY',
            'META_APP_SECRET',
            'GOOGLE_CLIENT_SECRET',
            'KAKAO_CLIENT_SECRET',
            'SENTRY_AUTH_TOKEN',
          ]
          for (const envVar of sensitiveEnvVars) {
            if (envVars[envVar]) {
              envVars[envVar] = '[REDACTED]'
            }
          }
        }
      }

      // 사용자 IP 제거
      if (event.user) {
        delete event.user.ip_address
      }

      return event
    },

    // 에러 무시 패턴
    ignoreErrors: [
      // Next.js 내부 에러
      'NEXT_NOT_FOUND',
      'NEXT_REDIRECT',
      // 인증 관련 (정상적인 흐름)
      'UnauthenticatedError',
      'UnauthorizedError',
      // 요청 취소
      'AbortError',
    ],

    // 통합 설정
    integrations: [
      // 데이터베이스 쿼리 추적 비활성화 (보안)
      Sentry.prismaIntegration(),
    ],
  })
}
