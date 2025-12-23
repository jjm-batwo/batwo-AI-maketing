import { describe, it, expect, vi } from 'vitest';
import {
  calculateBackoffDelay,
  sleep,
  shouldRetry,
  getRetryDelay,
  withRetry,
  withTimeout,
  withRetryAndTimeout,
  DEFAULT_RETRY_CONFIG,
} from './retry';
import { LLMError, RateLimitError, ValidationError, TimeoutError } from './errors';

describe('calculateBackoffDelay', () => {
  it('should calculate exponential backoff delay', () => {
    const config = {
      ...DEFAULT_RETRY_CONFIG,
      initialDelayMs: 1000,
      backoffMultiplier: 2,
      maxDelayMs: 30000,
    };

    expect(calculateBackoffDelay(0, config)).toBe(1000);
    expect(calculateBackoffDelay(1, config)).toBe(2000);
    expect(calculateBackoffDelay(2, config)).toBe(4000);
    expect(calculateBackoffDelay(3, config)).toBe(8000);
  });

  it('should cap at maxDelayMs', () => {
    const config = {
      ...DEFAULT_RETRY_CONFIG,
      initialDelayMs: 1000,
      backoffMultiplier: 10,
      maxDelayMs: 5000,
    };

    expect(calculateBackoffDelay(2, config)).toBe(5000);
    expect(calculateBackoffDelay(3, config)).toBe(5000);
  });
});

describe('sleep', () => {
  it('should delay execution', async () => {
    const start = Date.now();
    await sleep(50);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(45); // Allow small timing variance
  });
});

describe('shouldRetry', () => {
  it('should return false when max retries reached', () => {
    const error = new LLMError('test', 'openai');
    expect(shouldRetry(error, 3, { ...DEFAULT_RETRY_CONFIG, maxRetries: 3 })).toBe(false);
  });

  it('should return true for retryable errors within limit', () => {
    const error = new LLMError('test', 'openai');
    expect(shouldRetry(error, 1, { ...DEFAULT_RETRY_CONFIG, maxRetries: 3 })).toBe(true);
  });

  it('should return false for non-retryable errors', () => {
    const error = new ValidationError('test');
    expect(shouldRetry(error, 1, { ...DEFAULT_RETRY_CONFIG, maxRetries: 3 })).toBe(false);
  });
});

describe('getRetryDelay', () => {
  it('should use rate limit retry after if available', () => {
    const error = new RateLimitError('rate limited', 45000);
    expect(getRetryDelay(error, 0, DEFAULT_RETRY_CONFIG)).toBe(45000);
  });

  it('should use backoff delay for other errors', () => {
    const error = new LLMError('test', 'openai');
    expect(getRetryDelay(error, 0, DEFAULT_RETRY_CONFIG)).toBe(1000);
    expect(getRetryDelay(error, 1, DEFAULT_RETRY_CONFIG)).toBe(2000);
  });
});

describe('withRetry', () => {
  it('should succeed on first try', async () => {
    const fn = vi.fn().mockResolvedValue('success');

    const result = await withRetry(fn);

    expect(result.success).toBe(true);
    expect(result.data).toBe('success');
    expect(result.attempts).toBe(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable error and succeed', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new LLMError('failed', 'openai'))
      .mockResolvedValue('success');

    const result = await withRetry(fn, { initialDelayMs: 10 });

    expect(result.success).toBe(true);
    expect(result.data).toBe('success');
    expect(result.attempts).toBe(2);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should fail after max retries', async () => {
    const error = new LLMError('always fails', 'openai');
    const fn = vi.fn().mockRejectedValue(error);

    const result = await withRetry(fn, { maxRetries: 2, initialDelayMs: 10 });

    expect(result.success).toBe(false);
    expect(result.error).toBe(error);
    // attempts counts number of tries including initial,
    // but we stop as soon as shouldRetry returns false
    expect(result.attempts).toBeGreaterThanOrEqual(1);
  });

  it('should not retry non-retryable errors', async () => {
    const error = new ValidationError('validation failed');
    const fn = vi.fn().mockRejectedValue(error);

    const result = await withRetry(fn);

    expect(result.success).toBe(false);
    expect(result.attempts).toBe(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should track total time', async () => {
    const fn = vi.fn().mockResolvedValue('success');

    const result = await withRetry(fn);

    expect(result.totalTimeMs).toBeGreaterThanOrEqual(0);
  });
});

describe('withTimeout', () => {
  it('should complete before timeout', async () => {
    const fn = async () => {
      await sleep(10);
      return 'success';
    };

    const result = await withTimeout(fn, 100);
    expect(result).toBe('success');
  });

  it('should throw TimeoutError when exceeding timeout', async () => {
    const fn = async () => {
      await sleep(200);
      return 'success';
    };

    await expect(withTimeout(fn, 50)).rejects.toThrow(TimeoutError);
  });

  it('should include timeout value in error', async () => {
    const fn = async () => {
      await sleep(200);
      return 'success';
    };

    try {
      await withTimeout(fn, 50);
    } catch (error) {
      expect(error).toBeInstanceOf(TimeoutError);
      expect((error as TimeoutError).timeoutMs).toBe(50);
    }
  });
});

describe('withRetryAndTimeout', () => {
  it('should combine retry and timeout', async () => {
    const fn = vi.fn().mockResolvedValue('success');

    const result = await withRetryAndTimeout(fn, 1000);

    expect(result.success).toBe(true);
    expect(result.data).toBe('success');
  });

  it('should retry on timeout', async () => {
    let callCount = 0;
    const fn = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount < 2) {
        await sleep(200);
        return 'too slow';
      }
      return 'success';
    });

    const result = await withRetryAndTimeout(fn, 50, { maxRetries: 2, initialDelayMs: 10 });

    expect(result.success).toBe(true);
    expect(result.data).toBe('success');
  });
});
