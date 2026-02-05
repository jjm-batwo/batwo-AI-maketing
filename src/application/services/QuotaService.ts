import {
  IUsageLogRepository,
  UsageType,
} from '@domain/repositories/IUsageLogRepository'
import { IUserRepository } from '@domain/repositories/IUserRepository'
import { ISubscriptionRepository } from '@domain/repositories/ISubscriptionRepository'
import { QuotaStatusDTO, QuotaLimits, FullQuotaStatusDTO } from '@application/dto/quota/QuotaStatusDTO'
import { QuotaExceededError } from '@domain/errors'
import { SubscriptionPlan, PLAN_CONFIGS } from '@domain/value-objects/SubscriptionPlan'

const TRIAL_DAYS = 14

function getQuotaLimitsForPlan(plan: SubscriptionPlan): QuotaLimits {
  const config = PLAN_CONFIGS[plan]
  return {
    CAMPAIGN_CREATE: { count: config.campaignsPerWeek, period: 'week' },
    AI_COPY_GEN: { count: config.aiCopyPerDay, period: 'day' },
    AI_ANALYSIS: { count: config.aiAnalysisPerWeek, period: 'week' },
    AI_SCIENCE: { count: config.aiSciencePerWeek, period: 'week' },
  }
}

export class QuotaService {
  constructor(
    private readonly usageLogRepository: IUsageLogRepository,
    private readonly userRepository?: IUserRepository,
    private readonly subscriptionRepository?: ISubscriptionRepository
  ) {}

  async isInTrialPeriod(userId: string): Promise<boolean> {
    if (!this.userRepository) return false

    const user = await this.userRepository.findById(userId)
    if (!user) return false

    const daysSinceRegistration = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysSinceRegistration < TRIAL_DAYS
  }

  async getTrialDaysRemaining(userId: string): Promise<number> {
    if (!this.userRepository) return 0

    const user = await this.userRepository.findById(userId)
    if (!user) return 0

    const daysSinceRegistration = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    )
    return Math.max(0, TRIAL_DAYS - daysSinceRegistration)
  }

  private async getUserPlan(userId: string): Promise<SubscriptionPlan> {
    if (!this.subscriptionRepository) return SubscriptionPlan.FREE
    const subscription = await this.subscriptionRepository.findByUserId(userId)
    return subscription?.plan ?? SubscriptionPlan.FREE
  }

  async checkQuota(userId: string, type: UsageType): Promise<boolean> {
    // 체험 기간 중에는 항상 true 반환
    if (await this.isInTrialPeriod(userId)) {
      return true
    }

    const plan = await this.getUserPlan(userId)
    const limits = getQuotaLimitsForPlan(plan)
    const limit = limits[type]

    // -1 means unlimited
    if (limit.count === -1) return true
    // 0 means feature not available
    if (limit.count === 0) return false

    const count = await this.usageLogRepository.countByPeriod(
      userId,
      type,
      limit.period
    )
    return count < limit.count
  }

  async logUsage(userId: string, type: UsageType): Promise<void> {
    await this.usageLogRepository.log(userId, type)
  }

  async getRemainingQuota(userId: string): Promise<QuotaStatusDTO> {
    const plan = await this.getUserPlan(userId)
    const limits = getQuotaLimitsForPlan(plan)
    const result: QuotaStatusDTO = {} as QuotaStatusDTO

    for (const [type, limit] of Object.entries(limits) as [
      UsageType,
      (typeof limits)[UsageType],
    ][]) {
      const used = await this.usageLogRepository.countByPeriod(
        userId,
        type,
        limit.period
      )
      result[type] = {
        used,
        limit: limit.count,
        remaining: limit.count === -1 ? -1 : Math.max(0, limit.count - used),
        period: limit.period,
      }
    }

    return result
  }

  async getFullQuotaStatus(userId: string): Promise<FullQuotaStatusDTO> {
    const plan = await this.getUserPlan(userId)
    const [quotas, isInTrial, daysRemaining] = await Promise.all([
      this.getRemainingQuota(userId),
      this.isInTrialPeriod(userId),
      this.getTrialDaysRemaining(userId),
    ])

    return {
      plan,
      quotas,
      trial: {
        isInTrial,
        daysRemaining,
      },
    }
  }

  async enforceQuota(userId: string, type: UsageType): Promise<void> {
    // 체험 기간 중에는 제한 없음
    if (await this.isInTrialPeriod(userId)) {
      return
    }

    const hasQuota = await this.checkQuota(userId, type)
    if (!hasQuota) {
      const plan = await this.getUserPlan(userId)
      const limits = getQuotaLimitsForPlan(plan)
      const limit = limits[type]
      throw new QuotaExceededError(type, limit.count, limit.period)
    }
  }

  getQuotaLimits(plan: SubscriptionPlan = SubscriptionPlan.FREE): QuotaLimits {
    return getQuotaLimitsForPlan(plan)
  }
}
