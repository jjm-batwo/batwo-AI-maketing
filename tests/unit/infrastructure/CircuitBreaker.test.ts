import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { CircuitBreakerImpl } from '@infrastructure/external/errors/CircuitBreaker'

describe('CircuitBreakerImpl', () => {
    let breaker: CircuitBreakerImpl

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('CLOSED state (normal operation)', () => {
        beforeEach(() => {
            breaker = new CircuitBreakerImpl(3, 1000) // threshold=3, timeout=1s
        })

        it('should start in CLOSED state and execute successfully', async () => {
            const result = await breaker.execute(() => Promise.resolve('ok'))

            expect(result).toBe('ok')
        })

        it('should propagate errors from the wrapped function', async () => {
            await expect(
                breaker.execute(() => Promise.reject(new Error('boom')))
            ).rejects.toThrow('boom')
        })

        it('should remain CLOSED after fewer failures than threshold', async () => {
            // Fail twice (threshold is 3)
            for (let i = 0; i < 2; i++) {
                await expect(
                    breaker.execute(() => Promise.reject(new Error('fail')))
                ).rejects.toThrow('fail')
            }

            // Should still allow execution (CLOSED)
            const result = await breaker.execute(() => Promise.resolve('still ok'))
            expect(result).toBe('still ok')
        })

        it('should reset failure count on successful call', async () => {
            // Fail twice
            for (let i = 0; i < 2; i++) {
                await expect(
                    breaker.execute(() => Promise.reject(new Error('fail')))
                ).rejects.toThrow()
            }

            // Succeed → resets failure count
            await breaker.execute(() => Promise.resolve('ok'))

            // Fail two more (total should be 2 again, not 4)
            for (let i = 0; i < 2; i++) {
                await expect(
                    breaker.execute(() => Promise.reject(new Error('fail')))
                ).rejects.toThrow()
            }

            // Should still be CLOSED (2 failures, not at threshold 3)
            const result = await breaker.execute(() => Promise.resolve('still closed'))
            expect(result).toBe('still closed')
        })
    })

    describe('CLOSED → OPEN transition', () => {
        beforeEach(() => {
            breaker = new CircuitBreakerImpl(3, 1000)
        })

        it('should transition to OPEN after reaching failure threshold', async () => {
            // Trigger 3 consecutive failures
            for (let i = 0; i < 3; i++) {
                await expect(
                    breaker.execute(() => Promise.reject(new Error('fail')))
                ).rejects.toThrow('fail')
            }

            // Now OPEN: should reject immediately without calling the function
            const spy = vi.fn(() => Promise.resolve('should not execute'))

            await expect(breaker.execute(spy)).rejects.toThrow('Circuit breaker OPEN')

            expect(spy).not.toHaveBeenCalled()
        })

        it('should reject all calls while OPEN', async () => {
            // Trigger threshold
            for (let i = 0; i < 3; i++) {
                await expect(
                    breaker.execute(() => Promise.reject(new Error('fail')))
                ).rejects.toThrow()
            }

            // Multiple calls should all be rejected
            for (let i = 0; i < 5; i++) {
                await expect(
                    breaker.execute(() => Promise.resolve('nope'))
                ).rejects.toThrow('Circuit breaker OPEN')
            }
        })
    })

    describe('OPEN → HALF_OPEN transition', () => {
        it('should transition to HALF_OPEN after recovery timeout', async () => {
            // Use a very short timeout for testing
            breaker = new CircuitBreakerImpl(2, 100) // 100ms timeout

            // Trigger OPEN state (2 failures)
            for (let i = 0; i < 2; i++) {
                await expect(
                    breaker.execute(() => Promise.reject(new Error('fail')))
                ).rejects.toThrow()
            }

            // Confirm OPEN
            await expect(
                breaker.execute(() => Promise.resolve('blocked'))
            ).rejects.toThrow('Circuit breaker OPEN')

            // Wait for recovery timeout to elapse
            await new Promise((resolve) => setTimeout(resolve, 150))

            // Now should allow a trial call (HALF_OPEN)
            const result = await breaker.execute(() => Promise.resolve('recovered'))
            expect(result).toBe('recovered')
        })
    })

    describe('HALF_OPEN → CLOSED transition (success)', () => {
        it('should transition to CLOSED after successful trial in HALF_OPEN', async () => {
            breaker = new CircuitBreakerImpl(2, 100)

            // Open the circuit
            for (let i = 0; i < 2; i++) {
                await expect(
                    breaker.execute(() => Promise.reject(new Error('fail')))
                ).rejects.toThrow()
            }

            // Wait for recovery
            await new Promise((resolve) => setTimeout(resolve, 150))

            // Successful trial → HALF_OPEN → CLOSED
            await breaker.execute(() => Promise.resolve('trial success'))

            // Circuit is now CLOSED — subsequent calls should work normally
            const result1 = await breaker.execute(() => Promise.resolve('normal 1'))
            const result2 = await breaker.execute(() => Promise.resolve('normal 2'))

            expect(result1).toBe('normal 1')
            expect(result2).toBe('normal 2')
        })
    })

    describe('HALF_OPEN → OPEN transition (failure)', () => {
        it('should transition back to OPEN if trial fails in HALF_OPEN', async () => {
            breaker = new CircuitBreakerImpl(2, 100)

            // Open the circuit
            for (let i = 0; i < 2; i++) {
                await expect(
                    breaker.execute(() => Promise.reject(new Error('fail')))
                ).rejects.toThrow()
            }

            // Wait for recovery
            await new Promise((resolve) => setTimeout(resolve, 150))

            // Failed trial → HALF_OPEN → OPEN again
            await expect(
                breaker.execute(() => Promise.reject(new Error('trial fail')))
            ).rejects.toThrow('trial fail')

            // Should be OPEN again — reject immediately
            const spy = vi.fn(() => Promise.resolve('blocked'))
            await expect(breaker.execute(spy)).rejects.toThrow('Circuit breaker OPEN')
            expect(spy).not.toHaveBeenCalled()
        })
    })

    describe('full lifecycle: CLOSED → OPEN → HALF_OPEN → CLOSED', () => {
        it('should complete the full state machine cycle', async () => {
            breaker = new CircuitBreakerImpl(2, 100)

            // 1. CLOSED: normal operation
            const r1 = await breaker.execute(() => Promise.resolve('step 1'))
            expect(r1).toBe('step 1')

            // 2. CLOSED → OPEN: trigger failures
            for (let i = 0; i < 2; i++) {
                await expect(
                    breaker.execute(() => Promise.reject(new Error('fail')))
                ).rejects.toThrow()
            }

            // 3. OPEN: reject calls
            await expect(
                breaker.execute(() => Promise.resolve('blocked'))
            ).rejects.toThrow('Circuit breaker OPEN')

            // 4. Wait for OPEN → HALF_OPEN
            await new Promise((resolve) => setTimeout(resolve, 150))

            // 5. HALF_OPEN → CLOSED: successful trial
            const r5 = await breaker.execute(() => Promise.resolve('recovered'))
            expect(r5).toBe('recovered')

            // 6. CLOSED: normal operation again
            const r6 = await breaker.execute(() => Promise.resolve('fully recovered'))
            expect(r6).toBe('fully recovered')
        })
    })

    describe('edge cases', () => {
        it('should work with default parameters', async () => {
            const defaultBreaker = new CircuitBreakerImpl()

            const result = await defaultBreaker.execute(() => Promise.resolve('default'))
            expect(result).toBe('default')
        })

        it('should handle async functions that take time', async () => {
            breaker = new CircuitBreakerImpl(3, 1000)

            const result = await breaker.execute(
                () => new Promise<string>((resolve) => setTimeout(() => resolve('delayed'), 50))
            )

            expect(result).toBe('delayed')
        })

        it('should handle different error types', async () => {
            breaker = new CircuitBreakerImpl(3, 1000)

            await expect(
                breaker.execute(() => Promise.reject(new TypeError('type error')))
            ).rejects.toThrow(TypeError)

            await expect(
                breaker.execute(() => Promise.reject(new RangeError('range error')))
            ).rejects.toThrow(RangeError)
        })

        it('should preserve the error from the wrapped function', async () => {
            breaker = new CircuitBreakerImpl(3, 1000)

            const customError = new Error('specific error')
            customError.name = 'CustomError'

            await expect(
                breaker.execute(() => Promise.reject(customError))
            ).rejects.toThrow('specific error')
        })

        it('should handle generic return types', async () => {
            breaker = new CircuitBreakerImpl(3, 1000)

            const numResult = await breaker.execute(() => Promise.resolve(42))
            expect(numResult).toBe(42)

            const objResult = await breaker.execute(() => Promise.resolve({ key: 'value' }))
            expect(objResult).toEqual({ key: 'value' })

            const arrResult = await breaker.execute(() => Promise.resolve([1, 2, 3]))
            expect(arrResult).toEqual([1, 2, 3])
        })
    })
})
