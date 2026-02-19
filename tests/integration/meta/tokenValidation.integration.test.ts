/**
 * Meta 액세스 토큰 유효성 검증 통합 테스트
 *
 * 실행 조건: META_TEST_ACCESS_TOKEN 환경변수 필요
 *            META_TEST_APP_ID, META_TEST_APP_SECRET (선택 - 디버그 엔드포인트용)
 * 실행 방법:
 *   META_TEST_ACCESS_TOKEN=xxx \
 *     npx vitest run -c vitest.config.integration.ts tests/integration/meta/tokenValidation
 *
 * 주의: 읽기 전용 (토큰 디버그 API 호출만 수행)
 */
import { describe, it, expect } from 'vitest'
import { describeIfToken, META_TEST_TOKEN } from './setup'

const META_GRAPH_BASE = 'https://graph.facebook.com/v25.0'

/**
 * Meta Graph API debug_token 엔드포인트 응답 타입
 */
interface TokenDebugResponse {
  data: {
    app_id?: string
    type?: string
    application?: string
    expires_at?: number
    is_valid: boolean
    scopes?: string[]
    user_id?: string
    error?: {
      code: number
      message: string
      subcode: number
    }
  }
}

/**
 * 액세스 토큰으로 /me 엔드포인트를 호출해 기본 유효성을 확인합니다.
 * (App Secret 없이도 호출 가능한 방식)
 */
async function fetchMeEndpoint(accessToken: string): Promise<{ id: string; name?: string }> {
  const url = `${META_GRAPH_BASE}/me?fields=id,name&access_token=${encodeURIComponent(accessToken)}`
  const response = await fetch(url)
  const data = await response.json()

  if (!response.ok || data.error) {
    const err = data.error || { message: 'Unknown error', code: 0 }
    throw new Error(`Meta API Error [${err.code}]: ${err.message}`)
  }

  return data
}

/**
 * App Token을 사용해 debug_token 엔드포인트로 토큰 상세 정보를 조회합니다.
 * META_TEST_APP_ID 와 META_TEST_APP_SECRET이 모두 있을 때만 호출합니다.
 */
async function debugToken(
  inputToken: string,
  appId: string,
  appSecret: string
): Promise<TokenDebugResponse['data']> {
  const appToken = `${appId}|${appSecret}`
  const url = `${META_GRAPH_BASE}/debug_token?input_token=${encodeURIComponent(inputToken)}&access_token=${encodeURIComponent(appToken)}`
  const response = await fetch(url)
  const data: TokenDebugResponse = await response.json()

  if (!response.ok) {
    throw new Error(`debug_token 호출 실패: ${JSON.stringify(data)}`)
  }

  return data.data
}

describeIfToken('Meta 액세스 토큰 유효성 검증', () => {
  const accessToken = META_TEST_TOKEN!
  const appId = process.env['META_TEST_APP_ID']
  const appSecret = process.env['META_TEST_APP_SECRET']

  // -------------------------------------------------------------------------
  // /me 엔드포인트 기본 검증 (App Secret 불필요)
  // -------------------------------------------------------------------------
  it('should_return_user_id_when_token_is_valid', async () => {
    const me = await fetchMeEndpoint(accessToken)

    expect(me).toBeDefined()
    expect(typeof me.id).toBe('string')
    expect(me.id.length).toBeGreaterThan(0)
  })

  it('should_throw_error_when_token_is_invalid', async () => {
    const invalidToken = 'EAAinvalid_token_for_testing_only'

    await expect(fetchMeEndpoint(invalidToken)).rejects.toThrow()
  })

  // -------------------------------------------------------------------------
  // debug_token 엔드포인트 (META_TEST_APP_ID + META_TEST_APP_SECRET 필요)
  // -------------------------------------------------------------------------
  const describeIfAppCredentials = appId && appSecret ? describe : describe.skip

  describeIfAppCredentials(
    'debug_token 엔드포인트 (META_TEST_APP_ID + META_TEST_APP_SECRET 필요)',
    () => {
      it('should_confirm_token_is_valid_via_debug_endpoint', async () => {
        const result = await debugToken(accessToken, appId!, appSecret!)

        expect(result).toBeDefined()
        expect(result.is_valid).toBe(true)
      })

      it('should_return_required_scopes_in_token', async () => {
        const result = await debugToken(accessToken, appId!, appSecret!)

        expect(result.is_valid).toBe(true)
        expect(Array.isArray(result.scopes)).toBe(true)

        // Meta 광고 관리에 필요한 최소 권한 확인
        const requiredScopes = ['ads_read']
        const grantedScopes = result.scopes || []

        for (const scope of requiredScopes) {
          expect(grantedScopes).toContain(scope)
        }
      })

      it('should_report_token_expiry_time_when_token_is_not_permanent', async () => {
        const result = await debugToken(accessToken, appId!, appSecret!)

        expect(result.is_valid).toBe(true)

        if (result.expires_at !== undefined && result.expires_at !== 0) {
          // 만료 시간이 현재 시각보다 미래인지 확인
          const expiresAt = new Date(result.expires_at * 1000)
          const now = new Date()
          expect(expiresAt.getTime()).toBeGreaterThan(now.getTime())

          // 만료까지 7일 미만이면 경고 출력
          const daysUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          if (daysUntilExpiry < 7) {
            console.warn(
              `[경고] Meta 액세스 토큰이 ${Math.floor(daysUntilExpiry)}일 후 만료됩니다. 갱신이 필요합니다.`
            )
          }
        }
      })
    }
  )
})
