import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StartTrialUseCase } from '@/application/use-cases/payment/StartTrialUseCase'
import { SubscriptionPlan } from '@/domain/value-objects/SubscriptionPlan'
import { SubscriptionStatus } from '@/domain/value-objects/SubscriptionStatus'
import { ISubscriptionRepository } from '@/domain/repositories/ISubscriptionRepository'
import { Subscription, SubscriptionProps } from '@/domain/entities/Subscription'
import { InvalidSubscriptionError } from '@/domain/errors/InvalidSubscriptionError'

class MockSubscriptionRepository implements Partial<ISubscriptionRepository> {
  private existing: SubscriptionProps[] = []

  setExisting(props: Partial<SubscriptionProps>) {
    const defaultProps: SubscriptionProps = {
      id: 'sub-1',
      userId: props.userId || 'user-123',
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.EXPIRED,
      currentPeriodStart: new Date('2026-01-01'),
      currentPeriodEnd: new Date('2026-01-15'),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...props
    }
    this.existing.push(defaultProps)
  }

  async findByUserId(userId: string): Promise<Subscription | null> {
    const found = this.existing.find((e) => e.userId === userId)
    if (!found) return null
    return Subscription.restore(found)
  }

  save = vi.fn().mockResolvedValue(undefined)
  update = vi.fn().mockResolvedValue(undefined)
}

describe('StartTrialUseCase', () => {
  let useCase: StartTrialUseCase
  let subscriptionRepository: MockSubscriptionRepository

  beforeEach(() => {
    subscriptionRepository = new MockSubscriptionRepository()
    useCase = new StartTrialUseCase(subscriptionRepository as any)
  })

  it('should create a 14-day PRO trial for new user', async () => {
    const result = await useCase.execute({ userId: 'user-123' })

    expect(result.plan).toBe(SubscriptionPlan.PRO)
    expect(result.status).toBe(SubscriptionStatus.TRIALING)
    expect(result.trialEndDate).toBeDefined()
    expect(subscriptionRepository.save).toHaveBeenCalled()
  })

  it('should reject if user already has active subscription', async () => {
    subscriptionRepository.setExisting({
      userId: 'user-123',
      status: SubscriptionStatus.ACTIVE,
    })

    await expect(useCase.execute({ userId: 'user-123' }))
      .rejects.toThrow(InvalidSubscriptionError)
  })

  it('should reject if user already used trial', async () => {
    subscriptionRepository.setExisting({
      userId: 'user-123',
      status: SubscriptionStatus.EXPIRED,
      trialStartedAt: new Date('2026-01-01'),
    })

    await expect(useCase.execute({ userId: 'user-123' }))
      .rejects.toThrow(InvalidSubscriptionError)
  })
})
