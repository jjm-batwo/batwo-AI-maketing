import { AppError } from './AppError'

/**
 * Validation Error
 *
 * Thrown when input validation fails (e.g., invalid DTO, business rule violation)
 */
export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR'
  readonly statusCode = 400

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context, false) // Don't log validation errors
  }

  /**
   * Create validation error for missing required field
   */
  static missingField(fieldName: string): ValidationError {
    return new ValidationError(`Required field is missing: ${fieldName}`, {
      field: fieldName,
    })
  }

  /**
   * Create validation error for invalid field value
   */
  static invalidField(fieldName: string, reason: string): ValidationError {
    return new ValidationError(`Invalid value for field "${fieldName}": ${reason}`, {
      field: fieldName,
      reason,
    })
  }

  /**
   * Create validation error for multiple fields
   */
  static multipleFields(errors: Record<string, string>): ValidationError {
    const fieldNames = Object.keys(errors)
    return new ValidationError(`Validation failed for fields: ${fieldNames.join(', ')}`, {
      fields: errors,
    })
  }

  /**
   * Create validation error for business rule violation
   */
  static businessRule(rule: string, details?: string): ValidationError {
    return new ValidationError(`Business rule violation: ${rule}${details ? ` - ${details}` : ''}`, {
      rule,
      details,
    })
  }
}
