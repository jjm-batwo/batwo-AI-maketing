import { NextRequest, NextResponse } from 'next/server'
import { MetaAdsWarmupClient, WarmupSummary } from '@/infrastructure/external/meta-ads/MetaAdsWarmupClient'

// Vercel Cron 또는 내부 API 호출만 허용
function isAuthorized(request: NextRequest): boolean {
  // Vercel Cron에서 호출 시 헤더 확인
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true
  }

  // 개발 환경에서는 허용
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  return false
}

// DB 로깅을 위한 동적 import (DB 연결 실패 시에도 웜업은 동작)
async function tryLogToDatabase(summary: WarmupSummary, adAccountId: string): Promise<{
  logged: boolean
  reviewStatus?: {
    passed: boolean
    totalCalls: number
    errorRate: number
    requiredCalls: number
    maxErrorRate: number
    message: string
  }
  error?: string
}> {
  try {
    const { prisma } = await import('@/lib/prisma')
    const { MetaApiLogRepository } = await import('@/infrastructure/external/meta-ads/MetaApiLogRepository')

    const logRepository = new MetaApiLogRepository(prisma)

    for (const result of summary.results) {
      await logRepository.log({
        endpoint: result.endpoint,
        method: 'GET',
        statusCode: result.success ? 200 : 400,
        success: result.success,
        errorCode: result.errorCode?.toString(),
        errorMsg: result.errorMessage,
        latencyMs: result.latencyMs,
        accountId: adAccountId,
      })
    }

    const reviewStatus = await logRepository.checkAppReviewStatus()
    return { logged: true, reviewStatus }
  } catch (error) {
    console.warn('[meta-warmup] DB logging failed:', error instanceof Error ? error.message : 'Unknown error')
    return {
      logged: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function POST(request: NextRequest) {
  // 인증 확인
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // 환경 변수 확인
  const accessToken = process.env.META_ACCESS_TOKEN
  const adAccountId = process.env.META_AD_ACCOUNT_ID // batowcompany 계정

  if (!accessToken) {
    return NextResponse.json(
      { error: 'META_ACCESS_TOKEN not configured' },
      { status: 500 }
    )
  }

  if (!adAccountId) {
    return NextResponse.json(
      { error: 'META_AD_ACCOUNT_ID not configured' },
      { status: 500 }
    )
  }

  try {
    // Warmup 클라이언트 실행 (DB 없이 동작)
    const warmupClient = new MetaAdsWarmupClient()
    const summary = await warmupClient.runWarmupSequence(accessToken, adAccountId, {
      maxCampaigns: 10,
      maxAdSets: 5,
      maxAds: 5,
    })

    // 결과를 DB에 로깅 시도 (실패해도 웜업 결과는 반환)
    const dbResult = await tryLogToDatabase(summary, adAccountId)

    return NextResponse.json({
      success: true,
      summary: {
        totalCalls: summary.totalCalls,
        successfulCalls: summary.successfulCalls,
        failedCalls: summary.failedCalls,
        durationMs: summary.durationMs,
        executedAt: summary.executedAt.toISOString(),
      },
      dbLogging: {
        logged: dbResult.logged,
        error: dbResult.error,
      },
      appReviewStatus: dbResult.reviewStatus,
    })
  } catch (error) {
    console.error('[meta-warmup] Error:', error)

    return NextResponse.json(
      {
        error: 'Warmup failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET: 현재 상태만 확인 (warmup 실행 없이)
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { prisma } = await import('@/lib/prisma')
    const { MetaApiLogRepository } = await import('@/infrastructure/external/meta-ads/MetaApiLogRepository')

    const logRepository = new MetaApiLogRepository(prisma)
    const reviewStatus = await logRepository.checkAppReviewStatus()
    const stats = await logRepository.getStats(15)

    return NextResponse.json({
      appReviewStatus: reviewStatus,
      stats,
    })
  } catch (error) {
    console.error('[meta-warmup] Error:', error)

    return NextResponse.json(
      {
        error: 'Failed to get status',
        message: error instanceof Error ? error.message : 'Unknown error',
        note: 'Database connection may be unavailable. Warmup POST endpoint can still work.',
      },
      { status: 500 }
    )
  }
}
