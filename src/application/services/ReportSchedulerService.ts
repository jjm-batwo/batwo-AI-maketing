import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import type { IReportRepository } from '@domain/repositories/IReportRepository'
import type { IKPIRepository } from '@domain/repositories/IKPIRepository'
import type { IAIService } from '@application/ports/IAIService'
import type { IEmailService } from '@application/ports/IEmailService'
import type { IReportPDFGenerator } from '@infrastructure/pdf/ReportPDFGenerator'
import { GenerateWeeklyReportUseCase } from '@application/use-cases/report/GenerateWeeklyReportUseCase'
import type { IUsageLogRepository } from '@domain/repositories/IUsageLogRepository'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'

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
   * Generate and send weekly report for a specific user
   */
  async generateAndSendReportForUser(
    userId: string,
    recipientEmail: string
  ): Promise<ScheduledReportResult> {
    try {
      // Get user's campaigns
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

      const campaignIds = campaigns.data.map((c) => c.id)

      // Calculate date range for last week
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)

      // Generate report using existing use case
      const generateReportUseCase = new GenerateWeeklyReportUseCase(
        this.reportRepository,
        this.campaignRepository,
        this.kpiRepository,
        this.aiService,
        this.usageLogRepository
      )

      const reportDTO = await generateReportUseCase.execute({
        userId,
        campaignIds,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })

      // Generate PDF
      const { buffer, filename } = await this.pdfGenerator.generateWeeklyReport(reportDTO)

      // Send email
      const emailResult = await this.emailService.sendWeeklyReportEmail({
        to: recipientEmail,
        reportName: '바투 마케팅',
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
    userEmailMap: Map<string, string>
  ): Promise<SchedulerRunResult> {
    const results: ScheduledReportResult[] = []
    let successful = 0
    let failed = 0

    for (const [userId, email] of userEmailMap.entries()) {
      const result = await this.generateAndSendReportForUser(userId, email)
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
