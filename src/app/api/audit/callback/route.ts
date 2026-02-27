/**
 * GET /api/audit/callback
 *
 * Meta OAuth 콜백 처리 (비로그인 감사 전용).
 * - code → short-lived access token 교환 (long-lived 불필요)
 * - CSRF 방지: state 파라미터 검증 (auditStateCache)
 * - 광고 계정 목록 조회 (Authorization 헤더 방식, URL에 토큰 노출 없음)
 * - auditTokenCache에 15분 TTL로 저장
 * - /audit/callback?session=<uuid> 로 리다이렉트
 * - DB에 사용자 데이터 저장하지 않음
 * - Rate Limit 없음: Meta가 호출하는 OAuth 콜백이므로 사용자 한도 차감 불가
 *   (auth-url에서 이미 gate 역할 수행)
 */
import { NextRequest, NextResponse } from 'next/server'
import { auditTokenCache } from '@/lib/cache/auditTokenCache'
import { auditStateCache } from '@/lib/cache/auditStateCache'

const META_API_URL = 'https://graph.facebook.com/v25.0'

interface MetaTokenResponse {
  access_token?: string
  token_type?: string
  error?: { message: string }
}

interface MetaAdAccount {
  id: string
  name: string
  account_status: number
  currency: string
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const state = searchParams.get('state')

  // OAuth 에러 처리
  if (error) {
    const msg = encodeURIComponent(errorDescription || error)
    return NextResponse.redirect(new URL(`/audit/callback?error=${msg}`, request.url))
  }

  // CSRF state 검증: state 파라미터가 없거나 캐시에 없으면 거부
  if (!state || !auditStateCache.verify(state)) {
    return NextResponse.redirect(
      new URL(
        '/audit/callback?error=' + encodeURIComponent('유효하지 않은 요청입니다 (CSRF 검증 실패)'),
        request.url
      )
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/audit/callback?error=' + encodeURIComponent('인증 코드가 없습니다'), request.url)
    )
  }

  try {
    // 1. code → short-lived access token 교환
    const params = new URLSearchParams({
      client_id: process.env.META_APP_ID || '',
      client_secret: process.env.META_APP_SECRET || '',
      code,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/audit/callback`,
    })

    const tokenRes = await fetch(`${META_API_URL}/oauth/access_token?${params.toString()}`)
    const tokenData: MetaTokenResponse = await tokenRes.json()

    if (!tokenData.access_token) {
      return NextResponse.redirect(
        new URL('/audit/callback?error=' + encodeURIComponent('토큰 발급 실패'), request.url)
      )
    }

    // 2. 광고 계정 목록 조회 — Authorization 헤더 사용 (URL에 토큰 노출 방지)
    const accountsRes = await fetch(
      `${META_API_URL}/me/adaccounts?fields=id,name,account_status,currency`,
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    )
    const accountsData: { data?: MetaAdAccount[] } = await accountsRes.json()
    const accounts = accountsData.data || []

    if (accounts.length === 0) {
      return NextResponse.redirect(
        new URL('/audit/callback?error=' + encodeURIComponent('광고 계정이 없습니다'), request.url)
      )
    }

    // 3. 임시 캐시에 저장 (15분 TTL, DB 저장 없음)
    // adAccountId는 프론트에서 계정 선택 후 결정 (빈 문자열로 초기화)
    const sessionId = auditTokenCache.set({
      accessToken: tokenData.access_token,
      adAccountId: '',
      adAccounts: accounts.map((a) => ({
        id: a.id,
        name: a.name,
        currency: a.currency,
        accountStatus: a.account_status,
      })),
    })

    return NextResponse.redirect(
      new URL(`/audit/callback?session=${sessionId}`, request.url)
    )
  } catch (err) {
    console.error('[AUDIT CALLBACK] OAuth 처리 오류:', err instanceof Error ? err.message : err)
    return NextResponse.redirect(
      new URL('/audit/callback?error=' + encodeURIComponent('연결 중 오류가 발생했습니다'), request.url)
    )
  }
}
