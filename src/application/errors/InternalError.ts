import { AppError } from './AppError'

/**
 * Internal Error
 *
 * Thrown when an unexpected internal error occurs (programming error, unexpected state, etc.)
 */
export class InternalError extends AppError {
  readonly code = 'INTERNAL_ERROR'
  readonly statusCode = 500

  constructor(message: string = 'An internal error occurred', context?: Record<string, unknown>) {
    super(message, context, true) // Always log internal errors
  }

  /**
   * Create error from unexpected exception
   */
  static fromError(error: Error, context?: Record<string, unknown>): InternalError {
    return new InternalError(error.message, {
      ...context,
      originalError: error.name,
      stack: error.stack,
    })
  }

  /**
   * Create error for unexpected state
   */
  static unexpectedState(description: string, state: Record<string, unknown>): InternalError {
    return new InternalError(`Unexpected state: ${description}`, {
      state,
    })
  }

  /**
   * Create error for unimplemented feature
   */
  static notImplemented(feature: string): InternalError {
    return new InternalError(`Feature not implemented: ${feature}`, {
      feature,
    })
  }

  /**
   * Create error for configuration issue
   */
  static configuration(issue: string): InternalError {
    return new InternalError(`Configuration error: ${issue}`, {
      issue,
    })
  }
}
