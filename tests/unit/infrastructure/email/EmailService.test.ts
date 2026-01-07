import { describe, it, expect, vi, beforeEach } from 'vitest'

// Create mock for Resend
const mockSend = vi.fn()

vi.mock('resend', () => {
  return {
    Resend: class MockResend {
      emails = {
        send: mockSend,
      }
    },
  }
})

// Import after mock
import { EmailService } from '@infrastructure/email/EmailService'

describe('EmailService', () => {
  let emailService: EmailService

  beforeEach(() => {
    vi.clearAllMocks()
    mockSend.mockResolvedValue({
      data: { id: 'msg_123' },
      error: null,
    })
    emailService = new EmailService('test-api-key')
  })

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      })

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('msg_123')
    })

    it('should send email to multiple recipients', async () => {
      const result = await emailService.sendEmail({
        to: ['test1@example.com', 'test2@example.com'],
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      })

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['test1@example.com', 'test2@example.com'],
        })
      )
    })

    it('should send email with attachments', async () => {
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
        attachments: [
          {
            filename: 'test.pdf',
            content: Buffer.from('pdf content'),
            contentType: 'application/pdf',
          },
        ],
      })

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: [
            {
              filename: 'test.pdf',
              content: Buffer.from('pdf content'),
              contentType: 'application/pdf',
            },
          ],
        })
      )
    })

    it('should handle Resend API error', async () => {
      mockSend.mockResolvedValue({
        data: null,
        error: { message: 'API Error' },
      })

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('API Error')
    })

    it('should handle exceptions', async () => {
      mockSend.mockRejectedValue(new Error('Network error'))

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })

    it('should handle unknown errors', async () => {
      mockSend.mockRejectedValue('Unknown error')

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unknown error')
    })
  })

  describe('sendWeeklyReportEmail', () => {
    const reportParams = {
      to: 'test@example.com',
      reportName: '테스트 리포트',
      dateRange: {
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-07T23:59:59.999Z',
      },
      summaryMetrics: {
        totalImpressions: 1000000,
        totalClicks: 50000,
        totalConversions: 2500,
        totalSpend: 5000000,
        totalRevenue: 15000000,
        overallROAS: 3.0,
      },
    }

    it('should send weekly report email successfully', async () => {
      const result = await emailService.sendWeeklyReportEmail(reportParams)

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: '[바투] 테스트 리포트 주간 리포트',
        })
      )
    })

    it('should include PDF attachment when provided', async () => {
      const result = await emailService.sendWeeklyReportEmail({
        ...reportParams,
        pdfAttachment: {
          filename: 'report.pdf',
          content: Buffer.from('pdf content'),
        },
      })

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: [
            {
              filename: 'report.pdf',
              content: Buffer.from('pdf content'),
              contentType: 'application/pdf',
            },
          ],
        })
      )
    })

    it('should send to multiple recipients', async () => {
      const result = await emailService.sendWeeklyReportEmail({
        ...reportParams,
        to: ['user1@example.com', 'user2@example.com'],
      })

      expect(result.success).toBe(true)
    })

    it('should generate HTML with proper metrics', async () => {
      await emailService.sendWeeklyReportEmail(reportParams)

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('1,000,000'),
        })
      )
    })
  })

  describe('constructor', () => {
    it('should use default from email', () => {
      const service = new EmailService('test-key')
      expect(service).toBeDefined()
    })

    it('should use custom from email', () => {
      const service = new EmailService('test-key', 'custom@example.com')
      expect(service).toBeDefined()
    })
  })
})
