import { DomainError } from './DomainError'

/**
 * PixelError
 *
 * Base class for Meta Pixel related domain errors.
 */
export abstract class PixelError extends DomainError {}

/**
 * Thrown when pixel setup configuration is invalid.
 */
export class InvalidPixelSetupError extends PixelError {
  readonly code = 'INVALID_PIXEL_SETUP'

  constructor(message: string) {
    super(message)
  }

  static bothPixelIdAndNewPixel(): InvalidPixelSetupError {
    return new InvalidPixelSetupError('Cannot specify both pixelId and newPixel')
  }

  static neitherPixelIdNorNewPixel(): InvalidPixelSetupError {
    return new InvalidPixelSetupError('Either pixelId or newPixel must be provided')
  }

  static platformRequiredForPlatformApi(): InvalidPixelSetupError {
    return new InvalidPixelSetupError('Platform must be specified for PLATFORM_API mode')
  }

  static invalidMetaPixelIdFormat(pixelId: string): InvalidPixelSetupError {
    return new InvalidPixelSetupError(
      `Invalid Meta Pixel ID format: ${pixelId}. Must be a 15-16 digit numeric string.`
    )
  }

  static pixelNameRequired(): InvalidPixelSetupError {
    return new InvalidPixelSetupError('Pixel name is required')
  }
}

/**
 * Thrown when pixel not found.
 */
export class PixelNotFoundError extends PixelError {
  readonly code = 'PIXEL_NOT_FOUND'

  constructor(pixelId: string) {
    super(`Pixel not found: ${pixelId}`)
  }
}

/**
 * Thrown when duplicate pixel with same Meta Pixel ID already exists.
 */
export class DuplicatePixelError extends PixelError {
  readonly code = 'DUPLICATE_PIXEL'

  constructor(metaPixelId: string) {
    super(`Pixel with Meta Pixel ID ${metaPixelId} already exists for this user`)
  }
}
