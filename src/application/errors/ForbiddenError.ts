import { AppError } from './AppError'

/**
 * Forbidden Error
 *
 * Thrown when a user is authenticated but not authorized to perform an action
 */
export class ForbiddenError extends AppError {
  readonly code = 'FORBIDDEN'
  readonly statusCode = 403

  constructor(message: string = 'Access denied', context?: Record<string, unknown>) {
    super(message, context, false) // Don't log forbidden errors
  }

  /**
   * Create error for insufficient permissions
   */
  static insufficientPermissions(action: string): ForbiddenError {
    return new ForbiddenError(`Insufficient permissions to ${action}`, {
      action,
    })
  }

  /**
   * Create error for resource access denial
   */
  static resourceAccess(resourceType: string, resourceId: string): ForbiddenError {
    return new ForbiddenError(`Access denied to ${resourceType}`, {
      resourceType,
      resourceId,
    })
  }

  /**
   * Create error for role-based access control
   */
  static roleRequired(requiredRole: string): ForbiddenError {
    return new ForbiddenError(`This action requires ${requiredRole} role`, {
      requiredRole,
    })
  }
}
