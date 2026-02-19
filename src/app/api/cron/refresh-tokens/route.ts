import { NextRequest, NextResponse } from 'next/server'
import { validateCronAuth } from '@/lib/middleware/cronAuth'
import { getRefreshMetaTokenUseCase } from '@/lib/di/container'

/**
 * GET /api/cron/refresh-tokens
 *
 * Vercel Cron Job - Meta long-lived token 자동 갱신
 *
 * Meta long-lived token은 60일 유효.
 * 만료 7일 전인 토큰을 가진 계정을 자동 갱신.
 *
 * Configuration in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/refresh-tokens",
 *     "schedule": "0 2 * * *"  // 매일 새벽 2시 UTC (오전 11시 KST)
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // 크론 인증 검증
    const authResult = validateCronAuth(request)
    if (!authResult.authorized) {
      return authResult.response!
    }

    console.log('[RefreshTokens Cron] Meta 토큰 자동 갱신 시작...')

    const refreshUseCase = getRefreshMetaTokenUseCase()
    const result = await refreshUseCase.execute()

    console.log('[RefreshTokens Cron] 완료:', result)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('[RefreshTokens Cron] 치명적 오류:', error)
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
