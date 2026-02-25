import type { CircuitBreaker as ICircuitBreaker } from '@application/ports/IResilienceService'

type State = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

/**
 * Lightweight Circuit Breaker implementation.
 * - CLOSED: normal operation, counts consecutive failures
 * - OPEN: reject calls until recovery timeout passes
 * - HALF_OPEN: allow a single trial to test recovery
 */
export class CircuitBreakerImpl implements ICircuitBreaker {
  private state: State = 'CLOSED'
  private failureCount: number = 0
  private openedAt: number | null = null

  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeoutMs: number = 30000
  ) {}

  private transitionOpen(now: number) {
    this.state = 'OPEN'
    this.openedAt = now
    this.failureCount = 0
  }

  private transitionHalfOpen() {
    this.state = 'HALF_OPEN'
    // openedAt not strictly needed in HALF_OPEN
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now()

    if (this.state === 'OPEN') {
      if (this.openedAt && now - this.openedAt >= this.recoveryTimeoutMs) {
        this.transitionHalfOpen()
      } else {
        return Promise.reject(new Error('Circuit breaker OPEN')) as Promise<T>
      }
    }

    try {
      const result = await fn()
      // on success, reset or close HALF_OPEN -> CLOSED
      this.failureCount = 0
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED'
      } else {
        this.state = 'CLOSED'
      }
      this.openedAt = null
      return result
    } catch (err) {
      // on failure, maybe open circuit or move from HALF_OPEN to OPEN
      this.failureCount += 1
      if (this.state === 'HALF_OPEN') {
        this.transitionOpen(now)
      } else if (this.state === 'CLOSED' && this.failureCount >= this.failureThreshold) {
        this.transitionOpen(now)
      }
      throw err
    }
  }
}
