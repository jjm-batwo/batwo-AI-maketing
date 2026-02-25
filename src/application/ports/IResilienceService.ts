export interface RetryOptions {
  retries?: number
  baseDelay?: number
  factor?: number
  jitter?: number
  signal?: AbortSignal
}

export interface CircuitBreaker {
  execute<T>(fn: () => Promise<T>): Promise<T>
}

export interface IResilienceService {
  withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>
  circuitBreaker(name: string): CircuitBreaker
}
