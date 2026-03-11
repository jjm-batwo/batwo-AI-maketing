/**
 * Report Module - DI 등록
 *
 * 리포트 생성 관련 Repository, Use Case 등록
 */

import type { Container } from '../container'
import { DI_TOKENS } from '../types'

// Repository interfaces
import type { IReportRepository } from '@domain/repositories/IReportRepository'

// Infrastructure implementations
import { PrismaReportRepository } from '@infrastructure/database/repositories/PrismaReportRepository'

// Use Cases
import { GenerateWeeklyReportUseCase } from '@application/use-cases/report/GenerateWeeklyReportUseCase'

import { prisma } from '@/lib/prisma'

export function registerReportModule(container: Container): void {
  // --- Repositories ---
  container.registerSingleton<IReportRepository>(
    DI_TOKENS.ReportRepository,
    () => new PrismaReportRepository(prisma)
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
        container.resolve(DI_TOKENS.UsageLogRepository)
      )
  )
}
