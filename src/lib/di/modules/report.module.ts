/**
 * Report Module - DI 등록
 *
 * 리포트 생성 관련 Repository, Use Case 등록
 */

import type { Container } from '../container'
import { DI_TOKENS } from '../types'

// Repository interfaces
import type { IReportRepository } from '@domain/repositories/IReportRepository'
import type { IReportScheduleRepository } from '@domain/repositories/IReportScheduleRepository'

// Infrastructure implementations
import { PrismaReportRepository } from '@infrastructure/database/repositories/PrismaReportRepository'
import { PrismaReportScheduleRepository } from '@infrastructure/database/repositories/PrismaReportScheduleRepository'

// Use Cases
import { GenerateWeeklyReportUseCase } from '@application/use-cases/report/GenerateWeeklyReportUseCase'
import { SendScheduledReportsUseCase } from '@application/use-cases/report/SendScheduledReportsUseCase'

// Phase 2: Enhanced Report Services
import { EnhancedReportDataBuilder } from '@application/services/EnhancedReportDataBuilder'
import { CreativeFatigueService } from '@application/services/CreativeFatigueService'
import { FunnelClassificationService } from '@application/services/FunnelClassificationService'

import { prisma } from '@/lib/prisma'

export function registerReportModule(container: Container): void {
  // --- Repositories ---
  container.registerSingleton<IReportRepository>(
    DI_TOKENS.ReportRepository,
    () => new PrismaReportRepository(prisma)
  )

  container.registerSingleton<IReportScheduleRepository>(
    DI_TOKENS.ReportScheduleRepository,
    () => new PrismaReportScheduleRepository(prisma)
  )

  // --- Phase 2: Enhanced Report ---
  container.registerSingleton(
    DI_TOKENS.CreativeFatigueService,
    () => new CreativeFatigueService()
  )

  container.registerSingleton(
    DI_TOKENS.FunnelClassificationService,
    () => new FunnelClassificationService()
  )

  container.register(
    DI_TOKENS.EnhancedReportDataBuilder,
    () => new EnhancedReportDataBuilder(
      container.resolve(DI_TOKENS.KPIRepository),
      container.resolve(DI_TOKENS.AdKPIRepository),
      container.resolve(DI_TOKENS.CampaignRepository),
      container.resolve(DI_TOKENS.CreativeFatigueService),
      container.resolve(DI_TOKENS.FunnelClassificationService),
      container.resolve(DI_TOKENS.AIService)
    )
  )

  // --- Use Cases (Transient) ---
  container.register(
    DI_TOKENS.GenerateWeeklyReportUseCase,
    () =>
      new GenerateWeeklyReportUseCase(
        container.resolve(DI_TOKENS.ReportRepository),
        container.resolve(DI_TOKENS.CampaignRepository),
        container.resolve(DI_TOKENS.KPIRepository),
        container.resolve(DI_TOKENS.AIService),
        container.resolve(DI_TOKENS.UsageLogRepository),
        container.resolve(DI_TOKENS.EnhancedReportDataBuilder)
      )
  )

  container.register(
    DI_TOKENS.SendScheduledReportsUseCase,
    () =>
      new SendScheduledReportsUseCase(
        container.resolve(DI_TOKENS.ReportScheduleRepository),
        container.resolve(DI_TOKENS.ReportRepository),
        container.resolve(DI_TOKENS.EmailService)
      )
  )
}
