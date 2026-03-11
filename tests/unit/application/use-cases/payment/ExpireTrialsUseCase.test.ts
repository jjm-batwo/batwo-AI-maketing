import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ExpireTrialsUseCase } from '@/application/use-cases/payment/ExpireTrialsUseCase'
import { SubscriptionPlan } from '@/domain/value-objects/SubscriptionPlan'
import { SubscriptionStatus } from '@/domain/value-objects/SubscriptionStatus'
import { ISubscriptionRepository } from '@/domain/repositories/ISubscriptionRepository'
import { Subscription, SubscriptionProps } from '@/domain/entities/Subscription'

class MockSubscriptionRepository implements Partial<ISubscriptionRepository> {
  private existing: SubscriptionProps[] = []

  setExpiredTrials(trials: Partial<SubscriptionProps>[]) {
    this.existing = trials.map((t, idx) => ({
      id: `sub-${idx}`,
      userId: t.userId || `user-${idx}`,
      plan: SubscriptionPlan.PRO,
      status: SubscriptionStatus.TRIALING,
      currentPeriodStart: new Date('2026-01-01'),
      currentPeriodEnd: new Date('2026-01-15'),
      trialStartedAt: new Date('2026-01-01'),
      trialEndDate: new Date('2026-01-15'),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...t,
    }))
  }

  async findExpiredTrials(): Promise<Subscription[]> {
    return this.existing.map(t => Subscription.restore(t))
  }

  update = vi.fn().mockResolvedValue(undefined)
}

describe('ExpireTrialsUseCase', () => {
  let useCase: ExpireTrialsUseCase
  let subscriptionRepository: MockSubscriptionRepository

  beforeEach(() => {
    subscriptionRepository = new MockSubscriptionRepository()
    useCase = new ExpireTrialsUseCase(subscriptionRepository as any)
  })

  it('should expire all past trials and update their status', async () => {
    subscriptionRepository.setExpiredTrials([
      { userId: 'user-1' },
      { userId: 'user-2' },
    ])

    const result = await useCase.execute()

    expect(result.expiredCount).toBe(2)
    expect(subscriptionRepository.update).toHaveBeenCalledTimes(2)
    
    // Expect status strictly to be EXPIRED
    const firstCallArg = subscriptionRepository.update.mock.calls[0][0]
    expect(firstCallArg.status).toBe(SubscriptionStatus.EXPIRED)
  })

  it('should return 0 when no expired trials exist', async () => {
    subscriptionRepository.setExpiredTrials([])

    const result = await useCase.execute()

    expect(result.expiredCount).toBe(0)
    expect(subscriptionRepository.update).not.toHaveBeenCalled()
  })
})
