import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import type { IReportRepository } from '@domain/repositories/IReportRepository'
import type { IKPIRepository } from '@domain/repositories/IKPIRepository'
import type { IAIService } from '@application/ports/IAIService'
import type { IEmailService } from '@application/ports/IEmailService'
import type { IReportPDFGenerator } from '@application/ports/IReportPDFGenerator'
import { GenerateWeeklyReportUseCase } from '@application/use-cases/report/GenerateWeeklyReportUseCase'
import { GenerateDailyReportUseCase } from '@application/use-cases/report/GenerateDailyReportUseCase'
import { GenerateMonthlyReportUseCase } from '@application/use-cases/report/GenerateMonthlyReportUseCase'
import type { IUsageLogRepository } from '@domain/repositories/IUsageLogRepository'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'

export type ReportType = 'daily' | 'weekly' | 'monthly'

export interface ScheduledReportResult {
  userId: string
  success: boolean
  reportId?: string
  error?: string
}

export interface SchedulerRunResult {
  totalProcessed: number
  successful: number
  failed: number
  results: ScheduledReportResult[]
}

export class ReportSchedulerService {
  constructor(
    private readonly campaignRepository: ICampaignRepository,
    private readonly reportRepository: IReportRepository,
    private readonly kpiRepository: IKPIRepository,
    private readonly aiService: IAIService,
    private readonly usageLogRepository: IUsageLogRepository,
    private readonly emailService: IEmailService,
    private readonly pdfGenerator: IReportPDFGenerator
  ) {}

  /**
   * Get unique user IDs who have active campaigns
   */
  async getUsersWithActiveCampaigns(): Promise<string[]> {
    const result = await this.campaignRepository.findByFilters({
      status: [CampaignStatus.ACTIVE, CampaignStatus.PAUSED],
    })

    // Get unique user IDs
    const userIds = [...new Set(result.data.map((c) => c.userId))]
    return userIds
  }

  /**
   * Generate and send report for a specific user
   */
  async generateAndSendReportForUser(
    userId: string,
    recipientEmail: string,
    reportType: ReportType = 'weekly',
    campaignIds?: string[]
  ): Promise<ScheduledReportResult> {
    try {
      // Get campaign IDs either from parameter or fetch from repository
      let finalCampaignIds: string[]

      if (campaignIds && campaignIds.length > 0) {
        // Use preloaded campaign IDs to avoid N+1 query
        finalCampaignIds = campaignIds
      } else {
        // Fallback: fetch campaigns if not provided
        const campaigns = await this.campaignRepository.findByFilters({
          userId,
          status: [CampaignStatus.ACTIVE, CampaignStatus.PAUSED],
        })

        if (campaigns.data.length === 0) {
          return {
            userId,
            success: false,
            error: 'No active campaigns found',
          }
        }

        finalCampaignIds = campaigns.data.map((c) => c.id)
      }

      // Calculate date range based on report type
      const endDate = new Date()
      const startDate = new Date()

      switch (reportType) {
        case 'daily':
          // Yesterday
          startDate.setDate(startDate.getDate() - 1)
          break
        case 'weekly':
          // Last 7 days
          startDate.setDate(startDate.getDate() - 7)
          break
        case 'monthly':
          // Last 30 days
          startDate.setDate(startDate.getDate() - 30)
          break
      }

      // Generate report using appropriate use case
      let reportDTO
      switch (reportType) {
        case 'daily': {
          const generateReportUseCase = new GenerateDailyReportUseCase(
            this.reportRepository,
            this.campaignRepository,
            this.kpiRepository,
            this.aiService,
            this.usageLogRepository
          )
          reportDTO = await generateReportUseCase.execute({
            userId,
            campaignIds: finalCampaignIds,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          })
          break
        }
        case 'monthly': {
          const generateReportUseCase = new GenerateMonthlyReportUseCase(
            this.reportRepository,
            this.campaignRepository,
            this.kpiRepository,
            this.aiService,
            this.usageLogRepository
          )
          reportDTO = await generateReportUseCase.execute({
            userId,
            campaignIds: finalCampaignIds,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          })
          break
        }
        case 'weekly':
        default: {
          const generateReportUseCase = new GenerateWeeklyReportUseCase(
            this.reportRepository,
            this.campaignRepository,
            this.kpiRepository,
            this.aiService,
            this.usageLogRepository
          )
          reportDTO = await generateReportUseCase.execute({
            userId,
            campaignIds: finalCampaignIds,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          })
          break
        }
      }

      // Generate PDF
      const { buffer, filename } = await this.pdfGenerator.generateWeeklyReport(reportDTO)

      // Send email
      const reportNameMap = {
        daily: '바투 일일 리포트',
        weekly: '바투 주간 리포트',
        monthly: '바투 월간 리포트',
      }

      const emailResult = await this.emailService.sendWeeklyReportEmail({
        to: recipientEmail,
        reportName: reportNameMap[reportType],
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

      if (!emailResult.success) {
        return {
          userId,
          success: false,
          reportId: reportDTO.id,
          error: emailResult.error || 'Failed to send email',
        }
      }

      return {
        userId,
        success: true,
        reportId: reportDTO.id,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return {
        userId,
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * Run scheduled report generation for all eligible users
   * This should be called by a cron job
   */
  async runScheduledReports(
    userEmailMap: Map<string, string>,
    reportType: ReportType = 'weekly',
    userCampaignsMap?: Map<string, string[]>
  ): Promise<SchedulerRunResult> {
    const results: ScheduledReportResult[] = []
    let successful = 0
    let failed = 0

    for (const [userId, email] of userEmailMap.entries()) {
      // Get preloaded campaign IDs if available
      const campaignIds = userCampaignsMap?.get(userId)
      const result = await this.generateAndSendReportForUser(userId, email, reportType, campaignIds)
      results.push(result)

      if (result.success) {
        successful++
      } else {
        failed++
      }
    }

    return {
      totalProcessed: results.length,
      successful,
      failed,
      results,
    }
  }
}
