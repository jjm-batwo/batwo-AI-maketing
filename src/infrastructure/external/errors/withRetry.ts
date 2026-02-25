export interface RetryOptions {
  retries?: number
  baseDelay?: number
  factor?: number
  jitter?: number
  signal?: AbortSignal
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { retries = 3, baseDelay = 1000, factor = 2, jitter = 200, signal } = options

  let lastError: unknown

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (signal?.aborted) {
      throw new Error('Aborted')
    }

    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (attempt === retries) {
        break
      }

      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = baseDelay * Math.pow(factor, attempt)
      const jitterAmount = Math.random() * jitter * 2 - jitter
      const delay = Math.max(0, exponentialDelay + jitterAmount)

      await new Promise<void>((resolve, reject) => {
        if (signal?.aborted) {
          reject(new Error('Aborted'))
          return
        }

        const timeout = setTimeout(() => {
          resolve()
        }, delay)

        if (signal) {
          signal.addEventListener('abort', () => {
            clearTimeout(timeout)
            reject(new Error('Aborted'))
          }, { once: true })
        }
      })
    }
  }

  throw lastError
}
