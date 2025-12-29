/**
 * Sentry Client Configuration
 *
 * 클라이언트 사이드 에러 추적 및 성능 모니터링
 * 브라우저에서 발생하는 에러와 사용자 세션을 추적합니다.
 */

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

// DSN이 설정되어 있을 때만 Sentry 초기화
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // 환경 구분
    environment: process.env.NODE_ENV,

    // 앱 버전 (CI/CD에서 주입)
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

    // 성능 모니터링 샘플링 레이트 (10%)
    // 프로덕션에서는 비용 고려하여 조절
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // 세션 리플레이 설정
    replaysSessionSampleRate: 0.1, // 일반 세션 10% 샘플링
    replaysOnErrorSampleRate: 1.0, // 에러 발생 시 100% 캡처

    // 개발 모드에서 디버그 활성화
    debug: false,

    // 민감한 데이터 필터링
    beforeSend(event, hint) {
      // 개발 모드에서는 Sentry로 전송하지 않음
      if (process.env.NODE_ENV === 'development') {
        console.log('[Sentry] Event captured (dev mode, not sent):', event)
        return null
      }

      // 민감한 데이터 제거
      if (event.request?.headers) {
        delete event.request.headers['authorization']
        delete event.request.headers['cookie']
        delete event.request.headers['x-api-key']
      }

      // 사용자 정보에서 민감한 데이터 마스킹
      if (event.user) {
        // IP 주소 제거
        delete event.user.ip_address
      }

      // 에러 메시지에서 민감한 패턴 필터링
      const sensitivePatterns = [
        /api[_-]?key/i,
        /password/i,
        /secret/i,
        /token/i,
        /credential/i,
        /auth/i,
      ]

      if (event.exception?.values) {
        for (const exception of event.exception.values) {
          if (exception.value) {
            for (const pattern of sensitivePatterns) {
              if (pattern.test(exception.value)) {
                exception.value = exception.value.replace(
                  /[a-zA-Z0-9-_]{20,}/g,
                  '[REDACTED]'
                )
              }
            }
          }
        }
      }

      return event
    },

    // 특정 에러 무시
    ignoreErrors: [
      // 브라우저 확장 프로그램 에러
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      // 네트워크 관련
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      // 사용자 취소
      'AbortError',
      'The operation was aborted',
      // 비밀번호 관리자
      'Non-Error promise rejection captured',
    ],

    // 특정 URL 제외
    denyUrls: [
      // 브라우저 확장 프로그램
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      /^moz-extension:\/\//i,
      // 써드파티 스크립트
      /googletagmanager\.com/i,
      /google-analytics\.com/i,
    ],

    // 통합 설정
    integrations: [
      // 세션 리플레이 (에러 발생 시 사용자 세션 녹화)
      Sentry.replayIntegration({
        // 마스킹할 요소들
        maskAllText: false,
        maskAllInputs: true,
        blockAllMedia: false,
      }),
      // 브라우저 트레이싱
      Sentry.browserTracingIntegration({
        // 페이지 로드 추적
        enableInp: true,
      }),
    ],
  })
}
