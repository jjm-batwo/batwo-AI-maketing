/**
 * POST /api/audit/analyze
 *
 * 무료 감사 실행 API.
 * - 인증 불필요 (공개 API)
 * - IP Rate Limit: audit 타입 (3회/일)
 * - auditTokenCache에서 세션 조회 → 없거나 만료 시 403
 * - AuditAdAccountUseCase 실행 후 결과 반환
 * - 토큰은 1회 사용 후 즉시 삭제
 */
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIp, rateLimitExceededResponse } from '@/lib/middleware/rateLimit'
import { auditTokenCache } from '@/lib/cache/auditTokenCache'
import { auditAnalyzeSchema } from '@/lib/validations/audit'
import { getAuditAdAccountUseCase } from '@/lib/di/container'

export async function POST(request: NextRequest) {
  // IP 기반 Rate Limit 체크
  const ip = getClientIp(request)
  const rateLimit = await checkRateLimit(`audit:${ip}`, 'audit')
  if (!rateLimit.success) return rateLimitExceededResponse(rateLimit)

  // 요청 바디 파싱 및 Zod 검증
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: '유효하지 않은 요청 바디입니다' }, { status: 400 })
  }

  const validation = auditAnalyzeSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { message: validation.error.issues[0].message },
      { status: 400 }
    )
  }

  const { sessionId, adAccountId } = validation.data

  // 세션 조회 (만료 또는 없음 → 403)
  const session = auditTokenCache.get(sessionId)
  if (!session) {
    return NextResponse.json(
      { message: '세션이 만료되었습니다. 다시 시도해주세요.' },
      { status: 403 }
    )
  }

  try {
    // UseCase 실행
    const useCase = getAuditAdAccountUseCase()
    const report = await useCase.execute({
      accessToken: session.accessToken,
      adAccountId,
    })

    // 1회용: 사용 후 즉시 삭제
    auditTokenCache.delete(sessionId)

    return NextResponse.json(report)
  } catch (err) {
    // 에러 발생 시에도 세션 삭제 (보안)
    auditTokenCache.delete(sessionId)

    console.error('[AUDIT ANALYZE] 감사 실행 오류:', err instanceof Error ? err.message : err)
    return NextResponse.json(
      { message: '감사 분석 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
