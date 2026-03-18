import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ReportNotificationService } from '@application/services/ReportNotificationService'
import type { IEmailService } from '@application/ports/IEmailService'
import type { INotificationSender } from '@application/ports/INotificationSender'
import type { INotificationChannelRepository } from '@domain/repositories/INotificationChannelRepository'

const mockEmailService = {
  sendReportEmail: vi.fn(),
} as unknown as IEmailService

const mockSlackSender = {
  send: vi.fn(),
} as unknown as INotificationSender

const mockChannelRepository = {
  findByUserId: vi.fn(),
} as unknown as INotificationChannelRepository

const defaultSummary = {
  totalImpressions: 1000,
  totalClicks: 50,
  totalConversions: 5,
  totalSpend: 100000,
  totalRevenue: 300000,
  overallROAS: 3.0,
  averageCTR: 5.0,
  averageCVR: 10.0,
}

describe('ReportNotificationService', () => {
  let service: ReportNotificationService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new ReportNotificationService(
      mockEmailService,
      mockSlackSender,
      mockChannelRepository
    )
  })

  it('should send email when schedule has recipients', async () => {
    vi.mocked(mockEmailService.sendReportEmail).mockResolvedValue({ success: true })
    vi.mocked(mockChannelRepository.findByUserId).mockResolvedValue([])

    const result = await service.sendReport({
      userId: 'user-1',
      recipients: ['test@example.com'],
      subject: '주간 보고서',
      reportId: 'r-1',
      reportSummary: defaultSummary,
      shareUrl: 'https://app.batwo.ai/reports/share/abc',
    })

    expect(result.emailSent).toBe(true)
    expect(mockEmailService.sendReportEmail).toHaveBeenCalled()
  })

  it('should send Slack notification when user has active Slack channel', async () => {
    vi.mocked(mockEmailService.sendReportEmail).mockResolvedValue({ success: true })
    vi.mocked(mockSlackSender.send).mockResolvedValue({ success: true })
    vi.mocked(mockChannelRepository.findByUserId).mockResolvedValue([
      {
        id: 'ch-1',
        userId: 'user-1',
        type: 'SLACK',
        config: { webhookUrl: 'https://hooks.slack.com/xxx' },
        isActive: true,
      } as any,
    ])

    const result = await service.sendReport({
      userId: 'user-1',
      recipients: ['test@example.com'],
      subject: '주간 보고서',
      reportId: 'r-1',
      reportSummary: defaultSummary,
      shareUrl: 'https://app.batwo.ai/reports/share/abc',
    })

    expect(result.slackSent).toBe(true)
    expect(mockSlackSender.send).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('보고서'),
        severity: 'INFO',
      })
    )
  })

  it('should not fail if Slack sending fails', async () => {
    vi.mocked(mockEmailService.sendReportEmail).mockResolvedValue({ success: true })
    vi.mocked(mockSlackSender.send).mockResolvedValue({ success: false, error: 'webhook error' })
    vi.mocked(mockChannelRepository.findByUserId).mockResolvedValue([
      { id: 'ch-1', userId: 'user-1', type: 'SLACK', config: { webhookUrl: 'https://hooks.slack.com/xxx' }, isActive: true } as any,
    ])

    const result = await service.sendReport({
      userId: 'user-1',
      recipients: ['test@example.com'],
      subject: '주간 보고서',
      reportId: 'r-1',
      reportSummary: defaultSummary,
      shareUrl: 'https://app.batwo.ai/reports/share/abc',
    })

    expect(result.emailSent).toBe(true)
    expect(result.slackSent).toBe(false)
    expect(result.errors).toHaveLength(1)
  })

  it('should not send Slack when no active Slack channel exists', async () => {
    vi.mocked(mockEmailService.sendReportEmail).mockResolvedValue({ success: true })
    vi.mocked(mockChannelRepository.findByUserId).mockResolvedValue([])

    const result = await service.sendReport({
      userId: 'user-1',
      recipients: ['test@example.com'],
      subject: '주간 보고서',
      reportId: 'r-1',
      reportSummary: defaultSummary,
      shareUrl: 'https://app.batwo.ai/reports/share/abc',
    })

    expect(result.emailSent).toBe(true)
    expect(result.slackSent).toBe(false)
    expect(mockSlackSender.send).not.toHaveBeenCalled()
  })
})
