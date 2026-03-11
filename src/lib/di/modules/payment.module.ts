/**
 * Payment Module - DI 등록
 *
 * 결제/구독 관련 Repository, Service, Use Case 등록
 */

import type { Container } from '../container'
import { DI_TOKENS } from '../types'

// Repository interfaces
import type { ISubscriptionRepository } from '@domain/repositories/ISubscriptionRepository'
import type { IInvoiceRepository } from '@domain/repositories/IInvoiceRepository'
import type { IBillingKeyRepository } from '@domain/repositories/IBillingKeyRepository'
import type { IPaymentLogRepository } from '@domain/repositories/IPaymentLogRepository'
import type { IPaymentGateway } from '@application/ports/IPaymentGateway'

// Infrastructure implementations
import { PrismaSubscriptionRepository } from '@infrastructure/database/repositories/PrismaSubscriptionRepository'
import { PrismaInvoiceRepository } from '@infrastructure/database/repositories/PrismaInvoiceRepository'
import { PrismaBillingKeyRepository } from '@infrastructure/database/repositories/PrismaBillingKeyRepository'
import { PrismaPaymentLogRepository } from '@infrastructure/database/repositories/PrismaPaymentLogRepository'
import { TossPaymentsClient } from '@infrastructure/payment/TossPaymentsClient'

// Use Cases
import { IssueBillingKeyUseCase } from '@application/use-cases/payment/IssueBillingKeyUseCase'
import { SubscribePlanUseCase } from '@application/use-cases/payment/SubscribePlanUseCase'
import { CancelSubscriptionUseCase } from '@application/use-cases/payment/CancelSubscriptionUseCase'
import { ChangePlanUseCase } from '@application/use-cases/payment/ChangePlanUseCase'
import { GetPaymentHistoryUseCase } from '@application/use-cases/payment/GetPaymentHistoryUseCase'

import { prisma } from '@/lib/prisma'

export function registerPaymentModule(container: Container): void {
  // --- Repositories ---
  container.registerSingleton<ISubscriptionRepository>(
    DI_TOKENS.SubscriptionRepository,
    () => new PrismaSubscriptionRepository(prisma)
  )

  container.registerSingleton<IInvoiceRepository>(
    DI_TOKENS.InvoiceRepository,
    () => new PrismaInvoiceRepository(prisma)
  )

  container.registerSingleton<IBillingKeyRepository>(
    DI_TOKENS.BillingKeyRepository,
    () => new PrismaBillingKeyRepository(prisma)
  )

  container.registerSingleton<IPaymentLogRepository>(
    DI_TOKENS.PaymentLogRepository,
    () => new PrismaPaymentLogRepository(prisma)
  )

  container.registerSingleton<IPaymentGateway>(
    DI_TOKENS.PaymentGateway,
    () => new TossPaymentsClient()
  )

  // --- Use Cases (Transient) ---
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
}
