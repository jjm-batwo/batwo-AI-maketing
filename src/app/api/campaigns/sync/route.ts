import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import { SyncCampaignsUseCase, MetaConnectionError } from '@application/use-cases/campaign/SyncCampaignsUseCase'
import { invalidateCache, getUserPattern } from '@/lib/cache/kpiCache'

/**
 * POST /api/campaigns/sync
 *
 * Meta Ads 캠페인 동기화 엔드포인트
 * - 인증된 사용자만 접근 가능
 * - Meta Ad Account 연결 필요
 * - 캠페인 생성/업데이트/아카이브 수행
 */
export async function POST() {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const syncUseCase = container.resolve<SyncCampaignsUseCase>(
      DI_TOKENS.SyncCampaignsUseCase
    )

    const result = await syncUseCase.execute({
      userId: user.id,
    })

    // KPI 캐시 무효화
    invalidateCache(getUserPattern(user.id))

    return NextResponse.json({
      success: true,
      created: result.created,
      updated: result.updated,
      archived: result.archived,
      total: result.total,
      message: `동기화 완료: ${result.created}개 생성, ${result.updated}개 업데이트, ${result.archived}개 아카이브`,
    })
  } catch (error) {
    console.error('Failed to sync campaigns:', error)

    if (error instanceof MetaConnectionError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '캠페인 동기화에 실패했습니다' },
      { status: 500 }
    )
  }
}
