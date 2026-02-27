/**
 * POST /api/audit/analyze
 *
 * 무료 감사 실행 API.
 * - 인증 불필요 (공개 API)
 * - Rate Limit 없음: getAndDelete로 single-use 세션 보호,
 *   auth-url이 유일한 gate 역할 (3회/일)
 * - auditTokenCache에서 세션 조회 → 없거나 만료 시 403
 * - AuditAdAccountUseCase 실행 후 결과 반환
 * - 토큰은 1회 사용 후 즉시 삭제
 */
import { NextRequest, NextResponse } from 'next/server'
import { auditTokenCache } from '@/lib/cache/auditTokenCache'
import { auditAnalyzeSchema } from '@/lib/validations/audit'
import { getAuditAdAccountUseCase } from '@/lib/di/container'
import { signReport } from '@/lib/security/auditHmac'

export async function POST(request: NextRequest) {
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

  // 세션 원자적 조회 + 삭제 (Race Condition 방어 — 1회 사용 후 즉시 무효화)
  const session = await auditTokenCache.getAndDelete(sessionId)
  if (!session) {
    return NextResponse.json(
      { message: '세션이 만료되었습니다. 다시 시도해주세요.' },
      { status: 403 }
    )
  }

  try {
    // 선택된 광고 계정의 currency 추출 (없으면 기본값 'KRW')
    const selectedAccount = session.adAccounts.find(a => a.id === adAccountId)
    const currency = selectedAccount?.currency ?? 'KRW'

    // UseCase 실행
    const useCase = getAuditAdAccountUseCase()
    const report = await useCase.execute({
      accessToken: session.accessToken,
      adAccountId,
      currency,
    })

    // HMAC 서명 생성 후 응답에 첨부 (클라이언트가 PDF/Share 요청 시 전달)
    const signature = signReport(report)

    return NextResponse.json({ ...report, signature })
  } catch (err) {
    // getAndDelete에서 이미 세션 삭제됨 — 별도 delete 불필요
    console.error('[AUDIT ANALYZE] 감사 실행 오류:', err instanceof Error ? err.message : err)
    return NextResponse.json(
      { message: '감사 분석 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
