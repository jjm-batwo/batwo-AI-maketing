/**
 * Meta Module - DI 등록
 *
 * Meta API 연동 관련 Repository, Service, Use Case 등록
 * (Pixel, CAPI, Token, AdAccount)
 */

import type { Container } from '../container'
import { DI_TOKENS } from '../types'

// Repository interfaces
import type { IMetaPixelRepository } from '@domain/repositories/IMetaPixelRepository'
import type { IConversionEventRepository } from '@domain/repositories/IConversionEventRepository'
import type { IMetaAdAccountRepository } from '@application/ports/IMetaAdAccountRepository'

// Port interfaces
import type { IMetaAdsService } from '@application/ports/IMetaAdsService'
import type { IMetaPixelService } from '@application/ports/IMetaPixelService'
import type { ICAPIService } from '@application/ports/ICAPIService'
import type { IPlatformAdapter } from '@application/ports/IPlatformAdapter'

// Infrastructure implementations
import { PrismaMetaPixelRepository } from '@infrastructure/database/repositories/PrismaMetaPixelRepository'
import { PrismaConversionEventRepository } from '@infrastructure/database/repositories/PrismaConversionEventRepository'
import { PrismaMetaAdAccountRepository } from '@infrastructure/database/repositories/PrismaMetaAdAccountRepository'
import { MetaAdsClient } from '@infrastructure/external/meta-ads/MetaAdsClient'
import { MetaPixelClient } from '@infrastructure/external/meta-pixel/MetaPixelClient'
import { CAPIClient } from '@infrastructure/external/meta-pixel/CAPIClient'
import { Cafe24Adapter } from '@infrastructure/external/platforms/cafe24/Cafe24Adapter'

// Use Cases
import { ListUserPixelsUseCase } from '@application/use-cases/pixel/ListUserPixelsUseCase'
import { SelectPixelUseCase } from '@application/use-cases/pixel/SelectPixelUseCase'
import { SendCAPIEventsUseCase } from '@application/use-cases/pixel/SendCAPIEventsUseCase'
import { GetTrackingHealthUseCase } from '@application/use-cases/pixel/GetTrackingHealthUseCase'
import { RefreshMetaTokenUseCase } from '@application/use-cases/token/RefreshMetaTokenUseCase'

import { safeDecryptToken } from '@application/utils/TokenEncryption'
import { prisma } from '@/lib/prisma'

export function registerMetaModule(container: Container): void {
  // --- Repositories ---
  container.registerSingleton<IMetaPixelRepository>(
    DI_TOKENS.MetaPixelRepository,
    () => new PrismaMetaPixelRepository(prisma)
  )

  container.registerSingleton<IConversionEventRepository>(
    DI_TOKENS.ConversionEventRepository,
    () => new PrismaConversionEventRepository(prisma)
  )

  container.registerSingleton<IMetaAdAccountRepository>(
    DI_TOKENS.MetaAdAccountRepository,
    () => new PrismaMetaAdAccountRepository(prisma)
  )

  // --- External Services ---
  container.registerSingleton<IMetaAdsService>(DI_TOKENS.MetaAdsService, () => new MetaAdsClient())

  container.registerSingleton<IMetaPixelService>(
    DI_TOKENS.MetaPixelService,
    () => new MetaPixelClient()
  )

  container.registerSingleton<ICAPIService>(DI_TOKENS.CAPIService, () => new CAPIClient())

  container.registerSingleton<IPlatformAdapter>(
    DI_TOKENS.PlatformAdapter,
    () =>
      new Cafe24Adapter(process.env.CAFE24_CLIENT_ID || '', process.env.CAFE24_CLIENT_SECRET || '')
  )

  // --- Pixel Use Cases (Transient) ---
  container.register(
    DI_TOKENS.ListUserPixelsUseCase,
    () => new ListUserPixelsUseCase(container.resolve(DI_TOKENS.MetaPixelRepository))
  )

  container.register(
    DI_TOKENS.SelectPixelUseCase,
    () => new SelectPixelUseCase(container.resolve(DI_TOKENS.MetaPixelRepository))
  )

  container.register(
    DI_TOKENS.GetTrackingHealthUseCase,
    () =>
      new GetTrackingHealthUseCase(
        container.resolve(DI_TOKENS.MetaPixelRepository),
        container.resolve(DI_TOKENS.MetaPixelService),
        {
          async getCAPIStatsByPixelId(pixelId: string) {
            const repo = container.resolve<IConversionEventRepository>(
              DI_TOKENS.ConversionEventRepository
            )
            return repo.countByPixelIdGrouped(pixelId)
          },
        },
        {
          async getAccessTokenByUserId(userId: string) {
            const account = await prisma.metaAdAccount.findUnique({ where: { userId } })
            return account?.accessToken ? safeDecryptToken(account.accessToken) : null
          },
        }
      )
  )

  // --- CAPI Use Cases (Transient) ---
  container.register(
    DI_TOKENS.SendCAPIEventsUseCase,
    () =>
      new SendCAPIEventsUseCase(
        container.resolve(DI_TOKENS.ConversionEventRepository),
        container.resolve(DI_TOKENS.CAPIService)
      )
  )

  // --- Token Management Use Cases (Transient) ---
  container.register(
    DI_TOKENS.RefreshMetaTokenUseCase,
    () =>
      new RefreshMetaTokenUseCase(
        container.resolve(DI_TOKENS.MetaAdAccountRepository),
        container.resolve(DI_TOKENS.AppConfig)
      )
  )
}
