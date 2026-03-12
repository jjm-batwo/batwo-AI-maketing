import { ISubscriptionRepository } from '@/domain/repositories/ISubscriptionRepository'
import { Subscription } from '@/domain/entities/Subscription'
import { InvalidSubscriptionError } from '@/domain/errors/InvalidSubscriptionError'

interface StartTrialDTO {
  userId: string
}

interface StartTrialResult {
  subscriptionId: string
  plan: string
  status: string
  trialEndDate: Date
}

export class StartTrialUseCase {
  constructor(private readonly subscriptionRepository: ISubscriptionRepository) {}

  async execute(dto: StartTrialDTO): Promise<StartTrialResult> {
    const existing = await this.subscriptionRepository.findByUserId(dto.userId)

    if (existing && existing.hasAccess()) {
      throw new InvalidSubscriptionError('이미 활성 구독이 있습니다')
    }

    if (existing && existing.hasUsedTrial()) {
      throw new InvalidSubscriptionError('이미 무료 체험을 사용했습니다')
    }

    const subscription = Subscription.startTrial({ userId: dto.userId })
    await this.subscriptionRepository.save(subscription)

    return {
      subscriptionId: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      trialEndDate: subscription.trialEndDate!,
    }
  }
}
