import { NextRequest, NextResponse } from 'next/server'
import { validateCronAuth } from '@/lib/middleware/cronAuth'
import { getEvaluateOptimizationRulesUseCase } from '@/lib/di/container'

// GET /api/cron/evaluate-rules
// Vercel Cron Job - 15분마다 최적화 규칙 평가 및 자동 액션 실행
// vercel.json schedule: "*/15 * * * *"
export async function GET(request: NextRequest) {
  try {
    const authResult = validateCronAuth(request)
    if (!authResult.authorized) {
      return authResult.response
    }

    console.log('[OptimizationRule Cron] Starting rule evaluation...')

    const result = await getEvaluateOptimizationRulesUseCase().execute()

    console.log('[OptimizationRule Cron] Completed:', result)

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('[OptimizationRule Cron] Fatal error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
export const maxDuration = 300
