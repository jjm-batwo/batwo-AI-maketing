import { AppError } from './AppError'

/**
 * Not Found Error
 *
 * Thrown when a requested resource does not exist
 */
export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND'
  readonly statusCode = 404

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context, false) // Don't log "not found" errors
  }

  /**
   * Create not found error for a specific entity
   */
  static entity(entityName: string, id: string): NotFoundError {
    return new NotFoundError(`${entityName} not found with id: ${id}`, {
      entityName,
      id,
    })
  }

  /**
   * Create not found error for a resource
   */
  static resource(resourceType: string, criteria: Record<string, unknown>): NotFoundError {
    return new NotFoundError(`${resourceType} not found`, {
      resourceType,
      criteria,
    })
  }
}
