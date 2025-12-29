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

  // External Services
  MetaAdsService: Symbol.for('MetaAdsService'),
  AIService: Symbol.for('AIService'),

  // Application Services
  QuotaService: Symbol.for('QuotaService'),

  // Use Cases
  CreateCampaignUseCase: Symbol.for('CreateCampaignUseCase'),
  GetCampaignUseCase: Symbol.for('GetCampaignUseCase'),
  ListCampaignsUseCase: Symbol.for('ListCampaignsUseCase'),
  GenerateWeeklyReportUseCase: Symbol.for('GenerateWeeklyReportUseCase'),
  GetDashboardKPIUseCase: Symbol.for('GetDashboardKPIUseCase'),
  SyncMetaInsightsUseCase: Symbol.for('SyncMetaInsightsUseCase'),
} as const

export type DIToken = (typeof DI_TOKENS)[keyof typeof DI_TOKENS]
