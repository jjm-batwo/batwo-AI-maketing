import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EnhancedReportDataBuilder } from '@/application/services/EnhancedReportDataBuilder'
import { CreativeFatigueService } from '@/application/services/CreativeFatigueService'
import { FunnelClassificationService } from '@/application/services/FunnelClassificationService'
import type { IKPIRepository } from '@domain/repositories/IKPIRepository'
import type { IAdKPIRepository } from '@domain/repositories/IAdKPIRepository'
import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import type { IAIService } from '@application/ports/IAIService'

const mockKPIRepository = {} as unknown as IKPIRepository

const mockAdKPIRepository = {
  getDailyAggregatesByCampaignIds: vi.fn(),
  getTopCreatives: vi.fn(),
  aggregateByFormat: vi.fn(),
  aggregateByCampaignIds: vi.fn(),
} as unknown as IAdKPIRepository

const mockCampaignRepository = {} as unknown as ICampaignRepository

const mockAIService = {
  generateReportInsights: vi.fn(),
} as unknown as IAIService

const setupDefaultMocks = () => {
  vi.mocked(mockAdKPIRepository.getDailyAggregatesByCampaignIds).mockResolvedValue([])
  vi.mocked(mockAdKPIRepository.getTopCreatives).mockResolvedValue([])
  vi.mocked(mockAdKPIRepository.aggregateByFormat).mockResolvedValue([])
  vi.mocked(mockAdKPIRepository.aggregateByCampaignIds).mockResolvedValue([])
  vi.mocked(mockAIService.generateReportInsights).mockResolvedValue({
    title: '',
    summary: '',
    keyMetrics: [],
    recommendations: [],
    insights: [],
    actionItems: [],
  })
}

describe('EnhancedReportDataBuilder', () => {
  let builder: EnhancedReportDataBuilder

  beforeEach(() => {
    vi.clearAllMocks()
    builder = new EnhancedReportDataBuilder(
      mockKPIRepository,
      mockAdKPIRepository,
      mockCampaignRepository,
      new CreativeFatigueService(),
      new FunnelClassificationService(),
      mockAIService
    )
  })

  describe('build', () => {
    it('should return EnhancedReportSections with all 9 sections', async () => {
      setupDefaultMocks()
      vi.mocked(mockAIService.generateReportInsights).mockResolvedValue({
        title: '',
        summary: '분석 요약',
        keyMetrics: [],
        recommendations: [],
        insights: [],
        actionItems: [],
      })

      const result = await builder.build({
        campaignIds: ['c-1'],
        campaigns: [],
        startDate: new Date('2026-03-10'),
        endDate: new Date('2026-03-16'),
        previousStartDate: new Date('2026-03-03'),
        previousEndDate: new Date('2026-03-09'),
      })

      expect(result).toHaveProperty('overallSummary')
      expect(result).toHaveProperty('dailyTrend')
      expect(result).toHaveProperty('campaignPerformance')
      expect(result).toHaveProperty('creativePerformance')
      expect(result).toHaveProperty('creativeFatigue')
      expect(result).toHaveProperty('formatComparison')
      expect(result).toHaveProperty('funnelPerformance')
      expect(result).toHaveProperty('performanceAnalysis')
      expect(result).toHaveProperty('recommendations')
    })

    it('should calculate ChangeRate correctly (B7)', async () => {
      setupDefaultMocks()

      const result = await builder.build({
        campaignIds: [],
        campaigns: [],
        startDate: new Date('2026-03-10'),
        endDate: new Date('2026-03-16'),
        previousStartDate: new Date('2026-03-03'),
        previousEndDate: new Date('2026-03-09'),
      })

      expect(result.overallSummary.changes.spend.isPositive).toBe(false)
      expect(result.overallSummary.changes.revenue.isPositive).toBe(true)
    })

    it('should handle empty campaign list gracefully', async () => {
      setupDefaultMocks()

      const result = await builder.build({
        campaignIds: [],
        campaigns: [],
        startDate: new Date('2026-03-10'),
        endDate: new Date('2026-03-16'),
        previousStartDate: new Date('2026-03-03'),
        previousEndDate: new Date('2026-03-09'),
      })

      expect(result.overallSummary.totalSpend).toBe(0)
      expect(result.dailyTrend.days).toEqual([])
      expect(result.campaignPerformance.campaigns).toEqual([])
    })

    it('should run DB queries in parallel for performance (B5)', async () => {
      setupDefaultMocks()

      await builder.build({
        campaignIds: ['c-1'],
        campaigns: [],
        startDate: new Date('2026-03-10'),
        endDate: new Date('2026-03-16'),
        previousStartDate: new Date('2026-03-03'),
        previousEndDate: new Date('2026-03-09'),
      })

      expect(mockAdKPIRepository.getDailyAggregatesByCampaignIds).toHaveBeenCalled()
      expect(mockAdKPIRepository.getTopCreatives).toHaveBeenCalled()
      expect(mockAdKPIRepository.aggregateByFormat).toHaveBeenCalled()
      expect(mockAdKPIRepository.aggregateByCampaignIds).toHaveBeenCalled()
    })

    it('should retry AI service once on failure before falling back', async () => {
      setupDefaultMocks()
      vi.mocked(mockAIService.generateReportInsights)
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({
          title: '', summary: 'Retry succeeded',
          keyMetrics: [], recommendations: [],
          insights: [], actionItems: [],
        })

      const result = await builder.build({
        campaignIds: [],
        campaigns: [],
        startDate: new Date('2026-03-10'),
        endDate: new Date('2026-03-16'),
        previousStartDate: new Date('2026-03-03'),
        previousEndDate: new Date('2026-03-09'),
      })

      expect(mockAIService.generateReportInsights).toHaveBeenCalledTimes(2)
      expect(result.performanceAnalysis.summary).toBe('Retry succeeded')
    })

    it('should fallback gracefully after retry exhaustion', async () => {
      setupDefaultMocks()
      vi.mocked(mockAIService.generateReportInsights)
        .mockRejectedValue(new Error('Persistent failure'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await builder.build({
        campaignIds: [],
        campaigns: [],
        startDate: new Date('2026-03-10'),
        endDate: new Date('2026-03-16'),
        previousStartDate: new Date('2026-03-03'),
        previousEndDate: new Date('2026-03-09'),
      })

      expect(result.performanceAnalysis.summary).toContain('사용할 수 없습니다')
      expect(result.recommendations.actions).toEqual([])
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[EnhancedReportDataBuilder]'),
        expect.any(Error)
      )
      consoleSpy.mockRestore()
    })

    it('should populate campaign metrics from AdKPISnapshot aggregates', async () => {
      setupDefaultMocks()
      vi.mocked(mockAdKPIRepository.aggregateByCampaignIds).mockResolvedValue([
        {
          campaignId: 'c-1',
          totalImpressions: 10000,
          totalClicks: 500,
          totalConversions: 50,
          totalSpend: 200000,
          totalRevenue: 600000,
        },
      ])

      const result = await builder.build({
        campaignIds: ['c-1'],
        campaigns: [{
          id: 'c-1',
          name: 'Test Campaign',
          objective: 'CONVERSIONS',
          status: 'ACTIVE',
        }],
        startDate: new Date('2026-03-10'),
        endDate: new Date('2026-03-16'),
        previousStartDate: new Date('2026-03-03'),
        previousEndDate: new Date('2026-03-09'),
      })

      const campaign = result.campaignPerformance.campaigns[0]
      expect(campaign.impressions).toBe(10000)
      expect(campaign.clicks).toBe(500)
      expect(campaign.conversions).toBe(50)
      expect(campaign.spend).toBe(200000)
      expect(campaign.revenue).toBe(600000)
      expect(campaign.roas).toBeCloseTo(3.0)
      expect(campaign.ctr).toBeCloseTo(5.0)
    })

    it('should populate funnel stage spend from AdKPISnapshot aggregates', async () => {
      setupDefaultMocks()
      vi.mocked(mockAdKPIRepository.aggregateByCampaignIds).mockResolvedValue([
        { campaignId: 'c-1', totalImpressions: 5000, totalClicks: 250, totalConversions: 25, totalSpend: 100000, totalRevenue: 300000 },
        { campaignId: 'c-2', totalImpressions: 8000, totalClicks: 400, totalConversions: 10, totalSpend: 50000, totalRevenue: 20000 },
      ])

      const result = await builder.build({
        campaignIds: ['c-1', 'c-2'],
        campaigns: [
          { id: 'c-1', name: 'Conversion Campaign', objective: 'CONVERSIONS', status: 'ACTIVE' },
          { id: 'c-2', name: 'Awareness Campaign', objective: 'BRAND_AWARENESS', status: 'ACTIVE' },
        ],
        startDate: new Date('2026-03-10'),
        endDate: new Date('2026-03-16'),
        previousStartDate: new Date('2026-03-03'),
        previousEndDate: new Date('2026-03-09'),
      })

      const totalSpend = result.funnelPerformance.stages.reduce((sum, s) => sum + s.spend, 0)
      expect(totalSpend).toBe(150000)
      expect(result.funnelPerformance.totalBudget).toBe(150000)
    })
  })
})
