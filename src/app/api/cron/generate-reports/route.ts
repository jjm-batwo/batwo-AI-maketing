import { NextRequest, NextResponse } from 'next/server'
import {
  getCampaignRepository,
  getReportRepository,
  getKPIRepository,
  getAIService,
  getEmailService,
  getReportPDFGenerator,
  getUserRepository,
} from '@/lib/di/container'
import { DI_TOKENS, container } from '@/lib/di/container'
import type { IUsageLogRepository } from '@domain/repositories/IUsageLogRepository'
import { ReportSchedulerService } from '@application/services/ReportSchedulerService'
import { validateCronAuth } from '@/lib/middleware/cronAuth'

/**
 * GET /api/cron/generate-reports?type=weekly|daily|monthly
 *
 * Vercel Cron Job - 주간/일일/월간 리포트 생성 및 발송
 *
 * Query Parameters:
 * - type: 'weekly' (default) | 'daily' | 'monthly'
 *
 * Configuration in vercel.json:
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron/generate-reports?type=weekly",
 *       "schedule": "0 0 * * 1"  // Every Monday at 00:00 UTC (9:00 KST)
 *     },
 *     {
 *       "path": "/api/cron/generate-reports?type=daily",
 *       "schedule": "0 0 * * *"  // Every day at 00:00 UTC (9:00 KST)
 *     },
 *     {
 *       "path": "/api/cron/generate-reports?type=monthly",
 *       "schedule": "0 0 1 * *"  // 1st of every month at 00:00 UTC (9:00 KST)
 *     }
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authResult = validateCronAuth(request)
    if (!authResult.authorized) {
      return authResult.response
    }

    // Get report type from query params
    const { searchParams } = new URL(request.url)
    const reportType = (searchParams.get('type') || 'weekly') as 'daily' | 'weekly' | 'monthly'

    // Validate report type
    if (!['daily', 'weekly', 'monthly'].includes(reportType)) {
      return NextResponse.json(
        { message: 'Invalid report type. Must be daily, weekly, or monthly' },
        { status: 400 }
      )
    }

    // Get all users with active campaigns and their emails using repository
    const userRepository = getUserRepository()
    const usersWithCampaigns = await userRepository.findUsersWithActiveCampaigns()

    if (usersWithCampaigns.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users with active campaigns found',
        processed: 0,
      })
    }

    // Create user email map and campaigns map
    const userEmailMap = new Map<string, string>()
    const userCampaignsMap = new Map<string, string[]>()
    for (const user of usersWithCampaigns) {
      userEmailMap.set(user.id, user.email)
      userCampaignsMap.set(user.id, user.campaigns.map((c) => c.id))
    }

    // Initialize scheduler service
    const schedulerService = new ReportSchedulerService(
      getCampaignRepository(),
      getReportRepository(),
      getKPIRepository(),
      getAIService(),
      container.resolve<IUsageLogRepository>(DI_TOKENS.UsageLogRepository),
      getEmailService(),
      getReportPDFGenerator()
    )

    // Run scheduled reports
    const results = await schedulerService.runScheduledReports(userEmailMap, reportType, userCampaignsMap)

    return NextResponse.json({
      success: true,
      reportType,
      ...results,
    })
  } catch (error) {
    console.error('Cron job failed:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Vercel Cron configuration
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes timeout for cron job
