import { AppError } from './AppError'

/**
 * Rate Limit Error
 *
 * Thrown when a rate limit is exceeded (API calls, usage quotas, etc.)
 */
export class RateLimitError extends AppError {
  readonly code = 'RATE_LIMIT_EXCEEDED'
  readonly statusCode = 429

  /**
   * Time when the rate limit will reset (ISO string)
   */
  readonly resetAt?: string

  /**
   * Number of requests/operations allowed
   */
  readonly limit?: number

  constructor(
    message: string,
    context?: Record<string, unknown> & {
      resetAt?: Date
      limit?: number
    }
  ) {
    super(message, context, false) // Don't log rate limit errors
    this.resetAt = context?.resetAt?.toISOString()
    this.limit = context?.limit
  }

  /**
   * Create error for API rate limit
   */
  static apiLimit(limit: number, resetAt: Date): RateLimitError {
    return new RateLimitError(`API rate limit exceeded. Limit: ${limit} requests`, {
      limit,
      resetAt,
    })
  }

  /**
   * Create error for usage quota
   */
  static quota(resourceType: string, limit: number, period: string): RateLimitError {
    return new RateLimitError(`${resourceType} quota exceeded. Limit: ${limit} per ${period}`, {
      resourceType,
      limit,
      period,
    })
  }

  /**
   * Create error for concurrent operations
   */
  static concurrentOperations(maxConcurrent: number): RateLimitError {
    return new RateLimitError(
      `Maximum concurrent operations exceeded. Limit: ${maxConcurrent}`,
      {
        limit: maxConcurrent,
      }
    )
  }

  /**
   * Override toJSON to include rate limit specific fields
   */
  toJSON() {
    return {
      ...super.toJSON(),
      ...(this.resetAt && { resetAt: this.resetAt }),
      ...(this.limit && { limit: this.limit }),
    }
  }
}
