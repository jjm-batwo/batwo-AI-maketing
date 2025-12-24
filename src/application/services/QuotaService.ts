import {
  IUsageLogRepository,
  UsageType,
} from '@domain/repositories/IUsageLogRepository'
import { QuotaStatusDTO, QuotaLimits } from '@application/dto/quota/QuotaStatusDTO'

export class QuotaExceededError extends Error {
  constructor(
    public readonly usageType: UsageType,
    public readonly limit: number,
    public readonly period: 'day' | 'week'
  ) {
    super(
      `Quota exceeded for ${usageType}: limit is ${limit} per ${period}`
    )
    this.name = 'QuotaExceededError'
  }
}

const QUOTA_LIMITS: QuotaLimits = {
  CAMPAIGN_CREATE: { count: 5, period: 'week' },
  AI_COPY_GEN: { count: 20, period: 'day' },
  AI_ANALYSIS: { count: 5, period: 'week' },
}

export class QuotaService {
  constructor(private readonly usageLogRepository: IUsageLogRepository) {}

  async checkQuota(userId: string, type: UsageType): Promise<boolean> {
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

  async enforceQuota(userId: string, type: UsageType): Promise<void> {
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
