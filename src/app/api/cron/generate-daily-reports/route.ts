import { NextRequest, NextResponse } from 'next/server'
import {
  getReportRepository,
  getKPIRepository,
  getAIService,
  getEmailService,
  getReportPDFGenerator,
  getUserRepository,
  getCampaignRepository,
} from '@/lib/di/container'
import { DI_TOKENS, container } from '@/lib/di/container'
import type { IUsageLogRepository } from '@domain/repositories/IUsageLogRepository'
import { GenerateDailyReportUseCase } from '@application/use-cases/report/GenerateDailyReportUseCase'
import { validateCronAuth } from '@/lib/middleware/cronAuth'

/**
 * GET /api/cron/generate-daily-reports
 *
 * Vercel Cron Job - 매일 오전 9시(KST)에 일일 리포트 생성 및 발송
 *
 * Configuration in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/generate-daily-reports",
 *     "schedule": "0 0 * * *"  // Every day at 00:00 UTC (9:00 KST)
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authResult = validateCronAuth(request)
    if (!authResult.authorized) {
      return authResult.response
    }

    // Get all users with active campaigns using repository
    const userRepository = getUserRepository()
    const usersWithCampaigns = await userRepository.findUsersWithActiveCampaigns()

    if (usersWithCampaigns.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users with active campaigns found',
        processed: 0,
      })
    }

    // Initialize repositories
    const reportRepository = getReportRepository()
    const kpiRepository = getKPIRepository()
    const aiService = getAIService()
    const usageLogRepository = container.resolve<IUsageLogRepository>(DI_TOKENS.UsageLogRepository)
    const emailService = getEmailService()
    const pdfGenerator = getReportPDFGenerator()

    const generateDailyReportUseCase = new GenerateDailyReportUseCase(
      reportRepository,
      getCampaignRepository(),
      kpiRepository,
      aiService,
      usageLogRepository
    )

    // Process each user
    const results = []
    let successful = 0
    let failed = 0

    for (const user of usersWithCampaigns) {
      try {
        // Use preloaded campaigns (already filtered for ACTIVE/PAUSED)
        if (user.campaigns.length === 0) {
          results.push({
            userId: user.id,
            success: false,
            error: 'No active campaigns',
          })
          failed++
          continue
        }

        const campaignIds = user.campaigns.map((c) => c.id)

        // Calculate date range for yesterday
        const endDate = new Date()
        endDate.setHours(0, 0, 0, 0) // Start of today
        const startDate = new Date(endDate)
        startDate.setDate(startDate.getDate() - 1) // Yesterday

        // Generate daily report
        const reportDTO = await generateDailyReportUseCase.execute({
          userId: user.id,
          campaignIds,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        })

        // Generate PDF (reuse weekly template for now, can customize later)
        const { buffer, filename } = await pdfGenerator.generateWeeklyReport(reportDTO)

        // Send email
        const emailResult = await emailService.sendWeeklyReportEmail({
          to: user.email,
          reportName: '바투 일일 리포트',
          dateRange: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
          summaryMetrics: {
            totalImpressions: reportDTO.summaryMetrics.totalImpressions,
            totalClicks: reportDTO.summaryMetrics.totalClicks,
            totalConversions: reportDTO.summaryMetrics.totalConversions,
            totalSpend: reportDTO.summaryMetrics.totalSpend,
            totalRevenue: reportDTO.summaryMetrics.totalRevenue,
            overallROAS: reportDTO.summaryMetrics.overallROAS,
          },
          pdfAttachment: {
            filename,
            content: buffer,
          },
        })

        if (emailResult.success) {
          results.push({
            userId: user.id,
            success: true,
            reportId: reportDTO.id,
          })
          successful++
        } else {
          results.push({
            userId: user.id,
            success: false,
            reportId: reportDTO.id,
            error: emailResult.error || 'Failed to send email',
          })
          failed++
        }
      } catch (error) {
        results.push({
          userId: user.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        failed++
      }
    }

    return NextResponse.json({
      success: true,
      reportType: 'daily',
      totalProcessed: results.length,
      successful,
      failed,
      results,
    })
  } catch (error) {
    console.error('Daily report cron job failed:', error)
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
