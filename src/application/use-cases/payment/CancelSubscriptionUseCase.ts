import type { ISubscriptionRepository } from '@domain/repositories/ISubscriptionRepository'
import type { IBillingKeyRepository } from '@domain/repositories/IBillingKeyRepository'

export interface CancelSubscriptionResult {
  subscriptionId: string
  cancelledAt: Date
  accessUntil: Date
}

export class CancelSubscriptionUseCase {
  constructor(
    private readonly subscriptionRepo: ISubscriptionRepository,
    private readonly billingKeyRepo: IBillingKeyRepository
  ) {}

  async execute(userId: string, _reason?: string): Promise<CancelSubscriptionResult> {
    // 1. Find active subscription
    const subscription = await this.subscriptionRepo.findByUserId(userId)
    if (!subscription) {
      throw new Error('구독을 찾을 수 없습니다')
    }

    if (subscription.isCancelled()) {
      throw new Error('이미 취소된 구독입니다')
    }

    // 2. Cancel subscription (keeps access until period end)
    const cancelled = subscription.cancel()
    await this.subscriptionRepo.update(cancelled)

    // 3. Deactivate billing key
    const billingKey = await this.billingKeyRepo.findActiveByUserId(userId)
    if (billingKey) {
      await this.billingKeyRepo.deactivate(billingKey.id)
    }

    return {
      subscriptionId: subscription.id,
      cancelledAt: cancelled.cancelledAt!,
      accessUntil: subscription.currentPeriodEnd,
    }
  }
}
