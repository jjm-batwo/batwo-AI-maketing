import { AppError } from './AppError'

/**
 * External Service Error
 *
 * Thrown when an external service (API, database, etc.) fails
 */
export class ExternalServiceError extends AppError {
  readonly code = 'EXTERNAL_SERVICE_ERROR'
  readonly statusCode = 502

  /**
   * Name of the external service that failed
   */
  readonly serviceName: string

  constructor(serviceName: string, message: string, context?: Record<string, unknown>) {
    super(message, { ...context, serviceName }, true) // Always log external errors
    this.serviceName = serviceName
  }

  /**
   * Create error for Meta Ads API
   */
  static metaAds(operation: string, details?: string): ExternalServiceError {
    return new ExternalServiceError(
      'Meta Ads API',
      `Meta Ads API error during ${operation}${details ? `: ${details}` : ''}`,
      { operation, details }
    )
  }

  /**
   * Create error for OpenAI API
   */
  static openAI(operation: string, details?: string): ExternalServiceError {
    return new ExternalServiceError(
      'OpenAI API',
      `OpenAI API error during ${operation}${details ? `: ${details}` : ''}`,
      { operation, details }
    )
  }

  /**
   * Create error for database operation
   */
  static database(operation: string, details?: string): ExternalServiceError {
    return new ExternalServiceError(
      'Database',
      `Database error during ${operation}${details ? `: ${details}` : ''}`,
      { operation, details }
    )
  }

  /**
   * Create error for email service
   */
  static email(operation: string, details?: string): ExternalServiceError {
    return new ExternalServiceError(
      'Email Service',
      `Email service error during ${operation}${details ? `: ${details}` : ''}`,
      { operation, details }
    )
  }

  /**
   * Create error for payment service
   */
  static payment(operation: string, details?: string): ExternalServiceError {
    return new ExternalServiceError(
      'Payment Service',
      `Payment service error during ${operation}${details ? `: ${details}` : ''}`,
      { operation, details }
    )
  }

  /**
   * Create error for timeout
   */
  static timeout(serviceName: string, timeoutMs: number): ExternalServiceError {
    return new ExternalServiceError(serviceName, `${serviceName} request timed out`, {
      timeoutMs,
    })
  }

  /**
   * Create generic external service error
   */
  static generic(serviceName: string, error: Error): ExternalServiceError {
    return new ExternalServiceError(serviceName, error.message, {
      originalError: error.name,
      stack: error.stack,
    })
  }

  /**
   * Override toJSON to include service name
   */
  toJSON() {
    return {
      ...super.toJSON(),
      serviceName: this.serviceName,
    }
  }
}
