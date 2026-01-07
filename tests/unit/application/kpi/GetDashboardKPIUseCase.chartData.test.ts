import { describe, it, expect, beforeEach } from 'vitest'
import { GetDashboardKPIUseCase } from '@application/use-cases/kpi/GetDashboardKPIUseCase'
import { MockCampaignRepository } from '@tests/mocks/repositories/MockCampaignRepository'
import { MockKPIRepository } from '@tests/mocks/repositories/MockKPIRepository'
import { Campaign } from '@domain/entities/Campaign'
import { KPI } from '@domain/entities/KPI'
import { Money } from '@domain/value-objects/Money'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'

describe('GetDashboardKPIUseCase - chartData', () => {
  let useCase: GetDashboardKPIUseCase
  let campaignRepository: MockCampaignRepository
  let kpiRepository: MockKPIRepository

  beforeEach(() => {
    campaignRepository = new MockCampaignRepository()
    kpiRepository = new MockKPIRepository()
    useCase = new GetDashboardKPIUseCase(campaignRepository, kpiRepository)
  })

  const createTestCampaign = (userId: string, name: string): Campaign => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    return Campaign.create({
      userId,
      name,
      objective: CampaignObjective.CONVERSIONS,
      dailyBudget: Money.create(50000, 'KRW'),
      startDate: tomorrow,
    })
  }

  const createTestKPI = (
    campaignId: string,
    date: Date,
    overrides: Partial<{
      impressions: number
      clicks: number
      conversions: number
      spend: number
      revenue: number
    }> = {}
  ): KPI => {
    return KPI.create({
      campaignId,
      impressions: overrides.impressions ?? 1000,
      clicks: overrides.clicks ?? 100,
      conversions: overrides.conversions ?? 10,
      spend: Money.create(overrides.spend ?? 50000, 'KRW'),
      revenue: Money.create(overrides.revenue ?? 200000, 'KRW'),
      date,
    })
  }

  // Helper to create dates within last 7 days for testing
  const getDaysAgo = (days: number): Date => {
    const date = new Date()
    date.setDate(date.getDate() - days)
    date.setHours(12, 0, 0, 0) // Set to noon to avoid timezone issues
    return date
  }

  describe('includeChartData option', () => {
    it('should return chartData when includeChartData is true', async () => {
      // Arrange
      const campaign = createTestCampaign('user-123', 'Test Campaign')
      await campaignRepository.save(campaign)

      // Create KPIs for the last 3 days
      await kpiRepository.save(createTestKPI(campaign.id, getDaysAgo(3)))
      await kpiRepository.save(createTestKPI(campaign.id, getDaysAgo(2)))
      await kpiRepository.save(createTestKPI(campaign.id, getDaysAgo(1)))

      // Act
      const result = await useCase.execute({
        userId: 'user-123',
        dateRange: 'last_7d',
        includeChartData: true,
      })

      // Assert
      expect(result.chartData).toBeDefined()
      expect(Array.isArray(result.chartData)).toBe(true)
      expect(result.chartData!.length).toBeGreaterThan(0)
    })

    it('should not return chartData when includeChartData is false or undefined', async () => {
      // Arrange
      const campaign = createTestCampaign('user-123', 'Test Campaign')
      await campaignRepository.save(campaign)
      await kpiRepository.save(createTestKPI(campaign.id, getDaysAgo(1)))

      // Act
      const result = await useCase.execute({
        userId: 'user-123',
        dateRange: 'last_7d',
        // includeChartData not provided
      })

      // Assert
      expect(result.chartData).toBeUndefined()
    })
  })

  describe('chartData structure', () => {
    it('should return chartData with correct structure', async () => {
      // Arrange
      const campaign = createTestCampaign('user-123', 'Test Campaign')
      await campaignRepository.save(campaign)

      await kpiRepository.save(
        createTestKPI(campaign.id, getDaysAgo(1), {
          impressions: 5000,
          clicks: 250,
          conversions: 25,
          spend: 100000,
          revenue: 400000,
        })
      )

      // Act
      const result = await useCase.execute({
        userId: 'user-123',
        dateRange: 'last_7d',
        includeChartData: true,
      })

      // Assert
      expect(result.chartData).toBeDefined()
      expect(result.chartData!.length).toBeGreaterThan(0)

      const dataPoint = result.chartData![0]
      expect(dataPoint).toHaveProperty('date')
      expect(dataPoint).toHaveProperty('spend')
      expect(dataPoint).toHaveProperty('revenue')
      expect(dataPoint).toHaveProperty('roas')
      expect(dataPoint).toHaveProperty('impressions')
      expect(dataPoint).toHaveProperty('clicks')
      expect(dataPoint).toHaveProperty('conversions')
    })

    it('should return date as YYYY-MM-DD string format', async () => {
      // Arrange
      const campaign = createTestCampaign('user-123', 'Test Campaign')
      await campaignRepository.save(campaign)
      await kpiRepository.save(createTestKPI(campaign.id, getDaysAgo(1)))

      // Act
      const result = await useCase.execute({
        userId: 'user-123',
        dateRange: 'last_7d',
        includeChartData: true,
      })

      // Assert
      expect(result.chartData![0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('ROAS calculation', () => {
    it('should calculate ROAS correctly (revenue / spend)', async () => {
      // Arrange
      const campaign = createTestCampaign('user-123', 'Test Campaign')
      await campaignRepository.save(campaign)

      // spend = 100000, revenue = 400000
      // ROAS = 400000 / 100000 = 4.0
      await kpiRepository.save(
        createTestKPI(campaign.id, getDaysAgo(1), {
          spend: 100000,
          revenue: 400000,
        })
      )

      // Act
      const result = await useCase.execute({
        userId: 'user-123',
        dateRange: 'last_7d',
        includeChartData: true,
      })

      // Assert
      expect(result.chartData![0].roas).toBe(4)
    })

    it('should return ROAS 0 when spend is 0', async () => {
      // Arrange
      const campaign = createTestCampaign('user-123', 'Test Campaign')
      await campaignRepository.save(campaign)

      await kpiRepository.save(
        createTestKPI(campaign.id, getDaysAgo(1), {
          spend: 0,
          revenue: 100000,
        })
      )

      // Act
      const result = await useCase.execute({
        userId: 'user-123',
        dateRange: 'last_7d',
        includeChartData: true,
      })

      // Assert
      expect(result.chartData![0].roas).toBe(0)
    })
  })

  describe('data aggregation', () => {
    it('should aggregate data from multiple campaigns on the same day', async () => {
      // Arrange
      const campaign1 = createTestCampaign('user-123', 'Campaign 1')
      const campaign2 = createTestCampaign('user-123', 'Campaign 2')
      await campaignRepository.save(campaign1)
      await campaignRepository.save(campaign2)

      const yesterday = getDaysAgo(1)

      await kpiRepository.save(
        createTestKPI(campaign1.id, yesterday, {
          impressions: 1000,
          spend: 50000,
          revenue: 200000,
        })
      )
      await kpiRepository.save(
        createTestKPI(campaign2.id, yesterday, {
          impressions: 2000,
          spend: 100000,
          revenue: 400000,
        })
      )

      // Act
      const result = await useCase.execute({
        userId: 'user-123',
        dateRange: 'last_7d',
        includeChartData: true,
      })

      // Assert
      expect(result.chartData!.length).toBeGreaterThanOrEqual(1)
      const dataPoint = result.chartData!.find(
        (d) => d.date === yesterday.toISOString().split('T')[0]
      )
      expect(dataPoint).toBeDefined()
      expect(dataPoint!.impressions).toBe(3000) // 1000 + 2000
      expect(dataPoint!.spend).toBe(150000) // 50000 + 100000
      expect(dataPoint!.revenue).toBe(600000) // 200000 + 400000
    })

    it('should sort chartData by date ascending', async () => {
      // Arrange
      const campaign = createTestCampaign('user-123', 'Test Campaign')
      await campaignRepository.save(campaign)

      await kpiRepository.save(createTestKPI(campaign.id, getDaysAgo(1)))
      await kpiRepository.save(createTestKPI(campaign.id, getDaysAgo(3)))
      await kpiRepository.save(createTestKPI(campaign.id, getDaysAgo(2)))

      // Act
      const result = await useCase.execute({
        userId: 'user-123',
        dateRange: 'last_7d',
        includeChartData: true,
      })

      // Assert
      const dates = result.chartData!.map((d) => d.date)
      const sortedDates = [...dates].sort()
      expect(dates).toEqual(sortedDates)
    })
  })

  describe('edge cases', () => {
    it('should return empty chartData when user has no campaigns', async () => {
      // Act
      const result = await useCase.execute({
        userId: 'user-with-no-campaigns',
        dateRange: 'last_7d',
        includeChartData: true,
      })

      // Assert
      expect(result.chartData).toEqual([])
    })

    it('should return empty chartData when no KPIs exist for date range', async () => {
      // Arrange
      const campaign = createTestCampaign('user-123', 'Test Campaign')
      await campaignRepository.save(campaign)
      // No KPIs saved

      // Act
      const result = await useCase.execute({
        userId: 'user-123',
        dateRange: 'last_7d',
        includeChartData: true,
      })

      // Assert
      expect(result.chartData).toEqual([])
    })
  })
})
