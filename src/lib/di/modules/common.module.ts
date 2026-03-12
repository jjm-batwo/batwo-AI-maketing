/**
 * Common Module - DI 등록
 *
 * 범용 인프라 서비스: 캐시, 리질리언스, AI, 스토리지, 이메일, PDF 등
 */

import type { Container } from '../container'
import { DI_TOKENS } from '../types'
import { env } from '@/lib/env'

// Port interfaces
import type { IAIService } from '@application/ports/IAIService'
import type { IStreamingAIService } from '@application/ports/IStreamingAIService'
import type { ICacheService } from '@application/ports/ICacheService'
import type { IResilienceService } from '@application/ports/IResilienceService'
import type { IPromptTemplateService } from '@application/ports/IPromptTemplateService'
import type { IFallbackResponseService } from '@application/ports/IFallbackResponseService'
import type { IFewShotExampleRegistry } from '@application/ports/IFewShotExampleRegistry'
import type { IEmailService } from '@application/ports/IEmailService'
import type { IReportPDFGenerator } from '@infrastructure/pdf/ReportPDFGenerator'
import type { IBlobStorageService } from '@infrastructure/storage/BlobStorageService'
import type { IKnowledgeBaseService } from '@application/ports/IKnowledgeBaseService'
import type { IResearchService } from '@application/ports/IResearchService'

// Infrastructure implementations
import { AIService } from '@infrastructure/external/openai/AIService'
import { StreamingAIService } from '@infrastructure/external/openai/streaming/StreamingAIService'
import { RedisCacheService } from '@infrastructure/cache/RedisCacheService'
import { MemoryCacheService } from '@infrastructure/cache/MemoryCacheService'
import { ResilienceService } from '@infrastructure/external/errors/ResilienceService'
import { PromptTemplateService } from '@application/services/PromptTemplateService'
import { FallbackResponseService } from '@application/services/FallbackResponseService'
import { FewShotExampleRegistry } from '@application/services/FewShotExampleRegistry'
import { ReportPDFGenerator } from '@infrastructure/pdf/ReportPDFGenerator'
import { EmailService } from '@infrastructure/email/EmailService'
import { BlobStorageService } from '@infrastructure/storage/BlobStorageService'
import { KnowledgeBaseService } from '@infrastructure/knowledge'
import { PerplexityResearchService } from '@infrastructure/external/research'
import { ScienceAIService } from '@infrastructure/external/openai/ScienceAIService'
import { MarketingIntelligenceService } from '@application/services/MarketingIntelligenceService'

// Application Services
import { QuotaService } from '@application/services/QuotaService'
import { PermissionService } from '@application/services/PermissionService'

import type { IPermissionRepository } from '@domain/repositories/IPermissionRepository'
import { PrismaPermissionRepository } from '@infrastructure/database/repositories/PrismaPermissionRepository'

import { prisma } from '@/lib/prisma'

import type { IAppConfig } from '@application/ports/IAppConfig'

export function registerCommonModule(container: Container): void {
  // --- App Configuration ---
  container.registerSingleton<IAppConfig>(DI_TOKENS.AppConfig, () => ({
    nodeEnv: process.env.NODE_ENV || 'development',
    metaAppId: process.env.META_APP_ID,
    metaAppSecret: process.env.META_APP_SECRET,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://batwo.ai',
  }))
  // --- AI Services ---
  container.registerSingleton<IAIService>(
    DI_TOKENS.AIService,
    () => new AIService(process.env.OPENAI_API_KEY || '', process.env.OPENAI_MODEL || 'gpt-4o-mini')
  )

  container.registerSingleton<IStreamingAIService>(
    DI_TOKENS.StreamingAIService,
    () => new StreamingAIService(process.env.OPENAI_MODEL || 'gpt-4o-mini')
  )

  // --- Resilience ---
  container.registerSingleton<IResilienceService>(
    DI_TOKENS.ResilienceService,
    () => new ResilienceService()
  )

  // --- Prompt / Fallback / Few-Shot ---
  container.registerSingleton<IPromptTemplateService>(
    DI_TOKENS.PromptTemplateService,
    () => new PromptTemplateService()
  )

  container.registerSingleton<IFallbackResponseService>(
    DI_TOKENS.FallbackResponseService,
    () =>
      new FallbackResponseService(
        container.resolve<IResilienceService>(DI_TOKENS.ResilienceService)
      )
  )

  container.registerSingleton<IFewShotExampleRegistry>(
    DI_TOKENS.FewShotExampleRegistry,
    () => new FewShotExampleRegistry()
  )

  // --- Cache Service ---
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

  // --- Infrastructure Services ---
  container.registerSingleton<IReportPDFGenerator>(
    DI_TOKENS.ReportPDFGenerator,
    () => new ReportPDFGenerator()
  )

  container.registerSingleton<IEmailService>(
    DI_TOKENS.EmailService,
    () => new EmailService(env.RESEND_API_KEY || '')
  )

  container.registerSingleton<IBlobStorageService>(
    DI_TOKENS.BlobStorageService,
    () => new BlobStorageService()
  )

  // --- Marketing Intelligence ---
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

  // --- Application Services ---
  container.registerSingleton(
    DI_TOKENS.QuotaService,
    () =>
      new QuotaService(
        container.resolve(DI_TOKENS.UsageLogRepository),
        container.resolve(DI_TOKENS.UserRepository),
        container.resolve(DI_TOKENS.SubscriptionRepository)
      )
  )

  container.registerSingleton<IPermissionRepository>(
    DI_TOKENS.PermissionRepository,
    () => new PrismaPermissionRepository(prisma)
  )

  container.registerSingleton(
    DI_TOKENS.PermissionService,
    () =>
      new PermissionService(
        container.resolve<IPermissionRepository>(DI_TOKENS.PermissionRepository)
      )
  )
}
