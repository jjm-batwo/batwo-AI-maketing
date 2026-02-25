/**
 * FallbackResponseService - Resilient fallback response handling
 *
 * Classifies errors into types and provides user-friendly Korean
 * fallback messages for different error scenarios in the chatbot pipeline.
 */

import type { IResilienceService } from '@application/ports/IResilienceService'
import type { IFallbackResponseService } from '@application/ports/IFallbackResponseService'

export type { FallbackResponse } from '@application/ports/IFallbackResponseService'

type ErrorType = 'NETWORK' | 'TIMEOUT' | 'AUTH' | 'RATE_LIMIT' | 'UNKNOWN'

const FALLBACK_MESSAGES: Record<ErrorType, string> = {
  NETWORK: '네트워크 연결에 문제가 발생했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.',
  TIMEOUT:
    '요청 처리 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요. 문제가 지속되면 고객센터로 문의해 주세요.',
  AUTH: '인증 정보가 유효하지 않습니다. 다시 로그인해 주세요.',
  RATE_LIMIT: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  UNKNOWN: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
}

const RETRYABLE_TYPES: Set<ErrorType> = new Set(['NETWORK', 'TIMEOUT', 'RATE_LIMIT'])

const RETRY_SUGGESTIONS: Partial<Record<ErrorType, string>> = {
  NETWORK: '네트워크 연결을 확인한 후 다시 시도해 주세요.',
  TIMEOUT: '잠시 후 다시 시도해 주세요. 요청이 많을 때 지연될 수 있습니다.',
  RATE_LIMIT: '잠시 대기 후 다시 시도해 주세요.',
}

export class FallbackResponseService implements IFallbackResponseService {
  private usageMetrics: Map<string, number> = new Map()

  constructor(private readonly resilienceService: IResilienceService) {}

  getFallbackForError(error: Error): {
    message: string
    isRetryable: boolean
    errorType: string
  } {
    const errorType = this.classifyError(error)
    return {
      message: FALLBACK_MESSAGES[errorType],
      isRetryable: RETRYABLE_TYPES.has(errorType),
      errorType,
    }
  }

  getRetrySuggestion(error: Error): string | null {
    const errorType = this.classifyError(error)
    if (!RETRYABLE_TYPES.has(errorType)) {
      return null
    }
    return RETRY_SUGGESTIONS[errorType] ?? null
  }

  trackFallbackUsage(errorType: string): void {
    const current = this.usageMetrics.get(errorType) ?? 0
    this.usageMetrics.set(errorType, current + 1)
  }

  private classifyError(error: Error): ErrorType {
    switch (error.name) {
      case 'NetworkError':
        return 'NETWORK'
      case 'TimeoutError':
        return 'TIMEOUT'
      case 'AuthenticationError':
        return 'AUTH'
      case 'RateLimitError':
        return 'RATE_LIMIT'
      case 'ServiceUnavailableError':
        return 'NETWORK'
      default:
        return 'UNKNOWN'
    }
  }
}
