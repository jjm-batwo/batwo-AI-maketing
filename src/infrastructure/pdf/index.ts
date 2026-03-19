// ========================================
// PDF Infrastructure Exports
// ========================================

// Design tokens (single source of truth for PDF styling)
export {
  colors,
  priorityColors,
  fatigueColors,
  importanceColors,
  analysisColors,
  funnelColors,
  formatColors,
  gradeColors,
  confidenceColors,
  spacing,
  radius,
  fontSize,
  letterSpacing,
  PDF_FONT_FAMILY,
  PDF_MONO_FONT_FAMILY,
} from './design-tokens'

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
export {
  BaseReportTemplate,
  baseStyles,
  formatNumber,
  formatCurrency,
  formatPercent,
  formatDate,
  formatDateShort,
} from './templates/BaseReportTemplate'
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
