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

// Result pattern types
export type { Result, Success, Failure } from './Result'
export {
  success,
  failure,
  isSuccess,
  isFailure,
  match,
  map,
  chain,
  mapError,
  unwrap,
  unwrapOr,
  tryCatch,
} from './Result'
