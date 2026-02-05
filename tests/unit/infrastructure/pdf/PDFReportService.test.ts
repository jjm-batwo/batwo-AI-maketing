import { describe, it, expect, beforeEach } from 'vitest'
import { PDFReportService } from '@infrastructure/pdf/PDFReportService'
import type { ReportDTO } from '@application/dto/report/ReportDTO'

describe('PDFReportService', () => {
  let service: PDFReportService
  let mockReport: ReportDTO

  beforeEach(() => {
    service = new PDFReportService()
    mockReport = {
      id: 'test-report-1',
      type: 'WEEKLY',
      userId: 'user-1',
      campaignIds: ['campaign-1', 'campaign-2'],
      dateRange: {
        startDate: '2024-01-08T00:00:00Z',
        endDate: '2024-01-14T23:59:59Z',
      },
      sections: [
        {
          title: '캠페인 A',
          content: '캠페인 A 설명',
          metrics: {
            impressions: 50000,
            clicks: 2500,
            conversions: 250,
            spend: 500000,
            revenue: 2500000,
          },
        },
        {
          title: '캠페인 B',
          content: '캠페인 B 설명',
          metrics: {
            impressions: 30000,
            clicks: 1500,
            conversions: 150,
            spend: 300000,
            revenue: 1500000,
          },
        },
      ],
      aiInsights: [
        {
          type: 'performance',
          insight: '캠페인 A가 우수한 성과를 보이고 있습니다.',
          confidence: 0.9,
          recommendations: ['예산 증액 고려', '타겟팅 확대'],
        },
      ],
      summaryMetrics: {
        totalImpressions: 80000,
        totalClicks: 4000,
        totalConversions: 400,
        totalSpend: 800000,
        totalRevenue: 4000000,
        overallROAS: 5.0,
        averageCTR: 5.0,
        averageCVR: 10.0,
      },
      status: 'GENERATED',
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
    }
  })

  describe('getAvailableTemplates', () => {
    it('should return all available templates', () => {
      const templates = service.getAvailableTemplates()

      expect(templates).toHaveLength(5)
      expect(templates.map((t) => t.type)).toEqual([
        'DAILY',
        'WEEKLY',
        'MONTHLY',
        'CAMPAIGN',
        'EXECUTIVE',
      ])
    })

    it('should include template metadata', () => {
      const templates = service.getAvailableTemplates()

      templates.forEach((template) => {
        expect(template).toHaveProperty('type')
        expect(template).toHaveProperty('name')
        expect(template).toHaveProperty('description')
        expect(template).toHaveProperty('component')
      })
    })
  })

  describe('generateReport', () => {
    it('should generate weekly report successfully', async () => {
      const result = await service.generateWeeklyReport(mockReport)

      expect(result).toHaveProperty('buffer')
      expect(result).toHaveProperty('filename')
      expect(result).toHaveProperty('contentType')
      expect(result.contentType).toBe('application/pdf')
      expect(result.buffer).toBeInstanceOf(Buffer)
    })

    it('should generate daily report successfully', async () => {
      const dailyReport: ReportDTO = {
        ...mockReport,
        type: 'DAILY',
        dateRange: {
          startDate: '2024-01-15T00:00:00Z',
          endDate: '2024-01-15T23:59:59Z',
        },
      }

      const result = await service.generateDailyReport(dailyReport)

      expect(result.buffer).toBeInstanceOf(Buffer)
      expect(result.filename).toMatch(/일간리포트/)
    })

    it('should generate monthly report successfully', async () => {
      const monthlyReport: ReportDTO = {
        ...mockReport,
        type: 'MONTHLY',
        dateRange: {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T23:59:59Z',
        },
      }

      const result = await service.generateMonthlyReport(monthlyReport)

      expect(result.buffer).toBeInstanceOf(Buffer)
      expect(result.filename).toMatch(/월간리포트/)
    })

    it('should generate campaign report successfully', async () => {
      const result = await service.generateCampaignReport(mockReport)

      expect(result.buffer).toBeInstanceOf(Buffer)
      expect(result.filename).toMatch(/캠페인리포트/)
    })

    it('should generate executive report successfully', async () => {
      const result = await service.generateExecutiveReport(mockReport)

      expect(result.buffer).toBeInstanceOf(Buffer)
      expect(result.filename).toMatch(/경영진리포트/)
    })

    it('should throw error for unknown template type', async () => {
      await expect(
        service.generateReport('UNKNOWN' as any, mockReport)
      ).rejects.toThrow('Unknown report template type')
    })
  })

  describe('generateFilename', () => {
    it('should generate correct filename for daily report', async () => {
      const dailyReport: ReportDTO = {
        ...mockReport,
        type: 'DAILY',
        dateRange: {
          startDate: '2024-01-15T00:00:00Z',
          endDate: '2024-01-15T23:59:59Z',
        },
      }

      const result = await service.generateDailyReport(dailyReport)

      expect(result.filename).toBe('바투_일간리포트_20240115.pdf')
    })

    it('should generate correct filename for weekly report', async () => {
      const result = await service.generateWeeklyReport(mockReport)

      expect(result.filename).toBe('바투_주간리포트_20240108_20240114.pdf')
    })

    it('should generate correct filename for monthly report', async () => {
      const monthlyReport: ReportDTO = {
        ...mockReport,
        type: 'MONTHLY',
        dateRange: {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T23:59:59Z',
        },
      }

      const result = await service.generateMonthlyReport(monthlyReport)

      expect(result.filename).toBe('바투_월간리포트_20240101_20240131.pdf')
    })
  })

  describe('validateReportData', () => {
    it('should validate valid report data', () => {
      const validation = service.validateReportData(mockReport)

      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should detect missing start date', () => {
      const invalidReport: ReportDTO = {
        ...mockReport,
        dateRange: {
          startDate: '',
          endDate: '2024-01-14T23:59:59Z',
        },
      }

      const validation = service.validateReportData(invalidReport)

      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('Start date is required')
    })

    it('should detect missing end date', () => {
      const invalidReport: ReportDTO = {
        ...mockReport,
        dateRange: {
          startDate: '2024-01-08T00:00:00Z',
          endDate: '',
        },
      }

      const validation = service.validateReportData(invalidReport)

      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('End date is required')
    })

    it('should detect missing sections', () => {
      const invalidReport: ReportDTO = {
        ...mockReport,
        sections: [],
      }

      const validation = service.validateReportData(invalidReport)

      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('At least one section is required')
    })

    it('should detect multiple validation errors', () => {
      const invalidReport: ReportDTO = {
        ...mockReport,
        dateRange: {
          startDate: '',
          endDate: '',
        },
        sections: [],
      }

      const validation = service.validateReportData(invalidReport)

      expect(validation.valid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(2)
    })
  })

  describe('scheduleReport', () => {
    it('should schedule report generation', async () => {
      const result = await service.scheduleReport('WEEKLY', '0 9 * * 1', 'user-1')

      expect(result.scheduled).toBe(true)
      expect(result.scheduleId).toBeDefined()
      expect(typeof result.scheduleId).toBe('string')
    })

    it('should return unique schedule IDs', async () => {
      const result1 = await service.scheduleReport('WEEKLY', '0 9 * * 1', 'user-1')
      const result2 = await service.scheduleReport('DAILY', '0 9 * * *', 'user-1')

      expect(result1.scheduleId).not.toBe(result2.scheduleId)
    })
  })
})
