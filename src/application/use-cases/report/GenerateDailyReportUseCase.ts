import { Report } from '@domain/entities/Report'
import { DateRange } from '@domain/value-objects/DateRange'
import { GenerateReportDTO } from '@application/dto/report/ReportDTO'
import { BaseReportGenerationUseCase } from './BaseReportGenerationUseCase'

/**
 * Generate Daily Report Use Case
 *
 * Creates a daily performance report (1-day period) with:
 * - Campaign performance summaries
 * - AI-generated insights and recommendations
 * - No forecasting (insufficient data for 1-day period)
 */
export class GenerateDailyReportUseCase extends BaseReportGenerationUseCase {
  protected createReport(dto: GenerateReportDTO, dateRange: DateRange): Report {
    return Report.createDaily({
      userId: dto.userId,
      campaignIds: dto.campaignIds,
      dateRange,
    })
  }

  protected getReportTypeName(): 'daily' {
    return 'daily'
  }

  protected getSectionLabel(): string {
    return '일일'
  }

  protected getAIInsightOptions() {
    return {
      includeExtendedInsights: true,
      includeForecast: false, // No forecast for daily reports
      includeBenchmark: false,
    }
  }
}
