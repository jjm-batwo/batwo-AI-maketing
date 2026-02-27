import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAgentChat } from '@presentation/hooks/useAgentChat'

// Mock fetch
const originalFetch = global.fetch

describe('useAgentChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAgentChat())

      expect(result.current.messages).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.conversationId).toBeNull()
    })
  })

  describe('concurrency guard', () => {
    it('should prevent multiple simultaneous message sends', async () => {
      const mockFetch = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                body: {
                  getReader: () => ({
                    read: vi
                      .fn()
                      .mockResolvedValueOnce({
                        done: false,
                        value: new TextEncoder().encode('data: {"type":"done"}\n'),
                      })
                      .mockResolvedValueOnce({ done: true, value: undefined }),
                  }),
                },
              })
            }, 100)
          })
      )
      global.fetch = mockFetch

      const { result } = renderHook(() => useAgentChat())

      await act(async () => {
        // Call twice rapidly
        result.current.sendMessage('Message 1')
        result.current.sendMessage('Message 2')
      })

      // Should only be called once because the first one sets isLoading=true synchronously (conceptually)
      // However, since sendMessage is async, we need to ensure the guard works.
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith('/api/agent/chat', expect.anything())
    })
  })

  describe('error handling', () => {
    it('should not retry on failure (server handles retry+CB)', async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
      global.fetch = mockFetch

      const { result } = renderHook(() => useAgentChat())

      await act(async () => {
        result.current.sendMessage('Error test')
      })

      // 클라이언트는 단일 요청만 수행 — 서버에서 retry+CB 처리
      expect(mockFetch).toHaveBeenCalledTimes(1)
      await waitFor(() => {
        expect(result.current.error).toBe('Network error')
      })
    })
  })
})
