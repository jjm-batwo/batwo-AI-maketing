/**
 * Sentry Edge Configuration
 *
 * Edge Runtime 에러 추적
 * Middleware, Edge API Routes에서 발생하는 에러를 추적합니다.
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

    // 성능 모니터링 (Edge는 더 낮은 샘플링)
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0.5,

    // 디버그 비활성화
    debug: false,

    // 민감한 데이터 필터링
    beforeSend(event, _hint) {
      // 개발 모드에서는 전송하지 않음
      if (process.env.NODE_ENV === 'development') {
        console.log('[Sentry Edge] Event captured (dev mode, not sent):', {
          message: event.message,
        })
        return null
      }

      // 요청 헤더에서 민감한 정보 제거
      if (event.request?.headers) {
        delete event.request.headers['authorization']
        delete event.request.headers['cookie']
      }

      return event
    },

    // Edge 특화 에러 무시
    ignoreErrors: [
      'NEXT_NOT_FOUND',
      'NEXT_REDIRECT',
      'Rate limit exceeded', // Rate limiting은 정상 동작
    ],
  })
}
