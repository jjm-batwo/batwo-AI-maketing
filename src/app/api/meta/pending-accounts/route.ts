import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { oauthCache } from '@/lib/cache/oauthCache'

/**
 * GET /api/meta/pending-accounts?session=xxx
 * 선택 대기 중인 Meta 광고 계정 목록 조회
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session')

    if (!sessionId) {
      return NextResponse.json(
        { error: '세션 ID가 필요합니다' },
        { status: 400 }
      )
    }

    // 캐시에서 OAuth 데이터 조회 (DB 기반)
    const oauthData = await oauthCache.get(sessionId, user.id)

    if (!oauthData) {
      return NextResponse.json(
        { error: '세션이 만료되었습니다. 다시 연결해주세요.' },
        { status: 401 }
      )
    }

    // 민감한 정보(accessToken) 제외하고 계정 목록만 반환
    return NextResponse.json({
      accounts: oauthData.accounts.map((acc) => ({
        id: acc.id,
        name: acc.name,
        currency: acc.currency,
        account_status: acc.account_status,
      })),
    })
  } catch (error) {
    console.error('Fetch pending accounts error:', error)
    return NextResponse.json(
      { error: '계정 목록 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
