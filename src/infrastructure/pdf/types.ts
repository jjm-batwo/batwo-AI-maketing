import type { ReportDTO } from '@application/dto/report/ReportDTO'

// ========================================
// Common Types
// ========================================

export interface ChartData {
  label: string
  value: number
  color?: string
}

export interface TableData {
  headers: string[]
  rows: Array<Record<string, string | number>>
}

export interface ReportData extends ReportDTO {
  // Extension point for template-specific data
  [key: string]: unknown
}

export type ReportTemplateType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CAMPAIGN' | 'EXECUTIVE'

export interface TemplateSection {
  id: string
  title: string
  order: number
  required: boolean
  render: (data: ReportData) => React.ReactElement | null
}

export interface TemplateConfig {
  name: string
  type: ReportTemplateType
  description: string
  sections: TemplateSection[]
  maxPages?: number
}

// ========================================
// PDF Generation Options
// ========================================

export interface PDFGenerationOptions {
  includeCharts?: boolean
  includeBenchmarks?: boolean
  includeForecasts?: boolean
  includeActionItems?: boolean
  maxCampaigns?: number
  locale?: string
}

// ========================================
// Chart Types
// ========================================

export interface LineChartData extends ChartData {
  dataPoints: Array<{ x: string | number; y: number }>
}

export interface PieChartData extends ChartData {
  percentage: number
}

// ========================================
// Metric Display Types
// ========================================

export interface MetricDisplay {
  label: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  format?: 'number' | 'currency' | 'percentage'
}

export interface ComparisonMetric extends MetricDisplay {
  previous: string | number
  current: string | number
}

// ========================================
// Template Export
// ========================================

export interface TemplateExport {
  config: TemplateConfig
  component: React.ComponentType<{ report: ReportDTO; options?: PDFGenerationOptions }>
}
