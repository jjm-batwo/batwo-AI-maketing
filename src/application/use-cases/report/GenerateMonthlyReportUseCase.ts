import { Report } from '@domain/entities/Report'
import { DateRange } from '@domain/value-objects/DateRange'
import { GenerateReportDTO } from '@application/dto/report/ReportDTO'
import { BaseReportGenerationUseCase } from './BaseReportGenerationUseCase'

/**
 * Generate Monthly Report Use Case
 *
 * Creates a monthly performance report (30-day period) with:
 * - Campaign performance summaries
 * - AI-generated insights and recommendations
 * - 7-day and 30-day forecasts
 * - Industry benchmark comparisons
 */
export class GenerateMonthlyReportUseCase extends BaseReportGenerationUseCase {
  protected createReport(dto: GenerateReportDTO, dateRange: DateRange): Report {
    return Report.createMonthly({
      userId: dto.userId,
      campaignIds: dto.campaignIds,
      dateRange,
    })
  }

  protected getReportTypeName(): 'monthly' {
    return 'monthly'
  }

  protected getSectionLabel(): string {
    return '월간'
  }

  protected getAIInsightOptions() {
    return {
      includeExtendedInsights: true,
      includeForecast: true,
      includeBenchmark: true, // Include benchmarks for monthly reports
    }
  }
}
