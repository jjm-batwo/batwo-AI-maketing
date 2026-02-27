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
  private readonly breakers = new Map<string, ICircuitBreaker>()

  withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T> {
    return withRetry<T>(fn, options)
  }

  circuitBreaker(name: string): ICircuitBreaker {
    let breaker = this.breakers.get(name)
    if (!breaker) {
      breaker = new CircuitBreakerImpl(5, 30000)
      this.breakers.set(name, breaker)
    }
    return breaker
  }
}
