import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ReportSchedulerService } from '@application/services/ReportSchedulerService'
import { MockCampaignRepository } from '@tests/mocks/repositories/MockCampaignRepository'
import { MockReportRepository } from '@tests/mocks/repositories/MockReportRepository'
import { MockKPIRepository } from '@tests/mocks/repositories/MockKPIRepository'
import { MockAIService } from '@tests/mocks/services/MockAIService'
import { MockUsageLogRepository } from '@tests/mocks/repositories/MockUsageLogRepository'
import { Campaign } from '@domain/entities/Campaign'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import { Money } from '@domain/value-objects/Money'
import type { IEmailService } from '@application/ports/IEmailService'
import type { IReportPDFGenerator } from '@infrastructure/pdf/ReportPDFGenerator'

describe('ReportSchedulerService', () => {
  let service: ReportSchedulerService
  let mockCampaignRepo: MockCampaignRepository
  let mockReportRepo: MockReportRepository
  let mockKPIRepo: MockKPIRepository
  let mockAIService: MockAIService
  let mockUsageLogRepo: MockUsageLogRepository
  let mockEmailService: IEmailService
  let mockPDFGenerator: IReportPDFGenerator

  beforeEach(() => {
    mockCampaignRepo = new MockCampaignRepository()
    mockReportRepo = new MockReportRepository()
    mockKPIRepo = new MockKPIRepository()
    mockAIService = new MockAIService()
    mockUsageLogRepo = new MockUsageLogRepository()

    mockEmailService = {
      sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'msg_123' }),
      sendWeeklyReportEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'msg_456' }),
    }

    mockPDFGenerator = {
      generateWeeklyReport: vi.fn().mockResolvedValue({
        buffer: Buffer.from('pdf content'),
        filename: 'report.pdf',
        contentType: 'application/pdf',
      }),
    }

    service = new ReportSchedulerService(
      mockCampaignRepo,
      mockReportRepo,
      mockKPIRepo,
      mockAIService,
      mockUsageLogRepo,
      mockEmailService,
      mockPDFGenerator
    )
  })

  const createMockCampaign = (overrides: { userId?: string; status?: CampaignStatus } = {}) => {
    const now = new Date()
    const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

    return Campaign.restore({
      id: crypto.randomUUID(),
      userId: overrides.userId ?? 'user-1',
      name: 'Test Campaign',
      objective: CampaignObjective.TRAFFIC,
      status: overrides.status ?? CampaignStatus.ACTIVE,
      dailyBudget: Money.create(100000, 'KRW'),
      startDate: futureDate,
      createdAt: now,
      updatedAt: now,
    })
  }

  describe('getUsersWithActiveCampaigns', () => {
    it('should return unique user IDs with active campaigns', async () => {
      const campaign1 = createMockCampaign({ userId: 'user-1', status: CampaignStatus.ACTIVE })
      const campaign2 = createMockCampaign({ userId: 'user-2', status: CampaignStatus.ACTIVE })
      const campaign3 = createMockCampaign({ userId: 'user-1', status: CampaignStatus.ACTIVE }) // Duplicate user

      await mockCampaignRepo.save(campaign1)
      await mockCampaignRepo.save(campaign2)
      await mockCampaignRepo.save(campaign3)

      const userIds = await service.getUsersWithActiveCampaigns()

      expect(userIds).toHaveLength(2)
      expect(userIds).toContain('user-1')
      expect(userIds).toContain('user-2')
    })

    it('should return empty array when no active campaigns exist', async () => {
      // Draft campaign (not active)
      const campaign = createMockCampaign({ userId: 'user-1', status: CampaignStatus.DRAFT })
      await mockCampaignRepo.save(campaign)

      const userIds = await service.getUsersWithActiveCampaigns()

      expect(userIds).toHaveLength(0)
    })

    it('should include paused campaigns', async () => {
      const campaign = createMockCampaign({ userId: 'user-1', status: CampaignStatus.PAUSED })
      await mockCampaignRepo.save(campaign)

      const userIds = await service.getUsersWithActiveCampaigns()

      expect(userIds).toContain('user-1')
    })
  })

  describe('generateAndSendReportForUser', () => {
    it('should generate and send report successfully', async () => {
      const campaign = createMockCampaign({ userId: 'user-1', status: CampaignStatus.ACTIVE })
      await mockCampaignRepo.save(campaign)

      const result = await service.generateAndSendReportForUser('user-1', 'test@example.com')

      expect(result.success).toBe(true)
      expect(result.userId).toBe('user-1')
      expect(result.reportId).toBeDefined()
      expect(mockPDFGenerator.generateWeeklyReport).toHaveBeenCalled()
      expect(mockEmailService.sendWeeklyReportEmail).toHaveBeenCalled()
    })

    it('should fail when user has no active campaigns', async () => {
      const result = await service.generateAndSendReportForUser('user-1', 'test@example.com')

      expect(result.success).toBe(false)
      expect(result.error).toBe('No active campaigns found')
    })

    it('should handle email sending failure', async () => {
      const campaign = createMockCampaign({ userId: 'user-1', status: CampaignStatus.ACTIVE })
      await mockCampaignRepo.save(campaign)

      vi.mocked(mockEmailService.sendWeeklyReportEmail).mockResolvedValue({
        success: false,
        error: 'Email service unavailable',
      })

      const result = await service.generateAndSendReportForUser('user-1', 'test@example.com')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email service unavailable')
      expect(result.reportId).toBeDefined() // Report was still generated
    })

    it('should handle PDF generation errors', async () => {
      const campaign = createMockCampaign({ userId: 'user-1', status: CampaignStatus.ACTIVE })
      await mockCampaignRepo.save(campaign)

      vi.mocked(mockPDFGenerator.generateWeeklyReport).mockRejectedValue(
        new Error('PDF generation failed')
      )

      const result = await service.generateAndSendReportForUser('user-1', 'test@example.com')

      expect(result.success).toBe(false)
      expect(result.error).toBe('PDF generation failed')
    })
  })

  describe('runScheduledReports', () => {
    it('should process multiple users', async () => {
      const campaign1 = createMockCampaign({ userId: 'user-1', status: CampaignStatus.ACTIVE })
      const campaign2 = createMockCampaign({ userId: 'user-2', status: CampaignStatus.ACTIVE })

      await mockCampaignRepo.save(campaign1)
      await mockCampaignRepo.save(campaign2)

      const userEmailMap = new Map([
        ['user-1', 'user1@example.com'],
        ['user-2', 'user2@example.com'],
      ])

      const results = await service.runScheduledReports(userEmailMap)

      expect(results.totalProcessed).toBe(2)
      expect(results.successful).toBe(2)
      expect(results.failed).toBe(0)
      expect(results.results).toHaveLength(2)
    })

    it('should track failed and successful reports', async () => {
      const campaign = createMockCampaign({ userId: 'user-1', status: CampaignStatus.ACTIVE })
      await mockCampaignRepo.save(campaign)

      // User 2 has no campaigns, so it will fail
      const userEmailMap = new Map([
        ['user-1', 'user1@example.com'],
        ['user-2', 'user2@example.com'],
      ])

      const results = await service.runScheduledReports(userEmailMap)

      expect(results.totalProcessed).toBe(2)
      expect(results.successful).toBe(1)
      expect(results.failed).toBe(1)
    })

    it('should handle empty user map', async () => {
      const userEmailMap = new Map<string, string>()

      const results = await service.runScheduledReports(userEmailMap)

      expect(results.totalProcessed).toBe(0)
      expect(results.successful).toBe(0)
      expect(results.failed).toBe(0)
      expect(results.results).toHaveLength(0)
    })
  })
})
