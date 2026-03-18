import { describe, it, expect, beforeEach } from 'vitest'
import { GenerateMonthlyReportUseCase } from '@application/use-cases/report/GenerateMonthlyReportUseCase'
import { MockReportRepository } from '@tests/mocks/repositories/MockReportRepository'
import { MockCampaignRepository } from '@tests/mocks/repositories/MockCampaignRepository'
import { MockKPIRepository } from '@tests/mocks/repositories/MockKPIRepository'
import { MockAIService } from '@tests/mocks/services/MockAIService'
import { MockUsageLogRepository } from '@tests/mocks/repositories/MockUsageLogRepository'
import { Campaign } from '@domain/entities/Campaign'
import { KPI } from '@domain/entities/KPI'
import { Money } from '@domain/value-objects/Money'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'

describe('GenerateMonthlyReportUseCase', () => {
  let useCase: GenerateMonthlyReportUseCase
  let reportRepository: MockReportRepository
  let campaignRepository: MockCampaignRepository
  let kpiRepository: MockKPIRepository
  let aiService: MockAIService
  let usageLogRepository: MockUsageLogRepository

  beforeEach(() => {
    reportRepository = new MockReportRepository()
    campaignRepository = new MockCampaignRepository()
    kpiRepository = new MockKPIRepository()
    aiService = new MockAIService()
    usageLogRepository = new MockUsageLogRepository()

    useCase = new GenerateMonthlyReportUseCase(
      reportRepository,
      campaignRepository,
      kpiRepository,
      aiService,
      usageLogRepository
    )
  })

  it('should create a MONTHLY type report', async () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const campaign = Campaign.create({
      userId: 'user-123',
      name: 'Monthly Test',
      objective: CampaignObjective.CONVERSIONS,
      dailyBudget: Money.create(50000, 'KRW'),
      startDate: tomorrow,
    })
    await campaignRepository.save(campaign)

    const now = new Date()
    for (let i = 0; i < 30; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const kpi = KPI.create({
        campaignId: campaign.id,
        impressions: 1000,
        clicks: 50,
        conversions: 5,
        spend: Money.create(10000, 'KRW'),
        revenue: Money.create(30000, 'KRW'),
        date,
      })
      await kpiRepository.save(kpi)
    }

    const monthAgo = new Date(now)
    monthAgo.setDate(monthAgo.getDate() - 30)

    const result = await useCase.execute({
      userId: 'user-123',
      campaignIds: [campaign.id],
      startDate: monthAgo.toISOString(),
      endDate: now.toISOString(),
    })

    expect(result.type).toBe('MONTHLY')
  })

  it('should include forecast and benchmark in AI options', () => {
    // Access protected method through type assertion
    const options = (useCase as any).getAIInsightOptions()
    expect(options.includeExtendedInsights).toBe(true)
    expect(options.includeForecast).toBe(true)
    expect(options.includeBenchmark).toBe(true)
  })

  it('should return "월간" as section label', () => {
    const label = (useCase as any).getSectionLabel()
    expect(label).toBe('월간')
  })

  it('should reject date range exceeding 35 days', async () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const campaign = Campaign.create({
      userId: 'user-123',
      name: 'Test',
      objective: CampaignObjective.CONVERSIONS,
      dailyBudget: Money.create(50000, 'KRW'),
      startDate: tomorrow,
    })
    await campaignRepository.save(campaign)

    const now = new Date()
    const twoMonthsAgo = new Date(now)
    twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60)

    await expect(
      useCase.execute({
        userId: 'user-123',
        campaignIds: [campaign.id],
        startDate: twoMonthsAgo.toISOString(),
        endDate: now.toISOString(),
      })
    ).rejects.toThrow()
  })
})
