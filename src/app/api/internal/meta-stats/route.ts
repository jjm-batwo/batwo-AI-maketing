import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MetaApiLogRepository } from '@/infrastructure/external/meta-ads/MetaApiLogRepository'

// 내부 API 인증 확인
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true
  }

  if (process.env.NODE_ENV === 'development') {
    return true
  }

  return false
}

/**
 * GET /api/internal/meta-stats
 *
 * Meta Ads API 호출 통계 조회
 * - 최근 15일간 호출 통계
 * - 앱 검수 통과 여부 확인
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const logRepository = new MetaApiLogRepository(prisma)

    // 기간 파라미터 (기본 15일)
    const url = new URL(request.url)
    const days = parseInt(url.searchParams.get('days') || '15', 10)

    // 통계 조회
    const stats = await logRepository.getStats(days)

    // 검수 상태 확인
    const reviewStatus = await logRepository.checkAppReviewStatus()

    // 일일 목표 대비 현황
    const dailyTarget = 100 // 최소 목표: 1,500회 / 15일
    const todayStats = stats.dailyBreakdown.find(
      (d) => d.date === new Date().toISOString().split('T')[0]
    )

    return NextResponse.json({
      period: {
        days,
        startDate: stats.dailyBreakdown[0]?.date || null,
        endDate: stats.dailyBreakdown[stats.dailyBreakdown.length - 1]?.date || null,
      },
      summary: {
        totalCalls: stats.totalCalls,
        successCalls: stats.successCalls,
        errorCalls: stats.errorCalls,
        errorRate: `${stats.errorRate.toFixed(2)}%`,
        avgLatencyMs: stats.avgLatencyMs,
      },
      targets: {
        required: {
          totalCalls: 1500,
          maxErrorRate: '15%',
        },
        current: {
          totalCalls: stats.totalCalls,
          errorRate: `${stats.errorRate.toFixed(2)}%`,
        },
        progress: {
          callsPercent: Math.min(100, (stats.totalCalls / 1500) * 100).toFixed(1),
          errorRateOk: stats.errorRate < 15,
        },
      },
      today: todayStats
        ? {
            calls: todayStats.calls,
            errors: todayStats.errors,
            errorRate: `${todayStats.errorRate.toFixed(2)}%`,
            targetCalls: dailyTarget,
            onTrack: todayStats.calls >= dailyTarget,
          }
        : null,
      callsByEndpoint: stats.callsByEndpoint,
      dailyBreakdown: stats.dailyBreakdown,
      appReviewStatus: reviewStatus,
    })
  } catch (error) {
    console.error('[meta-stats] Error:', error)

    return NextResponse.json(
      {
        error: 'Failed to get stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/internal/meta-stats
 *
 * 오래된 로그 정리 (30일 이상)
 */
export async function DELETE(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const logRepository = new MetaApiLogRepository(prisma)

    const url = new URL(request.url)
    const olderThanDays = parseInt(url.searchParams.get('olderThanDays') || '30', 10)

    const deletedCount = await logRepository.cleanupOldLogs(olderThanDays)

    return NextResponse.json({
      success: true,
      deletedCount,
      olderThanDays,
    })
  } catch (error) {
    console.error('[meta-stats] Cleanup error:', error)

    return NextResponse.json(
      {
        error: 'Failed to cleanup logs',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
