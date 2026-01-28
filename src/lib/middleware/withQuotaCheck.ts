import { NextRequest, NextResponse } from 'next/server'
import { UsageType } from '@domain/repositories/IUsageLogRepository'
import { QuotaService } from '@application/services/QuotaService'
import { QuotaExceededError } from '@domain/errors'

export interface QuotaCheckContext {
  userId: string
  quotaService: QuotaService
}

export type QuotaProtectedHandler<T = unknown> = (
  request: NextRequest,
  context: QuotaCheckContext
) => Promise<NextResponse<T>>

/**
 * Higher-order function that wraps an API route handler with quota checking.
 * Automatically checks if the user has remaining quota before executing the handler.
 *
 * @example
 * ```ts
 * export const POST = withQuotaCheck(
 *   'CAMPAIGN_CREATE',
 *   async (request, { userId, quotaService }) => {
 *     // Handle campaign creation
 *     await quotaService.logUsage(userId, 'CAMPAIGN_CREATE')
 *     return NextResponse.json({ success: true })
 *   }
 * )
 * ```
 */
export function withQuotaCheck<T = unknown>(
  usageType: UsageType,
  handler: QuotaProtectedHandler<T>,
  getContext: (request: NextRequest) => Promise<QuotaCheckContext>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const context = await getContext(request)
      const { userId, quotaService } = context

      // Check quota before proceeding
      const hasQuota = await quotaService.checkQuota(userId, usageType)

      if (!hasQuota) {
        const limits = quotaService.getQuotaLimits()
        const limit = limits[usageType]

        return NextResponse.json(
          {
            error: 'QuotaExceeded',
            message: getQuotaExceededMessage(usageType, limit.count, limit.period),
            usageType,
            limit: limit.count,
            period: limit.period,
          },
          { status: 429 }
        )
      }

      return handler(request, context)
    } catch (error) {
      if (error instanceof QuotaExceededError) {
        return NextResponse.json(
          {
            error: 'QuotaExceeded',
            message: getQuotaExceededMessage(
              error.usageType,
              error.limit,
              error.period
            ),
            usageType: error.usageType,
            limit: error.limit,
            period: error.period,
          },
          { status: 429 }
        )
      }

      throw error
    }
  }
}

function getQuotaExceededMessage(
  usageType: UsageType,
  limit: number,
  period: 'day' | 'week'
): string {
  const periodKo = period === 'day' ? '오늘' : '이번 주'

  switch (usageType) {
    case 'CAMPAIGN_CREATE':
      return `${periodKo} 캠페인 생성 횟수(${limit}회)를 모두 사용했어요`
    case 'AI_COPY_GEN':
      return `${periodKo} AI 카피 생성 횟수(${limit}회)를 모두 사용했어요`
    case 'AI_ANALYSIS':
      return `${periodKo} AI 분석 횟수(${limit}회)를 모두 사용했어요`
    case 'AI_SCIENCE':
      return `${periodKo} AI 과학 분석 횟수(${limit}회)를 모두 사용했어요`
    default:
      return `${periodKo} 사용량 한도(${limit}회)에 도달했어요`
  }
}

/**
 * Utility type for quota-aware API response
 */
export interface QuotaErrorResponse {
  error: 'QuotaExceeded'
  message: string
  usageType: UsageType
  limit: number
  period: 'day' | 'week'
}

/**
 * Type guard to check if an error is a quota exceeded error
 */
export function isQuotaExceededError(error: unknown): error is QuotaExceededError {
  return error instanceof QuotaExceededError
}
