import { NextRequest, NextResponse } from 'next/server'
import { container, DI_TOKENS } from '@/lib/di/container'
import { ProactiveAlertService } from '@application/services/ProactiveAlertService'

export async function POST(request: NextRequest) {
  try {
    // Cron 엔드포인트 - 인증 헤더로 보호 (optional)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const alertService = container.resolve<ProactiveAlertService>(
      DI_TOKENS.ProactiveAlertService
    )

    const totalResult = {
      created: 0,
      types: { anomaly: 0, budget: 0, milestone: 0 },
    }

    // 단일 사용자 체크 (MVP - 현재는 요청 시 userId를 쿼리로 받음)
    const userId = request.nextUrl.searchParams.get('userId')
    if (userId) {
      const result = await alertService.checkForUser(userId)
      return NextResponse.json(result)
    }

    // userId 없으면 빈 결과 반환
    return NextResponse.json(totalResult)
  } catch (error) {
    console.error('[alerts/check] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알림 체크 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
