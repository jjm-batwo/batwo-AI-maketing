/**
 * TEST-10: MSW 서버 설정
 *
 * 모든 외부 API 핸들러를 통합하여 MSW 서버 구성
 */

import { setupServer } from 'msw/node'
import { metaApiHandlers } from './handlers/meta-api'
import { openAiHandlers } from './handlers/openai-api'
import { tossPaymentsHandlers } from './handlers/toss-payments'

export const mswServer = setupServer(
  ...metaApiHandlers,
  ...openAiHandlers,
  ...tossPaymentsHandlers
)

/**
 * MSW 테스트 설정 헬퍼
 *
 * @example
 * ```ts
 * import { setupMSW } from '@tests/msw/server'
 *
 * const { server } = setupMSW()
 * // server는 자동으로 beforeAll/afterEach/afterAll 설정됨
 * ```
 */
export function setupMSW() {
  beforeAll(() => {
    mswServer.listen({ onUnhandledRequest: 'warn' })
  })

  afterEach(() => {
    mswServer.resetHandlers()
  })

  afterAll(() => {
    mswServer.close()
  })

  return { server: mswServer }
}

// Re-export handlers for selective use
export { metaApiHandlers } from './handlers/meta-api'
export { openAiHandlers } from './handlers/openai-api'
export { tossPaymentsHandlers } from './handlers/toss-payments'
