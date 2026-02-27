/**
 * POST /api/audit/pdf
 *
 * 감사 결과 PDF 다운로드 API.
 * - 인증 불필요
 * - IP Rate Limit: general 타입 (10회/시간)
 * - 감사 결과 데이터 → PDF 바이너리 응답
 * - Content-Disposition: attachment
 * - 외부 PDF 라이브러리 없이 구조화된 텍스트 PDF 생성
 *   (@react-pdf/renderer 활용)
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateAuditPDF } from '@/infrastructure/pdf/AuditPDFGenerator'
import { auditReportSchema } from '@/lib/validations/audit'
import { checkRateLimit, getClientIp, rateLimitExceededResponse } from '@/lib/middleware/rateLimit'
import { verifyReport } from '@/lib/security/auditHmac'

// =============================================================================
// Request Validation Schema
// =============================================================================

const pdfRequestSchema = z.object({
  report: auditReportSchema,
  signature: z.string().min(1),
  accountName: z.string().optional(),
})

// =============================================================================
// Handler
// =============================================================================

export async function POST(request: NextRequest) {
  // IP 기반 Rate Limit 체크 (PDF 생성은 무거운 작업이므로 제한 적용)
  const ip = getClientIp(request)
  const rateLimit = await checkRateLimit(`audit-pdf:${ip}`, 'general')
  if (!rateLimit.success) return rateLimitExceededResponse(rateLimit)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: '유효하지 않은 요청 바디입니다' }, { status: 400 })
  }

  const validation = pdfRequestSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { message: validation.error.issues[0].message },
      { status: 400 }
    )
  }

  const { report, signature, accountName } = validation.data

  // HMAC 서명 검증 (위조/변조된 report 차단)
  if (!verifyReport(report, signature)) {
    return NextResponse.json({ message: '유효하지 않은 서명입니다' }, { status: 403 })
  }

  try {
    const pdfBuffer = await generateAuditPDF(report)

    const analyzedDate = new Date(report.analyzedAt)
      .toISOString()
      .split('T')[0]
      .replace(/-/g, '')
    const safeName = (accountName || '').replace(/[^a-zA-Z0-9가-힣_-]/g, '_').slice(0, 30)
    const filename = safeName
      ? `바투_광고계정진단_${safeName}_${analyzedDate}.pdf`
      : `바투_광고계정진단_${analyzedDate}.pdf`
    const encodedFilename = encodeURIComponent(filename)

    return new NextResponse(pdfBuffer.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodedFilename}`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (err) {
    console.error('[AUDIT PDF] PDF 생성 오류:', err instanceof Error ? err.message : err)
    return NextResponse.json(
      { message: 'PDF 생성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
