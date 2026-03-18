import { describe, it, expect, beforeEach } from 'vitest'
import { GenerateDailyReportUseCase } from '@application/use-cases/report/GenerateDailyReportUseCase'
import { MockReportRepository } from '@tests/mocks/repositories/MockReportRepository'
import { MockCampaignRepository } from '@tests/mocks/repositories/MockCampaignRepository'
import { MockKPIRepository } from '@tests/mocks/repositories/MockKPIRepository'
import { MockAIService } from '@tests/mocks/services/MockAIService'
import { MockUsageLogRepository } from '@tests/mocks/repositories/MockUsageLogRepository'

describe('GenerateDailyReportUseCase', () => {
  let useCase: GenerateDailyReportUseCase

  beforeEach(() => {
    useCase = new GenerateDailyReportUseCase(
      new MockReportRepository(),
      new MockCampaignRepository(),
      new MockKPIRepository(),
      new MockAIService(),
      new MockUsageLogRepository()
    )
  })

  it('should return "daily" as report type name', () => {
    expect((useCase as any).getReportTypeName()).toBe('daily')
  })

  it('should return "일일" as section label', () => {
    expect((useCase as any).getSectionLabel()).toBe('일일')
  })

  it('should not include forecast or benchmark in AI options', () => {
    const options = (useCase as any).getAIInsightOptions()
    expect(options.includeExtendedInsights).toBe(true)
    expect(options.includeForecast).toBe(false)
    expect(options.includeBenchmark).toBe(false)
  })

  it('should have max 2-day date range', () => {
    expect((useCase as any).getMaxDateRangeDays()).toBe(2)
  })
})
