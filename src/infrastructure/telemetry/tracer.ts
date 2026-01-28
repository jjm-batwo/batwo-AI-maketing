import { trace, Span, SpanStatusCode, Context, context } from '@opentelemetry/api'

/**
 * Batwo 애플리케이션 Tracer
 */
export const tracer = trace.getTracer('batwo-marketing', '0.1.0')

/**
 * 함수 실행을 span으로 감싸는 헬퍼 함수
 * @param name Span 이름
 * @param fn 실행할 비동기 함수
 * @param attributes Span에 추가할 속성
 * @returns 함수 실행 결과
 *
 * @example
 * const result = await withSpan('fetchUserData', async () => {
 *   return await db.user.findUnique({ where: { id: userId } })
 * }, { userId: '123' })
 */
export async function withSpan<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  const span = tracer.startSpan(name)

  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      span.setAttribute(key, value)
    })
  }

  try {
    const result = await context.with(trace.setSpan(context.active(), span), fn)
    span.setStatus({ code: SpanStatusCode.OK })
    return result
  } catch (error) {
    span.recordException(error as Error)
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  } finally {
    span.end()
  }
}

/**
 * 현재 활성 span에 속성 추가
 * @param key 속성 키
 * @param value 속성 값
 */
export function setSpanAttribute(
  key: string,
  value: string | number | boolean
): void {
  const span = trace.getSpan(context.active())
  if (span) {
    span.setAttribute(key, value)
  }
}

/**
 * 현재 활성 span에 이벤트 추가
 * @param name 이벤트 이름
 * @param attributes 이벤트 속성
 */
export function addSpanEvent(
  name: string,
  attributes?: Record<string, string | number | boolean>
): void {
  const span = trace.getSpan(context.active())
  if (span) {
    span.addEvent(name, attributes)
  }
}

/**
 * Span 인터페이스 재export (타입 참조용)
 */
export type { Span, Context }
