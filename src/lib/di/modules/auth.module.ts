/**
 * Auth Module - DI 등록
 *
 * 인증/사용자/팀 관련 Repository, Service 등록
 * Conversational Agent 서비스 포함
 */

import type { Container } from '../container'
import { DI_TOKENS } from '../types'

// Repository interfaces
import type { IUserRepository } from '@domain/repositories/IUserRepository'
import type { ITeamRepository } from '@domain/repositories/ITeamRepository'
import type { IAIFeedbackRepository } from '@domain/repositories/IAIFeedbackRepository'
import type { IConversationRepository } from '@domain/repositories/IConversationRepository'
import type { IPendingActionRepository } from '@domain/repositories/IPendingActionRepository'
import type { IAlertRepository } from '@domain/repositories/IAlertRepository'

// Port interfaces
import type { IToolRegistry } from '@application/ports/IConversationalAgent'
import type { IResilienceService } from '@application/ports/IResilienceService'
import type { IAIService } from '@application/ports/IAIService'
import type { IGuideQuestionService } from '@application/ports/IGuideQuestionService'

// Infrastructure implementations
import { PrismaUserRepository } from '@infrastructure/database/repositories/PrismaUserRepository'
import { PrismaTeamRepository } from '@infrastructure/database/repositories/PrismaTeamRepository'
import { PrismaAIFeedbackRepository } from '@infrastructure/database/repositories/PrismaAIFeedbackRepository'
import { PrismaConversationRepository } from '@infrastructure/database/repositories/PrismaConversationRepository'
import { PrismaPendingActionRepository } from '@infrastructure/database/repositories/PrismaPendingActionRepository'
import { PrismaAlertRepository } from '@infrastructure/database/repositories/PrismaAlertRepository'

// Application services
import { registerAllTools } from '@application/tools/registerAllTools'
import { ConversationalAgentService } from '@application/services/ConversationalAgentService'
import { ActionConfirmationService } from '@application/services/ActionConfirmationService'
import { ProactiveAlertService } from '@application/services/ProactiveAlertService'
import { GuideQuestionService } from '@application/services/GuideQuestionService'
import { ConversationSummarizerService } from '@application/services/ConversationSummarizerService'

// Use Cases
import { GetFeedbackAnalyticsUseCase } from '@application/use-cases/ai/GetFeedbackAnalyticsUseCase'

import { safeDecryptToken } from '@application/utils/TokenEncryption'
import { prisma } from '@/lib/prisma'

export function registerAuthModule(container: Container): void {
  // --- Repositories ---
  container.registerSingleton<IUserRepository>(
    DI_TOKENS.UserRepository,
    () => new PrismaUserRepository(prisma)
  )

  container.registerSingleton<ITeamRepository>(
    DI_TOKENS.TeamRepository,
    () => new PrismaTeamRepository(prisma)
  )

  container.registerSingleton<IAIFeedbackRepository>(
    DI_TOKENS.AIFeedbackRepository,
    () => new PrismaAIFeedbackRepository(prisma)
  )

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

  // --- Conversational Agent Services ---
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
            accessToken: metaAccount?.accessToken ? safeDecryptToken(metaAccount.accessToken) : null,
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

  // --- Guide Question Service ---
  container.registerSingleton<IGuideQuestionService>(
    DI_TOKENS.GuideQuestionService,
    () => new GuideQuestionService({ questions: {}, maxQuestionsPerIntent: 5 })
  )

  // --- Conversation Summarizer ---
  container.register<ConversationSummarizerService>(
    DI_TOKENS.ConversationSummarizerService,
    () => new ConversationSummarizerService(container.resolve<IAIService>(DI_TOKENS.AIService))
  )

  // --- Feedback Analytics ---
  container.register(
    DI_TOKENS.GetFeedbackAnalyticsUseCase,
    () => new GetFeedbackAnalyticsUseCase(container.resolve(DI_TOKENS.AIFeedbackRepository))
  )
}
