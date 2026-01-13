import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MetaAdsWarmupClient } from '@infrastructure/external/meta-ads/MetaAdsWarmupClient'

interface AccountResult {
  accountId: string
  businessName: string | null
  totalCalls: number
  successfulCalls: number
  failedCalls: number
  durationMs: number
  tokenValid: boolean
}

/**
 * GET /api/cron/meta-warmup
 *
 * Meta Ads API 웜업 Cron Job
 * - 앱 검수를 위한 API 호출량 증가 목적
 * - 매일 자동 실행 (Vercel Cron)
 *
 * Configuration in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/meta-warmup",
 *     "schedule": "0 3 * * *"  // Every day at 03:00 UTC (12:00 KST)
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Verify the request is from Vercel Cron or has valid secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 특정 계정만 웜업 (환경 변수로 제한)
    const targetAccountId = process.env.WARMUP_ACCOUNT_ID

    // Get MetaAdAccounts with valid tokens
    const accounts = await prisma.metaAdAccount.findMany({
      where: {
        OR: [
          { tokenExpiry: null },
          { tokenExpiry: { gt: new Date() } },
        ],
        // 특정 계정만 필터링
        ...(targetAccountId && { metaAccountId: targetAccountId }),
      },
    })

    if (targetAccountId) {
      console.log(`[Meta Warmup] Targeting specific account: ${targetAccountId}`)
    }

    if (accounts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No valid Meta Ad accounts found',
        accountsProcessed: 0,
        totalApiCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        durationMs: Date.now() - startTime,
        executedAt: new Date().toISOString(),
      })
    }

    const warmupClient = new MetaAdsWarmupClient()
    const accountResults: AccountResult[] = []

    // Process each account
    for (const account of accounts) {
      try {
        const summary = await warmupClient.runWarmupSequence(
          account.accessToken,
          account.metaAccountId,
          {
            maxCampaigns: 5,
            maxAdSets: 3,
            maxAds: 3,
          }
        )

        accountResults.push({
          accountId: account.metaAccountId,
          businessName: account.businessName,
          totalCalls: summary.totalCalls,
          successfulCalls: summary.successfulCalls,
          failedCalls: summary.failedCalls,
          durationMs: summary.durationMs,
          tokenValid: true,
        })

        console.log(
          `[Meta Warmup] Account ${account.metaAccountId}: ${summary.successfulCalls}/${summary.totalCalls} successful`
        )
      } catch (error) {
        console.error(
          `[Meta Warmup] Account ${account.metaAccountId} failed:`,
          error instanceof Error ? error.message : 'Unknown error'
        )

        accountResults.push({
          accountId: account.metaAccountId,
          businessName: account.businessName,
          totalCalls: 0,
          successfulCalls: 0,
          failedCalls: 1,
          durationMs: 0,
          tokenValid: false,
        })
      }
    }

    // Calculate totals
    const totalApiCalls = accountResults.reduce((sum, r) => sum + r.totalCalls, 0)
    const successfulCalls = accountResults.reduce((sum, r) => sum + r.successfulCalls, 0)
    const failedCalls = accountResults.reduce((sum, r) => sum + r.failedCalls, 0)

    console.log(
      `[Meta Warmup] Summary: ${accountResults.length} accounts, ${successfulCalls}/${totalApiCalls} successful calls`
    )

    return NextResponse.json({
      success: true,
      accountsProcessed: accountResults.length,
      totalApiCalls,
      successfulCalls,
      failedCalls,
      accounts: accountResults.map(r => ({
        accountId: r.accountId,
        businessName: r.businessName,
        calls: r.totalCalls,
        success: r.successfulCalls,
        tokenValid: r.tokenValid,
      })),
      durationMs: Date.now() - startTime,
      executedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Meta Warmup] Cron job failed:', error)

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}

// Vercel Cron configuration
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 1 minute timeout
