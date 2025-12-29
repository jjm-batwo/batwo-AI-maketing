/**
 * Error Reporting Utility
 *
 * Sentry와 통합된 에러 리포팅 유틸리티
 * API Routes, Server Actions, 클라이언트에서 일관된 에러 추적
 */

import * as Sentry from '@sentry/nextjs'

/**
 * 에러 심각도 레벨
 */
export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info' | 'debug'

/**
 * 에러 컨텍스트 타입
 */
export interface ErrorContext {
  /** 에러가 발생한 컴포넌트/모듈 */
  component?: string
  /** 에러가 발생한 액션/함수 */
  action?: string
  /** 사용자 ID */
  userId?: string
  /** 추가 메타데이터 */
  extra?: Record<string, unknown>
  /** 태그 (필터링용) */
  tags?: Record<string, string>
  /** 심각도 (기본: error) */
  severity?: ErrorSeverity
  /** 핑거프린트 (그룹화용) */
  fingerprint?: string[]
}

/**
 * 에러를 Sentry에 리포팅
 *
 * @example
 * ```ts
 * try {
 *   await createCampaign(data)
 * } catch (error) {
 *   reportError(error, {
 *     component: 'CampaignService',
 *     action: 'createCampaign',
 *     userId: user.id,
 *     extra: { campaignData: data }
 *   })
 *   throw error
 * }
 * ```
 */
export function reportError(
  error: unknown,
  context: ErrorContext = {}
): string {
  const {
    component,
    action,
    userId,
    extra = {},
    tags = {},
    severity = 'error',
    fingerprint,
  } = context

  // 에러 정규화
  const normalizedError =
    error instanceof Error ? error : new Error(String(error))

  // Sentry 스코프 설정
  Sentry.withScope((scope) => {
    // 심각도 설정
    scope.setLevel(severity as Sentry.SeverityLevel)

    // 사용자 설정
    if (userId) {
      scope.setUser({ id: userId })
    }

    // 태그 설정
    if (component) {
      scope.setTag('component', component)
    }
    if (action) {
      scope.setTag('action', action)
    }
    Object.entries(tags).forEach(([key, value]) => {
      scope.setTag(key, value)
    })

    // 추가 컨텍스트
    scope.setContext('errorContext', {
      component,
      action,
      ...extra,
    })

    // 핑거프린트 (에러 그룹화)
    if (fingerprint) {
      scope.setFingerprint(fingerprint)
    }

    // 에러 전송
    Sentry.captureException(normalizedError)
  })

  // 개발 모드에서는 콘솔에도 출력
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Report]', {
      error: normalizedError.message,
      component,
      action,
      extra,
    })
  }

  // 에러 ID 반환 (사용자 지원용)
  return Sentry.lastEventId() || 'unknown'
}

/**
 * API 에러 리포팅 (API Routes 전용)
 */
export function reportApiError(
  error: unknown,
  request: Request,
  context: Omit<ErrorContext, 'component'> = {}
): string {
  const url = new URL(request.url)

  return reportError(error, {
    ...context,
    component: 'API',
    action: `${request.method} ${url.pathname}`,
    extra: {
      ...context.extra,
      method: request.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
    },
    tags: {
      ...context.tags,
      api_route: url.pathname,
      http_method: request.method,
    },
  })
}

/**
 * 사용자 피드백과 함께 에러 리포팅
 */
export function reportErrorWithFeedback(
  error: unknown,
  feedback: {
    name?: string
    email?: string
    comments: string
  },
  context: ErrorContext = {}
): string {
  const eventId = reportError(error, context)

  // 사용자 피드백 전송
  Sentry.captureFeedback({
    associatedEventId: eventId,
    name: feedback.name || 'Anonymous',
    email: feedback.email || 'anonymous@example.com',
    message: feedback.comments,
  })

  return eventId
}

/**
 * 메시지 리포팅 (에러가 아닌 이벤트)
 */
export function reportMessage(
  message: string,
  level: ErrorSeverity = 'info',
  context: Omit<ErrorContext, 'severity'> = {}
): string {
  Sentry.withScope((scope) => {
    scope.setLevel(level as Sentry.SeverityLevel)

    if (context.component) {
      scope.setTag('component', context.component)
    }
    if (context.action) {
      scope.setTag('action', context.action)
    }
    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value)
      })
    }
    if (context.extra) {
      scope.setContext('messageContext', context.extra)
    }

    Sentry.captureMessage(message)
  })

  return Sentry.lastEventId() || 'unknown'
}

/**
 * 사용자 컨텍스트 설정
 */
export function setUserContext(user: {
  id: string
  email?: string
  name?: string
}): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  })
}

/**
 * 사용자 컨텍스트 초기화 (로그아웃 시)
 */
export function clearUserContext(): void {
  Sentry.setUser(null)
}

/**
 * 브레드크럼 추가 (디버깅용 이벤트 로그)
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
    timestamp: Date.now() / 1000,
  })
}
