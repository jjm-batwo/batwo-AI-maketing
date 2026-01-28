import type { AppError } from './AppError'

/**
 * Result Pattern
 *
 * Type-safe error handling without throwing exceptions.
 * Use this for operations where errors are expected business cases.
 */

/**
 * Success result
 */
export interface Success<T> {
  readonly ok: true
  readonly value: T
}

/**
 * Failure result
 */
export interface Failure<E extends AppError> {
  readonly ok: false
  readonly error: E
}

/**
 * Result type that can be either Success or Failure
 */
export type Result<T, E extends AppError = AppError> = Success<T> | Failure<E>

/**
 * Create a success result
 */
export function success<T>(value: T): Success<T> {
  return { ok: true, value }
}

/**
 * Create a failure result
 */
export function failure<E extends AppError>(error: E): Failure<E> {
  return { ok: false, error }
}

/**
 * Type guard to check if result is success
 */
export function isSuccess<T, E extends AppError>(result: Result<T, E>): result is Success<T> {
  return result.ok === true
}

/**
 * Type guard to check if result is failure
 */
export function isFailure<T, E extends AppError>(result: Result<T, E>): result is Failure<E> {
  return result.ok === false
}

/**
 * Match pattern for Result
 *
 * @example
 * const message = match(result, {
 *   ok: (value) => `Success: ${value}`,
 *   error: (error) => `Error: ${error.message}`
 * })
 */
export function match<T, E extends AppError, R>(
  result: Result<T, E>,
  handlers: {
    ok: (value: T) => R
    error: (error: E) => R
  }
): R {
  if (isSuccess(result)) {
    return handlers.ok(result.value)
  } else {
    return handlers.error(result.error)
  }
}

/**
 * Map success value to another type
 */
export function map<T, U, E extends AppError>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (isSuccess(result)) {
    return success(fn(result.value))
  } else {
    return failure(result.error)
  }
}

/**
 * Chain results (flatMap)
 */
export function chain<T, U, E extends AppError>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (isSuccess(result)) {
    return fn(result.value)
  } else {
    return failure(result.error)
  }
}

/**
 * Map error to another type
 */
export function mapError<T, E extends AppError, F extends AppError>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  if (isSuccess(result)) {
    return success(result.value)
  } else {
    return failure(fn(result.error))
  }
}

/**
 * Unwrap result value or throw error
 */
export function unwrap<T, E extends AppError>(result: Result<T, E>): T {
  if (isSuccess(result)) {
    return result.value
  } else {
    throw result.error
  }
}

/**
 * Unwrap result value or return default
 */
export function unwrapOr<T, E extends AppError>(result: Result<T, E>, defaultValue: T): T {
  if (isSuccess(result)) {
    return result.value
  } else {
    return defaultValue
  }
}

/**
 * Convert async function to Result
 */
export async function tryCatch<T, E extends AppError>(
  fn: () => Promise<T>,
  onError: (error: unknown) => E
): Promise<Result<T, E>> {
  try {
    const value = await fn()
    return success(value)
  } catch (error) {
    return failure(onError(error))
  }
}
