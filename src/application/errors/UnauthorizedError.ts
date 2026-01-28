import { AppError } from './AppError'

/**
 * Unauthorized Error
 *
 * Thrown when authentication is required but not provided or invalid
 */
export class UnauthorizedError extends AppError {
  readonly code = 'UNAUTHORIZED'
  readonly statusCode = 401

  constructor(message: string = 'Authentication required', context?: Record<string, unknown>) {
    super(message, context, false) // Don't log auth errors
  }

  /**
   * Create error for missing authentication
   */
  static missingAuth(): UnauthorizedError {
    return new UnauthorizedError('No authentication credentials provided')
  }

  /**
   * Create error for invalid credentials
   */
  static invalidCredentials(): UnauthorizedError {
    return new UnauthorizedError('Invalid authentication credentials')
  }

  /**
   * Create error for expired token
   */
  static expiredToken(): UnauthorizedError {
    return new UnauthorizedError('Authentication token has expired')
  }
}
