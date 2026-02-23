import { NextRequest, NextResponse } from 'next/server'
import { validateCronAuth } from '@/lib/middleware/cronAuth'
import { getSendCAPIEventsUseCase } from '@/lib/di/container'

/**
 * GET /api/cron/capi-batch
 *
 * Vercel Cron Job - Meta CAPI 배치 전송
 *
 * DB에 저장된 sentToMeta=false 이벤트를 주기적으로 Meta CAPI로 전송.
 * 5분마다 실행하여 실시간에 가까운 이벤트 전송을 보장.
 *
 * 처리 전략:
 * - stale(7일+) 이벤트 → EXPIRED 마킹 (Meta 전송 생략)
 * - 3회 초과 실패 이벤트 → FAILED 마킹 (전송 포기)
 * - 정상 이벤트 → pixelId별 그룹핑 후 Meta CAPI 일괄 전송
 *
 * Configuration in vercel.json:
 * crons: [{ path: "/api/cron/capi-batch", schedule: "every 5 minutes" }]
 */
export async function GET(request: NextRequest) {
  try {
    // 크론 인증 검증
    const authResult = validateCronAuth(request)
    if (!authResult.authorized) {
      return authResult.response!
    }

    console.log('[CAPIBatch Cron] CAPI 배치 전송 시작...')

    const useCase = getSendCAPIEventsUseCase()
    const result = await useCase.execute()

    console.log('[CAPIBatch Cron] 완료:', result)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('[CAPIBatch Cron] 치명적 오류:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Vercel Cron 설정
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 1분 타임아웃
