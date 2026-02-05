// ========================================
// PDF Infrastructure Exports
// ========================================

// Legacy exports (backward compatibility)
export {
  ReportPDFGenerator,
  type IReportPDFGenerator,
  type PDFGeneratorResult,
} from './ReportPDFGenerator'

// New service exports
export {
  PDFReportService,
  pdfReportService,
  type PDFGenerationResult,
  type ReportTemplate,
} from './PDFReportService'

// Type exports
export type {
  ChartData,
  TableData,
  ReportData,
  ReportTemplateType,
  TemplateSection,
  TemplateConfig,
  PDFGenerationOptions,
  LineChartData,
  PieChartData,
  MetricDisplay,
  ComparisonMetric,
  TemplateExport,
} from './types'

// Template exports
export { BaseReportTemplate, baseStyles, formatNumber, formatCurrency, formatPercent, formatDate, formatDateShort } from './templates/BaseReportTemplate'
export { DailyReportTemplate } from './templates/DailyReportTemplate'
export { WeeklyReportTemplate } from './templates/WeeklyReportTemplate'
export { MonthlyReportTemplate } from './templates/MonthlyReportTemplate'
export { CampaignReportTemplate } from './templates/CampaignReportTemplate'
export { ExecutiveReportTemplate } from './templates/ExecutiveReportTemplate'

// Component exports
export { BarChart } from './components/BarChart'
export { MetricCard } from './components/MetricCard'
export { InsightCard } from './components/InsightCard'
export { ActionItemCard } from './components/ActionItemCard'
