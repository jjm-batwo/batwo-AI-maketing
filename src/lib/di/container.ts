/**
 * Dependency Injection Container
 *
 * A simple DI container for managing dependencies in the application.
 * This lightweight implementation provides constructor injection
 * without external DI libraries.
 */

import { env } from '@/lib/env'
import { DI_TOKENS } from './types'
import { SubscriptionPlan, getAIModelConfig } from '@domain/value-objects/SubscriptionPlan'

// Repository interfaces
import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import type { IReportRepository } from '@domain/repositories/IReportRepository'
import type { IKPIRepository } from '@domain/repositories/IKPIRepository'
import type { IUsageLogRepository } from '@domain/repositories/IUsageLogRepository'
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
import type { IPaymentGateway } from '@application/ports/IPaymentGateway'

// Port interfaces
import type { IMetaAdsService } from '@application/ports/IMetaAdsService'
import type { IAIService } from '@application/ports/IAIService'
import type { IStreamingAIService } from '@application/ports/IStreamingAIService'
import type { IKnowledgeBaseService } from '@application/ports/IKnowledgeBaseService'
import type { IResearchService } from '@application/ports/IResearchService'
import type { ICacheService } from '@application/ports/ICacheService'
import type { IPlatformAdapter } from '@application/ports/IPlatformAdapter'
import type { IResilienceService } from '@application/ports/IResilienceService'
import type { IPromptTemplateService } from '@application/ports/IPromptTemplateService'
import type { IFallbackResponseService } from '@application/ports/IFallbackResponseService'
import type { IFewShotExampleRegistry } from '@application/ports/IFewShotExampleRegistry'
import type { IMetaPixelService } from '@application/ports/IMetaPixelService'
import type { ICAPIService } from '@application/ports/ICAPIService'

// Infrastructure implementations
import { PrismaCampaignRepository } from '@infrastructure/database/repositories/PrismaCampaignRepository'
import { PrismaReportRepository } from '@infrastructure/database/repositories/PrismaReportRepository'
import { PrismaKPIRepository } from '@infrastructure/database/repositories/PrismaKPIRepository'
import { PrismaUsageLogRepository } from '@infrastructure/database/repositories/PrismaUsageLogRepository'
import { PrismaBudgetAlertRepository } from '@infrastructure/database/repositories/PrismaBudgetAlertRepository'
import { PrismaABTestRepository } from '@infrastructure/database/repositories/PrismaABTestRepository'
import { PrismaTeamRepository } from '@infrastructure/database/repositories/PrismaTeamRepository'
import { PrismaUserRepository } from '@infrastructure/database/repositories/PrismaUserRepository'
import { PrismaSubscriptionRepository } from '@infrastructure/database/repositories/PrismaSubscriptionRepository'
import { PrismaInvoiceRepository } from '@infrastructure/database/repositories/PrismaInvoiceRepository'
import { PrismaMetaPixelRepository } from '@infrastructure/database/repositories/PrismaMetaPixelRepository'
import { PrismaBillingKeyRepository } from '@infrastructure/database/repositories/PrismaBillingKeyRepository'
import { PrismaPaymentLogRepository } from '@infrastructure/database/repositories/PrismaPaymentLogRepository'
import { PrismaAIFeedbackRepository } from '@infrastructure/database/repositories/PrismaAIFeedbackRepository'
import { PrismaConversationRepository } from '@infrastructure/database/repositories/PrismaConversationRepository'
import { PrismaPendingActionRepository } from '@infrastructure/database/repositories/PrismaPendingActionRepository'
import { PrismaAlertRepository } from '@infrastructure/database/repositories/PrismaAlertRepository'
import { TossPaymentsClient } from '@infrastructure/payment/TossPaymentsClient'
import { MetaAdsClient } from '@infrastructure/external/meta-ads/MetaAdsClient'
import { Cafe24Adapter } from '@infrastructure/external/platforms/cafe24/Cafe24Adapter'
import { MetaPixelClient } from '@infrastructure/external/meta-pixel/MetaPixelClient'
import { CAPIClient } from '@infrastructure/external/meta-pixel/CAPIClient'
import { AIService } from '@infrastructure/external/openai/AIService'
import { ResilienceService } from '@infrastructure/external/errors/ResilienceService'
import { StreamingAIService } from '@infrastructure/external/openai/streaming/StreamingAIService'
import { KnowledgeBaseService } from '@infrastructure/knowledge'
import { MarketingIntelligenceService } from '@application/services/MarketingIntelligenceService'
import { ScienceAIService } from '@infrastructure/external/openai/ScienceAIService'
import { PerplexityResearchService } from '@infrastructure/external/research'
import { RedisCacheService } from '@infrastructure/cache/RedisCacheService'
import { MemoryCacheService } from '@infrastructure/cache/MemoryCacheService'
import type { IToolRegistry } from '@application/ports/IConversationalAgent'
import { registerAllTools } from '@application/tools/registerAllTools'
import { ConversationalAgentService } from '@application/services/ConversationalAgentService'
import { ActionConfirmationService } from '@application/services/ActionConfirmationService'
import { ProactiveAlertService } from '@application/services/ProactiveAlertService'
import { PromptTemplateService } from '@application/services/PromptTemplateService'
import { FallbackResponseService } from '@application/services/FallbackResponseService'
import { FewShotExampleRegistry } from '@application/services/FewShotExampleRegistry'
import { GuideQuestionService } from '@application/services/GuideQuestionService'
import { ConversationSummarizerService } from '@application/services/ConversationSummarizerService'
import { KPIInsightsService } from '@application/services/KPIInsightsService'
import type { IGuideQuestionService } from '@application/ports/IGuideQuestionService'

// Application services and use cases
import { QuotaService } from '@application/services/QuotaService'
import { BudgetAlertService } from '@application/services/BudgetAlertService'
import { AnomalyDetectionService } from '@application/services/AnomalyDetectionService'
import { AnomalyRootCauseService } from '@application/services/AnomalyRootCauseService'
import { AnomalySegmentAnalysisService } from '@application/services/AnomalySegmentAnalysisService'
import { CopyLearningService } from '@application/services/CopyLearningService'
import { CampaignAnalyzer } from '@application/services/CampaignAnalyzer'
import { CompetitorBenchmarkService } from '@application/services/CompetitorBenchmarkService'
import { TargetingRecommendationService } from '@application/services/TargetingRecommendationService'
import { PermissionService } from '@application/services/PermissionService'
import { ABTestAnalysisService } from '@application/services/ABTestAnalysisService'
import {
  ReportPDFGenerator,
  type IReportPDFGenerator,
} from '@infrastructure/pdf/ReportPDFGenerator'
import { EmailService } from '@infrastructure/email/EmailService'
import type { IEmailService } from '@application/ports/IEmailService'
import { CreateCampaignUseCase } from '@application/use-cases/campaign/CreateCampaignUseCase'
import { UpdateCampaignUseCase } from '@application/use-cases/campaign/UpdateCampaignUseCase'
import { PauseCampaignUseCase } from '@application/use-cases/campaign/PauseCampaignUseCase'
import { ResumeCampaignUseCase } from '@application/use-cases/campaign/ResumeCampaignUseCase'
import { DeleteCampaignUseCase } from '@application/use-cases/campaign/DeleteCampaignUseCase'
import { GetCampaignUseCase } from '@application/use-cases/campaign/GetCampaignUseCase'
import { ListCampaignsUseCase } from '@application/use-cases/campaign/ListCampaignsUseCase'
import { SyncCampaignsUseCase } from '@application/use-cases/campaign/SyncCampaignsUseCase'
import { GenerateWeeklyReportUseCase } from '@application/use-cases/report/GenerateWeeklyReportUseCase'
import { GetDashboardKPIUseCase } from '@application/use-cases/kpi/GetDashboardKPIUseCase'
import { SyncMetaInsightsUseCase } from '@application/use-cases/kpi/SyncMetaInsightsUseCase'
import { SyncAllInsightsUseCase } from '@application/use-cases/kpi/SyncAllInsightsUseCase'
import { ListUserPixelsUseCase } from '@application/use-cases/pixel/ListUserPixelsUseCase'
import { SelectPixelUseCase } from '@application/use-cases/pixel/SelectPixelUseCase'
import { IssueBillingKeyUseCase } from '@application/use-cases/payment/IssueBillingKeyUseCase'
import { SubscribePlanUseCase } from '@application/use-cases/payment/SubscribePlanUseCase'
import { CancelSubscriptionUseCase } from '@application/use-cases/payment/CancelSubscriptionUseCase'
import { ChangePlanUseCase } from '@application/use-cases/payment/ChangePlanUseCase'
import { GetPaymentHistoryUseCase } from '@application/use-cases/payment/GetPaymentHistoryUseCase'

import { PrismaAdSetRepository } from '@infrastructure/database/repositories/PrismaAdSetRepository'
import type { IAdSetRepository } from '@domain/repositories/IAdSetRepository'
import { CreateAdSetUseCase } from '@application/use-cases/adset/CreateAdSetUseCase'
import { UpdateAdSetUseCase } from '@application/use-cases/adset/UpdateAdSetUseCase'
import { DeleteAdSetUseCase } from '@application/use-cases/adset/DeleteAdSetUseCase'
import { ListAdSetsUseCase } from '@application/use-cases/adset/ListAdSetsUseCase'

import { PrismaAdRepository } from '@infrastructure/database/repositories/PrismaAdRepository'
import type { IAdRepository } from '@domain/repositories/IAdRepository'
import { CreateAdUseCase } from '@application/use-cases/ad/CreateAdUseCase'

import { PrismaCreativeRepository } from '@infrastructure/database/repositories/PrismaCreativeRepository'
import type { ICreativeRepository } from '@domain/repositories/ICreativeRepository'
import { PrismaCreativeAssetRepository } from '@infrastructure/database/repositories/PrismaCreativeAssetRepository'
import type { ICreativeAssetRepository } from '@domain/repositories/ICreativeAssetRepository'
import { CreateCreativeUseCase } from '@application/use-cases/creative/CreateCreativeUseCase'
import { UploadAssetUseCase } from '@application/use-cases/creative/UploadAssetUseCase'

import {
  BlobStorageService,
  type IBlobStorageService,
} from '@infrastructure/storage/BlobStorageService'
import { CreateAdvantageCampaignUseCase } from '@application/use-cases/campaign/CreateAdvantageCampaignUseCase'
import { RefreshMetaTokenUseCase } from '@application/use-cases/token/RefreshMetaTokenUseCase'
import { PrismaConversionEventRepository } from '@infrastructure/database/repositories/PrismaConversionEventRepository'
import type { IConversionEventRepository } from '@domain/repositories/IConversionEventRepository'
import { SendCAPIEventsUseCase } from '@application/use-cases/pixel/SendCAPIEventsUseCase'

import { PrismaCompetitorTrackingRepository } from '@infrastructure/database/repositories/PrismaCompetitorTrackingRepository'
import type { ICompetitorTrackingRepository } from '@domain/repositories/ICompetitorTrackingRepository'
import { TrackCompetitorUseCase } from '@application/use-cases/competitor/TrackCompetitorUseCase'
import { UntrackCompetitorUseCase } from '@application/use-cases/competitor/UntrackCompetitorUseCase'
import { GetTrackedCompetitorsUseCase } from '@application/use-cases/competitor/GetTrackedCompetitorsUseCase'

import { PrismaOptimizationRuleRepository } from '@infrastructure/database/repositories/PrismaOptimizationRuleRepository'
import type { IOptimizationRuleRepository } from '@domain/repositories/IOptimizationRuleRepository'
import { CreateOptimizationRuleUseCase } from '@application/use-cases/optimization/CreateOptimizationRuleUseCase'
import { UpdateOptimizationRuleUseCase } from '@application/use-cases/optimization/UpdateOptimizationRuleUseCase'
import { DeleteOptimizationRuleUseCase } from '@application/use-cases/optimization/DeleteOptimizationRuleUseCase'
import { ListOptimizationRulesUseCase } from '@application/use-cases/optimization/ListOptimizationRulesUseCase'
import { EvaluateOptimizationRulesUseCase } from '@application/use-cases/optimization/EvaluateOptimizationRulesUseCase'
import { AutoOptimizeCampaignUseCase } from '@application/use-cases/optimization/AutoOptimizeCampaignUseCase'
import { CalculateSavingsUseCase } from '@application/use-cases/optimization/CalculateSavingsUseCase'
import { AuditAdAccountUseCase } from '@application/use-cases/audit/AuditAdAccountUseCase'
import { GetFeedbackAnalyticsUseCase } from '@application/use-cases/ai/GetFeedbackAnalyticsUseCase'

import { prisma } from '@/lib/prisma'
import { safeDecryptToken } from '@application/utils/TokenEncryption'

type Factory<T> = () => T

class Container {
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

// Create and configure the container
const container = new Container()

// Register Repositories (Singletons)
container.registerSingleton<ICampaignRepository>(
  DI_TOKENS.CampaignRepository,
  () => new PrismaCampaignRepository(prisma)
)

container.registerSingleton<IReportRepository>(
  DI_TOKENS.ReportRepository,
  () => new PrismaReportRepository(prisma)
)

container.registerSingleton<IKPIRepository>(
  DI_TOKENS.KPIRepository,
  () => new PrismaKPIRepository(prisma)
)

container.registerSingleton<IUsageLogRepository>(
  DI_TOKENS.UsageLogRepository,
  () => new PrismaUsageLogRepository(prisma)
)

container.registerSingleton<IBudgetAlertRepository>(
  DI_TOKENS.BudgetAlertRepository,
  () => new PrismaBudgetAlertRepository(prisma)
)

container.registerSingleton<IABTestRepository>(
  DI_TOKENS.ABTestRepository,
  () => new PrismaABTestRepository(prisma)
)

container.registerSingleton<ITeamRepository>(
  DI_TOKENS.TeamRepository,
  () => new PrismaTeamRepository(prisma)
)

container.registerSingleton<IUserRepository>(
  DI_TOKENS.UserRepository,
  () => new PrismaUserRepository(prisma)
)

container.registerSingleton<ISubscriptionRepository>(
  DI_TOKENS.SubscriptionRepository,
  () => new PrismaSubscriptionRepository(prisma)
)

container.registerSingleton<IInvoiceRepository>(
  DI_TOKENS.InvoiceRepository,
  () => new PrismaInvoiceRepository(prisma)
)

container.registerSingleton<IMetaPixelRepository>(
  DI_TOKENS.MetaPixelRepository,
  () => new PrismaMetaPixelRepository(prisma)
)

container.registerSingleton<IBillingKeyRepository>(
  DI_TOKENS.BillingKeyRepository,
  () => new PrismaBillingKeyRepository(prisma)
)

container.registerSingleton<IPaymentLogRepository>(
  DI_TOKENS.PaymentLogRepository,
  () => new PrismaPaymentLogRepository(prisma)
)

container.registerSingleton<IAIFeedbackRepository>(
  DI_TOKENS.AIFeedbackRepository,
  () => new PrismaAIFeedbackRepository(prisma)
)

// Conversational Agent Repositories (Singletons)
container.registerSingleton<IConversationRepository>(
  DI_TOKENS.ConversationRepository,
  () => new PrismaConversationRepository(prisma)
)

container.registerSingleton<IPendingActionRepository>(
  DI_TOKENS.PendingActionRepository,
  () => new PrismaPendingActionRepository(prisma)
)

container.registerSingleton<IAlertRepository>(
  DI_TOKENS.AlertRepository,
  () => new PrismaAlertRepository(prisma)
)

// Register External Services (Singletons)
container.registerSingleton<IMetaAdsService>(DI_TOKENS.MetaAdsService, () => new MetaAdsClient())

container.registerSingleton<IAIService>(
  DI_TOKENS.AIService,
  () => new AIService(process.env.OPENAI_API_KEY || '', process.env.OPENAI_MODEL || 'gpt-4o-mini')
)

container.registerSingleton<IStreamingAIService>(
  DI_TOKENS.StreamingAIService,
  () => new StreamingAIService(process.env.OPENAI_MODEL || 'gpt-4o-mini')
)

container.registerSingleton<IPaymentGateway>(
  DI_TOKENS.PaymentGateway,
  () => new TossPaymentsClient()
)

container.registerSingleton<IPlatformAdapter>(
  DI_TOKENS.PlatformAdapter,
  () =>
    new Cafe24Adapter(process.env.CAFE24_CLIENT_ID || '', process.env.CAFE24_CLIENT_SECRET || '')
)

container.registerSingleton<IMetaPixelService>(
  DI_TOKENS.MetaPixelService,
  () => new MetaPixelClient()
)

container.registerSingleton<ICAPIService>(DI_TOKENS.CAPIService, () => new CAPIClient())

// Resilience Service (Singleton)
container.registerSingleton<IResilienceService>(
  DI_TOKENS.ResilienceService,
  () => new ResilienceService()
)

// PromptTemplate Service (Singleton)
container.registerSingleton<IPromptTemplateService>(
  DI_TOKENS.PromptTemplateService,
  () => new PromptTemplateService()
)

// FallbackResponse Service (Singleton)
container.registerSingleton<IFallbackResponseService>(
  DI_TOKENS.FallbackResponseService,
  () => new FallbackResponseService(
    container.resolve<IResilienceService>(DI_TOKENS.ResilienceService)
  )
)

// FewShotExample Registry (Singleton)
container.registerSingleton<IFewShotExampleRegistry>(
  DI_TOKENS.FewShotExampleRegistry,
  () => new FewShotExampleRegistry()
)

// Register Cache Service (Singleton)
container.registerSingleton<ICacheService>(DI_TOKENS.CacheService, () => {
  const cacheEnabled = process.env.CACHE_ENABLED !== 'false'
  const redisUrl = process.env.REDIS_URL

  if (cacheEnabled && redisUrl) {
    console.log('[DI] Using Redis cache service')
    return new RedisCacheService(redisUrl)
  } else {
    console.log('[DI] Using in-memory cache service (development only)')
    return new MemoryCacheService()
  }
})

// Register Application Services (Singletons)
container.registerSingleton(
  DI_TOKENS.QuotaService,
  () =>
    new QuotaService(
      container.resolve(DI_TOKENS.UsageLogRepository),
      container.resolve(DI_TOKENS.UserRepository),
      container.resolve(DI_TOKENS.SubscriptionRepository)
    )
)

container.registerSingleton(
  DI_TOKENS.BudgetAlertService,
  () =>
    new BudgetAlertService(
      container.resolve(DI_TOKENS.BudgetAlertRepository),
      container.resolve(DI_TOKENS.KPIRepository)
    )
)

container.registerSingleton(
  DI_TOKENS.AnomalyDetectionService,
  () =>
    new AnomalyDetectionService(
      container.resolve(DI_TOKENS.KPIRepository),
      container.resolve(DI_TOKENS.CampaignRepository)
    )
)

container.registerSingleton(DI_TOKENS.AnomalyRootCauseService, () => new AnomalyRootCauseService())

container.registerSingleton(
  DI_TOKENS.AnomalySegmentAnalysisService,
  () => new AnomalySegmentAnalysisService()
)

container.registerSingleton(DI_TOKENS.CopyLearningService, () => new CopyLearningService())

container.registerSingleton(DI_TOKENS.CampaignAnalyzer, () => new CampaignAnalyzer())

container.registerSingleton(
  DI_TOKENS.CompetitorBenchmarkService,
  () => new CompetitorBenchmarkService()
)

container.registerSingleton(
  DI_TOKENS.TargetingRecommendationService,
  () => new TargetingRecommendationService()
)

container.registerSingleton(DI_TOKENS.PermissionService, () => new PermissionService(prisma))

container.registerSingleton(
  DI_TOKENS.ABTestAnalysisService,
  () => new ABTestAnalysisService(container.resolve(DI_TOKENS.ABTestRepository))
)

// Conversational Agent Services
container.registerSingleton<IToolRegistry>(DI_TOKENS.ToolRegistry, () =>
  registerAllTools({
    campaignRepository: container.resolve(DI_TOKENS.CampaignRepository),
    kpiRepository: container.resolve(DI_TOKENS.KPIRepository),
    getDashboardKPIUseCase: container.resolve(DI_TOKENS.GetDashboardKPIUseCase),
    listCampaignsUseCase: container.resolve(DI_TOKENS.ListCampaignsUseCase),
    getCampaignUseCase: container.resolve(DI_TOKENS.GetCampaignUseCase),
    generateWeeklyReportUseCase: container.resolve(DI_TOKENS.GenerateWeeklyReportUseCase),
    createCampaignUseCase: container.resolve(DI_TOKENS.CreateCampaignUseCase),
    updateCampaignUseCase: container.resolve(DI_TOKENS.UpdateCampaignUseCase),
    pauseCampaignUseCase: container.resolve(DI_TOKENS.PauseCampaignUseCase),
    resumeCampaignUseCase: container.resolve(DI_TOKENS.ResumeCampaignUseCase),
    deleteCampaignUseCase: container.resolve(DI_TOKENS.DeleteCampaignUseCase),
  })
)

container.registerSingleton(
  DI_TOKENS.ConversationalAgentService,
  () =>
    new ConversationalAgentService(
      container.resolve<IToolRegistry>(DI_TOKENS.ToolRegistry),
      container.resolve<IConversationRepository>(DI_TOKENS.ConversationRepository),
      container.resolve<IPendingActionRepository>(DI_TOKENS.PendingActionRepository),
      container.resolve<IResilienceService>(DI_TOKENS.ResilienceService),
      async (userId: string) => {
        const metaAccount = await prisma.metaAdAccount.findUnique({
          where: { userId },
        })
        return {
          userId,
          accessToken: metaAccount?.accessToken
            ? safeDecryptToken(metaAccount.accessToken)
            : null,
          adAccountId: metaAccount?.metaAccountId ?? null,
          conversationId: '',
        }
      }
    )
)

container.registerSingleton(
  DI_TOKENS.ActionConfirmationService,
  () =>
    new ActionConfirmationService(
      container.resolve<IPendingActionRepository>(DI_TOKENS.PendingActionRepository),
      container.resolve<IConversationRepository>(DI_TOKENS.ConversationRepository),
      container.resolve<IToolRegistry>(DI_TOKENS.ToolRegistry),
      async (userId: string) => ({
        userId,
        accessToken: null,
        adAccountId: null,
        conversationId: '',
      })
    )
)

container.registerSingleton(
  DI_TOKENS.ProactiveAlertService,
  () =>
    new ProactiveAlertService(
      container.resolve(DI_TOKENS.CampaignRepository),
      container.resolve(DI_TOKENS.KPIRepository),
      container.resolve(DI_TOKENS.AlertRepository)
    )
)

// KPI Insights Service (Singleton)
container.registerSingleton(
  DI_TOKENS.KPIInsightsService,
  () =>
    new KPIInsightsService(
      container.resolve(DI_TOKENS.KPIRepository),
      container.resolve(DI_TOKENS.CampaignRepository),
      container.resolve<IAIService>(DI_TOKENS.AIService)
    )
)

// Register Infrastructure Services (Singletons)
container.registerSingleton<IReportPDFGenerator>(
  DI_TOKENS.ReportPDFGenerator,
  () => new ReportPDFGenerator()
)

container.registerSingleton<IEmailService>(
  DI_TOKENS.EmailService,
  () => new EmailService(env.RESEND_API_KEY || '')
)

// Register Marketing Intelligence Services (Singletons)
container.registerSingleton<IKnowledgeBaseService>(
  DI_TOKENS.KnowledgeBaseService,
  () => new KnowledgeBaseService()
)

container.registerSingleton<IResearchService>(
  DI_TOKENS.ResearchService,
  () => new PerplexityResearchService(process.env.PERPLEXITY_API_KEY)
)

container.registerSingleton(DI_TOKENS.MarketingIntelligenceService, () => {
  const knowledgeBase = container.resolve<IKnowledgeBaseService>(DI_TOKENS.KnowledgeBaseService)
  const researchEnabled = process.env.RESEARCH_ENABLED === 'true'
  const researchService = researchEnabled
    ? container.resolve<IResearchService>(DI_TOKENS.ResearchService)
    : undefined
  return new MarketingIntelligenceService(knowledgeBase, researchService)
})

container.registerSingleton<IAIService>(
  DI_TOKENS.ScienceAIService,
  () =>
    new ScienceAIService(
      container.resolve(DI_TOKENS.AIService),
      container.resolve(DI_TOKENS.MarketingIntelligenceService)
    )
)

// Register Use Cases (Transient - new instance each time)
container.register(
  DI_TOKENS.CreateCampaignUseCase,
  () =>
    new CreateCampaignUseCase(
      container.resolve(DI_TOKENS.CampaignRepository),
      container.resolve(DI_TOKENS.MetaAdsService),
      container.resolve(DI_TOKENS.UsageLogRepository)
    )
)

container.register(
  DI_TOKENS.UpdateCampaignUseCase,
  () =>
    new UpdateCampaignUseCase(
      container.resolve(DI_TOKENS.CampaignRepository),
      container.resolve(DI_TOKENS.MetaAdsService)
    )
)

container.register(
  DI_TOKENS.PauseCampaignUseCase,
  () =>
    new PauseCampaignUseCase(
      container.resolve(DI_TOKENS.CampaignRepository),
      container.resolve(DI_TOKENS.MetaAdsService)
    )
)

container.register(
  DI_TOKENS.ResumeCampaignUseCase,
  () =>
    new ResumeCampaignUseCase(
      container.resolve(DI_TOKENS.CampaignRepository),
      container.resolve(DI_TOKENS.MetaAdsService)
    )
)

container.register(
  DI_TOKENS.DeleteCampaignUseCase,
  () => new DeleteCampaignUseCase(container.resolve(DI_TOKENS.CampaignRepository))
)

container.register(
  DI_TOKENS.GetCampaignUseCase,
  () => new GetCampaignUseCase(container.resolve(DI_TOKENS.CampaignRepository))
)

container.register(
  DI_TOKENS.ListCampaignsUseCase,
  () => new ListCampaignsUseCase(container.resolve(DI_TOKENS.CampaignRepository))
)

container.register(
  DI_TOKENS.SyncCampaignsUseCase,
  () =>
    new SyncCampaignsUseCase(
      container.resolve(DI_TOKENS.CampaignRepository),
      container.resolve(DI_TOKENS.MetaAdsService)
    )
)

container.register(
  DI_TOKENS.GenerateWeeklyReportUseCase,
  () =>
    new GenerateWeeklyReportUseCase(
      container.resolve(DI_TOKENS.ReportRepository),
      container.resolve(DI_TOKENS.CampaignRepository),
      container.resolve(DI_TOKENS.KPIRepository),
      container.resolve(DI_TOKENS.AIService),
      container.resolve(DI_TOKENS.UsageLogRepository)
    )
)

container.register(
  DI_TOKENS.GetDashboardKPIUseCase,
  () =>
    new GetDashboardKPIUseCase(
      container.resolve(DI_TOKENS.CampaignRepository),
      container.resolve(DI_TOKENS.KPIRepository)
    )
)

container.register(
  DI_TOKENS.SyncMetaInsightsUseCase,
  () =>
    new SyncMetaInsightsUseCase(
      container.resolve(DI_TOKENS.CampaignRepository),
      container.resolve(DI_TOKENS.KPIRepository),
      container.resolve(DI_TOKENS.MetaAdsService)
    )
)

container.register(
  DI_TOKENS.SyncAllInsightsUseCase,
  () =>
    new SyncAllInsightsUseCase(
      container.resolve(DI_TOKENS.CampaignRepository),
      container.resolve(DI_TOKENS.KPIRepository),
      container.resolve(DI_TOKENS.MetaAdsService)
    )
)

// AdSet Repository (Singleton)
container.registerSingleton<IAdSetRepository>(
  DI_TOKENS.AdSetRepository,
  () => new PrismaAdSetRepository(prisma)
)

// AdSet Use Cases (Transient)
container.register(
  DI_TOKENS.CreateAdSetUseCase,
  () =>
    new CreateAdSetUseCase(
      container.resolve(DI_TOKENS.CampaignRepository),
      container.resolve(DI_TOKENS.AdSetRepository)
    )
)

container.register(
  DI_TOKENS.UpdateAdSetUseCase,
  () => new UpdateAdSetUseCase(container.resolve(DI_TOKENS.AdSetRepository))
)

container.register(
  DI_TOKENS.DeleteAdSetUseCase,
  () => new DeleteAdSetUseCase(container.resolve(DI_TOKENS.AdSetRepository))
)

container.register(
  DI_TOKENS.ListAdSetsUseCase,
  () => new ListAdSetsUseCase(container.resolve(DI_TOKENS.AdSetRepository))
)

// Ad Repository (Singleton)
container.registerSingleton<IAdRepository>(
  DI_TOKENS.AdRepository,
  () => new PrismaAdRepository(prisma)
)

// Creative Repository (Singleton)
container.registerSingleton<ICreativeRepository>(
  DI_TOKENS.CreativeRepository,
  () => new PrismaCreativeRepository(prisma)
)

// CreativeAsset Repository (Singleton)
container.registerSingleton<ICreativeAssetRepository>(
  DI_TOKENS.CreativeAssetRepository,
  () => new PrismaCreativeAssetRepository(prisma)
)

// Blob Storage Service (Singleton)
container.registerSingleton<IBlobStorageService>(
  DI_TOKENS.BlobStorageService,
  () => new BlobStorageService()
)

// Ad Use Cases (Transient)
container.register(
  DI_TOKENS.CreateAdUseCase,
  () =>
    new CreateAdUseCase(
      container.resolve(DI_TOKENS.AdRepository),
      container.resolve(DI_TOKENS.AdSetRepository),
      container.resolve(DI_TOKENS.CreativeRepository)
    )
)

// Creative Use Cases (Transient)
container.register(
  DI_TOKENS.CreateCreativeUseCase,
  () => new CreateCreativeUseCase(container.resolve(DI_TOKENS.CreativeRepository))
)

container.register(
  DI_TOKENS.UploadAssetUseCase,
  () =>
    new UploadAssetUseCase(
      container.resolve(DI_TOKENS.CreativeAssetRepository),
      container.resolve(DI_TOKENS.BlobStorageService)
    )
)

// Advantage+ Campaign Use Case (Transient)
container.register(
  DI_TOKENS.CreateAdvantageCampaignUseCase,
  () =>
    new CreateAdvantageCampaignUseCase(
      container.resolve(DI_TOKENS.CampaignRepository),
      container.resolve(DI_TOKENS.AdSetRepository),
      container.resolve(DI_TOKENS.MetaAdsService),
      container.resolve(DI_TOKENS.UsageLogRepository)
    )
)

// Pixel Use Cases
container.register(
  DI_TOKENS.ListUserPixelsUseCase,
  () => new ListUserPixelsUseCase(container.resolve(DI_TOKENS.MetaPixelRepository))
)

container.register(
  DI_TOKENS.SelectPixelUseCase,
  () => new SelectPixelUseCase(container.resolve(DI_TOKENS.MetaPixelRepository))
)

// Payment Use Cases
container.register(
  DI_TOKENS.IssueBillingKeyUseCase,
  () =>
    new IssueBillingKeyUseCase(
      container.resolve(DI_TOKENS.BillingKeyRepository),
      container.resolve(DI_TOKENS.PaymentGateway)
    )
)

container.register(
  DI_TOKENS.SubscribePlanUseCase,
  () =>
    new SubscribePlanUseCase(
      container.resolve(DI_TOKENS.BillingKeyRepository),
      container.resolve(DI_TOKENS.SubscriptionRepository),
      container.resolve(DI_TOKENS.InvoiceRepository),
      container.resolve(DI_TOKENS.PaymentLogRepository),
      container.resolve(DI_TOKENS.PaymentGateway)
    )
)

container.register(
  DI_TOKENS.CancelSubscriptionUseCase,
  () =>
    new CancelSubscriptionUseCase(
      container.resolve(DI_TOKENS.SubscriptionRepository),
      container.resolve(DI_TOKENS.BillingKeyRepository)
    )
)

container.register(
  DI_TOKENS.ChangePlanUseCase,
  () =>
    new ChangePlanUseCase(
      container.resolve(DI_TOKENS.SubscriptionRepository),
      container.resolve(DI_TOKENS.BillingKeyRepository),
      container.resolve(DI_TOKENS.InvoiceRepository),
      container.resolve(DI_TOKENS.PaymentLogRepository),
      container.resolve(DI_TOKENS.PaymentGateway)
    )
)

container.register(
  DI_TOKENS.GetPaymentHistoryUseCase,
  () => new GetPaymentHistoryUseCase(container.resolve(DI_TOKENS.PaymentLogRepository))
)

// Optimization Repository (Singleton)
container.registerSingleton<IOptimizationRuleRepository>(
  DI_TOKENS.OptimizationRuleRepository,
  () => new PrismaOptimizationRuleRepository(prisma)
)

// Optimization Use Cases (Transient)
container.register(
  DI_TOKENS.AutoOptimizeCampaignUseCase,
  () =>
    new AutoOptimizeCampaignUseCase(
      container.resolve(DI_TOKENS.CampaignRepository),
      container.resolve(DI_TOKENS.MetaAdsService)
    )
)

container.register(
  DI_TOKENS.CreateOptimizationRuleUseCase,
  () => new CreateOptimizationRuleUseCase(container.resolve(DI_TOKENS.OptimizationRuleRepository))
)

container.register(
  DI_TOKENS.UpdateOptimizationRuleUseCase,
  () => new UpdateOptimizationRuleUseCase(container.resolve(DI_TOKENS.OptimizationRuleRepository))
)

container.register(
  DI_TOKENS.DeleteOptimizationRuleUseCase,
  () => new DeleteOptimizationRuleUseCase(container.resolve(DI_TOKENS.OptimizationRuleRepository))
)

container.register(
  DI_TOKENS.ListOptimizationRulesUseCase,
  () => new ListOptimizationRulesUseCase(container.resolve(DI_TOKENS.OptimizationRuleRepository))
)

container.register(
  DI_TOKENS.EvaluateOptimizationRulesUseCase,
  () =>
    new EvaluateOptimizationRulesUseCase(
      container.resolve(DI_TOKENS.OptimizationRuleRepository),
      container.resolve(DI_TOKENS.CampaignRepository),
      container.resolve(DI_TOKENS.KPIRepository),
      container.resolve(DI_TOKENS.AutoOptimizeCampaignUseCase)
    )
)

// 절감 금액 계산 UseCase
container.register(
  DI_TOKENS.CalculateSavingsUseCase,
  () =>
    new CalculateSavingsUseCase(
      container.resolve(DI_TOKENS.OptimizationRuleRepository),
      container.resolve(DI_TOKENS.CampaignRepository),
      container.resolve(DI_TOKENS.KPIRepository)
    )
)

// Audit Use Cases
container.register(
  DI_TOKENS.AuditAdAccountUseCase,
  () => new AuditAdAccountUseCase(container.resolve(DI_TOKENS.MetaAdsService))
)

// Feedback Analytics Use Cases
container.register(
  DI_TOKENS.GetFeedbackAnalyticsUseCase,
  () => new GetFeedbackAnalyticsUseCase(container.resolve(DI_TOKENS.AIFeedbackRepository))
)

export { container, DI_TOKENS }

// Convenience functions for resolving dependencies
export function getCampaignRepository(): ICampaignRepository {
  return container.resolve(DI_TOKENS.CampaignRepository)
}

export function getReportRepository(): IReportRepository {
  return container.resolve(DI_TOKENS.ReportRepository)
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

// Competitor Tracking Repository (Singleton)
container.registerSingleton<ICompetitorTrackingRepository>(
  DI_TOKENS.CompetitorTrackingRepository,
  () => new PrismaCompetitorTrackingRepository(prisma)
)

// Competitor Tracking Use Cases (Transient)
container.register(
  DI_TOKENS.TrackCompetitorUseCase,
  () => new TrackCompetitorUseCase(container.resolve(DI_TOKENS.CompetitorTrackingRepository))
)

container.register(
  DI_TOKENS.UntrackCompetitorUseCase,
  () => new UntrackCompetitorUseCase(container.resolve(DI_TOKENS.CompetitorTrackingRepository))
)

container.register(
  DI_TOKENS.GetTrackedCompetitorsUseCase,
  () => new GetTrackedCompetitorsUseCase(container.resolve(DI_TOKENS.CompetitorTrackingRepository))
)

// Token Management Use Cases (Transient)
container.register(DI_TOKENS.RefreshMetaTokenUseCase, () => new RefreshMetaTokenUseCase())

export function getRefreshMetaTokenUseCase(): RefreshMetaTokenUseCase {
  return container.resolve(DI_TOKENS.RefreshMetaTokenUseCase)
}

// ConversionEvent Repository (Singleton)
container.registerSingleton<IConversionEventRepository>(
  DI_TOKENS.ConversionEventRepository,
  () => new PrismaConversionEventRepository(prisma)
)

// SendCAPIEvents Use Case (Transient)
container.register(
  DI_TOKENS.SendCAPIEventsUseCase,
  () =>
    new SendCAPIEventsUseCase(
      container.resolve(DI_TOKENS.ConversionEventRepository),
      container.resolve(DI_TOKENS.CAPIService)
    )
)

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

// Guide Question Service (Singleton)
container.registerSingleton<IGuideQuestionService>(
  DI_TOKENS.GuideQuestionService,
  () => new GuideQuestionService({ questions: {}, maxQuestionsPerIntent: 5 })
)

export function getGuideQuestionService(): IGuideQuestionService {
  return container.resolve(DI_TOKENS.GuideQuestionService)
}

// Conversation Summarizer Service
container.register<ConversationSummarizerService>(
  DI_TOKENS.ConversationSummarizerService,
  () => new ConversationSummarizerService(container.resolve<IAIService>(DI_TOKENS.AIService))
)

export function getConversationSummarizerService(): ConversationSummarizerService {
  return container.resolve(DI_TOKENS.ConversationSummarizerService)
}

export function getKPIInsightsService(): KPIInsightsService {
  return container.resolve(DI_TOKENS.KPIInsightsService)
}
