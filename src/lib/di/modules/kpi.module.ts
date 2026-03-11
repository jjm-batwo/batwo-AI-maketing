/**
 * KPI Module - DI 등록
 *
 * KPI/대시보드 관련 Repository, Service, Use Case 등록
 */

import type { Container } from '../container'
import { DI_TOKENS } from '../types'

// Repository interfaces
import type { IKPIRepository } from '@domain/repositories/IKPIRepository'
import type { IInsightHistoryRepository } from '@domain/repositories/IInsightHistoryRepository'
import type { IAIService } from '@application/ports/IAIService'
import type { ICacheService } from '@application/ports/ICacheService'

// Infrastructure implementations
import { PrismaKPIRepository } from '@infrastructure/database/repositories/PrismaKPIRepository'
import { PrismaInsightHistoryRepository } from '@infrastructure/database/repositories/PrismaInsightHistoryRepository'

// Application services
import { KPIInsightsService } from '@application/services/KPIInsightsService'
import { PerformanceBenchmarkService } from '@application/services/PerformanceBenchmarkService'

// Use Cases
import { GetDashboardKPIUseCase } from '@application/use-cases/kpi/GetDashboardKPIUseCase'
import { GetLiveDashboardKPIUseCase } from '@application/use-cases/kpi/GetLiveDashboardKPIUseCase'
import { SyncMetaInsightsUseCase } from '@application/use-cases/kpi/SyncMetaInsightsUseCase'
import { SyncAllInsightsUseCase } from '@application/use-cases/kpi/SyncAllInsightsUseCase'

import { prisma } from '@/lib/prisma'

export function registerKPIModule(container: Container): void {
  // --- Repositories ---
  container.registerSingleton<IKPIRepository>(
    DI_TOKENS.KPIRepository,
    () => new PrismaKPIRepository(prisma)
  )

  container.registerSingleton<IInsightHistoryRepository>(
    DI_TOKENS.InsightHistoryRepository,
    () => new PrismaInsightHistoryRepository(prisma)
  )

  // --- KPI Insights Service ---
  container.registerSingleton(DI_TOKENS.KPIInsightsService, () => {
    return new KPIInsightsService(
      container.resolve(DI_TOKENS.KPIRepository),
      container.resolve(DI_TOKENS.CampaignRepository),
      container.resolve<IAIService>(DI_TOKENS.AIService),
      container.resolve<ICacheService>(DI_TOKENS.CacheService),
      container.resolve<IInsightHistoryRepository>(DI_TOKENS.InsightHistoryRepository)
    )
  })

  container.registerSingleton(DI_TOKENS.PerformanceBenchmarkService, () => {
    return new PerformanceBenchmarkService(
      container.resolve(DI_TOKENS.KPIRepository),
      container.resolve(DI_TOKENS.CampaignRepository)
    )
  })

  // --- Use Cases (Transient) ---
  container.register(
    DI_TOKENS.GetDashboardKPIUseCase,
    () =>
      new GetDashboardKPIUseCase(
        container.resolve(DI_TOKENS.CampaignRepository),
        container.resolve(DI_TOKENS.KPIRepository)
      )
  )

  container.register(
    DI_TOKENS.GetLiveDashboardKPIUseCase,
    () =>
      new GetLiveDashboardKPIUseCase(
        container.resolve(DI_TOKENS.CampaignRepository),
        container.resolve(DI_TOKENS.MetaAdsService),
        container.resolve(DI_TOKENS.MetaAdAccountRepository)
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
        container.resolve(DI_TOKENS.MetaAdsService),
        container.resolve(DI_TOKENS.MetaAdAccountRepository)
      )
  )
}
