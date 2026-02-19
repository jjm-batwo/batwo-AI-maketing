import { NextRequest, NextResponse } from 'next/server'
import { validateCronAuth } from '@/lib/middleware/cronAuth'
import { container, DI_TOKENS } from '@/lib/di/container'
import { SyncCampaignsUseCase } from '@application/use-cases/campaign/SyncCampaignsUseCase'
import { SyncAllInsightsUseCase } from '@application/use-cases/kpi/SyncAllInsightsUseCase'
import { invalidateCache, getUserPattern } from '@/lib/cache/kpiCache'
import { revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { isTokenExpired } from '@application/utils/metaTokenUtils'

/**
 * GET /api/cron/sync
 *
 * Vercel Cron Job - Meta 캠페인 및 KPI 자동 동기화
 *
 * 모든 Meta 계정 연결 사용자를 대상으로:
 * 1. 캠페인 동기화 (생성/수정/아카이브)
 * 2. KPI 인사이트 동기화 (최근 7일)
 * 3. 캐시 무효화 (인메모리 + ISR)
 *
 * Configuration in vercel.json:
 * - path: /api/cron/sync
 * - schedule: 매 6시간 (0 star-slash-6 * * *)
 */
export async function GET(request: NextRequest) {
  try {
    // 크론 인증 검증
    const authResult = validateCronAuth(request)
    if (!authResult.authorized) {
      return authResult.response!
    }

    console.log('[Sync Cron] Meta 캠페인/KPI 자동 동기화 시작...')

    // Meta 계정이 연결된 모든 사용자 조회
    const metaAccounts = await prisma.metaAdAccount.findMany({
      select: {
        userId: true,
        tokenExpiry: true,
      },
    })

    if (metaAccounts.length === 0) {
      console.log('[Sync Cron] Meta 계정이 연결된 사용자가 없습니다')
      return NextResponse.json({
        success: true,
        message: 'No Meta accounts found',
        processed: 0,
      })
    }

    console.log(`[Sync Cron] ${metaAccounts.length}개 Meta 계정 발견`)

    const syncCampaignsUseCase = container.resolve<SyncCampaignsUseCase>(
      DI_TOKENS.SyncCampaignsUseCase
    )
    const syncInsightsUseCase = container.resolve<SyncAllInsightsUseCase>(
      DI_TOKENS.SyncAllInsightsUseCase
    )

    const results = {
      processed: 0,
      skipped: 0,
      totalCampaignsSynced: 0,
      totalInsightsSynced: 0,
      errors: [] as string[],
    }

    for (const account of metaAccounts) {
      // 토큰 만료 확인
      if (isTokenExpired(account.tokenExpiry)) {
        console.log(`[Sync Cron] 사용자 ${account.userId} 토큰 만료 - 스킵`)
        results.skipped++
        continue
      }

      try {
        console.log(`[Sync Cron] 사용자 ${account.userId} 동기화 시작`)

        // 1. 캠페인 동기화
        const campaignResult = await syncCampaignsUseCase.execute({
          userId: account.userId,
        })

        // 2. KPI 인사이트 동기화 (크론은 최근 7일만)
        const insightsResult = await syncInsightsUseCase.execute({
          userId: account.userId,
          datePreset: 'last_7d',
          includeTodayData: true,
        })

        // 3. 인메모리 KPI 캐시 무효화
        invalidateCache(getUserPattern(account.userId))

        results.processed++
        results.totalCampaignsSynced += campaignResult.total
        results.totalInsightsSynced += insightsResult.synced

        console.log(
          `[Sync Cron] 사용자 ${account.userId} 완료: 캠페인 ${campaignResult.total}개, KPI ${insightsResult.synced}개`
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error(`[Sync Cron] 사용자 ${account.userId} 실패:`, message)
        results.errors.push(`User ${account.userId}: ${message}`)
      }
    }

    // ISR 캐시 무효화 (전체 1회)
    if (results.processed > 0) {
      revalidateTag('campaigns', 'default')
      revalidateTag('kpi', 'default')
    }

    console.log('[Sync Cron] 완료:', results)

    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error) {
    console.error('[Sync Cron] 치명적 오류:', error)
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
export const maxDuration = 300 // 5분 타임아웃
