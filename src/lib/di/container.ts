/**
 * Dependency Injection Container
 *
 * A simple DI container for managing dependencies in the application.
 * This lightweight implementation provides constructor injection
 * without external DI libraries.
 */

import { DI_TOKENS } from './types'

// Repository interfaces
import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import type { IReportRepository } from '@domain/repositories/IReportRepository'
import type { IKPIRepository } from '@domain/repositories/IKPIRepository'
import type { IUsageLogRepository } from '@domain/repositories/IUsageLogRepository'
import type { IBudgetAlertRepository } from '@domain/repositories/IBudgetAlertRepository'
import type { IABTestRepository } from '@domain/repositories/IABTestRepository'

// Port interfaces
import type { IMetaAdsService } from '@application/ports/IMetaAdsService'
import type { IAIService } from '@application/ports/IAIService'

// Infrastructure implementations
import { PrismaCampaignRepository } from '@infrastructure/database/repositories/PrismaCampaignRepository'
import { PrismaReportRepository } from '@infrastructure/database/repositories/PrismaReportRepository'
import { PrismaKPIRepository } from '@infrastructure/database/repositories/PrismaKPIRepository'
import { PrismaUsageLogRepository } from '@infrastructure/database/repositories/PrismaUsageLogRepository'
import { PrismaBudgetAlertRepository } from '@infrastructure/database/repositories/PrismaBudgetAlertRepository'
import { PrismaABTestRepository } from '@infrastructure/database/repositories/PrismaABTestRepository'
import { MetaAdsClient } from '@infrastructure/external/meta-ads/MetaAdsClient'
import { AIService } from '@infrastructure/external/openai/AIService'

// Application services and use cases
import { QuotaService } from '@application/services/QuotaService'
import { BudgetAlertService } from '@application/services/BudgetAlertService'
import { AnomalyDetectionService } from '@application/services/AnomalyDetectionService'
import { ReportPDFGenerator, type IReportPDFGenerator } from '@infrastructure/pdf/ReportPDFGenerator'
import { EmailService } from '@infrastructure/email/EmailService'
import type { IEmailService } from '@application/ports/IEmailService'
import { CreateCampaignUseCase } from '@application/use-cases/campaign/CreateCampaignUseCase'
import { UpdateCampaignUseCase } from '@application/use-cases/campaign/UpdateCampaignUseCase'
import { PauseCampaignUseCase } from '@application/use-cases/campaign/PauseCampaignUseCase'
import { ResumeCampaignUseCase } from '@application/use-cases/campaign/ResumeCampaignUseCase'
import { GetCampaignUseCase } from '@application/use-cases/campaign/GetCampaignUseCase'
import { ListCampaignsUseCase } from '@application/use-cases/campaign/ListCampaignsUseCase'
import { GenerateWeeklyReportUseCase } from '@application/use-cases/report/GenerateWeeklyReportUseCase'
import { GetDashboardKPIUseCase } from '@application/use-cases/kpi/GetDashboardKPIUseCase'
import { SyncMetaInsightsUseCase } from '@application/use-cases/kpi/SyncMetaInsightsUseCase'

import { prisma } from '@/lib/prisma'

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

// Register External Services (Singletons)
container.registerSingleton<IMetaAdsService>(
  DI_TOKENS.MetaAdsService,
  () => new MetaAdsClient()
)

container.registerSingleton<IAIService>(
  DI_TOKENS.AIService,
  () => new AIService(process.env.OPENAI_API_KEY || '', process.env.OPENAI_MODEL || 'gpt-4o-mini')
)

// Register Application Services (Singletons)
container.registerSingleton(
  DI_TOKENS.QuotaService,
  () => new QuotaService(container.resolve(DI_TOKENS.UsageLogRepository))
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

// Register Infrastructure Services (Singletons)
container.registerSingleton<IReportPDFGenerator>(
  DI_TOKENS.ReportPDFGenerator,
  () => new ReportPDFGenerator()
)

container.registerSingleton<IEmailService>(
  DI_TOKENS.EmailService,
  () => new EmailService(process.env.RESEND_API_KEY || '')
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
  DI_TOKENS.GetCampaignUseCase,
  () => new GetCampaignUseCase(container.resolve(DI_TOKENS.CampaignRepository))
)

container.register(
  DI_TOKENS.ListCampaignsUseCase,
  () => new ListCampaignsUseCase(container.resolve(DI_TOKENS.CampaignRepository))
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

export function getAnomalyDetectionService(): AnomalyDetectionService {
  return container.resolve(DI_TOKENS.AnomalyDetectionService)
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
