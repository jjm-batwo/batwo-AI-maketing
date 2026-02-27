/**
 * POST /api/audit/share
 *
 * 감사 결과 공유 토큰 생성 API.
 * - 인증 불필요 (감사 결과 자체가 이미 공개 데이터)
 * - IP Rate Limit: general 타입 (10회/시간)
 * - 감사 결과 데이터 → 공유 토큰 (UUID v4) 생성
 * - 만료: 7일
 * - 공유 URL은 NEXTAUTH_URL 환경변수 기준으로 생성 (origin 헤더 미사용)
 */
import { NextRequest, NextResponse } from 'next/server'
import { auditShareCache } from '@/lib/cache/auditShareCache'
import { auditReportSchema } from '@/lib/validations/audit'
import { checkRateLimit, getClientIp, rateLimitExceededResponse } from '@/lib/middleware/rateLimit'
import { verifyReport } from '@/lib/security/auditHmac'
import { z } from 'zod'

// =============================================================================
// Request Validation Schema
// =============================================================================

const shareRequestSchema = z.object({
  report: auditReportSchema,
  signature: z.string().min(1),
})

// =============================================================================
// Handler
// =============================================================================

export async function POST(request: NextRequest) {
  // IP 기반 Rate Limit 체크
  const ip = getClientIp(request)
  const rateLimit = await checkRateLimit(`audit-share:${ip}`, 'general')
  if (!rateLimit.success) return rateLimitExceededResponse(rateLimit)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: '유효하지 않은 요청 바디입니다' }, { status: 400 })
  }

  const validation = shareRequestSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { message: validation.error.issues[0].message },
      { status: 400 }
    )
  }

  const { report, signature } = validation.data

  // HMAC 서명 검증 (위조/변조된 report 차단)
  if (!verifyReport(report, signature)) {
    return NextResponse.json({ message: '유효하지 않은 서명입니다' }, { status: 403 })
  }

  // 공유 토큰 생성 (UUID v4, 7일 만료)
  const token = await auditShareCache.set(report)

  // 공유 URL 구성 — NEXTAUTH_URL 환경변수 사용 (origin 헤더는 위조 가능하므로 사용 안 함)
  const baseUrl = process.env.NEXTAUTH_URL || ''
  const shareUrl = `${baseUrl}/audit/shared/${token}`

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  return NextResponse.json(
    { token, shareUrl, expiresAt },
    { status: 201 }
  )
}
