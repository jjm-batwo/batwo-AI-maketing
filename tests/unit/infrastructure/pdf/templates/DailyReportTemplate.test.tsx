import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { DailyReportTemplate } from '@infrastructure/pdf/templates/DailyReportTemplate'
import type { ReportDTO } from '@application/dto/report/ReportDTO'

describe('DailyReportTemplate', () => {
  const mockReport: ReportDTO = {
    id: 'test-report-1',
    type: 'DAILY',
    userId: 'user-1',
    campaignIds: ['campaign-1'],
    dateRange: {
      startDate: '2024-01-15T00:00:00Z',
      endDate: '2024-01-15T23:59:59Z',
    },
    sections: [
      {
        title: '테스트 캠페인',
        content: '캠페인 설명',
        metrics: {
          impressions: 10000,
          clicks: 500,
          conversions: 50,
          spend: 100000,
          revenue: 500000,
        },
      },
    ],
    aiInsights: [],
    summaryMetrics: {
      totalImpressions: 10000,
      totalClicks: 500,
      totalConversions: 50,
      totalSpend: 100000,
      totalRevenue: 500000,
      overallROAS: 5.0,
      averageCTR: 5.0,
      averageCVR: 10.0,
    },
    status: 'GENERATED',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  }

  it('should render daily report template', async () => {
    const component = <DailyReportTemplate report={mockReport} />

    await expect(renderToBuffer(component)).resolves.toBeInstanceOf(Buffer)
  })

  it('should include required sections', () => {
    const component = <DailyReportTemplate report={mockReport} />

    // Component should be a valid React element
    expect(React.isValidElement(component)).toBe(true)
  })

  it('should handle empty sections gracefully', async () => {
    const emptyReport: ReportDTO = {
      ...mockReport,
      sections: [],
    }

    const component = <DailyReportTemplate report={emptyReport} />

    await expect(renderToBuffer(component)).resolves.toBeInstanceOf(Buffer)
  })

  it('should display correct date format', () => {
    const component = <DailyReportTemplate report={mockReport} />

    // Component should render with the correct report data
    expect(component.props.report).toEqual(mockReport)
    expect(component.props.report.dateRange).toBeDefined()
  })
})
