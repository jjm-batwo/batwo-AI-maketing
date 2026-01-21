/**
 * Dependency Injection Types
 *
 * This file defines the symbols and types for dependency injection.
 * Using symbols ensures type-safe dependency resolution.
 */

export const DI_TOKENS = {
  // Repositories
  CampaignRepository: Symbol.for('CampaignRepository'),
  ReportRepository: Symbol.for('ReportRepository'),
  KPIRepository: Symbol.for('KPIRepository'),
  UserRepository: Symbol.for('UserRepository'),
  UsageLogRepository: Symbol.for('UsageLogRepository'),
  BudgetAlertRepository: Symbol.for('BudgetAlertRepository'),
  ABTestRepository: Symbol.for('ABTestRepository'),
  TeamRepository: Symbol.for('TeamRepository'),
  SubscriptionRepository: Symbol.for('SubscriptionRepository'),
  InvoiceRepository: Symbol.for('InvoiceRepository'),

  // External Services
  MetaAdsService: Symbol.for('MetaAdsService'),
  AIService: Symbol.for('AIService'),

  // Application Services
  QuotaService: Symbol.for('QuotaService'),
  BudgetAlertService: Symbol.for('BudgetAlertService'),
  AnomalyDetectionService: Symbol.for('AnomalyDetectionService'),
  AnomalyRootCauseService: Symbol.for('AnomalyRootCauseService'),
  AnomalySegmentAnalysisService: Symbol.for('AnomalySegmentAnalysisService'),
  CopyLearningService: Symbol.for('CopyLearningService'),
  CampaignAnalyzer: Symbol.for('CampaignAnalyzer'),
  CompetitorBenchmarkService: Symbol.for('CompetitorBenchmarkService'),

  // Infrastructure Services
  ReportPDFGenerator: Symbol.for('ReportPDFGenerator'),
  EmailService: Symbol.for('EmailService'),

  // Use Cases
  CreateCampaignUseCase: Symbol.for('CreateCampaignUseCase'),
  UpdateCampaignUseCase: Symbol.for('UpdateCampaignUseCase'),
  PauseCampaignUseCase: Symbol.for('PauseCampaignUseCase'),
  ResumeCampaignUseCase: Symbol.for('ResumeCampaignUseCase'),
  GetCampaignUseCase: Symbol.for('GetCampaignUseCase'),
  ListCampaignsUseCase: Symbol.for('ListCampaignsUseCase'),
  GenerateWeeklyReportUseCase: Symbol.for('GenerateWeeklyReportUseCase'),
  GetDashboardKPIUseCase: Symbol.for('GetDashboardKPIUseCase'),
  SyncMetaInsightsUseCase: Symbol.for('SyncMetaInsightsUseCase'),
} as const

export type DIToken = (typeof DI_TOKENS)[keyof typeof DI_TOKENS]
