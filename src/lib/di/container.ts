/**
 * Dependency Injection Container
 *
 * A simple DI container for managing dependencies in the application.
 * This lightweight implementation provides constructor injection
 * without external DI libraries.
 *
 * Registration is split into domain-specific modules under ./modules/
 */

import { DI_TOKENS } from './types'
import { SubscriptionPlan, getAIModelConfig } from '@domain/value-objects/SubscriptionPlan'

// Module registrations
import { registerCommonModule } from './modules/common.module'
import { registerCampaignModule } from './modules/campaign.module'
import { registerReportModule } from './modules/report.module'
import { registerKPIModule } from './modules/kpi.module'
import { registerPaymentModule } from './modules/payment.module'
import { registerMetaModule } from './modules/meta.module'
import { registerAuthModule } from './modules/auth.module'

// Type-only imports for convenience function signatures
import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import type { IReportRepository } from '@domain/repositories/IReportRepository'
import type { IReportScheduleRepository } from '@domain/repositories/IReportScheduleRepository'
import type { IKPIRepository } from '@domain/repositories/IKPIRepository'
import type { IBudgetAlertRepository } from '@domain/repositories/IBudgetAlertRepository'
import type { IABTestRepository } from '@domain/repositories/IABTestRepository'
import type { ITeamRepository } from '@domain/repositories/ITeamRepository'
import type { IUserRepository } from '@domain/repositories/IUserRepository'
import type { ISubscriptionRepository } from '@domain/repositories/ISubscriptionRepository'
import type { IInvoiceRepository } from '@domain/repositories/IInvoiceRepository'
import type { IMetaPixelRepository } from '@domain/repositories/IMetaPixelRepository'
import type { IBillingKeyRepository } from '@domain/repositories/IBillingKeyRepository'
import type { IPaymentLogRepository } from '@domain/repositories/IPaymentLogRepository'
import type { IAIFeedbackRepository } from '@domain/repositories/IAIFeedbackRepository'
import type { IConversationRepository } from '@domain/repositories/IConversationRepository'
import type { IPendingActionRepository } from '@domain/repositories/IPendingActionRepository'
import type { IAlertRepository } from '@domain/repositories/IAlertRepository'
import type { IAdSetRepository } from '@domain/repositories/IAdSetRepository'
import type { ICompetitorTrackingRepository } from '@domain/repositories/ICompetitorTrackingRepository'
import type { IOptimizationRuleRepository } from '@domain/repositories/IOptimizationRuleRepository'
import type { IPaymentGateway } from '@application/ports/IPaymentGateway'
import type { IAIService } from '@application/ports/IAIService'
import type { IStreamingAIService } from '@application/ports/IStreamingAIService'
import type { ICacheService } from '@application/ports/ICacheService'
import type { IKnowledgeBaseService } from '@application/ports/IKnowledgeBaseService'
import type { IResearchService } from '@application/ports/IResearchService'
import type { IEmailService } from '@application/ports/IEmailService'
import type { IReportPDFGenerator } from '@infrastructure/pdf/ReportPDFGenerator'
import type { IToolRegistry } from '@application/ports/IConversationalAgent'
import type { IGuideQuestionService } from '@application/ports/IGuideQuestionService'

import type { QuotaService } from '@application/services/QuotaService'
import type { BudgetAlertService } from '@application/services/BudgetAlertService'
import type { AnomalyDetectionService } from '@application/services/AnomalyDetectionService'
import type { AnomalyRootCauseService } from '@application/services/AnomalyRootCauseService'
import type { AnomalySegmentAnalysisService } from '@application/services/AnomalySegmentAnalysisService'
import type { CopyLearningService } from '@application/services/CopyLearningService'
import type { CampaignAnalyzer } from '@application/services/CampaignAnalyzer'
import type { CompetitorBenchmarkService } from '@application/services/CompetitorBenchmarkService'
import type { TargetingRecommendationService } from '@application/services/TargetingRecommendationService'
import type { PermissionService } from '@application/services/PermissionService'
import type { ABTestAnalysisService } from '@application/services/ABTestAnalysisService'
import type { ConversationalAgentService } from '@application/services/ConversationalAgentService'
import type { ActionConfirmationService } from '@application/services/ActionConfirmationService'
import type { ProactiveAlertService } from '@application/services/ProactiveAlertService'
import type { MarketingIntelligenceService } from '@application/services/MarketingIntelligenceService'
import type { ConversationSummarizerService } from '@application/services/ConversationSummarizerService'
import type { KPIInsightsService } from '@application/services/KPIInsightsService'

import type { CreateCampaignUseCase } from '@application/use-cases/campaign/CreateCampaignUseCase'
import type { UpdateCampaignUseCase } from '@application/use-cases/campaign/UpdateCampaignUseCase'
import type { PauseCampaignUseCase } from '@application/use-cases/campaign/PauseCampaignUseCase'
import type { ResumeCampaignUseCase } from '@application/use-cases/campaign/ResumeCampaignUseCase'
import type { DeleteCampaignUseCase } from '@application/use-cases/campaign/DeleteCampaignUseCase'
import type { SyncCampaignsUseCase } from '@application/use-cases/campaign/SyncCampaignsUseCase'
import type { GenerateWeeklyReportUseCase } from '@application/use-cases/report/GenerateWeeklyReportUseCase'
import type { SendScheduledReportsUseCase } from '@application/use-cases/report/SendScheduledReportsUseCase'
import type { GetDashboardKPIUseCase } from '@application/use-cases/kpi/GetDashboardKPIUseCase'
import type { ListUserPixelsUseCase } from '@application/use-cases/pixel/ListUserPixelsUseCase'
import type { SelectPixelUseCase } from '@application/use-cases/pixel/SelectPixelUseCase'
import type { GetTrackingHealthUseCase } from '@application/use-cases/pixel/GetTrackingHealthUseCase'
import type { SendCAPIEventsUseCase } from '@application/use-cases/pixel/SendCAPIEventsUseCase'
import type { IssueBillingKeyUseCase } from '@application/use-cases/payment/IssueBillingKeyUseCase'
import type { SubscribePlanUseCase } from '@application/use-cases/payment/SubscribePlanUseCase'
import type { CancelSubscriptionUseCase } from '@application/use-cases/payment/CancelSubscriptionUseCase'
import type { ChangePlanUseCase } from '@application/use-cases/payment/ChangePlanUseCase'
import type { GetPaymentHistoryUseCase } from '@application/use-cases/payment/GetPaymentHistoryUseCase'
import type { RefreshMetaTokenUseCase } from '@application/use-cases/token/RefreshMetaTokenUseCase'
import type { AuditAdAccountUseCase } from '@application/use-cases/audit/AuditAdAccountUseCase'
import type { CreateAdSetUseCase } from '@application/use-cases/adset/CreateAdSetUseCase'
import type { UpdateAdSetUseCase } from '@application/use-cases/adset/UpdateAdSetUseCase'
import type { DeleteAdSetUseCase } from '@application/use-cases/adset/DeleteAdSetUseCase'
import type { ListAdSetsUseCase } from '@application/use-cases/adset/ListAdSetsUseCase'
import type { TrackCompetitorUseCase } from '@application/use-cases/competitor/TrackCompetitorUseCase'
import type { UntrackCompetitorUseCase } from '@application/use-cases/competitor/UntrackCompetitorUseCase'
import type { GetTrackedCompetitorsUseCase } from '@application/use-cases/competitor/GetTrackedCompetitorsUseCase'
import type { CreateOptimizationRuleUseCase } from '@application/use-cases/optimization/CreateOptimizationRuleUseCase'
import type { UpdateOptimizationRuleUseCase } from '@application/use-cases/optimization/UpdateOptimizationRuleUseCase'
import type { DeleteOptimizationRuleUseCase } from '@application/use-cases/optimization/DeleteOptimizationRuleUseCase'
import type { ListOptimizationRulesUseCase } from '@application/use-cases/optimization/ListOptimizationRulesUseCase'
import type { EvaluateOptimizationRulesUseCase } from '@application/use-cases/optimization/EvaluateOptimizationRulesUseCase'
import type { AutoOptimizeCampaignUseCase } from '@application/use-cases/optimization/AutoOptimizeCampaignUseCase'
import type { CalculateSavingsUseCase } from '@application/use-cases/optimization/CalculateSavingsUseCase'

import { AIService } from '@infrastructure/external/openai/AIService'

// ─── Container Class ────────────────────────────────────────────────

type Factory<T> = () => T

export class Container {
  private singletons = new Map<symbol, unknown>()
  private factories = new Map<symbol, Factory<unknown>>()

  register<T>(token: symbol, factory: Factory<T>): void {
    this.factories.set(token, factory)
  }

  registerSingleton<T>(token: symbol, factory: Factory<T>): void {
    this.factories.set(token, () => {
      if (!this.singletons.has(token)) {
        this.singletons.set(token, factory())
      }
      return this.singletons.get(token)
    })
  }

  resolve<T>(token: symbol): T {
    const factory = this.factories.get(token)
    if (!factory) {
      throw new Error(`No factory registered for token: ${token.toString()}`)
    }
    return factory() as T
  }

  clear(): void {
    this.singletons.clear()
    this.factories.clear()
  }
}

// ─── Create and Configure Container ─────────────────────────────────

const container = new Container()

// 등록 순서 중요: 의존 관계에 따라 선행 모듈부터 등록
// 1. Meta (MetaAdsService, AdAccountRepository 등 – 다른 모듈 의존)
registerMetaModule(container)
// 2. Campaign (CampaignRepository 등 – KPI/Report에서 의존)
registerCampaignModule(container)
// 3. KPI (KPIRepository – Report에서 의존)
registerKPIModule(container)
// 4. Payment (SubscriptionRepository – Common/QuotaService에서 의존)
registerPaymentModule(container)
// 5. Common (AI, Cache, Quota 등 – Auth에서 의존)
registerCommonModule(container)
// 6. Report (GenerateWeeklyReportUseCase – Auth에서 의존)
registerReportModule(container)
// 7. Auth (ToolRegistry, ConversationalAgent – 모든 Use Case 의존)
registerAuthModule(container)

export { container, DI_TOKENS }

// ─── Convenience Functions ──────────────────────────────────────────
// 기존 export 시그니처를 유지하여 import 경로 변경 최소화

export function getCampaignRepository(): ICampaignRepository {
  return container.resolve(DI_TOKENS.CampaignRepository)
}

export function getReportRepository(): IReportRepository {
  return container.resolve(DI_TOKENS.ReportRepository)
}

export function getReportScheduleRepository(): IReportScheduleRepository {
  return container.resolve(DI_TOKENS.ReportScheduleRepository)
}

export function getKPIRepository(): IKPIRepository {
  return container.resolve(DI_TOKENS.KPIRepository)
}

export function getQuotaService(): QuotaService {
  return container.resolve(DI_TOKENS.QuotaService)
}

export function getCreateCampaignUseCase(): CreateCampaignUseCase {
  return container.resolve(DI_TOKENS.CreateCampaignUseCase)
}

export function getUpdateCampaignUseCase(): UpdateCampaignUseCase {
  return container.resolve(DI_TOKENS.UpdateCampaignUseCase)
}

export function getPauseCampaignUseCase(): PauseCampaignUseCase {
  return container.resolve(DI_TOKENS.PauseCampaignUseCase)
}

export function getResumeCampaignUseCase(): ResumeCampaignUseCase {
  return container.resolve(DI_TOKENS.ResumeCampaignUseCase)
}

export function getGenerateWeeklyReportUseCase(): GenerateWeeklyReportUseCase {
  return container.resolve(DI_TOKENS.GenerateWeeklyReportUseCase)
}

export function getSendScheduledReportsUseCase(): SendScheduledReportsUseCase {
  return container.resolve(DI_TOKENS.SendScheduledReportsUseCase)
}

export function getGetDashboardKPIUseCase(): GetDashboardKPIUseCase {
  return container.resolve(DI_TOKENS.GetDashboardKPIUseCase)
}

export function getBudgetAlertService(): BudgetAlertService {
  return container.resolve(DI_TOKENS.BudgetAlertService)
}

export function getBudgetAlertRepository(): IBudgetAlertRepository {
  return container.resolve(DI_TOKENS.BudgetAlertRepository)
}

export function getAIService(): IAIService {
  return container.resolve(DI_TOKENS.AIService)
}

export function getStreamingAIService(): IStreamingAIService {
  return container.resolve(DI_TOKENS.StreamingAIService)
}

export function getAnomalyDetectionService(): AnomalyDetectionService {
  return container.resolve(DI_TOKENS.AnomalyDetectionService)
}

export function getAnomalyRootCauseService(): AnomalyRootCauseService {
  return container.resolve(DI_TOKENS.AnomalyRootCauseService)
}

export function getReportPDFGenerator(): IReportPDFGenerator {
  return container.resolve(DI_TOKENS.ReportPDFGenerator)
}

export function getEmailService(): IEmailService {
  return container.resolve(DI_TOKENS.EmailService)
}

export function getABTestRepository(): IABTestRepository {
  return container.resolve(DI_TOKENS.ABTestRepository)
}

export function getTeamRepository(): ITeamRepository {
  return container.resolve(DI_TOKENS.TeamRepository)
}

export function getCopyLearningService(): CopyLearningService {
  return container.resolve(DI_TOKENS.CopyLearningService)
}

export function getAnomalySegmentAnalysisService(): AnomalySegmentAnalysisService {
  return container.resolve(DI_TOKENS.AnomalySegmentAnalysisService)
}

export function getCampaignAnalyzer(): CampaignAnalyzer {
  return container.resolve(DI_TOKENS.CampaignAnalyzer)
}

export function getCompetitorBenchmarkService(): CompetitorBenchmarkService {
  return container.resolve(DI_TOKENS.CompetitorBenchmarkService)
}

export function getTargetingRecommendationService(): TargetingRecommendationService {
  return container.resolve(DI_TOKENS.TargetingRecommendationService)
}

export function getUserRepository(): IUserRepository {
  return container.resolve(DI_TOKENS.UserRepository)
}

export function getSubscriptionRepository(): ISubscriptionRepository {
  return container.resolve(DI_TOKENS.SubscriptionRepository)
}

export function getInvoiceRepository(): IInvoiceRepository {
  return container.resolve(DI_TOKENS.InvoiceRepository)
}

export function getMetaPixelRepository(): IMetaPixelRepository {
  return container.resolve(DI_TOKENS.MetaPixelRepository)
}

export function getListUserPixelsUseCase(): ListUserPixelsUseCase {
  return container.resolve(DI_TOKENS.ListUserPixelsUseCase)
}

export function getSelectPixelUseCase(): SelectPixelUseCase {
  return container.resolve(DI_TOKENS.SelectPixelUseCase)
}

export function getGetTrackingHealthUseCase(): GetTrackingHealthUseCase {
  return container.resolve(DI_TOKENS.GetTrackingHealthUseCase)
}

export function getSyncCampaignsUseCase(): SyncCampaignsUseCase {
  return container.resolve(DI_TOKENS.SyncCampaignsUseCase)
}

export function getKnowledgeBaseService(): IKnowledgeBaseService {
  return container.resolve(DI_TOKENS.KnowledgeBaseService)
}

export function getMarketingIntelligenceService(): MarketingIntelligenceService {
  return container.resolve(DI_TOKENS.MarketingIntelligenceService)
}

export function getScienceAIService(): IAIService {
  return container.resolve(DI_TOKENS.ScienceAIService)
}

export function getResearchService(): IResearchService {
  return container.resolve(DI_TOKENS.ResearchService)
}

export function getBillingKeyRepository(): IBillingKeyRepository {
  return container.resolve(DI_TOKENS.BillingKeyRepository)
}

export function getPaymentLogRepository(): IPaymentLogRepository {
  return container.resolve(DI_TOKENS.PaymentLogRepository)
}

export function getPaymentGateway(): IPaymentGateway {
  return container.resolve(DI_TOKENS.PaymentGateway)
}

export function getIssueBillingKeyUseCase(): IssueBillingKeyUseCase {
  return container.resolve(DI_TOKENS.IssueBillingKeyUseCase)
}

export function getSubscribePlanUseCase(): SubscribePlanUseCase {
  return container.resolve(DI_TOKENS.SubscribePlanUseCase)
}

export function getCancelSubscriptionUseCase(): CancelSubscriptionUseCase {
  return container.resolve(DI_TOKENS.CancelSubscriptionUseCase)
}

export function getChangePlanUseCase(): ChangePlanUseCase {
  return container.resolve(DI_TOKENS.ChangePlanUseCase)
}

export function getPaymentHistoryUseCase(): GetPaymentHistoryUseCase {
  return container.resolve(DI_TOKENS.GetPaymentHistoryUseCase)
}

export function getAIFeedbackRepository(): IAIFeedbackRepository {
  return container.resolve(DI_TOKENS.AIFeedbackRepository)
}

export function getAuditAdAccountUseCase(): AuditAdAccountUseCase {
  return container.resolve(DI_TOKENS.AuditAdAccountUseCase)
}

export function getPermissionService(): PermissionService {
  return container.resolve(DI_TOKENS.PermissionService)
}

export function getABTestAnalysisService(): ABTestAnalysisService {
  return container.resolve(DI_TOKENS.ABTestAnalysisService)
}

export function getConversationRepository(): IConversationRepository {
  return container.resolve(DI_TOKENS.ConversationRepository)
}

export function getPendingActionRepository(): IPendingActionRepository {
  return container.resolve(DI_TOKENS.PendingActionRepository)
}

export function getAlertRepository(): IAlertRepository {
  return container.resolve(DI_TOKENS.AlertRepository)
}

export function getToolRegistry(): IToolRegistry {
  return container.resolve(DI_TOKENS.ToolRegistry)
}

export function getConversationalAgentService(): ConversationalAgentService {
  return container.resolve(DI_TOKENS.ConversationalAgentService)
}

export function getActionConfirmationService(): ActionConfirmationService {
  return container.resolve(DI_TOKENS.ActionConfirmationService)
}

export function getProactiveAlertService(): ProactiveAlertService {
  return container.resolve(DI_TOKENS.ProactiveAlertService)
}

export function getDeleteCampaignUseCase(): DeleteCampaignUseCase {
  return container.resolve(DI_TOKENS.DeleteCampaignUseCase)
}

export function getAdSetRepository(): IAdSetRepository {
  return container.resolve(DI_TOKENS.AdSetRepository)
}

export function getCreateAdSetUseCase(): CreateAdSetUseCase {
  return container.resolve(DI_TOKENS.CreateAdSetUseCase)
}

export function getUpdateAdSetUseCase(): UpdateAdSetUseCase {
  return container.resolve(DI_TOKENS.UpdateAdSetUseCase)
}

export function getDeleteAdSetUseCase(): DeleteAdSetUseCase {
  return container.resolve(DI_TOKENS.DeleteAdSetUseCase)
}

export function getListAdSetsUseCase(): ListAdSetsUseCase {
  return container.resolve(DI_TOKENS.ListAdSetsUseCase)
}

/**
 * Get AIService configured for a specific subscription plan's copy model
 */
export function getAIServiceForPlan(plan: SubscriptionPlan): IAIService {
  const modelConfig = getAIModelConfig(plan)
  return new AIService(process.env.OPENAI_API_KEY || '', modelConfig.copyModel)
}

/**
 * Get AIService configured for premium copy generation (gpt-4o)
 */
export function getPremiumAIService(plan: SubscriptionPlan): IAIService | null {
  const modelConfig = getAIModelConfig(plan)
  if (!modelConfig.premiumCopyModel) return null
  return new AIService(process.env.OPENAI_API_KEY || '', modelConfig.premiumCopyModel)
}

/**
 * Get the cache service instance
 */
export function getCacheService(): ICacheService {
  return container.resolve(DI_TOKENS.CacheService)
}

export function getRefreshMetaTokenUseCase(): RefreshMetaTokenUseCase {
  return container.resolve(DI_TOKENS.RefreshMetaTokenUseCase)
}

export function getSendCAPIEventsUseCase(): SendCAPIEventsUseCase {
  return container.resolve(DI_TOKENS.SendCAPIEventsUseCase)
}

export function getCompetitorTrackingRepository(): ICompetitorTrackingRepository {
  return container.resolve(DI_TOKENS.CompetitorTrackingRepository)
}

export function getTrackCompetitorUseCase(): TrackCompetitorUseCase {
  return container.resolve(DI_TOKENS.TrackCompetitorUseCase)
}

export function getUntrackCompetitorUseCase(): UntrackCompetitorUseCase {
  return container.resolve(DI_TOKENS.UntrackCompetitorUseCase)
}

export function getGetTrackedCompetitorsUseCase(): GetTrackedCompetitorsUseCase {
  return container.resolve(DI_TOKENS.GetTrackedCompetitorsUseCase)
}

export function getOptimizationRuleRepository(): IOptimizationRuleRepository {
  return container.resolve(DI_TOKENS.OptimizationRuleRepository)
}

export function getCreateOptimizationRuleUseCase(): CreateOptimizationRuleUseCase {
  return container.resolve(DI_TOKENS.CreateOptimizationRuleUseCase)
}

export function getUpdateOptimizationRuleUseCase(): UpdateOptimizationRuleUseCase {
  return container.resolve(DI_TOKENS.UpdateOptimizationRuleUseCase)
}

export function getDeleteOptimizationRuleUseCase(): DeleteOptimizationRuleUseCase {
  return container.resolve(DI_TOKENS.DeleteOptimizationRuleUseCase)
}

export function getListOptimizationRulesUseCase(): ListOptimizationRulesUseCase {
  return container.resolve(DI_TOKENS.ListOptimizationRulesUseCase)
}

export function getEvaluateOptimizationRulesUseCase(): EvaluateOptimizationRulesUseCase {
  return container.resolve(DI_TOKENS.EvaluateOptimizationRulesUseCase)
}

export function getAutoOptimizeCampaignUseCase(): AutoOptimizeCampaignUseCase {
  return container.resolve(DI_TOKENS.AutoOptimizeCampaignUseCase)
}

export function getCalculateSavingsUseCase(): CalculateSavingsUseCase {
  return container.resolve(DI_TOKENS.CalculateSavingsUseCase)
}

export function getGuideQuestionService(): IGuideQuestionService {
  return container.resolve(DI_TOKENS.GuideQuestionService)
}

export function getConversationSummarizerService(): ConversationSummarizerService {
  return container.resolve(DI_TOKENS.ConversationSummarizerService)
}

export function getKPIInsightsService(): KPIInsightsService {
  return container.resolve(DI_TOKENS.KPIInsightsService)
}
