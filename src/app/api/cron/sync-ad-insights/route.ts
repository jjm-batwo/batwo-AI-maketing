import { NextRequest, NextResponse } from 'next/server'
import { validateCronAuth } from '@/lib/middleware/cronAuth'
import { container, DI_TOKENS } from '@/lib/di/container'
import { SyncAdInsightsUseCase } from '@application/use-cases/kpi/SyncAdInsightsUseCase'
import { prisma } from '@/lib/prisma'
import { isTokenExpired } from '@application/utils/metaTokenUtils'

/**
 * GET /api/cron/sync-ad-insights
 *
 * Vercel Cron Job - Ad 레벨 KPI 동기화
 *
 * 기존 /api/cron/sync (06:00) 이후 30분 뒤 실행하여 Rate Limit 충돌 방지.
 *
 * Configuration in vercel.json:
 * - path: /api/cron/sync-ad-insights
 * - schedule: "30 6 * * *" (매일 06:30 KST)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = validateCronAuth(request)
    if (!authResult.authorized) {
      return authResult.response!
    }

    console.log('[SyncAdInsights Cron] Ad 레벨 KPI 동기화 시작...')

    const metaAccounts = await prisma.metaAdAccount.findMany({
      select: {
        userId: true,
        metaAccountId: true,
        tokenExpiry: true,
      },
    })

    if (metaAccounts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No Meta accounts found',
        processed: 0,
      })
    }

    const syncUseCase = container.resolve<SyncAdInsightsUseCase>(
      DI_TOKENS.SyncAdInsightsUseCase
    )

    const results = {
      processed: 0,
      skipped: 0,
      totalSynced: 0,
      errors: [] as string[],
    }

    for (const account of metaAccounts) {
      if (isTokenExpired(account.tokenExpiry)) {
        console.log(`[SyncAdInsights Cron] 사용자 ${account.userId} 토큰 만료 - 스킵`)
        results.skipped++
        continue
      }

      try {
        const syncResult = await syncUseCase.execute({
          userId: account.userId,
          datePreset: 'last_7d',
        })

        results.processed++
        results.totalSynced += syncResult.syncedCount

        console.log(
          `[SyncAdInsights Cron] 사용자 ${account.userId} 완료: ${syncResult.syncedCount}개 동기화`
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error(`[SyncAdInsights Cron] 사용자 ${account.userId} 실패:`, message)
        results.errors.push(`User ${account.userId}: ${message}`)
      }
    }

    console.log('[SyncAdInsights Cron] 완료:', results)

    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error) {
    console.error('[SyncAdInsights Cron] 치명적 오류:', error)
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
