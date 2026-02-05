import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import { SyncCampaignsUseCase, MetaConnectionError } from '@application/use-cases/campaign/SyncCampaignsUseCase'
import { SyncAllInsightsUseCase } from '@application/use-cases/kpi/SyncAllInsightsUseCase'
import { invalidateCache, getUserPattern } from '@/lib/cache/kpiCache'

/**
 * POST /api/campaigns/sync
 *
 * Meta Ads 캠페인 동기화 엔드포인트
 * - 인증된 사용자만 접근 가능
 * - Meta Ad Account 연결 필요
 * - 캠페인 생성/업데이트/아카이브 수행
 * - KPI 인사이트 자동 동기화
 */
export async function POST() {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    // 1. Sync campaigns
    const syncCampaignsUseCase = container.resolve<SyncCampaignsUseCase>(
      DI_TOKENS.SyncCampaignsUseCase
    )
    const campaignResult = await syncCampaignsUseCase.execute({
      userId: user.id,
    })

    // 2. Sync KPI insights
    const syncInsightsUseCase = container.resolve<SyncAllInsightsUseCase>(
      DI_TOKENS.SyncAllInsightsUseCase
    )
    const insightsResult = await syncInsightsUseCase.execute({
      userId: user.id,
      datePreset: 'last_7d',
    })

    // Invalidate KPI cache
    invalidateCache(getUserPattern(user.id))

    return NextResponse.json({
      success: true,
      campaigns: {
        created: campaignResult.created,
        updated: campaignResult.updated,
        archived: campaignResult.archived,
        total: campaignResult.total,
      },
      insights: {
        synced: insightsResult.synced,
        failed: insightsResult.failed,
        total: insightsResult.total,
      },
      message: `동기화 완료: 캠페인 ${campaignResult.total}개, KPI ${insightsResult.synced}개`,
    })
  } catch (error) {
    console.error('Failed to sync:', error)

    if (error instanceof MetaConnectionError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '동기화에 실패했습니다' },
      { status: 500 }
    )
  }
}
