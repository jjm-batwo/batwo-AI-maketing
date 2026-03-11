/**
 * Campaign Module - DI 등록
 *
 * 캠페인 도메인 관련 Repository, Service, Use Case 등록
 */

import type { Container } from '../container'
import { DI_TOKENS } from '../types'

// Repository interfaces
import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import type { IAdSetRepository } from '@domain/repositories/IAdSetRepository'
import type { IAdRepository } from '@domain/repositories/IAdRepository'
import type { ICreativeRepository } from '@domain/repositories/ICreativeRepository'
import type { ICreativeAssetRepository } from '@domain/repositories/ICreativeAssetRepository'
import type { IABTestRepository } from '@domain/repositories/IABTestRepository'
import type { IUsageLogRepository } from '@domain/repositories/IUsageLogRepository'
import type { IBudgetAlertRepository } from '@domain/repositories/IBudgetAlertRepository'

// Infrastructure implementations
import { PrismaCampaignRepository } from '@infrastructure/database/repositories/PrismaCampaignRepository'
import { PrismaAdSetRepository } from '@infrastructure/database/repositories/PrismaAdSetRepository'
import { PrismaAdRepository } from '@infrastructure/database/repositories/PrismaAdRepository'
import { PrismaCreativeRepository } from '@infrastructure/database/repositories/PrismaCreativeRepository'
import { PrismaCreativeAssetRepository } from '@infrastructure/database/repositories/PrismaCreativeAssetRepository'
import { PrismaABTestRepository } from '@infrastructure/database/repositories/PrismaABTestRepository'
import { PrismaUsageLogRepository } from '@infrastructure/database/repositories/PrismaUsageLogRepository'
import { PrismaBudgetAlertRepository } from '@infrastructure/database/repositories/PrismaBudgetAlertRepository'

// Application services
import { BudgetAlertService } from '@application/services/BudgetAlertService'
import { AnomalyDetectionService } from '@application/services/AnomalyDetectionService'
import { AnomalyRootCauseService } from '@application/services/AnomalyRootCauseService'
import { AnomalySegmentAnalysisService } from '@application/services/AnomalySegmentAnalysisService'
import { AdAccountAuditService } from '@application/services/AdAccountAuditService'
import { CopyLearningService } from '@application/services/CopyLearningService'
import { CampaignAnalyzer } from '@application/services/CampaignAnalyzer'
import { CompetitorBenchmarkService } from '@application/services/CompetitorBenchmarkService'
import { TargetingRecommendationService } from '@application/services/TargetingRecommendationService'
import { ABTestAnalysisService } from '@application/services/ABTestAnalysisService'

// Campaign Use Cases
import { CreateCampaignUseCase } from '@application/use-cases/campaign/CreateCampaignUseCase'
import { UpdateCampaignUseCase } from '@application/use-cases/campaign/UpdateCampaignUseCase'
import { PauseCampaignUseCase } from '@application/use-cases/campaign/PauseCampaignUseCase'
import { ResumeCampaignUseCase } from '@application/use-cases/campaign/ResumeCampaignUseCase'
import { DeleteCampaignUseCase } from '@application/use-cases/campaign/DeleteCampaignUseCase'
import { GetCampaignUseCase } from '@application/use-cases/campaign/GetCampaignUseCase'
import { ListCampaignsUseCase } from '@application/use-cases/campaign/ListCampaignsUseCase'
import { SyncCampaignsUseCase } from '@application/use-cases/campaign/SyncCampaignsUseCase'
import { CreateAdvantageCampaignUseCase } from '@application/use-cases/campaign/CreateAdvantageCampaignUseCase'

// AdSet Use Cases
import { CreateAdSetUseCase } from '@application/use-cases/adset/CreateAdSetUseCase'
import { UpdateAdSetUseCase } from '@application/use-cases/adset/UpdateAdSetUseCase'
import { DeleteAdSetUseCase } from '@application/use-cases/adset/DeleteAdSetUseCase'
import { ListAdSetsUseCase } from '@application/use-cases/adset/ListAdSetsUseCase'

// Ad Use Cases
import { CreateAdUseCase } from '@application/use-cases/ad/CreateAdUseCase'

// Creative Use Cases
import { CreateCreativeUseCase } from '@application/use-cases/creative/CreateCreativeUseCase'
import { UploadAssetUseCase } from '@application/use-cases/creative/UploadAssetUseCase'

// Audit Use Cases
import { AuditAdAccountUseCase } from '@application/use-cases/audit/AuditAdAccountUseCase'

// Competitor Tracking
import { PrismaCompetitorTrackingRepository } from '@infrastructure/database/repositories/PrismaCompetitorTrackingRepository'
import type { ICompetitorTrackingRepository } from '@domain/repositories/ICompetitorTrackingRepository'
import { TrackCompetitorUseCase } from '@application/use-cases/competitor/TrackCompetitorUseCase'
import { UntrackCompetitorUseCase } from '@application/use-cases/competitor/UntrackCompetitorUseCase'
import { GetTrackedCompetitorsUseCase } from '@application/use-cases/competitor/GetTrackedCompetitorsUseCase'

// Optimization
import { PrismaOptimizationRuleRepository } from '@infrastructure/database/repositories/PrismaOptimizationRuleRepository'
import type { IOptimizationRuleRepository } from '@domain/repositories/IOptimizationRuleRepository'
import { CreateOptimizationRuleUseCase } from '@application/use-cases/optimization/CreateOptimizationRuleUseCase'
import { UpdateOptimizationRuleUseCase } from '@application/use-cases/optimization/UpdateOptimizationRuleUseCase'
import { DeleteOptimizationRuleUseCase } from '@application/use-cases/optimization/DeleteOptimizationRuleUseCase'
import { ListOptimizationRulesUseCase } from '@application/use-cases/optimization/ListOptimizationRulesUseCase'
import { EvaluateOptimizationRulesUseCase } from '@application/use-cases/optimization/EvaluateOptimizationRulesUseCase'
import { AutoOptimizeCampaignUseCase } from '@application/use-cases/optimization/AutoOptimizeCampaignUseCase'
import { CalculateSavingsUseCase } from '@application/use-cases/optimization/CalculateSavingsUseCase'

import { prisma } from '@/lib/prisma'

export function registerCampaignModule(container: Container): void {
  // --- Repositories ---
  container.registerSingleton<ICampaignRepository>(
    DI_TOKENS.CampaignRepository,
    () => new PrismaCampaignRepository(prisma)
  )

  container.registerSingleton<IUsageLogRepository>(
    DI_TOKENS.UsageLogRepository,
    () => new PrismaUsageLogRepository(prisma)
  )

  container.registerSingleton<IABTestRepository>(
    DI_TOKENS.ABTestRepository,
    () => new PrismaABTestRepository(prisma)
  )

  container.registerSingleton<IAdSetRepository>(
    DI_TOKENS.AdSetRepository,
    () => new PrismaAdSetRepository(prisma)
  )

  container.registerSingleton<IAdRepository>(
    DI_TOKENS.AdRepository,
    () => new PrismaAdRepository(prisma)
  )

  container.registerSingleton<ICreativeRepository>(
    DI_TOKENS.CreativeRepository,
    () => new PrismaCreativeRepository(prisma)
  )

  container.registerSingleton<ICreativeAssetRepository>(
    DI_TOKENS.CreativeAssetRepository,
    () => new PrismaCreativeAssetRepository(prisma)
  )

  container.registerSingleton<IBudgetAlertRepository>(
    DI_TOKENS.BudgetAlertRepository,
    () => new PrismaBudgetAlertRepository(prisma)
  )

  container.registerSingleton<ICompetitorTrackingRepository>(
    DI_TOKENS.CompetitorTrackingRepository,
    () => new PrismaCompetitorTrackingRepository(prisma)
  )

  container.registerSingleton<IOptimizationRuleRepository>(
    DI_TOKENS.OptimizationRuleRepository,
    () => new PrismaOptimizationRuleRepository(prisma)
  )

  // --- Application Services ---
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

  container.registerSingleton(
    DI_TOKENS.AdAccountAuditService,
    () => new AdAccountAuditService(
      container.resolve(DI_TOKENS.AnomalyDetectionService),
      container.resolve(DI_TOKENS.PortfolioOptimizationService),
      container.resolve(DI_TOKENS.KPIRepository),
      container.resolve(DI_TOKENS.CampaignRepository)
    )
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

  container.registerSingleton(
    DI_TOKENS.ABTestAnalysisService,
    () => new ABTestAnalysisService(container.resolve(DI_TOKENS.ABTestRepository))
  )

  // --- Campaign Use Cases (Transient) ---
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
        container.resolve(DI_TOKENS.MetaAdsService),
        container.resolve(DI_TOKENS.MetaAdAccountRepository)
      )
  )

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

  // --- AdSet Use Cases (Transient) ---
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

  // --- Ad Use Cases (Transient) ---
  container.register(
    DI_TOKENS.CreateAdUseCase,
    () =>
      new CreateAdUseCase(
        container.resolve(DI_TOKENS.AdRepository),
        container.resolve(DI_TOKENS.AdSetRepository),
        container.resolve(DI_TOKENS.CreativeRepository)
      )
  )

  // --- Creative Use Cases (Transient) ---
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

  // --- Audit Use Cases ---
  container.register(
    DI_TOKENS.AuditAdAccountUseCase,
    () => new AuditAdAccountUseCase(container.resolve(DI_TOKENS.MetaAdsService))
  )

  // --- Competitor Tracking Use Cases (Transient) ---
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

  // --- Optimization Use Cases (Transient) ---
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

  container.register(
    DI_TOKENS.CalculateSavingsUseCase,
    () =>
      new CalculateSavingsUseCase(
        container.resolve(DI_TOKENS.OptimizationRuleRepository),
        container.resolve(DI_TOKENS.CampaignRepository),
        container.resolve(DI_TOKENS.KPIRepository)
      )
  )
}
