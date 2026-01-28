/**
 * Base Application Error
 *
 * All application-layer errors extend this class to provide
 * consistent error handling across use cases and services.
 */
export abstract class AppError extends Error {
  /**
   * Machine-readable error code
   */
  abstract readonly code: string

  /**
   * HTTP status code for API responses
   */
  abstract readonly statusCode: number

  /**
   * Timestamp when the error occurred
   */
  readonly timestamp: Date

  /**
   * Additional context information about the error
   */
  readonly context?: Record<string, unknown>

  /**
   * Whether this error should be logged
   */
  readonly shouldLog: boolean

  constructor(message: string, context?: Record<string, unknown>, shouldLog: boolean = true) {
    super(message)
    this.name = this.constructor.name
    this.timestamp = new Date()
    this.context = context
    this.shouldLog = shouldLog

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * Serialize error for API response
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      ...(this.context && { context: this.context }),
    }
  }

  /**
   * Serialize error for logging
   */
  toLogFormat() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
      context: this.context,
    }
  }
}
