import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ChangePlanUseCase } from '@application/use-cases/payment/ChangePlanUseCase'
import { PaymentError } from '@domain/errors/PaymentError'
import { SubscriptionPlan } from '@domain/value-objects/SubscriptionPlan'
import { BillingPeriod } from '@domain/value-objects/BillingPeriod'
import { SubscriptionStatus } from '@domain/value-objects/SubscriptionStatus'
import { Subscription } from '@domain/entities/Subscription'
import type { ISubscriptionRepository } from '@domain/repositories/ISubscriptionRepository'
import type { IBillingKeyRepository } from '@domain/repositories/IBillingKeyRepository'
import type { IInvoiceRepository } from '@domain/repositories/IInvoiceRepository'
import type { IPaymentLogRepository } from '@domain/repositories/IPaymentLogRepository'
import type { IPaymentGateway } from '@application/ports/IPaymentGateway'

vi.mock('@application/utils/BillingKeyEncryption', () => ({
  encryptBillingKey: vi.fn((key: string) => `encrypted_${key}`),
  decryptBillingKey: vi.fn((key: string) => key.replace('encrypted_', '')),
}))

const now = new Date('2026-03-11T10:00:00Z')

function createActiveSub(plan: SubscriptionPlan = SubscriptionPlan.STARTER) {
  return Subscription.restore({
    id: 'sub-1',
    userId: 'user-1',
    plan,
    status: SubscriptionStatus.ACTIVE,
    currentPeriodStart: new Date('2026-03-01'),
    currentPeriodEnd: new Date('2026-03-31'),
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}

describe('ChangePlanUseCase', () => {
  let useCase: ChangePlanUseCase
  let subscriptionRepo: ISubscriptionRepository
  let billingKeyRepo: IBillingKeyRepository
  let invoiceRepo: IInvoiceRepository
  let paymentLogRepo: IPaymentLogRepository
  let paymentGateway: IPaymentGateway

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)

    subscriptionRepo = {
      findByUserId: vi.fn().mockResolvedValue(createActiveSub()),
      update: vi.fn().mockImplementation((sub) => Promise.resolve(sub)),
      save: vi.fn(),
    } as unknown as ISubscriptionRepository

    billingKeyRepo = {
      findActiveByUserId: vi.fn().mockResolvedValue({
        id: 'bk-1',
        encryptedBillingKey: 'encrypted_billing-key-123',
        isActive: true,
      }),
      save: vi.fn(),
      findByUserId: vi.fn().mockResolvedValue([]),
      deactivate: vi.fn(),
    } as unknown as IBillingKeyRepository

    invoiceRepo = {
      save: vi.fn().mockResolvedValue(undefined),
    } as unknown as IInvoiceRepository

    paymentLogRepo = {
      save: vi.fn().mockResolvedValue(undefined),
    } as unknown as IPaymentLogRepository

    paymentGateway = {
      chargeBilling: vi.fn().mockResolvedValue({
        paymentKey: 'pay-change-key',
        status: 'DONE',
        method: '카드',
        totalAmount: 10000,
        receipt: { url: 'https://toss.im/receipt/change' },
      }),
    } as unknown as IPaymentGateway

    useCase = new ChangePlanUseCase(
      subscriptionRepo,
      billingKeyRepo,
      invoiceRepo,
      paymentLogRepo,
      paymentGateway
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('업그레이드 시 차액을 결제하고 플랜을 변경해야 함', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      newPlan: SubscriptionPlan.PRO,
      newBillingPeriod: BillingPeriod.MONTHLY,
    })

    expect(result.plan).toBe(SubscriptionPlan.PRO)
    expect(subscriptionRepo.update).toHaveBeenCalledOnce()
    // 차액이 있으면 결제가 호출됨
    if (result.amount > 0) {
      expect(paymentGateway.chargeBilling).toHaveBeenCalledOnce()
      expect(invoiceRepo.save).toHaveBeenCalledOnce()
    }
  })

  it('같은 플랜으로 변경하면 에러를 던져야 함', async () => {
    await expect(
      useCase.execute({
        userId: 'user-1',
        newPlan: SubscriptionPlan.STARTER,
        newBillingPeriod: BillingPeriod.MONTHLY,
      })
    ).rejects.toThrow(PaymentError)
  })

  it('FREE 플랜으로 변경하면 에러를 던져야 함', async () => {
    await expect(
      useCase.execute({
        userId: 'user-1',
        newPlan: SubscriptionPlan.FREE,
        newBillingPeriod: BillingPeriod.MONTHLY,
      })
    ).rejects.toThrow(PaymentError)
  })

  it('구독이 없으면 에러를 던져야 함', async () => {
    vi.mocked(subscriptionRepo.findByUserId).mockResolvedValue(null)

    await expect(
      useCase.execute({
        userId: 'user-1',
        newPlan: SubscriptionPlan.PRO,
        newBillingPeriod: BillingPeriod.MONTHLY,
      })
    ).rejects.toThrow()
  })

  it('빌링키가 없으면 에러를 던져야 함', async () => {
    vi.mocked(billingKeyRepo.findActiveByUserId).mockResolvedValue(null)

    await expect(
      useCase.execute({
        userId: 'user-1',
        newPlan: SubscriptionPlan.PRO,
        newBillingPeriod: BillingPeriod.MONTHLY,
      })
    ).rejects.toThrow(PaymentError)
  })

  it('결제 실패 시 에러를 던져야 함', async () => {
    vi.mocked(paymentGateway.chargeBilling).mockRejectedValue(new Error('결제 실패'))

    await expect(
      useCase.execute({
        userId: 'user-1',
        newPlan: SubscriptionPlan.PRO,
        newBillingPeriod: BillingPeriod.MONTHLY,
      })
    ).rejects.toThrow(PaymentError)
  })
})
