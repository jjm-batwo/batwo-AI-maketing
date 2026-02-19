/**
 * Meta API 통합 테스트 공통 setup
 *
 * META_TEST_ACCESS_TOKEN 환경변수가 없으면 describe.skip()으로 테스트를 건너뜁니다.
 * 토큰이 있을 때만 실제 Meta Graph API를 호출합니다.
 *
 * 실행 방법:
 *   META_TEST_ACCESS_TOKEN=xxx META_TEST_AD_ACCOUNT_ID=act_xxx \
 *     npx vitest run -c vitest.config.integration.ts tests/integration/meta
 */
import 'dotenv/config'

export const META_TEST_TOKEN = process.env['META_TEST_ACCESS_TOKEN']
export const META_TEST_AD_ACCOUNT = process.env['META_TEST_AD_ACCOUNT_ID']

/**
 * META_TEST_ACCESS_TOKEN이 설정된 경우에만 describe 블록을 실행합니다.
 * 토큰이 없으면 describe.skip으로 전체 블록을 건너뜁니다.
 */
export function describeIfToken(name: string, fn: () => void): void {
  if (META_TEST_TOKEN) {
    describe(name, fn)
  } else {
    describe.skip(`${name} (META_TEST_ACCESS_TOKEN not set)`, fn)
  }
}

/**
 * 토큰과 광고 계정 ID가 모두 설정된 경우에만 실행합니다.
 */
export function describeIfFullConfig(name: string, fn: () => void): void {
  if (META_TEST_TOKEN && META_TEST_AD_ACCOUNT) {
    describe(name, fn)
  } else {
    const missing: string[] = []
    if (!META_TEST_TOKEN) missing.push('META_TEST_ACCESS_TOKEN')
    if (!META_TEST_AD_ACCOUNT) missing.push('META_TEST_AD_ACCOUNT_ID')
    describe.skip(`${name} (missing: ${missing.join(', ')})`, fn)
  }
}
