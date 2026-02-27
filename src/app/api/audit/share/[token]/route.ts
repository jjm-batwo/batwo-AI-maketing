/**
 * GET /api/audit/share/[token]
 *
 * 공유 토큰으로 감사 결과 조회 API.
 * - 인증 불필요 (공개 공유 링크)
 * - 유효한 토큰: 200 + 감사 결과 데이터
 * - 만료된 토큰: 404
 * - 존재하지 않는 토큰: 404
 */
import { NextRequest, NextResponse } from 'next/server'
import { auditShareCache } from '@/lib/cache/auditShareCache'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  if (!token) {
    return NextResponse.json({ message: '공유 토큰이 필요합니다' }, { status: 400 })
  }

  const entry = await auditShareCache.get(token)
  if (!entry) {
    return NextResponse.json(
      { message: '공유 링크가 만료되었거나 존재하지 않습니다' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    report: entry.report,
    createdAt: new Date(entry.createdAt).toISOString(),
    expiresAt: new Date(entry.expiresAt).toISOString(),
  })
}
