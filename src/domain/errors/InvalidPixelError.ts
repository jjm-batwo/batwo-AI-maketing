import { DomainError } from './DomainError'

export class InvalidPixelError extends DomainError {
  readonly code = 'INVALID_PIXEL'

  constructor(message: string) {
    super(message)
  }

  static emptyName(): InvalidPixelError {
    return new InvalidPixelError('Pixel name is required')
  }

  static nameTooLong(maxLength: number = 255): InvalidPixelError {
    return new InvalidPixelError(`Pixel name cannot exceed ${maxLength} characters`)
  }

  static emptyMetaPixelId(): InvalidPixelError {
    return new InvalidPixelError('Meta Pixel ID is required')
  }

  static invalidMetaPixelIdFormat(): InvalidPixelError {
    return new InvalidPixelError('Invalid Meta Pixel ID format')
  }

  static alreadyActive(): InvalidPixelError {
    return new InvalidPixelError('Pixel is already active')
  }

  static alreadyInactive(): InvalidPixelError {
    return new InvalidPixelError('Pixel is already inactive')
  }
}
