/**
 * GET /api/audit/auth-url
 *
 * 무료 감사용 Meta OAuth URL 생성.
 * - 인증 불필요 (공개 API)
 * - IP Rate Limit: audit 타입 (3회/일)
 * - scope: ads_read 만 요청 (읽기 전용)
 */
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIp, rateLimitExceededResponse } from '@/lib/middleware/rateLimit'

export async function GET(request: NextRequest) {
  // IP 기반 Rate Limit 체크
  const ip = getClientIp(request)
  const rateLimit = await checkRateLimit(`audit:${ip}`, 'audit')
  if (!rateLimit.success) return rateLimitExceededResponse(rateLimit)

  const META_APP_ID = process.env.META_APP_ID
  if (!META_APP_ID) {
    return NextResponse.json({ message: 'Meta 앱 설정이 없습니다' }, { status: 503 })
  }

  // 감사 전용 콜백 URI
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/audit/callback`

  // ads_read 스코프만 요청 (수정 권한 없음)
  const authUrl =
    `https://www.facebook.com/v25.0/dialog/oauth` +
    `?client_id=${META_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=ads_read` +
    `&response_type=code`

  return NextResponse.json({ authUrl })
}
