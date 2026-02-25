import { describe, it, expect, vi, beforeEach } from 'vitest'
import { withRetry } from '../../../../src/infrastructure/external/errors/withRetry'

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('success')
    const result = await withRetry(fn)
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should retry on failure and eventually succeed', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success')

    const promise = withRetry(fn, {
      retries: 3,
      baseDelay: 100,
      jitter: 0, // Disable jitter for predictable testing
    })

    // Fast-forward time for retries
    await vi.runAllTimersAsync()

    const result = await promise
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('should throw last error after max retries', async () => {
    // fake timer와 async retry chain 사이 타이밍 이슈 회피를 위해 real timer 사용
    vi.useRealTimers()
    const fn = vi.fn().mockRejectedValue(new Error('persistent failure'))

    await expect(
      withRetry(fn, { retries: 2, baseDelay: 1, jitter: 0 })
    ).rejects.toThrow('persistent failure')

    expect(fn).toHaveBeenCalledTimes(3) // Initial + 2 retries
  })

  it('should respect exponential backoff', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success')

    const promise = withRetry(fn, {
      retries: 3,
      baseDelay: 1000,
      factor: 2,
      jitter: 0,
    })

    // First retry should wait 1000ms
    await vi.advanceTimersByTimeAsync(1000)
    expect(fn).toHaveBeenCalledTimes(2)

    // Second retry should wait 2000ms
    await vi.advanceTimersByTimeAsync(2000)
    expect(fn).toHaveBeenCalledTimes(3)

    await promise
  })

  it('should support abortion via AbortSignal', async () => {
    const controller = new AbortController()
    const fn = vi.fn().mockRejectedValue(new Error('fail'))

    const promise = withRetry(fn, {
      retries: 5,
      baseDelay: 1000,
      signal: controller.signal,
    })

    // Fail once, wait for delay
    await vi.advanceTimersByTimeAsync(500)

    // Abort during delay
    controller.abort()

    await expect(promise).rejects.toThrow('Aborted')
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
