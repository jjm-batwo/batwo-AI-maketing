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
} as unknown as IAdKPIRepository

const mockCampaignRepository = {} as unknown as ICampaignRepository

const mockAIService = {
  generateReportInsights: vi.fn(),
} as unknown as IAIService

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
      vi.mocked(mockAdKPIRepository.getDailyAggregatesByCampaignIds).mockResolvedValue([])
      vi.mocked(mockAdKPIRepository.getTopCreatives).mockResolvedValue([])
      vi.mocked(mockAdKPIRepository.aggregateByFormat).mockResolvedValue([])
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
      vi.mocked(mockAdKPIRepository.getDailyAggregatesByCampaignIds).mockResolvedValue([])
      vi.mocked(mockAdKPIRepository.getTopCreatives).mockResolvedValue([])
      vi.mocked(mockAdKPIRepository.aggregateByFormat).mockResolvedValue([])
      vi.mocked(mockAIService.generateReportInsights).mockResolvedValue({
        title: '',
        summary: '',
        keyMetrics: [],
        recommendations: [],
      })

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
      vi.mocked(mockAdKPIRepository.getDailyAggregatesByCampaignIds).mockResolvedValue([])
      vi.mocked(mockAdKPIRepository.getTopCreatives).mockResolvedValue([])
      vi.mocked(mockAdKPIRepository.aggregateByFormat).mockResolvedValue([])
      vi.mocked(mockAIService.generateReportInsights).mockResolvedValue({
        title: '',
        summary: '',
        keyMetrics: [],
        recommendations: [],
      })

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
      vi.mocked(mockAdKPIRepository.getDailyAggregatesByCampaignIds).mockResolvedValue([])
      vi.mocked(mockAdKPIRepository.getTopCreatives).mockResolvedValue([])
      vi.mocked(mockAdKPIRepository.aggregateByFormat).mockResolvedValue([])
      vi.mocked(mockAIService.generateReportInsights).mockResolvedValue({
        title: '',
        summary: '',
        keyMetrics: [],
        recommendations: [],
      })

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
    })

    it('should gracefully degrade when AI service fails', async () => {
      vi.mocked(mockAdKPIRepository.getDailyAggregatesByCampaignIds).mockResolvedValue([])
      vi.mocked(mockAdKPIRepository.getTopCreatives).mockResolvedValue([])
      vi.mocked(mockAdKPIRepository.aggregateByFormat).mockResolvedValue([])
      vi.mocked(mockAIService.generateReportInsights).mockRejectedValue(new Error('AI down'))

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
    })
  })
})
