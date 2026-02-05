import { UsageType } from '@domain/repositories/IUsageLogRepository'
import { SubscriptionPlan } from '@domain/value-objects/SubscriptionPlan'

export interface QuotaItemDTO {
  used: number
  limit: number
  remaining: number
  period: 'day' | 'week'
}

export type QuotaStatusDTO = Record<UsageType, QuotaItemDTO>

export interface QuotaLimitConfig {
  count: number
  period: 'day' | 'week'
}

export type QuotaLimits = Record<UsageType, QuotaLimitConfig>

export interface TrialStatusDTO {
  isInTrial: boolean
  daysRemaining: number
}

export interface FullQuotaStatusDTO {
  plan: SubscriptionPlan
  quotas: QuotaStatusDTO
  trial: TrialStatusDTO
}
