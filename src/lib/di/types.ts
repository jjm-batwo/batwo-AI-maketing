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
  TeamRoleRepository: Symbol.for('TeamRoleRepository'),
  SubscriptionRepository: Symbol.for('SubscriptionRepository'),
  InvoiceRepository: Symbol.for('InvoiceRepository'),
  MetaPixelRepository: Symbol.for('MetaPixelRepository'),
  AIFeedbackRepository: Symbol.for('AIFeedbackRepository'),
  ConversationRepository: Symbol.for('ConversationRepository'),
  PendingActionRepository: Symbol.for('PendingActionRepository'),
  AlertRepository: Symbol.for('AlertRepository'),

  // External Services
  MetaAdsService: Symbol.for('MetaAdsService'),
  AIService: Symbol.for('AIService'),
  StreamingAIService: Symbol.for('StreamingAIService'),
  PlatformAdapter: Symbol.for('PlatformAdapter'),
  MetaPixelService: Symbol.for('MetaPixelService'),
  CAPIService: Symbol.for('CAPIService'),

  // Application Services
  QuotaService: Symbol.for('QuotaService'),
  BudgetAlertService: Symbol.for('BudgetAlertService'),
  AnomalyDetectionService: Symbol.for('AnomalyDetectionService'),
  AnomalyRootCauseService: Symbol.for('AnomalyRootCauseService'),
  AnomalySegmentAnalysisService: Symbol.for('AnomalySegmentAnalysisService'),
  CopyLearningService: Symbol.for('CopyLearningService'),
  CampaignAnalyzer: Symbol.for('CampaignAnalyzer'),
  CompetitorBenchmarkService: Symbol.for('CompetitorBenchmarkService'),
  TargetingRecommendationService: Symbol.for('TargetingRecommendationService'),
  PermissionService: Symbol.for('PermissionService'),
  ABTestAnalysisService: Symbol.for('ABTestAnalysisService'),
  ToolRegistry: Symbol.for('ToolRegistry'),
  ConversationalAgentService: Symbol.for('ConversationalAgentService'),
  ActionConfirmationService: Symbol.for('ActionConfirmationService'),
  ProactiveAlertService: Symbol.for('ProactiveAlertService'),
  KPIInsightsService: Symbol.for('KPIInsightsService'),

  // Infrastructure Services
  ReportPDFGenerator: Symbol.for('ReportPDFGenerator'),
  EmailService: Symbol.for('EmailService'),

  // Marketing Intelligence
  KnowledgeBaseService: Symbol.for('KnowledgeBaseService'),
  MarketingIntelligenceService: Symbol.for('MarketingIntelligenceService'),
  ScienceAIService: Symbol.for('ScienceAIService'),
  ResearchService: Symbol.for('ResearchService'),

  // Use Cases
  CreateCampaignUseCase: Symbol.for('CreateCampaignUseCase'),
  UpdateCampaignUseCase: Symbol.for('UpdateCampaignUseCase'),
  PauseCampaignUseCase: Symbol.for('PauseCampaignUseCase'),
  ResumeCampaignUseCase: Symbol.for('ResumeCampaignUseCase'),
  DeleteCampaignUseCase: Symbol.for('DeleteCampaignUseCase'),
  GetCampaignUseCase: Symbol.for('GetCampaignUseCase'),
  ListCampaignsUseCase: Symbol.for('ListCampaignsUseCase'),
  SyncCampaignsUseCase: Symbol.for('SyncCampaignsUseCase'),
  GenerateWeeklyReportUseCase: Symbol.for('GenerateWeeklyReportUseCase'),
  GetDashboardKPIUseCase: Symbol.for('GetDashboardKPIUseCase'),
  SyncMetaInsightsUseCase: Symbol.for('SyncMetaInsightsUseCase'),
  SyncAllInsightsUseCase: Symbol.for('SyncAllInsightsUseCase'),

  // Pixel Use Cases
  ListUserPixelsUseCase: Symbol.for('ListUserPixelsUseCase'),
  SelectPixelUseCase: Symbol.for('SelectPixelUseCase'),

  // Payment
  BillingKeyRepository: Symbol.for('BillingKeyRepository'),
  PaymentLogRepository: Symbol.for('PaymentLogRepository'),
  PaymentGateway: Symbol.for('PaymentGateway'),

  // Payment Use Cases
  IssueBillingKeyUseCase: Symbol.for('IssueBillingKeyUseCase'),
  SubscribePlanUseCase: Symbol.for('SubscribePlanUseCase'),
  CancelSubscriptionUseCase: Symbol.for('CancelSubscriptionUseCase'),
  ChangePlanUseCase: Symbol.for('ChangePlanUseCase'),
  GetPaymentHistoryUseCase: Symbol.for('GetPaymentHistoryUseCase'),

  // AdSet
  AdSetRepository: Symbol.for('AdSetRepository'),
  CreateAdSetUseCase: Symbol.for('CreateAdSetUseCase'),
  UpdateAdSetUseCase: Symbol.for('UpdateAdSetUseCase'),
  DeleteAdSetUseCase: Symbol.for('DeleteAdSetUseCase'),
  ListAdSetsUseCase: Symbol.for('ListAdSetsUseCase'),

  // Ad
  AdRepository: Symbol.for('AdRepository'),
  CreateAdUseCase: Symbol.for('CreateAdUseCase'),

  // Creative
  CreativeRepository: Symbol.for('CreativeRepository'),
  CreativeAssetRepository: Symbol.for('CreativeAssetRepository'),
  CreateCreativeUseCase: Symbol.for('CreateCreativeUseCase'),
  UploadAssetUseCase: Symbol.for('UploadAssetUseCase'),

  // Storage
  BlobStorageService: Symbol.for('BlobStorageService'),

  // Advantage+ Campaign
  CreateAdvantageCampaignUseCase: Symbol.for('CreateAdvantageCampaignUseCase'),

  // Competitor Tracking
  CompetitorTrackingRepository: Symbol.for('CompetitorTrackingRepository'),
  TrackCompetitorUseCase: Symbol.for('TrackCompetitorUseCase'),
  UntrackCompetitorUseCase: Symbol.for('UntrackCompetitorUseCase'),
  GetTrackedCompetitorsUseCase: Symbol.for('GetTrackedCompetitorsUseCase'),

  // Cache Service
  CacheService: Symbol.for('CacheService'),

  // Token Management
  RefreshMetaTokenUseCase: Symbol.for('RefreshMetaTokenUseCase'),

  // CAPI Batch
  ConversionEventRepository: Symbol.for('ConversionEventRepository'),
  SendCAPIEventsUseCase: Symbol.for('SendCAPIEventsUseCase'),

  // Optimization (자동 최적화)
  OptimizationRuleRepository: Symbol.for('OptimizationRuleRepository'),
  CreateOptimizationRuleUseCase: Symbol.for('CreateOptimizationRuleUseCase'),
  UpdateOptimizationRuleUseCase: Symbol.for('UpdateOptimizationRuleUseCase'),
  DeleteOptimizationRuleUseCase: Symbol.for('DeleteOptimizationRuleUseCase'),
  ListOptimizationRulesUseCase: Symbol.for('ListOptimizationRulesUseCase'),
  EvaluateOptimizationRulesUseCase: Symbol.for('EvaluateOptimizationRulesUseCase'),
  AutoOptimizeCampaignUseCase: Symbol.for('AutoOptimizeCampaignUseCase'),
  CalculateSavingsUseCase: Symbol.for('CalculateSavingsUseCase'),

  // Audit Use Cases
  AuditAdAccountUseCase: Symbol.for('AuditAdAccountUseCase'),

  // Feedback Analytics Use Cases
  GetFeedbackAnalyticsUseCase: Symbol.for('GetFeedbackAnalyticsUseCase'),

  // Resilience (new)
  ResilienceService: Symbol.for('ResilienceService'),

  // Prompt Template (new)
  PromptTemplateService: Symbol.for('PromptTemplateService'),

  // Fallback Response (new)
  FallbackResponseService: Symbol.for('FallbackResponseService'),

  // Few-Shot Example Registry (new)
  FewShotExampleRegistry: Symbol.for('FewShotExampleRegistry'),

  // Guide Question (new)
  GuideQuestionService: Symbol.for('GuideQuestionService'),

  // Conversation Summarizer
  ConversationSummarizerService: Symbol.for('ConversationSummarizerService'),
} as const

export type DIToken = (typeof DI_TOKENS)[keyof typeof DI_TOKENS]
