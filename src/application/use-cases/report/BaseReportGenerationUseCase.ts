import { Report, ReportSection, AIInsight } from '@domain/entities/Report'
import { IReportRepository } from '@domain/repositories/IReportRepository'
import { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import { IKPIRepository } from '@domain/repositories/IKPIRepository'
import { IUsageLogRepository } from '@domain/repositories/IUsageLogRepository'
import { IAIService } from '@application/ports/IAIService'
import { DateRange } from '@domain/value-objects/DateRange'
import { GenerateReportDTO, ReportDTO, toReportDTO } from '@application/dto/report/ReportDTO'
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  ExternalServiceError,
} from '@application/errors'

/**
 * Base class for report generation use cases.
 * Uses Template Method pattern to eliminate duplication across daily/weekly/monthly reports.
 */
export abstract class BaseReportGenerationUseCase {
  constructor(
    protected readonly reportRepository: IReportRepository,
    protected readonly campaignRepository: ICampaignRepository,
    protected readonly kpiRepository: IKPIRepository,
    protected readonly aiService: IAIService,
    protected readonly usageLogRepository: IUsageLogRepository
  ) {}

  /**
   * Main execution method - Template Method pattern.
   * Defines the skeleton of the algorithm, delegating specifics to subclasses.
   */
  async execute(dto: GenerateReportDTO): Promise<ReportDTO> {
    // Validate input
    this.validateInput(dto)

    const startDate = new Date(dto.startDate)
    const endDate = new Date(dto.endDate)

    // Step 1: Validate campaign ownership
    const campaigns = await this.validateCampaignOwnership(dto)

    // Step 2: Create report entity (delegated to subclass)
    const dateRange = DateRange.create(startDate, endDate)
    let report = this.createReport(dto, dateRange)

    // Step 3: Build campaign sections
    const campaignSummaries = await this.buildCampaignSections(
      campaigns,
      startDate,
      endDate,
      report
    )
    report = campaignSummaries.report

    // Step 4: Generate AI insights
    report = await this.generateAIInsights(report, campaignSummaries.summaries, dto.userId)

    // Step 5: Mark as generated and save
    report = report.markAsGenerated()

    try {
      const savedReport = await this.reportRepository.save(report)
      return toReportDTO(savedReport)
    } catch (error) {
      throw ExternalServiceError.database('save report', error instanceof Error ? error.message : undefined)
    }
  }

  /**
   * Validate input DTO
   */
  private validateInput(dto: GenerateReportDTO): void {
    if (!dto.userId || dto.userId.trim() === '') {
      throw ValidationError.missingField('userId')
    }

    if (!dto.campaignIds || dto.campaignIds.length === 0) {
      throw ValidationError.invalidField('campaignIds', 'at least one campaign ID is required')
    }

    if (!dto.startDate) {
      throw ValidationError.missingField('startDate')
    }

    if (!dto.endDate) {
      throw ValidationError.missingField('endDate')
    }

    const startDate = new Date(dto.startDate)
    const endDate = new Date(dto.endDate)

    if (isNaN(startDate.getTime())) {
      throw ValidationError.invalidField('startDate', 'invalid date format')
    }

    if (isNaN(endDate.getTime())) {
      throw ValidationError.invalidField('endDate', 'invalid date format')
    }

    if (startDate >= endDate) {
      throw ValidationError.businessRule(
        'Date range validation',
        'startDate must be before endDate'
      )
    }
  }

  /**
   * Validate that all campaigns belong to the requesting user.
   * Throws NotFoundError if campaign doesn't exist.
   * Throws ForbiddenError if campaign is not owned by user.
   */
  private async validateCampaignOwnership(dto: GenerateReportDTO) {
    try {
      const campaigns = await Promise.all(
        dto.campaignIds.map((id) => this.campaignRepository.findById(id))
      )

      for (let i = 0; i < campaigns.length; i++) {
        const campaign = campaigns[i]
        const campaignId = dto.campaignIds[i]

        if (!campaign) {
          throw NotFoundError.entity('Campaign', campaignId)
        }

        if (campaign.userId !== dto.userId) {
          throw ForbiddenError.resourceAccess('Campaign', campaignId)
        }
      }

      return campaigns
    } catch (error) {
      // Re-throw AppError instances
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error
      }
      // Wrap unknown errors
      throw ExternalServiceError.database('fetch campaigns', error instanceof Error ? error.message : undefined)
    }
  }

  /**
   * Build report sections from campaign KPI data.
   */
  private async buildCampaignSections(
    campaigns: (Awaited<ReturnType<ICampaignRepository['findById']>> | null)[],
    startDate: Date,
    endDate: Date,
    report: Report
  ) {
    const campaignSummaries = []
    let updatedReport = report

    try {
      for (const campaign of campaigns) {
        if (!campaign) continue

        const aggregated = await this.kpiRepository.aggregateByCampaignId(
          campaign.id,
          startDate,
          endDate
        )

        const section: ReportSection = {
          title: campaign.name,
          content: `${campaign.name} 캠페인의 ${this.getSectionLabel()} 성과 요약`,
          metrics: {
            impressions: aggregated.totalImpressions,
            clicks: aggregated.totalClicks,
            conversions: aggregated.totalConversions,
            spend: aggregated.totalSpend,
            revenue: aggregated.totalRevenue,
          },
        }

        updatedReport = updatedReport.addSection(section)

        campaignSummaries.push({
          name: campaign.name,
          objective: campaign.objective,
          metrics: {
            impressions: aggregated.totalImpressions,
            clicks: aggregated.totalClicks,
            conversions: aggregated.totalConversions,
            spend: aggregated.totalSpend,
            revenue: aggregated.totalRevenue,
          },
        })
      }

      return { report: updatedReport, summaries: campaignSummaries }
    } catch (error) {
      throw ExternalServiceError.database('aggregate KPI data', error instanceof Error ? error.message : undefined)
    }
  }

  /**
   * Generate AI insights for the report.
   * Continues without AI insights if service is unavailable (graceful degradation).
   */
  private async generateAIInsights(
    report: Report,
    campaignSummaries: Array<{
      name: string
      objective: string
      metrics: {
        impressions: number
        clicks: number
        conversions: number
        spend: number
        revenue: number
      }
    }>,
    userId: string
  ): Promise<Report> {
    try {
      const aiOptions = this.getAIInsightOptions()
      const aiInsightResult = await this.aiService.generateReportInsights({
        reportType: this.getReportTypeName(),
        campaignSummaries,
        includeExtendedInsights: aiOptions.includeExtendedInsights,
        includeForecast: aiOptions.includeForecast,
        includeBenchmark: aiOptions.includeBenchmark,
      })

      const insight: AIInsight = {
        type: 'performance',
        insight: aiInsightResult.summary,
        confidence: 0.85,
        recommendations: aiInsightResult.recommendations,
        insights: aiInsightResult.insights,
        actionItems: aiInsightResult.actionItems,
        forecast: aiInsightResult.forecast,
        benchmarkComparison: aiInsightResult.benchmarkComparison,
      }

      const updatedReport = report.addAIInsight(insight)

      // Log AI usage
      try {
        await this.usageLogRepository.log(userId, 'AI_ANALYSIS')
      } catch (logError) {
        // Don't fail report generation if usage logging fails
        console.warn('Failed to log AI usage:', logError)
      }

      return updatedReport
    } catch (error) {
      // Graceful degradation: continue without AI insights
      const serviceError = ExternalServiceError.openAI(
        'generate report insights',
        error instanceof Error ? error.message : undefined
      )

      // Log the error but don't throw - allow report generation to continue
      console.warn('AI service error (continuing without insights):', serviceError.toLogFormat())

      return report
    }
  }

  // ============================================================================
  // Abstract methods - must be implemented by subclasses
  // ============================================================================

  /**
   * Create the appropriate report entity (daily/weekly/monthly).
   */
  protected abstract createReport(dto: GenerateReportDTO, dateRange: DateRange): Report

  /**
   * Get the report type name for AI service ('daily' | 'weekly' | 'monthly').
   */
  protected abstract getReportTypeName(): 'daily' | 'weekly' | 'monthly'

  /**
   * Get the section label for campaign summaries ('일일' | '주간' | '월간').
   */
  protected abstract getSectionLabel(): string

  /**
   * Get AI insight generation options specific to this report type.
   */
  protected abstract getAIInsightOptions(): {
    includeExtendedInsights: boolean
    includeForecast: boolean
    includeBenchmark: boolean
  }
}
