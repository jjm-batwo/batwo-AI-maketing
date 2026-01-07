import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  getCampaignRepository,
  getReportRepository,
  getKPIRepository,
  getAIService,
  getEmailService,
  getReportPDFGenerator,
} from '@/lib/di/container'
import { DI_TOKENS, container } from '@/lib/di/container'
import type { IUsageLogRepository } from '@domain/repositories/IUsageLogRepository'
import { ReportSchedulerService } from '@application/services/ReportSchedulerService'

/**
 * GET /api/cron/generate-reports
 *
 * Vercel Cron Job - 매주 월요일 오전 9시(KST)에 주간 리포트 생성 및 발송
 *
 * Configuration in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/generate-reports",
 *     "schedule": "0 0 * * 1"  // Every Monday at 00:00 UTC (9:00 KST)
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all users with active campaigns and their emails
    const usersWithCampaigns = await prisma.user.findMany({
      where: {
        campaigns: {
          some: {
            status: {
              in: ['ACTIVE', 'PAUSED'],
            },
          },
        },
      },
      select: {
        id: true,
        email: true,
      },
    })

    if (usersWithCampaigns.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users with active campaigns found',
        processed: 0,
      })
    }

    // Create user email map
    const userEmailMap = new Map<string, string>()
    for (const user of usersWithCampaigns) {
      userEmailMap.set(user.id, user.email)
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
    const results = await schedulerService.runScheduledReports(userEmailMap)

    return NextResponse.json({
      success: true,
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
