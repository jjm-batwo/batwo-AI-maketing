/**
 * Next.js Instrumentation
 *
 * 서버 시작 시 Sentry 및 OpenTelemetry 초기화를 위한 instrumentation hook
 * https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */

export async function register() {
  // Temporarily disabled for debugging
  console.log('[instrumentation] Skipping telemetry/sentry init for debugging')
}

/**
 * Sentry 에러 핸들러 (Next.js 15+ onRequestError)
 * 서버 사이드 요청 에러를 Sentry에 자동 전송
 */
// export const onRequestError = async (
//   error: unknown,
//   request: Request,
//   context: {
//     routerKind: 'Pages Router' | 'App Router'
//     routePath: string
//     routeType: 'render' | 'route' | 'action' | 'middleware'
//     renderSource?:
//       | 'react-server-components'
//       | 'react-server-components-payload'
//       | 'server-rendering'
//     revalidateReason?: 'on-demand' | 'stale' | undefined
//     experimentalBypassFor?: { type: string; key: string; value: string }[]
//   }
// ) => {
//   // Sentry가 로드되어 있는지 확인
//   const Sentry = await import('@sentry/nextjs')
//
//   // 에러 리포팅
//   Sentry.captureException(error, {
//     extra: {
//       routerKind: context.routerKind,
//       routePath: context.routePath,
//       routeType: context.routeType,
//       renderSource: context.renderSource,
//       revalidateReason: context.revalidateReason,
//       url: request.url,
//       method: request.method,
//     },
//     tags: {
//       router: context.routerKind,
//       routeType: context.routeType,
//     },
//   })
// }
