import { AppError } from './AppError'

/**
 * Conflict Error
 *
 * Thrown when an operation conflicts with current state (e.g., duplicate resource)
 */
export class ConflictError extends AppError {
  readonly code = 'CONFLICT'
  readonly statusCode = 409

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context, false) // Don't log conflict errors
  }

  /**
   * Create error for duplicate resource
   */
  static duplicate(resourceType: string, field: string, value: string): ConflictError {
    return new ConflictError(`${resourceType} already exists with ${field}: ${value}`, {
      resourceType,
      field,
      value,
    })
  }

  /**
   * Create error for invalid state transition
   */
  static invalidStateTransition(
    resourceType: string,
    currentState: string,
    attemptedState: string
  ): ConflictError {
    return new ConflictError(
      `Cannot transition ${resourceType} from ${currentState} to ${attemptedState}`,
      {
        resourceType,
        currentState,
        attemptedState,
      }
    )
  }

  /**
   * Create error for concurrent modification
   */
  static concurrentModification(resourceType: string, resourceId: string): ConflictError {
    return new ConflictError(`${resourceType} was modified by another process`, {
      resourceType,
      resourceId,
    })
  }
}
