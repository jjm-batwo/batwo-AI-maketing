import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS, getCacheService } from '@/lib/di/container'
import { SyncCampaignsUseCase, MetaConnectionError } from '@application/use-cases/campaign/SyncCampaignsUseCase'
import { SyncAllInsightsUseCase } from '@application/use-cases/kpi/SyncAllInsightsUseCase'
import { invalidateCache, getUserPattern } from '@/lib/cache/kpiCache'
import { CacheKeys } from '@/infrastructure/cache/CacheKeys'

type DatePreset = 'today' | 'yesterday' | 'last_7d' | 'last_30d'

/**
 * POST /api/campaigns/sync
 *
 * Meta Ads 캠페인 동기화 엔드포인트
 * - 인증된 사용자만 접근 가능
 * - Meta Ad Account 연결 필요
 * - 캠페인 생성/업데이트/아카이브 수행
 * - KPI 인사이트 자동 동기화 (기본: 90일)
 */
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    // Get period from query params (default: last_30d)
    const { searchParams } = new URL(request.url)
    const periodParam = searchParams.get('period')
    const validPresets: DatePreset[] = ['today', 'yesterday', 'last_7d', 'last_30d']
    const datePreset: DatePreset = validPresets.includes(periodParam as DatePreset)
      ? (periodParam as DatePreset)
      : 'last_30d'

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
      datePreset,
      includeTodayData: true, // Always include today's data for real-time dashboard
    })

    // Invalidate both cache layers
    // 1. Legacy in-memory kpiCache
    invalidateCache(getUserPattern(user.id))
    // 2. DI CacheService (MemoryCacheService / Redis) — 대시보드 API가 실제 사용하는 캐시
    const cacheService = getCacheService()
    await cacheService.deletePattern(CacheKeys.userPattern(user.id))

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
