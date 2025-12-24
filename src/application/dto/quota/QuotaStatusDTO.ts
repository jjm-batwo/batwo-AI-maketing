import { UsageType } from '@domain/repositories/IUsageLogRepository'

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
