import { ISubscriptionRepository } from '@/domain/repositories/ISubscriptionRepository'

export interface ExpireTrialsResult {
  expiredCount: number
}

export class ExpireTrialsUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  async execute(): Promise<ExpireTrialsResult> {
    const expiredTrials = await this.subscriptionRepository.findExpiredTrials()
    let count = 0

    for (const subscription of expiredTrials) {
      const expired = subscription.markExpired()
      await this.subscriptionRepository.update(expired)
      count++
    }

    return { expiredCount: count }
  }
}
