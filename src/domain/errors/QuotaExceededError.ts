import { DomainError } from './DomainError'
import type { UsageType } from '@domain/repositories/IUsageLogRepository'

/**
 * QuotaExceededError
 *
 * Thrown when a user exceeds their usage quota for a specific feature.
 * This is a domain error because quota enforcement is a business rule.
 */
export class QuotaExceededError extends DomainError {
  readonly code = 'QUOTA_EXCEEDED'

  constructor(
    public readonly usageType: UsageType,
    public readonly limit: number,
    public readonly period: 'day' | 'week'
  ) {
    super(`Quota exceeded for ${usageType}: limit is ${limit} per ${period}`)
  }

  toJSON() {
    return {
      ...super.toJSON(),
      usageType: this.usageType,
      limit: this.limit,
      period: this.period,
    }
  }
}
