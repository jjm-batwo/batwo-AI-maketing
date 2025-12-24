import { Report, ReportSection, AIInsight } from '@domain/entities/Report'
import { IReportRepository } from '@domain/repositories/IReportRepository'
import { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import { IKPIRepository } from '@domain/repositories/IKPIRepository'
import { IUsageLogRepository } from '@domain/repositories/IUsageLogRepository'
import { IAIService } from '@application/ports/IAIService'
import { DateRange } from '@domain/value-objects/DateRange'
import { GenerateReportDTO, ReportDTO, toReportDTO } from '@application/dto/report/ReportDTO'

export class UnauthorizedCampaignError extends Error {
  constructor(campaignId: string) {
    super(`Campaign ${campaignId} not found or unauthorized`)
    this.name = 'UnauthorizedCampaignError'
  }
}

export class GenerateWeeklyReportUseCase {
  constructor(
    private readonly reportRepository: IReportRepository,
    private readonly campaignRepository: ICampaignRepository,
    private readonly kpiRepository: IKPIRepository,
    private readonly aiService: IAIService,
    private readonly usageLogRepository: IUsageLogRepository
  ) {}

  async execute(dto: GenerateReportDTO): Promise<ReportDTO> {
    const startDate = new Date(dto.startDate)
    const endDate = new Date(dto.endDate)

    // Validate campaign ownership
    const campaigns = await Promise.all(
      dto.campaignIds.map((id) => this.campaignRepository.findById(id))
    )

    for (let i = 0; i < campaigns.length; i++) {
      const campaign = campaigns[i]
      if (!campaign || campaign.userId !== dto.userId) {
        throw new UnauthorizedCampaignError(dto.campaignIds[i])
      }
    }

    // Create report
    const dateRange = DateRange.create(startDate, endDate)
    let report = Report.createWeekly({
      userId: dto.userId,
      campaignIds: dto.campaignIds,
      dateRange,
    })

    // Fetch KPIs and build sections
    const campaignSummaries = []
    for (const campaign of campaigns) {
      if (!campaign) continue

      const aggregated = await this.kpiRepository.aggregateByCampaignId(
        campaign.id,
        startDate,
        endDate
      )

      const section: ReportSection = {
        title: campaign.name,
        content: `${campaign.name} 캠페인의 주간 성과 요약`,
        metrics: {
          impressions: aggregated.totalImpressions,
          clicks: aggregated.totalClicks,
          conversions: aggregated.totalConversions,
          spend: aggregated.totalSpend,
          revenue: aggregated.totalRevenue,
        },
      }

      report = report.addSection(section)

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

    // Generate AI insights
    try {
      const aiInsightResult = await this.aiService.generateReportInsights({
        reportType: 'weekly',
        campaignSummaries,
      })

      const insight: AIInsight = {
        type: 'performance',
        insight: aiInsightResult.summary,
        confidence: 0.85,
        recommendations: aiInsightResult.recommendations,
      }

      report = report.addAIInsight(insight)

      // Log AI usage
      await this.usageLogRepository.log(dto.userId, 'AI_ANALYSIS')
    } catch {
      // Continue without AI insights on failure
      console.warn('AI service failed, generating report without insights')
    }

    // Mark as generated and save
    report = report.markAsGenerated()
    const savedReport = await this.reportRepository.save(report)

    return toReportDTO(savedReport)
  }
}
