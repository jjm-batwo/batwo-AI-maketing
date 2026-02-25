import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFeedback } from '@/presentation/hooks/useFeedback'

const originalFetch = global.fetch

describe('useFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  describe('초기 상태', () => {
    it('should_have_correct_initial_state', () => {
      const { result } = renderHook(() => useFeedback())

      expect(result.current.isSubmitting).toBe(false)
      expect(result.current.isSubmitted).toBe(false)
      expect(result.current.error).toBeNull()
      expect(typeof result.current.submitFeedback).toBe('function')
    })
  })

  describe('submitFeedback 성공', () => {
    it('should_call_fetch_with_correct_payload_when_submitFeedback_called', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'fb-001', messageId: 'msg-001', rating: 'positive' }),
      })
      global.fetch = mockFetch

      const { result } = renderHook(() => useFeedback())

      await act(async () => {
        await result.current.submitFeedback({
          messageId: 'msg-001',
          rating: 'positive',
        })
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: 'msg-001', rating: 'positive' }),
      })
    })

    it('should_set_isSubmitted_true_after_successful_submission', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'fb-001', messageId: 'msg-001', rating: 'positive' }),
      })
      global.fetch = mockFetch

      const { result } = renderHook(() => useFeedback())

      await act(async () => {
        await result.current.submitFeedback({
          messageId: 'msg-001',
          rating: 'positive',
        })
      })

      expect(result.current.isSubmitted).toBe(true)
      expect(result.current.error).toBeNull()
    })

    it('should_include_comment_in_request_when_provided', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'fb-001', messageId: 'msg-002', rating: 'negative' }),
      })
      global.fetch = mockFetch

      const { result } = renderHook(() => useFeedback())

      await act(async () => {
        await result.current.submitFeedback({
          messageId: 'msg-002',
          rating: 'negative',
          comment: '응답이 부정확합니다',
        })
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: 'msg-002',
          rating: 'negative',
          comment: '응답이 부정확합니다',
        }),
      })
    })

    it('should_set_isSubmitting_true_during_submission', async () => {
      let resolvePromise: (value: unknown) => void
      const mockFetch = vi.fn().mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve
        })
      )
      global.fetch = mockFetch

      const { result } = renderHook(() => useFeedback())

      // 제출 시작 (완료 전)
      act(() => {
        result.current.submitFeedback({ messageId: 'msg-001', rating: 'positive' })
      })

      expect(result.current.isSubmitting).toBe(true)

      // 제출 완료
      await act(async () => {
        resolvePromise!({
          ok: true,
          json: async () => ({ id: 'fb-001', messageId: 'msg-001', rating: 'positive' }),
        })
      })

      expect(result.current.isSubmitting).toBe(false)
    })
  })

  describe('submitFeedback 실패', () => {
    it('should_set_error_when_fetch_fails_with_network_error', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('네트워크 오류'))
      global.fetch = mockFetch

      const { result } = renderHook(() => useFeedback())

      await act(async () => {
        await result.current.submitFeedback({
          messageId: 'msg-001',
          rating: 'positive',
        })
      })

      expect(result.current.error).toBe('네트워크 오류')
      expect(result.current.isSubmitted).toBe(false)
    })

    it('should_set_error_when_server_returns_non_ok_response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: '잘못된 요청입니다' }),
      })
      global.fetch = mockFetch

      const { result } = renderHook(() => useFeedback())

      await act(async () => {
        await result.current.submitFeedback({
          messageId: 'msg-001',
          rating: 'positive',
        })
      })

      expect(result.current.error).toBeTruthy()
      expect(result.current.isSubmitted).toBe(false)
    })

    it('should_set_isSubmitting_false_after_failed_submission', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('오류'))
      global.fetch = mockFetch

      const { result } = renderHook(() => useFeedback())

      await act(async () => {
        await result.current.submitFeedback({
          messageId: 'msg-001',
          rating: 'positive',
        })
      })

      expect(result.current.isSubmitting).toBe(false)
    })
  })
})
