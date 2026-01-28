import {
  IUsageLogRepository,
  UsageType,
} from '@domain/repositories/IUsageLogRepository'
import { IUserRepository } from '@domain/repositories/IUserRepository'
import { QuotaStatusDTO, QuotaLimits, FullQuotaStatusDTO } from '@application/dto/quota/QuotaStatusDTO'
import { QuotaExceededError } from '@domain/errors'

const TRIAL_DAYS = 14

const QUOTA_LIMITS: QuotaLimits = {
  CAMPAIGN_CREATE: { count: 5, period: 'week' },
  AI_COPY_GEN: { count: 20, period: 'day' },
  AI_ANALYSIS: { count: 5, period: 'week' },
  AI_SCIENCE: { count: 10, period: 'week' },
}

export class QuotaService {
  constructor(
    private readonly usageLogRepository: IUsageLogRepository,
    private readonly userRepository?: IUserRepository
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

  async checkQuota(userId: string, type: UsageType): Promise<boolean> {
    // 체험 기간 중에는 항상 true 반환
    if (await this.isInTrialPeriod(userId)) {
      return true
    }

    const limit = QUOTA_LIMITS[type]
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
    const result: QuotaStatusDTO = {} as QuotaStatusDTO

    for (const [type, limit] of Object.entries(QUOTA_LIMITS) as [
      UsageType,
      (typeof QUOTA_LIMITS)[UsageType],
    ][]) {
      const used = await this.usageLogRepository.countByPeriod(
        userId,
        type,
        limit.period
      )
      result[type] = {
        used,
        limit: limit.count,
        remaining: Math.max(0, limit.count - used),
        period: limit.period,
      }
    }

    return result
  }

  async getFullQuotaStatus(userId: string): Promise<FullQuotaStatusDTO> {
    const [quotas, isInTrial, daysRemaining] = await Promise.all([
      this.getRemainingQuota(userId),
      this.isInTrialPeriod(userId),
      this.getTrialDaysRemaining(userId),
    ])

    return {
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
      const limit = QUOTA_LIMITS[type]
      throw new QuotaExceededError(type, limit.count, limit.period)
    }
  }

  getQuotaLimits(): QuotaLimits {
    return { ...QUOTA_LIMITS }
  }
}
