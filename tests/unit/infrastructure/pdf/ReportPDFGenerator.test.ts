import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ReportPDFGenerator } from '@infrastructure/pdf/ReportPDFGenerator'
import type { ReportDTO } from '@application/dto/report/ReportDTO'
import { ReportType } from '@domain/entities/Report'

// Mock @react-pdf/renderer
vi.mock('@react-pdf/renderer', () => ({
  Document: vi.fn(({ children }) => children),
  Page: vi.fn(({ children }) => children),
  Text: vi.fn(({ children }) => children),
  View: vi.fn(({ children }) => children),
  Image: vi.fn(() => null),
  StyleSheet: {
    create: vi.fn((styles) => styles),
  },
  Font: {
    register: vi.fn(),
    registerHyphenationCallback: vi.fn(),
  },
  renderToBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-pdf-content')),
}))

describe('ReportPDFGenerator', () => {
  let generator: ReportPDFGenerator
  let mockReport: ReportDTO

  beforeEach(() => {
    generator = new ReportPDFGenerator()
    mockReport = createMockReportDTO()
  })

  describe('generateWeeklyReport', () => {
    it('should generate a PDF buffer', async () => {
      const result = await generator.generateWeeklyReport(mockReport)

      expect(result.buffer).toBeInstanceOf(Buffer)
      expect(result.buffer.length).toBeGreaterThan(0)
    })

    it('should return correct content type', async () => {
      const result = await generator.generateWeeklyReport(mockReport)

      expect(result.contentType).toBe('application/pdf')
    })

    it('should generate filename with date range', async () => {
      const result = await generator.generateWeeklyReport(mockReport)

      expect(result.filename).toContain('바투_주간리포트_')
      expect(result.filename).toContain('.pdf')
      expect(result.filename).toContain('20240101')
      expect(result.filename).toContain('20240107')
    })

    it('should handle report with no sections', async () => {
      mockReport.sections = []

      const result = await generator.generateWeeklyReport(mockReport)

      expect(result.buffer).toBeInstanceOf(Buffer)
    })

    it('should handle report with no AI insights', async () => {
      mockReport.aiInsights = []

      const result = await generator.generateWeeklyReport(mockReport)

      expect(result.buffer).toBeInstanceOf(Buffer)
    })

    it('should handle report with multiple sections', async () => {
      mockReport.sections = [
        createMockSection('캠페인 1'),
        createMockSection('캠페인 2'),
        createMockSection('캠페인 3'),
      ]

      const result = await generator.generateWeeklyReport(mockReport)

      expect(result.buffer).toBeInstanceOf(Buffer)
    })

    it('should handle zero metrics gracefully', async () => {
      mockReport.summaryMetrics = {
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalSpend: 0,
        totalRevenue: 0,
        overallROAS: 0,
        averageCTR: 0,
        averageCVR: 0,
      }

      const result = await generator.generateWeeklyReport(mockReport)

      expect(result.buffer).toBeInstanceOf(Buffer)
    })
  })
})

function createMockReportDTO(): ReportDTO {
  return {
    id: 'report-123',
    type: ReportType.WEEKLY,
    userId: 'user-123',
    campaignIds: ['campaign-1', 'campaign-2'],
    dateRange: {
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: '2024-01-07T23:59:59.999Z',
    },
    sections: [createMockSection('테스트 캠페인')],
    aiInsights: [
      {
        type: 'performance',
        insight: '캠페인 성과가 전주 대비 15% 향상되었습니다.',
        confidence: 0.85,
        recommendations: [
          '현재 타겟팅 전략을 유지하세요.',
          '예산을 10% 증가시키는 것을 고려하세요.',
        ],
      },
    ],
    summaryMetrics: {
      totalImpressions: 1000000,
      totalClicks: 50000,
      totalConversions: 2500,
      totalSpend: 5000000,
      totalRevenue: 15000000,
      overallROAS: 3.0,
      averageCTR: 5.0,
      averageCVR: 5.0,
    },
    status: 'GENERATED',
    generatedAt: '2024-01-08T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-08T00:00:00.000Z',
  }
}

function createMockSection(title: string) {
  return {
    title,
    content: `${title}의 주간 성과 요약`,
    metrics: {
      impressions: 500000,
      clicks: 25000,
      conversions: 1250,
      spend: 2500000,
      revenue: 7500000,
    },
  }
}
