import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAIStream } from '@presentation/hooks/useAIStream'

// Mock fetch
const originalFetch = global.fetch

describe('useAIStream', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAIStream())

      expect(result.current.text).toBe('')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.stage).toBeNull()
      expect(result.current.progress).toBe(0)
    })
  })

  describe('stream function', () => {
    it('should make fetch call with correct URL and options', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"type":"text","content":"Hello"}\n') })
              .mockResolvedValueOnce({ done: true, value: undefined }),
          }),
        },
      })
      global.fetch = mockFetch

      const { result } = renderHook(() => useAIStream())

      await act(async () => {
        await result.current.stream('/api/test', {
          method: 'POST',
          body: JSON.stringify({ test: true }),
        })
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ test: true }),
        signal: expect.any(AbortSignal),
      }))
    })

    it('should accumulate text from text chunks', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"type":"text","content":"Hello "}\n') })
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"type":"text","content":"World"}\n') })
              .mockResolvedValueOnce({ done: true, value: undefined }),
          }),
        },
      })
      global.fetch = mockFetch

      const { result } = renderHook(() => useAIStream())

      await act(async () => {
        await result.current.stream('/api/test')
      })

      await waitFor(() => {
        expect(result.current.text).toBe('Hello World')
      })
    })

    it('should update stage and progress from progress chunks', async () => {
      const onProgress = vi.fn()
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"type":"progress","stage":"analyzing","progress":50}\n') })
              .mockResolvedValueOnce({ done: true, value: undefined }),
          }),
        },
      })
      global.fetch = mockFetch

      const { result } = renderHook(() => useAIStream({ onProgress }))

      await act(async () => {
        await result.current.stream('/api/test')
      })

      await waitFor(() => {
        expect(result.current.stage).toBe('analyzing')
        expect(result.current.progress).toBe(50)
        expect(onProgress).toHaveBeenCalledWith('analyzing', 50)
      })
    })

    it('should handle error chunks', async () => {
      const onError = vi.fn()
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"type":"error","error":"Test error"}\n') })
              .mockResolvedValueOnce({ done: true, value: undefined }),
          }),
        },
      })
      global.fetch = mockFetch

      const { result } = renderHook(() => useAIStream({ onError }))

      await act(async () => {
        await result.current.stream('/api/test')
      })

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error)
        expect(result.current.error?.message).toBe('Test error')
        expect(onError).toHaveBeenCalledWith(expect.any(Error))
      })
    })

    it('should handle HTTP errors', async () => {
      const onError = vi.fn()
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      })
      global.fetch = mockFetch

      const { result } = renderHook(() => useAIStream({ onError }))

      await act(async () => {
        await result.current.stream('/api/test')
      })

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error)
        expect(result.current.error?.message).toContain('500')
        expect(onError).toHaveBeenCalled()
      })
    })

    it('should call lifecycle callbacks', async () => {
      const onStart = vi.fn()
      const onToken = vi.fn()
      const onComplete = vi.fn()

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"type":"text","content":"Test"}\n') })
              .mockResolvedValueOnce({ done: true, value: undefined }),
          }),
        },
      })
      global.fetch = mockFetch

      const { result } = renderHook(() => useAIStream({
        onStart,
        onToken,
        onComplete,
      }))

      await act(async () => {
        await result.current.stream('/api/test')
      })

      await waitFor(() => {
        expect(onStart).toHaveBeenCalledTimes(1)
        expect(onToken).toHaveBeenCalledWith('Test')
        expect(onComplete).toHaveBeenCalledWith('Test')
      })
    })

    it('should parse SSE [DONE] signal', async () => {
      const onComplete = vi.fn()
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"type":"text","content":"Done"}\n') })
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: [DONE]\n') })
              .mockResolvedValueOnce({ done: true, value: undefined }),
          }),
        },
      })
      global.fetch = mockFetch

      const { result } = renderHook(() => useAIStream({ onComplete }))

      await act(async () => {
        await result.current.stream('/api/test')
      })

      await waitFor(() => {
        expect(result.current.text).toBe('Done')
        expect(onComplete).toHaveBeenCalledWith('Done')
      })
    })

    it('should handle plain text without SSE format', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('{"type":"text","content":"Plain"}\n') })
              .mockResolvedValueOnce({ done: true, value: undefined }),
          }),
        },
      })
      global.fetch = mockFetch

      const { result } = renderHook(() => useAIStream())

      await act(async () => {
        await result.current.stream('/api/test')
      })

      await waitFor(() => {
        expect(result.current.text).toBe('Plain')
      })
    })

    it('should set isLoading correctly', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"type":"text","content":"Test"}\n') })
              .mockResolvedValueOnce({ done: true, value: undefined }),
          }),
        },
      })
      global.fetch = mockFetch

      const { result } = renderHook(() => useAIStream())

      expect(result.current.isLoading).toBe(false)

      act(() => {
        result.current.stream('/api/test')
      })

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('stop function', () => {
    it('should abort ongoing stream without errors', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"type":"text","content":"Test"}\n') })
              .mockResolvedValueOnce({ done: true, value: undefined }),
          }),
        },
      })
      global.fetch = mockFetch

      const { result } = renderHook(() => useAIStream())

      // Start and complete stream
      await act(async () => {
        await result.current.stream('/api/test')
      })

      // Stop after completion should not throw
      expect(() => {
        act(() => {
          result.current.stop()
        })
      }).not.toThrow()
    })

    it('should handle stop when not streaming', () => {
      const { result } = renderHook(() => useAIStream())

      expect(() => {
        act(() => {
          result.current.stop()
        })
      }).not.toThrow()
    })
  })

  describe('reset function', () => {
    it('should clear all state', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"type":"text","content":"Test"}\n') })
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"type":"progress","stage":"analyzing","progress":50}\n') })
              .mockResolvedValueOnce({ done: true, value: undefined }),
          }),
        },
      })
      global.fetch = mockFetch

      const { result } = renderHook(() => useAIStream())

      // Stream some data
      await act(async () => {
        await result.current.stream('/api/test')
      })

      await waitFor(() => {
        expect(result.current.text).toBe('Test')
        expect(result.current.stage).toBe('analyzing')
        expect(result.current.progress).toBe(50)
      })

      // Reset
      act(() => {
        result.current.reset()
      })

      // All state should be cleared
      expect(result.current.text).toBe('')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.stage).toBeNull()
      expect(result.current.progress).toBe(0)
    })

    it('should abort ongoing stream when reset', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn().mockImplementation(() => {
              return new Promise((resolve) => {
                setTimeout(() => {
                  resolve({ done: false, value: new TextEncoder().encode('data: {"type":"text","content":"Test"}\n') })
                }, 1000)
              })
            }),
          }),
        },
      })
      global.fetch = mockFetch

      const { result } = renderHook(() => useAIStream())

      // Start stream
      act(() => {
        result.current.stream('/api/test')
      })

      // Reset immediately
      act(() => {
        result.current.reset()
      })

      // Should stop and clear state
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        expect(result.current.text).toBe('')
      })
    })
  })
})
