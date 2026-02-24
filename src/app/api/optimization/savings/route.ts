/**
 * GET /api/optimization/savings
 *
 * 로그인 사용자의 최적화 규칙 실행으로 인한 누적 절감액 리포트를 반환한다.
 */
import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { getCalculateSavingsUseCase } from '@/lib/di/container'

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const report = await getCalculateSavingsUseCase().execute(user.id)
    return NextResponse.json(report)
  } catch (error) {
    console.error('절감 금액 조회 실패:', error)
    return NextResponse.json(
      { message: '절감 금액을 불러오지 못했습니다' },
      { status: 500 }
    )
  }
}
