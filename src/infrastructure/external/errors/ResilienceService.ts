import type {
  IResilienceService,
  RetryOptions,
  CircuitBreaker as ICircuitBreaker,
} from '@application/ports/IResilienceService'
import { withRetry } from './withRetry'
import { CircuitBreakerImpl } from './CircuitBreaker'

/**
 * Concrete implementation of the resilience service used across the app.
 * Exposes retry capability and a circuit breaker factory per name.
 */
export class ResilienceService implements IResilienceService {
  withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T> {
    return withRetry<T>(fn, options)
  }

  circuitBreaker(_name: string): ICircuitBreaker {
    // Provide a simple per-service circuit breaker with sensible defaults.
    // Consumers can override by passing a custom implementation if needed.
    return new CircuitBreakerImpl(5, 30000)
  }
}
