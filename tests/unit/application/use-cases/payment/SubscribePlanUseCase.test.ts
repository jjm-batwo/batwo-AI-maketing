import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SubscribePlanUseCase } from '@application/use-cases/payment/SubscribePlanUseCase'
import { PaymentError } from '@domain/errors/PaymentError'
import { SubscriptionPlan } from '@domain/value-objects/SubscriptionPlan'
import { BillingPeriod } from '@domain/value-objects/BillingPeriod'
import { SubscriptionStatus } from '@domain/value-objects/SubscriptionStatus'
import { Subscription } from '@domain/entities/Subscription'
import type { IBillingKeyRepository } from '@domain/repositories/IBillingKeyRepository'
import type { ISubscriptionRepository } from '@domain/repositories/ISubscriptionRepository'
import type { IInvoiceRepository } from '@domain/repositories/IInvoiceRepository'
import type { IPaymentLogRepository } from '@domain/repositories/IPaymentLogRepository'
import type { IPaymentGateway } from '@application/ports/IPaymentGateway'

// BillingKeyEncryption 모킹 (환경변수 의존 제거)
vi.mock('@application/utils/BillingKeyEncryption', () => ({
  encryptBillingKey: vi.fn((key: string) => `encrypted_${key}`),
  decryptBillingKey: vi.fn((key: string) => key.replace('encrypted_', '')),
}))

const mockBillingKeyResult = {
  billingKey: 'billing-key-123',
  cardCompany: '삼성카드',
  cardNumber: '4321-****-****-1234',
  method: '카드',
  authenticatedAt: '2026-03-11T10:00:00Z',
}

const mockChargeResult = {
  paymentKey: 'pay-key-abc',
  orderId: 'ORDER_user-1_123',
  status: 'DONE',
  method: '카드',
  totalAmount: 29000,
  receipt: { url: 'https://toss.im/receipt/abc' },
}

describe('SubscribePlanUseCase', () => {
  let useCase: SubscribePlanUseCase
  let billingKeyRepo: IBillingKeyRepository
  let subscriptionRepo: ISubscriptionRepository
  let invoiceRepo: IInvoiceRepository
  let paymentLogRepo: IPaymentLogRepository
  let paymentGateway: IPaymentGateway

  beforeEach(() => {
    billingKeyRepo = {
      save: vi.fn().mockImplementation((entity) => Promise.resolve({ ...entity, id: 'bk-1' })),
      deactivate: vi.fn().mockResolvedValue(undefined),
      findByUserId: vi.fn().mockResolvedValue([]),
      findActiveByUserId: vi.fn().mockResolvedValue(null),
    } as unknown as IBillingKeyRepository

    subscriptionRepo = {
      findByUserId: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockImplementation((sub) => Promise.resolve(sub)),
      update: vi.fn().mockImplementation((sub) => Promise.resolve(sub)),
    } as unknown as ISubscriptionRepository

    invoiceRepo = {
      save: vi.fn().mockResolvedValue(undefined),
    } as unknown as IInvoiceRepository

    paymentLogRepo = {
      save: vi.fn().mockResolvedValue(undefined),
    } as unknown as IPaymentLogRepository

    paymentGateway = {
      issueBillingKey: vi.fn().mockResolvedValue(mockBillingKeyResult),
      chargeBilling: vi.fn().mockResolvedValue(mockChargeResult),
    } as unknown as IPaymentGateway

    useCase = new SubscribePlanUseCase(
      billingKeyRepo,
      subscriptionRepo,
      invoiceRepo,
      paymentLogRepo,
      paymentGateway
    )
  })

  it('월간 구독을 성공적으로 생성해야 함', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      plan: SubscriptionPlan.STARTER,
      billingPeriod: BillingPeriod.MONTHLY,
      authKey: 'auth-key',
      customerKey: 'cust-key',
    })

    expect(result.plan).toBe(SubscriptionPlan.STARTER)
    expect(result.billingPeriod).toBe(BillingPeriod.MONTHLY)
    expect(result.status).toBe('ACTIVE')
    expect(result.paymentKey).toBe('pay-key-abc')
    expect(result.subscriptionId).toBeDefined()
    expect(paymentGateway.issueBillingKey).toHaveBeenCalledWith('auth-key', 'cust-key')
    expect(paymentGateway.chargeBilling).toHaveBeenCalledOnce()
    expect(subscriptionRepo.save).toHaveBeenCalledOnce()
    expect(invoiceRepo.save).toHaveBeenCalledOnce()
  })

  it('FREE 플랜으로 구독하려 하면 에러를 던져야 함', async () => {
    await expect(
      useCase.execute({
        userId: 'user-1',
        plan: SubscriptionPlan.FREE,
        billingPeriod: BillingPeriod.MONTHLY,
        authKey: 'auth-key',
        customerKey: 'cust-key',
      })
    ).rejects.toThrow(PaymentError)
  })

  it('이미 활성 구독이 있으면 에러를 던져야 함', async () => {
    vi.mocked(subscriptionRepo.findByUserId).mockResolvedValue(
      Subscription.restore({
        id: 'sub-1',
        userId: 'user-1',
        plan: SubscriptionPlan.STARTER,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    )

    await expect(
      useCase.execute({
        userId: 'user-1',
        plan: SubscriptionPlan.PRO,
        billingPeriod: BillingPeriod.MONTHLY,
        authKey: 'auth-key',
        customerKey: 'cust-key',
      })
    ).rejects.toThrow(PaymentError)
  })

  it('빌링키 발급 실패 시 에러를 던져야 함', async () => {
    vi.mocked(paymentGateway.issueBillingKey).mockRejectedValue(new Error('카드 인증 실패'))

    await expect(
      useCase.execute({
        userId: 'user-1',
        plan: SubscriptionPlan.STARTER,
        billingPeriod: BillingPeriod.MONTHLY,
        authKey: 'bad-key',
        customerKey: 'cust-key',
      })
    ).rejects.toThrow(PaymentError)
  })

  it('결제 실패 시 빌링키를 비활성화하고 에러를 던져야 함', async () => {
    vi.mocked(paymentGateway.chargeBilling).mockRejectedValue(new Error('잔액 부족'))

    await expect(
      useCase.execute({
        userId: 'user-1',
        plan: SubscriptionPlan.STARTER,
        billingPeriod: BillingPeriod.MONTHLY,
        authKey: 'auth-key',
        customerKey: 'cust-key',
      })
    ).rejects.toThrow(PaymentError)

    expect(billingKeyRepo.deactivate).toHaveBeenCalledOnce()
  })

  it('취소된 구독이 있으면 재활성화해야 함', async () => {
    vi.mocked(subscriptionRepo.findByUserId).mockResolvedValue(
      Subscription.restore({
        id: 'sub-old',
        userId: 'user-1',
        plan: SubscriptionPlan.STARTER,
        status: SubscriptionStatus.CANCELLED,
        currentPeriodStart: new Date(Date.now() - 60 * 86400000),
        currentPeriodEnd: new Date(Date.now() - 30 * 86400000),
        cancelledAt: new Date(Date.now() - 35 * 86400000),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    )

    const result = await useCase.execute({
      userId: 'user-1',
      plan: SubscriptionPlan.PRO,
      billingPeriod: BillingPeriod.MONTHLY,
      authKey: 'auth-key',
      customerKey: 'cust-key',
    })

    expect(result.status).toBe('ACTIVE')
    expect(subscriptionRepo.update).toHaveBeenCalledOnce()
    expect(subscriptionRepo.save).not.toHaveBeenCalled()
  })
})
