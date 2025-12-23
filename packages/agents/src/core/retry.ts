/**
 * 재시도 로직 구현
 */

import { isRetryableError, TimeoutError, RateLimitError } from './errors';

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrorCodes?: string[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableErrorCodes: ['LLM_ERROR', 'TIMEOUT_ERROR', 'RATE_LIMIT_ERROR'],
};

/**
 * 지수 백오프 딜레이 계산
 */
export function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig
): number {
  const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * 지연 실행
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 재시도 가능 여부 확인
 */
export function shouldRetry(
  error: unknown,
  attempt: number,
  config: RetryConfig
): boolean {
  if (attempt >= config.maxRetries) {
    return false;
  }

  return isRetryableError(error);
}

/**
 * Rate Limit 에러의 경우 서버가 지정한 대기 시간 사용
 */
export function getRetryDelay(
  error: unknown,
  attempt: number,
  config: RetryConfig
): number {
  if (error instanceof RateLimitError && error.retryAfterMs) {
    return error.retryAfterMs;
  }

  return calculateBackoffDelay(attempt, config);
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: unknown;
  attempts: number;
  totalTimeMs: number;
}

/**
 * 재시도 래퍼 함수
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const startTime = Date.now();
  let lastError: unknown;
  let attempt = 0;

  while (attempt <= finalConfig.maxRetries) {
    try {
      const data = await fn();
      return {
        success: true,
        data,
        attempts: attempt + 1,
        totalTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error;
      attempt++;

      if (!shouldRetry(error, attempt, finalConfig)) {
        break;
      }

      const delay = getRetryDelay(error, attempt - 1, finalConfig);
      await sleep(delay);
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: attempt,
    totalTimeMs: Date.now() - startTime,
  };
}

/**
 * 타임아웃 래퍼 함수
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(`Operation timed out after ${timeoutMs}ms`, timeoutMs));
      }, timeoutMs);
    }),
  ]);
}

/**
 * 재시도 + 타임아웃 결합 래퍼
 */
export async function withRetryAndTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  retryConfig: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  return withRetry(() => withTimeout(fn, timeoutMs), retryConfig);
}
