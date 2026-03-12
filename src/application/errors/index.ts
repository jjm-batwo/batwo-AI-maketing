/**
 * Application Error Types
 *
 * Standardized error handling for the application layer.
 * All errors extend AppError and provide consistent structure.
 */

export { AppError } from './AppError'
export { ValidationError } from './ValidationError'
export { NotFoundError } from './NotFoundError'
export { UnauthorizedError } from './UnauthorizedError'
export { ForbiddenError } from './ForbiddenError'
export { ConflictError } from './ConflictError'
export { RateLimitError } from './RateLimitError'
export { ExternalServiceError } from './ExternalServiceError'
export { InternalError } from './InternalError'
