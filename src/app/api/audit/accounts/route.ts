/**
 * GET /api/audit/accounts
 *
 * 무료 감사 세션의 광고 계정 목록 반환.
 * - sessionId로 캐시 조회 → adAccounts 배열 반환
 * - accessToken은 절대 노출하지 않음 (보안)
 * - IP Rate Limit: general 타입 (100회/분, 읽기전용이므로 완화)
 */
import { NextRequest, NextResponse } from 'next/server'
import { auditTokenCache } from '@/lib/cache/auditTokenCache'
import { checkRateLimit, getClientIp, rateLimitExceededResponse } from '@/lib/middleware/rateLimit'

export async function GET(request: NextRequest) {
  // IP 기반 Rate Limit 체크
  const ip = getClientIp(request)
  const rateLimit = await checkRateLimit(`audit-accounts:${ip}`, 'general')
  if (!rateLimit.success) return rateLimitExceededResponse(rateLimit)

  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session')

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Bad Request', message: '세션 ID가 필요합니다' },
      { status: 400 }
    )
  }

  const session = await auditTokenCache.get(sessionId)
  if (!session) {
    return NextResponse.json(
      { error: 'Not Found', message: '세션이 존재하지 않거나 만료되었습니다' },
      { status: 404 }
    )
  }

  // accessToken 제외, 계정 목록만 반환
  return NextResponse.json({
    accounts: session.adAccounts.map((a) => ({
      id: a.id,
      name: a.name,
      currency: a.currency,
      accountStatus: a.accountStatus,
    })),
  })
}
