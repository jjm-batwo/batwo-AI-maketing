import { describe, it, expect, beforeEach } from 'vitest'
import { GenerateWeeklyReportUseCase } from '@application/use-cases/report/GenerateWeeklyReportUseCase'
import { MockReportRepository } from '@tests/mocks/repositories/MockReportRepository'
import { MockCampaignRepository } from '@tests/mocks/repositories/MockCampaignRepository'
import { MockKPIRepository } from '@tests/mocks/repositories/MockKPIRepository'
import { MockAIService } from '@tests/mocks/services/MockAIService'
import { MockUsageLogRepository } from '@tests/mocks/repositories/MockUsageLogRepository'
import { Campaign } from '@domain/entities/Campaign'
import { KPI } from '@domain/entities/KPI'
import { Money } from '@domain/value-objects/Money'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import { ReportType } from '@domain/entities/Report'

describe('GenerateWeeklyReportUseCase', () => {
  let useCase: GenerateWeeklyReportUseCase
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

    useCase = new GenerateWeeklyReportUseCase(
      reportRepository,
      campaignRepository,
      kpiRepository,
      aiService,
      usageLogRepository
    )
  })

  const createTestCampaign = async (userId: string, name: string): Promise<Campaign> => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const campaign = Campaign.create({
      userId,
      name,
      objective: CampaignObjective.CONVERSIONS,
      dailyBudget: Money.create(50000, 'KRW'),
      startDate: tomorrow,
    })

    await campaignRepository.save(campaign)
    return campaign
  }

  const createTestKPIs = async (campaignId: string): Promise<void> => {
    const now = new Date()
    for (let i = 0; i < 7; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)

      const kpi = KPI.create({
        campaignId,
        impressions: 1000 + i * 100,
        clicks: 50 + i * 5,
        conversions: 5 + i,
        spend: Money.create(10000 + i * 1000, 'KRW'),
        revenue: Money.create(30000 + i * 3000, 'KRW'),
        date,
      })

      await kpiRepository.save(kpi)
    }
  }

  describe('execute', () => {
    it('should generate weekly report for user campaigns', async () => {
      const campaign = await createTestCampaign('user-123', 'Test Campaign')
      await createTestKPIs(campaign.id)

      const now = new Date()
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - 7)

      const result = await useCase.execute({
        userId: 'user-123',
        campaignIds: [campaign.id],
        startDate: weekAgo.toISOString(),
        endDate: now.toISOString(),
      })

      expect(result.id).toBeDefined()
      expect(result.type).toBe(ReportType.WEEKLY)
      expect(result.campaignIds).toContain(campaign.id)
    })

    it('should include AI insights in report', async () => {
      const campaign = await createTestCampaign('user-123', 'Test Campaign')
      await createTestKPIs(campaign.id)

      const now = new Date()
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - 7)

      const result = await useCase.execute({
        userId: 'user-123',
        campaignIds: [campaign.id],
        startDate: weekAgo.toISOString(),
        endDate: now.toISOString(),
      })

      expect(result.aiInsights).toBeDefined()
      expect(result.aiInsights.length).toBeGreaterThan(0)
    })

    it('should save report to repository', async () => {
      const campaign = await createTestCampaign('user-123', 'Test Campaign')
      await createTestKPIs(campaign.id)

      const now = new Date()
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - 7)

      const result = await useCase.execute({
        userId: 'user-123',
        campaignIds: [campaign.id],
        startDate: weekAgo.toISOString(),
        endDate: now.toISOString(),
      })

      const saved = await reportRepository.findById(result.id)
      expect(saved).not.toBeNull()
    })

    it('should log AI analysis usage', async () => {
      const campaign = await createTestCampaign('user-123', 'Test Campaign')
      await createTestKPIs(campaign.id)

      const now = new Date()
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - 7)

      await useCase.execute({
        userId: 'user-123',
        campaignIds: [campaign.id],
        startDate: weekAgo.toISOString(),
        endDate: now.toISOString(),
      })

      const logs = usageLogRepository.getAll()
      expect(logs.some((log) => log.type === 'AI_ANALYSIS')).toBe(true)
    })

    it('should throw error for empty campaign list', async () => {
      const now = new Date()
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - 7)

      await expect(
        useCase.execute({
          userId: 'user-123',
          campaignIds: [],
          startDate: weekAgo.toISOString(),
          endDate: now.toISOString(),
        })
      ).rejects.toThrow()
    })

    it('should throw error if user does not own campaign', async () => {
      const campaign = await createTestCampaign('other-user', 'Test Campaign')

      const now = new Date()
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - 7)

      await expect(
        useCase.execute({
          userId: 'user-123',
          campaignIds: [campaign.id],
          startDate: weekAgo.toISOString(),
          endDate: now.toISOString(),
        })
      ).rejects.toThrow(/unauthorized|not found/i)
    })

    it('should calculate summary metrics correctly', async () => {
      const campaign = await createTestCampaign('user-123', 'Test Campaign')
      await createTestKPIs(campaign.id)

      const now = new Date()
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - 7)

      const result = await useCase.execute({
        userId: 'user-123',
        campaignIds: [campaign.id],
        startDate: weekAgo.toISOString(),
        endDate: now.toISOString(),
      })

      expect(result.summaryMetrics).toBeDefined()
      expect(result.summaryMetrics.totalImpressions).toBeGreaterThan(0)
      expect(result.summaryMetrics.totalSpend).toBeGreaterThan(0)
    })

    it('should handle AI service failure gracefully', async () => {
      const campaign = await createTestCampaign('user-123', 'Test Campaign')
      await createTestKPIs(campaign.id)
      aiService.setShouldFail(true, new Error('AI service unavailable'))

      const now = new Date()
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - 7)

      // Should still generate report without AI insights
      const result = await useCase.execute({
        userId: 'user-123',
        campaignIds: [campaign.id],
        startDate: weekAgo.toISOString(),
        endDate: now.toISOString(),
      })

      expect(result.id).toBeDefined()
      // AI insights should be empty or contain fallback
      expect(result.aiInsights.length).toBe(0)
    })
  })
})
