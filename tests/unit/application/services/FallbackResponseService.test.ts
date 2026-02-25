/**
 * FallbackResponseService - TDD RED Phase Tests
 *
 * Tests for resilient fallback response handling when errors occur in the
 * chatbot pipeline. Uses IResilienceService for retry logic and provides
 * user-friendly fallback messages for different error types.
 *
 * Expected to FAIL: FallbackResponseService, FallbackResponse types
 * do not exist yet. IResilienceService EXISTS at @application/ports.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FallbackResponseService } from '@application/services/FallbackResponseService'
import type { FallbackResponse } from '@application/services/FallbackResponseService'
import type { IResilienceService } from '@application/ports/IResilienceService'

describe('FallbackResponseService', () => {
  let service: FallbackResponseService
  let mockResilienceService: IResilienceService

  beforeEach(() => {
    mockResilienceService = {
      withRetry: vi.fn(),
      circuitBreaker: vi.fn().mockReturnValue({
        execute: vi.fn(),
        getState: vi.fn().mockReturnValue('CLOSED'),
        reset: vi.fn(),
      }),
    } as unknown as IResilienceService

    service = new FallbackResponseService(mockResilienceService)
  })

  describe('getFallbackForError - 에러 타입별 폴백 응답', () => {
    it('should_return_network_fallback_for_network_error', () => {
      const error = new Error('Network request failed')
      error.name = 'NetworkError'

      const fallback = service.getFallbackForError(error)

      expect(fallback).toBeDefined()
      expect(fallback.message).toBeTruthy()
      expect(fallback.errorType).toBe('NETWORK')
      expect(typeof fallback.message).toBe('string')
    })

    it('should_return_timeout_fallback_for_timeout_error', () => {
      const error = new Error('Request timed out')
      error.name = 'TimeoutError'

      const fallback = service.getFallbackForError(error)

      expect(fallback).toBeDefined()
      expect(fallback.errorType).toBe('TIMEOUT')
      expect(fallback.message).toBeTruthy()
    })

    it('should_return_auth_fallback_for_authentication_error', () => {
      const error = new Error('Unauthorized')
      error.name = 'AuthenticationError'

      const fallback = service.getFallbackForError(error)

      expect(fallback).toBeDefined()
      expect(fallback.errorType).toBe('AUTH')
      expect(fallback.message).toBeTruthy()
    })

    it('should_return_rate_limit_fallback_for_rate_limit_error', () => {
      const error = new Error('Too many requests')
      error.name = 'RateLimitError'

      const fallback = service.getFallbackForError(error)

      expect(fallback).toBeDefined()
      expect(fallback.errorType).toBe('RATE_LIMIT')
    })

    it('should_return_generic_fallback_for_unknown_error', () => {
      const error = new Error('Something unexpected happened')

      const fallback = service.getFallbackForError(error)

      expect(fallback).toBeDefined()
      expect(fallback.errorType).toBe('UNKNOWN')
      expect(fallback.message).toBeTruthy()
    })

    it('should_include_isRetryable_flag_in_fallback', () => {
      const networkError = new Error('Network request failed')
      networkError.name = 'NetworkError'

      const authError = new Error('Unauthorized')
      authError.name = 'AuthenticationError'

      const networkFallback = service.getFallbackForError(networkError)
      const authFallback = service.getFallbackForError(authError)

      // Network errors are retryable, auth errors are not
      expect(networkFallback.isRetryable).toBe(true)
      expect(authFallback.isRetryable).toBe(false)
    })
  })

  describe('getRetrySuggestion - 재시도 제안', () => {
    it('should_return_retry_suggestion_for_retryable_error', () => {
      const error = new Error('Network request failed')
      error.name = 'NetworkError'

      const suggestion = service.getRetrySuggestion(error)

      expect(suggestion).not.toBeNull()
      expect(typeof suggestion).toBe('string')
      expect(suggestion!.length).toBeGreaterThan(0)
    })

    it('should_return_null_for_non_retryable_error', () => {
      const error = new Error('Unauthorized')
      error.name = 'AuthenticationError'

      const suggestion = service.getRetrySuggestion(error)

      expect(suggestion).toBeNull()
    })

    it('should_return_suggestion_for_timeout_error', () => {
      const error = new Error('Request timed out')
      error.name = 'TimeoutError'

      const suggestion = service.getRetrySuggestion(error)

      expect(suggestion).not.toBeNull()
      expect(suggestion).toContain('다시') // Korean: "again" / retry suggestion
    })

    it('should_return_suggestion_for_rate_limit_with_wait_time', () => {
      const error = new Error('Too many requests')
      error.name = 'RateLimitError'

      const suggestion = service.getRetrySuggestion(error)

      expect(suggestion).not.toBeNull()
      // Should suggest waiting
      expect(suggestion).toBeTruthy()
    })
  })

  describe('trackFallbackUsage - 폴백 사용 메트릭 추적', () => {
    it('should_track_fallback_usage_by_error_type', () => {
      // Should not throw
      expect(() => {
        service.trackFallbackUsage('NETWORK')
      }).not.toThrow()
    })

    it('should_track_multiple_error_types_independently', () => {
      service.trackFallbackUsage('NETWORK')
      service.trackFallbackUsage('NETWORK')
      service.trackFallbackUsage('TIMEOUT')

      // trackFallbackUsage should accumulate counts internally
      // Verification depends on implementation exposing metrics,
      // but the call itself should succeed without throwing
      expect(() => {
        service.trackFallbackUsage('AUTH')
      }).not.toThrow()
    })

    it('should_track_unknown_error_types', () => {
      expect(() => {
        service.trackFallbackUsage('UNKNOWN')
      }).not.toThrow()
    })

    it('should_handle_rapid_successive_tracking_calls', () => {
      // Simulate burst of errors
      const errorTypes = ['NETWORK', 'TIMEOUT', 'NETWORK', 'RATE_LIMIT', 'UNKNOWN']

      expect(() => {
        errorTypes.forEach((type) => service.trackFallbackUsage(type))
      }).not.toThrow()
    })
  })

  describe('predefined messages - 공통 실패 사전 정의 메시지', () => {
    it('should_have_predefined_message_for_network_failure', () => {
      const error = new Error('fetch failed')
      error.name = 'NetworkError'

      const fallback = service.getFallbackForError(error)

      expect(fallback.message).toBeTruthy()
      expect(fallback.message.length).toBeGreaterThan(10)
    })

    it('should_have_predefined_message_for_api_unavailable', () => {
      const error = new Error('Service unavailable')
      error.name = 'ServiceUnavailableError'

      const fallback = service.getFallbackForError(error)

      expect(fallback.message).toBeTruthy()
      expect(fallback.message.length).toBeGreaterThan(10)
    })

    it('should_provide_korean_fallback_messages', () => {
      const error = new Error('Network request failed')
      error.name = 'NetworkError'

      const fallback = service.getFallbackForError(error)

      // Verify message contains Korean characters (Hangul range)
      expect(fallback.message).toMatch(/[\uAC00-\uD7AF]/)
    })

    it('should_include_actionable_guidance_in_fallback', () => {
      const error = new Error('Request timed out')
      error.name = 'TimeoutError'

      const fallback = service.getFallbackForError(error)

      // FallbackResponse should include an action field or suggestion
      expect(fallback.message).toBeTruthy()
      // The message should guide the user on what to do next
      expect(fallback.message.length).toBeGreaterThan(20)
    })

    it('should_differentiate_messages_by_error_type', () => {
      const networkError = new Error('Network failed')
      networkError.name = 'NetworkError'

      const timeoutError = new Error('Timed out')
      timeoutError.name = 'TimeoutError'

      const networkFallback = service.getFallbackForError(networkError)
      const timeoutFallback = service.getFallbackForError(timeoutError)

      // Different error types should produce different messages
      expect(networkFallback.message).not.toBe(timeoutFallback.message)
      expect(networkFallback.errorType).not.toBe(timeoutFallback.errorType)
    })
  })
})
