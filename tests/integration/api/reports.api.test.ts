/**
 * 🔴 RED Phase: Reports API Integration Tests
 *
 * These tests verify that Report Use Cases work correctly with the database.
 * The API routes should be connected to these Use Cases (not mock data).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setupIntegrationTest, getPrismaClient, createTestUser } from '../setup'
import { PrismaReportRepository } from '@infrastructure/database/repositories/PrismaReportRepository'
import { PrismaCampaignRepository } from '@infrastructure/database/repositories/PrismaCampaignRepository'
import { PrismaKPIRepository } from '@infrastructure/database/repositories/PrismaKPIRepository'
import { PrismaUsageLogRepository } from '@infrastructure/database/repositories/PrismaUsageLogRepository'
import { GenerateWeeklyReportUseCase } from '@application/use-cases/report/GenerateWeeklyReportUseCase'
import { Report, ReportType } from '@domain/entities/Report'
import { Campaign } from '@domain/entities/Campaign'
import { KPI } from '@domain/entities/KPI'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import { Money } from '@domain/value-objects/Money'
import { DateRange } from '@domain/value-objects/DateRange'
import { toReportDTO } from '@application/dto/report/ReportDTO'
import type { IAIService } from '@application/ports/IAIService'
import { ForbiddenError } from '@application/errors'

describe('Reports API Integration', () => {
  setupIntegrationTest()

  let reportRepository: PrismaReportRepository
  let campaignRepository: PrismaCampaignRepository
  let kpiRepository: PrismaKPIRepository
  let usageLogRepository: PrismaUsageLogRepository
  let mockAIService: IAIService
  let testUserId: string

  beforeEach(async () => {
    const prisma = getPrismaClient()
    reportRepository = new PrismaReportRepository(prisma)
    campaignRepository = new PrismaCampaignRepository(prisma)
    kpiRepository = new PrismaKPIRepository(prisma)
    usageLogRepository = new PrismaUsageLogRepository(prisma)

    // Mock AI Service (avoid real API calls in tests)
    mockAIService = {
      generateReportInsights: vi.fn().mockResolvedValue({
        summary: '테스트 AI 인사이트 요약',
        recommendations: ['추천 1', '추천 2'],
      }),
      generateAdCopy: vi.fn(),
      generateCampaignOptimization: vi.fn(),
    }

    const user = await createTestUser()
    testUserId = user.id
  })

  const createTestCampaign = async (name: string) => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const campaign = Campaign.restore({
      id: crypto.randomUUID(),
      userId: testUserId,
      name,
      objective: CampaignObjective.SALES,
      status: CampaignStatus.ACTIVE,
      dailyBudget: Money.create(100000, 'KRW'),
      startDate: tomorrow,
      endDate: undefined,
      targetAudience: undefined,
      metaCampaignId: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return campaignRepository.save(campaign)
  }

  const createTestKPI = async (
    campaignId: string,
    daysAgo: number,
    data: {
      impressions: number
      clicks: number
      conversions: number
      spend: number
      revenue: number
    }
  ) => {
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    date.setHours(0, 0, 0, 0)

    const kpi = KPI.create({
      campaignId,
      impressions: data.impressions,
      clicks: data.clicks,
      conversions: data.conversions,
      spend: Money.create(data.spend, 'KRW'),
      revenue: Money.create(data.revenue, 'KRW'),
      date,
    })

    return kpiRepository.save(kpi)
  }

  const createTestReport = async (
    campaignIds: string[],
    type: ReportType = ReportType.WEEKLY,
    status: 'DRAFT' | 'GENERATED' | 'SENT' = 'GENERATED'
  ) => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)

    const report = Report.restore({
      id: crypto.randomUUID(),
      type,
      userId: testUserId,
      campaignIds,
      dateRange: DateRange.create(startDate, endDate),
      sections: [],
      aiInsights: [],
      status,
      generatedAt: status === 'GENERATED' || status === 'SENT' ? new Date() : undefined,
      sentAt: status === 'SENT' ? new Date() : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return reportRepository.save(report)
  }

  describe('Report 목록 조회 (GET /api/reports)', () => {
    it('사용자의 보고서 목록을 DB에서 반환해야 함', async () => {
      // Given: 테스트 캠페인과 보고서가 DB에 존재
      const campaign = await createTestCampaign('Test Campaign')
      await createTestReport([campaign.id])
      await createTestReport([campaign.id], ReportType.MONTHLY)

      // When: 보고서 목록 조회
      const reports = await reportRepository.findByUserId(testUserId)

      // Then: DB에 있는 보고서만 반환
      expect(reports).toHaveLength(2)
      expect(reports.map((r) => r.type)).toContain(ReportType.WEEKLY)
      expect(reports.map((r) => r.type)).toContain(ReportType.MONTHLY)
    })

    it('다른 사용자의 보고서는 반환하지 않아야 함', async () => {
      // Given: 다른 사용자의 보고서
      const otherUser = await createTestUser({ email: 'other@example.com' })
      const campaign = await createTestCampaign('My Campaign')
      await createTestReport([campaign.id])

      // 다른 사용자의 보고서 생성
      const otherCampaign = Campaign.restore({
        id: crypto.randomUUID(),
        userId: otherUser.id,
        name: 'Other User Campaign',
        objective: CampaignObjective.SALES,
        status: CampaignStatus.ACTIVE,
        dailyBudget: Money.create(100000, 'KRW'),
        startDate: new Date(),
        endDate: undefined,
        targetAudience: undefined,
        metaCampaignId: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      await campaignRepository.save(otherCampaign)

      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)

      const otherReport = Report.restore({
        id: crypto.randomUUID(),
        type: ReportType.WEEKLY,
        userId: otherUser.id,
        campaignIds: [otherCampaign.id],
        dateRange: DateRange.create(startDate, endDate),
        sections: [],
        aiInsights: [],
        status: 'GENERATED',
        generatedAt: new Date(),
        sentAt: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      await reportRepository.save(otherReport)

      // When: 내 보고서만 조회
      const reports = await reportRepository.findByUserId(testUserId)

      // Then: 내 보고서만 반환
      expect(reports).toHaveLength(1)
      expect(reports[0].userId).toBe(testUserId)
    })

    it('보고서 타입별 필터링이 동작해야 함', async () => {
      // Given: 다양한 타입의 보고서 생성
      const campaign = await createTestCampaign('Campaign for Filter')
      await createTestReport([campaign.id], ReportType.WEEKLY)
      await createTestReport([campaign.id], ReportType.WEEKLY)
      await createTestReport([campaign.id], ReportType.MONTHLY)

      // When: WEEKLY 타입만 필터링
      const reports = await reportRepository.findByFilters({
        userId: testUserId,
        type: ReportType.WEEKLY,
      })

      // Then: WEEKLY 보고서만 반환
      expect(reports).toHaveLength(2)
      expect(reports.every((r) => r.type === ReportType.WEEKLY)).toBe(true)
    })
  })

  describe('GenerateWeeklyReportUseCase (POST /api/reports)', () => {
    it('유효한 요청으로 보고서를 생성하고 DB에 저장해야 함', async () => {
      // Given: 캠페인과 KPI 데이터가 존재
      const campaign = await createTestCampaign('Campaign for Report')
      await createTestKPI(campaign.id, 1, {
        impressions: 1000,
        clicks: 100,
        conversions: 10,
        spend: 50000,
        revenue: 150000,
      })
      await createTestKPI(campaign.id, 2, {
        impressions: 2000,
        clicks: 200,
        conversions: 20,
        spend: 100000,
        revenue: 300000,
      })

      const useCase = new GenerateWeeklyReportUseCase(
        reportRepository,
        campaignRepository,
        kpiRepository,
        mockAIService,
        usageLogRepository
      )

      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)

      // When: 보고서 생성
      const result = await useCase.execute({
        userId: testUserId,
        campaignIds: [campaign.id],
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })

      // Then: 생성된 보고서 반환
      expect(result.id).toBeDefined()
      expect(result.type).toBe(ReportType.WEEKLY)
      expect(result.status).toBe('GENERATED')
      expect(result.campaignIds).toContain(campaign.id)
      expect(result.sections).toHaveLength(1)
      expect(result.sections[0].title).toBe('Campaign for Report')

      // And: DB에 실제로 저장됨
      const savedReport = await reportRepository.findById(result.id)
      expect(savedReport).not.toBeNull()
      expect(savedReport!.status).toBe('GENERATED')
    })

    it('AI 인사이트가 보고서에 포함되어야 함', async () => {
      // Given: 캠페인과 KPI 데이터
      const campaign = await createTestCampaign('AI Test Campaign')
      await createTestKPI(campaign.id, 1, {
        impressions: 1000,
        clicks: 100,
        conversions: 10,
        spend: 50000,
        revenue: 150000,
      })

      const useCase = new GenerateWeeklyReportUseCase(
        reportRepository,
        campaignRepository,
        kpiRepository,
        mockAIService,
        usageLogRepository
      )

      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)

      // When: 보고서 생성
      const result = await useCase.execute({
        userId: testUserId,
        campaignIds: [campaign.id],
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })

      // Then: AI 인사이트 포함됨
      expect(result.aiInsights).toHaveLength(1)
      expect(result.aiInsights[0].insight).toBe('테스트 AI 인사이트 요약')
      expect(result.aiInsights[0].recommendations).toContain('추천 1')
      expect(mockAIService.generateReportInsights).toHaveBeenCalled()
    })

    it('다른 사용자의 캠페인으로 보고서 생성 시 에러 발생해야 함', async () => {
      // Given: 다른 사용자의 캠페인
      const otherUser = await createTestUser({ email: 'other@example.com' })
      const otherCampaign = Campaign.restore({
        id: crypto.randomUUID(),
        userId: otherUser.id,
        name: 'Other User Campaign',
        objective: CampaignObjective.SALES,
        status: CampaignStatus.ACTIVE,
        dailyBudget: Money.create(100000, 'KRW'),
        startDate: new Date(),
        endDate: undefined,
        targetAudience: undefined,
        metaCampaignId: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      await campaignRepository.save(otherCampaign)

      const useCase = new GenerateWeeklyReportUseCase(
        reportRepository,
        campaignRepository,
        kpiRepository,
        mockAIService,
        usageLogRepository
      )

      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)

      // When/Then: 다른 사용자 캠페인으로 생성 시 에러
      await expect(
        useCase.execute({
          userId: testUserId,
          campaignIds: [otherCampaign.id],
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        })
      ).rejects.toThrow(ForbiddenError)
    })

    it('사용량 로그가 기록되어야 함', async () => {
      // Given: 캠페인 존재
      const campaign = await createTestCampaign('Log Test Campaign')
      await createTestKPI(campaign.id, 1, {
        impressions: 1000,
        clicks: 100,
        conversions: 10,
        spend: 50000,
        revenue: 150000,
      })

      const useCase = new GenerateWeeklyReportUseCase(
        reportRepository,
        campaignRepository,
        kpiRepository,
        mockAIService,
        usageLogRepository
      )

      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)

      // When: 보고서 생성
      await useCase.execute({
        userId: testUserId,
        campaignIds: [campaign.id],
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })

      // Then: AI 사용량 로그 기록됨
      const logCount = await usageLogRepository.countByPeriod(testUserId, 'AI_ANALYSIS', 'day')
      expect(logCount).toBeGreaterThan(0)
    })
  })

  describe('단일 보고서 조회 (GET /api/reports/[id])', () => {
    it('존재하는 보고서를 DB에서 조회해야 함', async () => {
      // Given: DB에 보고서 존재
      const campaign = await createTestCampaign('Single Report Campaign')
      const report = await createTestReport([campaign.id])

      // When: ID로 조회
      const found = await reportRepository.findById(report.id)

      // Then: DB 데이터 반환
      expect(found).not.toBeNull()
      expect(found!.id).toBe(report.id)
      expect(found!.userId).toBe(testUserId)
    })

    it('존재하지 않는 보고서 조회 시 null 반환해야 함', async () => {
      // When: 없는 ID로 조회
      const found = await reportRepository.findById('non-existent-id')

      // Then: null 반환
      expect(found).toBeNull()
    })

    it('보고서 DTO 변환이 정상 동작해야 함', async () => {
      // Given: 보고서 존재
      const campaign = await createTestCampaign('DTO Test Campaign')
      const report = await createTestReport([campaign.id])

      // When: DTO로 변환
      const dto = toReportDTO(report)

      // Then: 모든 필드 포함됨
      expect(dto.id).toBe(report.id)
      expect(dto.type).toBe(report.type)
      expect(dto.userId).toBe(report.userId)
      expect(dto.status).toBe(report.status)
      expect(dto.dateRange).toBeDefined()
      expect(dto.dateRange.startDate).toBeDefined()
      expect(dto.dateRange.endDate).toBeDefined()
    })
  })
})
