import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import type { ReportDTO } from '@application/dto/report/ReportDTO'
import type { ReportTemplateType, PDFGenerationOptions } from './types'
import { DailyReportTemplate } from './templates/DailyReportTemplate'
import { WeeklyReportTemplate } from './templates/WeeklyReportTemplate'
import { MonthlyReportTemplate } from './templates/MonthlyReportTemplate'
import { CampaignReportTemplate } from './templates/CampaignReportTemplate'
import { ExecutiveReportTemplate } from './templates/ExecutiveReportTemplate'

// ========================================
// PDF Generation Result
// ========================================

export interface PDFGenerationResult {
  buffer: Buffer
  filename: string
  contentType: string
}

// ========================================
// Available Templates
// ========================================

export interface ReportTemplate {
  type: ReportTemplateType
  name: string
  description: string
  component: React.ComponentType<{ report: ReportDTO; options?: PDFGenerationOptions }>
}

const AVAILABLE_TEMPLATES: ReportTemplate[] = [
  {
    type: 'DAILY',
    name: '일간 성과 보고서',
    description: '일별 KPI 요약, 캠페인 성과, 전일 대비 변화',
    component: DailyReportTemplate,
  },
  {
    type: 'WEEKLY',
    name: '주간 종합 보고서',
    description: '주간 트렌드, 요일별 분석, 주요 성과',
    component: WeeklyReportTemplate,
  },
  {
    type: 'MONTHLY',
    name: '월간 분석 보고서',
    description: '월간 목표 대비 달성률, 상세 분석',
    component: MonthlyReportTemplate,
  },
  {
    type: 'CAMPAIGN',
    name: '캠페인별 상세 보고서',
    description: '단일 캠페인 상세 성과 분석',
    component: CampaignReportTemplate,
  },
  {
    type: 'EXECUTIVE',
    name: '경영진 요약 보고서',
    description: '핵심 지표만 포함한 1페이지 요약',
    component: ExecutiveReportTemplate,
  },
]

// ========================================
// PDF Report Service
// ========================================

export class PDFReportService {
  /**
   * Generate PDF report based on type
   */
  async generateReport(
    type: ReportTemplateType,
    data: ReportDTO,
    options?: PDFGenerationOptions
  ): Promise<PDFGenerationResult> {
    const template = AVAILABLE_TEMPLATES.find((t) => t.type === type)

    if (!template) {
      throw new Error(`Unknown report template type: ${type}`)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const document = React.createElement(template.component, { report: data, options }) as any
    const buffer = await renderToBuffer(document)

    const filename = this.generateFilename(type, data)

    return {
      buffer: Buffer.from(buffer),
      filename,
      contentType: 'application/pdf',
    }
  }

  /**
   * Generate daily report
   */
  async generateDailyReport(
    report: ReportDTO,
    options?: PDFGenerationOptions
  ): Promise<PDFGenerationResult> {
    return this.generateReport('DAILY', report, options)
  }

  /**
   * Generate weekly report
   */
  async generateWeeklyReport(
    report: ReportDTO,
    options?: PDFGenerationOptions
  ): Promise<PDFGenerationResult> {
    return this.generateReport('WEEKLY', report, options)
  }

  /**
   * Generate monthly report
   */
  async generateMonthlyReport(
    report: ReportDTO,
    options?: PDFGenerationOptions
  ): Promise<PDFGenerationResult> {
    return this.generateReport('MONTHLY', report, options)
  }

  /**
   * Generate campaign report
   */
  async generateCampaignReport(
    report: ReportDTO,
    options?: PDFGenerationOptions
  ): Promise<PDFGenerationResult> {
    return this.generateReport('CAMPAIGN', report, options)
  }

  /**
   * Generate executive summary report
   */
  async generateExecutiveReport(
    report: ReportDTO,
    options?: PDFGenerationOptions
  ): Promise<PDFGenerationResult> {
    return this.generateReport('EXECUTIVE', report, options)
  }

  /**
   * Get list of available templates
   */
  getAvailableTemplates(): ReportTemplate[] {
    return [...AVAILABLE_TEMPLATES]
  }

  /**
   * Schedule report generation (placeholder for future cron implementation)
   */
  async scheduleReport(
    type: ReportTemplateType,
    schedule: string,
    userId: string
  ): Promise<{ scheduled: boolean; scheduleId: string }> {
    // TODO: Implement with cron job or scheduling service
    console.log(`Scheduling ${type} report for user ${userId} with schedule: ${schedule}`)

    return {
      scheduled: true,
      scheduleId: crypto.randomUUID(),
    }
  }

  /**
   * Generate filename based on report type and date range
   */
  private generateFilename(type: ReportTemplateType, data: ReportDTO): string {
    const formatDate = (dateString: string) => {
      return new Date(dateString).toISOString().split('T')[0].replace(/-/g, '')
    }

    const startDate = formatDate(data.dateRange.startDate)
    const endDate = formatDate(data.dateRange.endDate)

    const typeMap: Record<ReportTemplateType, string> = {
      DAILY: '일간',
      WEEKLY: '주간',
      MONTHLY: '월간',
      CAMPAIGN: '캠페인',
      EXECUTIVE: '경영진',
    }

    const typeName = typeMap[type] || type

    if (type === 'DAILY') {
      return `바투_${typeName}리포트_${startDate}.pdf`
    }

    return `바투_${typeName}리포트_${startDate}_${endDate}.pdf`
  }

  /**
   * Validate report data before generation
   */
  validateReportData(data: ReportDTO): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.dateRange?.startDate) {
      errors.push('Start date is required')
    }

    if (!data.dateRange?.endDate) {
      errors.push('End date is required')
    }

    if (!data.summaryMetrics) {
      errors.push('Summary metrics are required')
    }

    if (data.sections.length === 0) {
      errors.push('At least one section is required')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}

// ========================================
// Export Singleton Instance
// ========================================

export const pdfReportService = new PDFReportService()
