import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CancelSubscriptionUseCase } from '@application/use-cases/payment/CancelSubscriptionUseCase'
import { SubscriptionPlan } from '@domain/value-objects/SubscriptionPlan'
import { SubscriptionStatus } from '@domain/value-objects/SubscriptionStatus'
import { Subscription } from '@domain/entities/Subscription'
import type { ISubscriptionRepository } from '@domain/repositories/ISubscriptionRepository'
import type { IBillingKeyRepository } from '@domain/repositories/IBillingKeyRepository'

function createSub(overrides: Partial<{ status: SubscriptionStatus; cancelledAt?: Date }> = {}) {
  return Subscription.restore({
    id: 'sub-1',
    userId: 'user-1',
    plan: SubscriptionPlan.STARTER,
    status: overrides.status ?? SubscriptionStatus.ACTIVE,
    currentPeriodStart: new Date('2026-03-01'),
    currentPeriodEnd: new Date('2026-03-31'),
    cancelledAt: overrides.cancelledAt,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}

describe('CancelSubscriptionUseCase', () => {
  let useCase: CancelSubscriptionUseCase
  let subscriptionRepo: ISubscriptionRepository
  let billingKeyRepo: IBillingKeyRepository

  beforeEach(() => {
    subscriptionRepo = {
      findByUserId: vi.fn().mockResolvedValue(createSub()),
      update: vi.fn().mockImplementation((sub) => Promise.resolve(sub)),
      save: vi.fn(),
    } as unknown as ISubscriptionRepository

    billingKeyRepo = {
      findActiveByUserId: vi.fn().mockResolvedValue({
        id: 'bk-1',
        isActive: true,
      }),
      deactivate: vi.fn().mockResolvedValue(undefined),
      save: vi.fn(),
      findByUserId: vi.fn().mockResolvedValue([]),
    } as unknown as IBillingKeyRepository

    useCase = new CancelSubscriptionUseCase(subscriptionRepo, billingKeyRepo)
  })

  it('활성 구독을 성공적으로 취소해야 함', async () => {
    const result = await useCase.execute('user-1', '더 이상 필요없어서')

    expect(result.subscriptionId).toBe('sub-1')
    expect(result.cancelledAt).toBeInstanceOf(Date)
    expect(result.accessUntil).toBeInstanceOf(Date)
    expect(subscriptionRepo.update).toHaveBeenCalledOnce()
  })

  it('빌링키도 함께 비활성화해야 함', async () => {
    await useCase.execute('user-1')

    expect(billingKeyRepo.deactivate).toHaveBeenCalledWith('bk-1')
  })

  it('빌링키가 없어도 정상 취소되어야 함', async () => {
    vi.mocked(billingKeyRepo.findActiveByUserId).mockResolvedValue(null)

    const result = await useCase.execute('user-1')

    expect(result.subscriptionId).toBe('sub-1')
    expect(billingKeyRepo.deactivate).not.toHaveBeenCalled()
  })

  it('구독이 없으면 에러를 던져야 함', async () => {
    vi.mocked(subscriptionRepo.findByUserId).mockResolvedValue(null)

    await expect(useCase.execute('user-not-found')).rejects.toThrow('구독을 찾을 수 없습니다')
  })

  it('이미 취소된 구독은 에러를 던져야 함', async () => {
    vi.mocked(subscriptionRepo.findByUserId).mockResolvedValue(
      createSub({ status: SubscriptionStatus.CANCELLED, cancelledAt: new Date() })
    )

    await expect(useCase.execute('user-1')).rejects.toThrow('이미 취소된 구독입니다')
  })
})
