import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Report, ReportSection, ReportType } from '@domain/entities/Report'
import { DateRange } from '@domain/value-objects/DateRange'

describe('Report', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-22T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('createWeeklyReport', () => {
    it('should create weekly report', () => {
      const report = Report.createWeekly({
        userId: 'user-123',
        campaignIds: ['campaign-1', 'campaign-2'],
        dateRange: DateRange.create(new Date('2025-01-13'), new Date('2025-01-19')),
      })

      expect(report.id).toBeDefined()
      expect(report.type).toBe(ReportType.WEEKLY)
      expect(report.userId).toBe('user-123')
      expect(report.campaignIds).toHaveLength(2)
      expect(report.sections).toHaveLength(0)
    })

    it('should throw error for empty campaign list', () => {
      expect(() =>
        Report.createWeekly({
          userId: 'user-123',
          campaignIds: [],
          dateRange: DateRange.create(new Date('2025-01-13'), new Date('2025-01-19')),
        })
      ).toThrow('At least one campaign is required for report')
    })

    it('should throw error for date range longer than 7 days for weekly', () => {
      expect(() =>
        Report.createWeekly({
          userId: 'user-123',
          campaignIds: ['campaign-1'],
          dateRange: DateRange.create(new Date('2025-01-01'), new Date('2025-01-15')),
        })
      ).toThrow('Weekly report date range must be 7 days or less')
    })
  })

  describe('addSection', () => {
    it('should add sections to report', () => {
      const report = Report.createWeekly({
        userId: 'user-123',
        campaignIds: ['campaign-1'],
        dateRange: DateRange.create(new Date('2025-01-13'), new Date('2025-01-19')),
      })

      const section: ReportSection = {
        title: 'Performance Summary',
        content: 'This week showed significant improvement...',
        metrics: {
          impressions: 50000,
          clicks: 2500,
          conversions: 250,
        },
      }

      const updatedReport = report.addSection(section)

      expect(updatedReport.sections).toHaveLength(1)
      expect(updatedReport.sections[0].title).toBe('Performance Summary')
      expect(report.sections).toHaveLength(0) // Original unchanged
    })

    it('should add multiple sections', () => {
      let report = Report.createWeekly({
        userId: 'user-123',
        campaignIds: ['campaign-1'],
        dateRange: DateRange.create(new Date('2025-01-13'), new Date('2025-01-19')),
      })

      report = report.addSection({
        title: 'Summary',
        content: 'Overview...',
      })

      report = report.addSection({
        title: 'Recommendations',
        content: 'Based on the data...',
      })

      expect(report.sections).toHaveLength(2)
    })
  })

  describe('addAIInsight', () => {
    it('should add AI insights', () => {
      const report = Report.createWeekly({
        userId: 'user-123',
        campaignIds: ['campaign-1'],
        dateRange: DateRange.create(new Date('2025-01-13'), new Date('2025-01-19')),
      })

      const updatedReport = report.addAIInsight({
        type: 'performance',
        insight: 'CTR increased by 15% compared to last week',
        confidence: 0.92,
        recommendations: ['Increase budget for high-performing ads', 'Test new creatives'],
      })

      expect(updatedReport.aiInsights).toHaveLength(1)
      expect(updatedReport.aiInsights[0].confidence).toBe(0.92)
    })

    it('should validate insight confidence range', () => {
      const report = Report.createWeekly({
        userId: 'user-123',
        campaignIds: ['campaign-1'],
        dateRange: DateRange.create(new Date('2025-01-13'), new Date('2025-01-19')),
      })

      expect(() =>
        report.addAIInsight({
          type: 'performance',
          insight: 'Some insight',
          confidence: 1.5, // Invalid confidence
          recommendations: [],
        })
      ).toThrow('Confidence must be between 0 and 1')
    })
  })

  describe('calculateSummaryMetrics', () => {
    it('should calculate summary metrics from sections', () => {
      let report = Report.createWeekly({
        userId: 'user-123',
        campaignIds: ['campaign-1', 'campaign-2'],
        dateRange: DateRange.create(new Date('2025-01-13'), new Date('2025-01-19')),
      })

      report = report.addSection({
        title: 'Campaign 1',
        content: 'Performance data',
        metrics: {
          impressions: 30000,
          clicks: 1500,
          conversions: 150,
          spend: 50000,
          revenue: 250000,
        },
      })

      report = report.addSection({
        title: 'Campaign 2',
        content: 'Performance data',
        metrics: {
          impressions: 20000,
          clicks: 1000,
          conversions: 100,
          spend: 30000,
          revenue: 150000,
        },
      })

      const summary = report.calculateSummaryMetrics()

      expect(summary.totalImpressions).toBe(50000)
      expect(summary.totalClicks).toBe(2500)
      expect(summary.totalConversions).toBe(250)
      expect(summary.totalSpend).toBe(80000)
      expect(summary.totalRevenue).toBe(400000)
      expect(summary.overallROAS).toBe(5) // 400000 / 80000
      expect(summary.averageCTR).toBeCloseTo(5) // (2500 / 50000) * 100
    })
  })

  describe('status', () => {
    it('should have DRAFT status on creation', () => {
      const report = Report.createWeekly({
        userId: 'user-123',
        campaignIds: ['campaign-1'],
        dateRange: DateRange.create(new Date('2025-01-13'), new Date('2025-01-19')),
      })

      expect(report.status).toBe('DRAFT')
    })

    it('should change status to GENERATED after processing', () => {
      const report = Report.createWeekly({
        userId: 'user-123',
        campaignIds: ['campaign-1'],
        dateRange: DateRange.create(new Date('2025-01-13'), new Date('2025-01-19')),
      })

      const generated = report.markAsGenerated()

      expect(generated.status).toBe('GENERATED')
      expect(generated.generatedAt).toBeDefined()
    })

    it('should change status to SENT after sending', () => {
      const report = Report.createWeekly({
        userId: 'user-123',
        campaignIds: ['campaign-1'],
        dateRange: DateRange.create(new Date('2025-01-13'), new Date('2025-01-19')),
      })
        .markAsGenerated()
        .markAsSent()

      expect(report.status).toBe('SENT')
      expect(report.sentAt).toBeDefined()
    })

    it('should not allow sending before generation', () => {
      const report = Report.createWeekly({
        userId: 'user-123',
        campaignIds: ['campaign-1'],
        dateRange: DateRange.create(new Date('2025-01-13'), new Date('2025-01-19')),
      })

      expect(() => report.markAsSent()).toThrow('Cannot send report that has not been generated')
    })
  })

  describe('immutability', () => {
    it('should be immutable', () => {
      const report = Report.createWeekly({
        userId: 'user-123',
        campaignIds: ['campaign-1'],
        dateRange: DateRange.create(new Date('2025-01-13'), new Date('2025-01-19')),
      })

      const withSection = report.addSection({
        title: 'Test',
        content: 'Content',
      })

      expect(report.sections).toHaveLength(0)
      expect(withSection.sections).toHaveLength(1)
    })
  })

  describe('restore', () => {
    it('should restore report from persisted data', () => {
      const report = Report.restore({
        id: 'report-123',
        type: ReportType.WEEKLY,
        userId: 'user-123',
        campaignIds: ['campaign-1'],
        dateRange: DateRange.create(new Date('2025-01-13'), new Date('2025-01-19')),
        sections: [{ title: 'Summary', content: 'Data' }],
        aiInsights: [],
        status: 'GENERATED',
        generatedAt: new Date('2025-01-20'),
        createdAt: new Date('2025-01-20'),
        updatedAt: new Date('2025-01-20'),
      })

      expect(report.id).toBe('report-123')
      expect(report.status).toBe('GENERATED')
      expect(report.sections).toHaveLength(1)
    })
  })

  describe('toJSON', () => {
    it('should serialize report to JSON', () => {
      const report = Report.createWeekly({
        userId: 'user-123',
        campaignIds: ['campaign-1', 'campaign-2'],
        dateRange: DateRange.create(new Date('2025-01-13'), new Date('2025-01-19')),
      })

      const json = report.toJSON()

      expect(json.id).toBe(report.id)
      expect(json.type).toBe(ReportType.WEEKLY)
      expect(json.userId).toBe('user-123')
      expect(json.campaignIds).toEqual(['campaign-1', 'campaign-2'])
      expect(json.sections).toHaveLength(0)
      expect(json.aiInsights).toHaveLength(0)
      expect(json.status).toBe('DRAFT')
      expect(json.createdAt).toBeDefined()
      expect(json.updatedAt).toBeDefined()
    })
  })

  describe('getters', () => {
    it('should return createdAt and updatedAt', () => {
      const report = Report.createWeekly({
        userId: 'user-123',
        campaignIds: ['campaign-1'],
        dateRange: DateRange.create(new Date('2025-01-13'), new Date('2025-01-19')),
      })

      expect(report.createdAt).toBeInstanceOf(Date)
      expect(report.updatedAt).toBeInstanceOf(Date)
    })

    it('should return undefined for generatedAt and sentAt on new report', () => {
      const report = Report.createWeekly({
        userId: 'user-123',
        campaignIds: ['campaign-1'],
        dateRange: DateRange.create(new Date('2025-01-13'), new Date('2025-01-19')),
      })

      expect(report.generatedAt).toBeUndefined()
      expect(report.sentAt).toBeUndefined()
    })
  })
})
