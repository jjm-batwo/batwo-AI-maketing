import { DomainError } from './DomainError'

export class InvalidCreativeError extends DomainError {
  readonly code = 'INVALID_CREATIVE'

  constructor(message: string) {
    super(message)
  }

  static emptyName(): InvalidCreativeError {
    return new InvalidCreativeError('Creative name is required')
  }

  static nameTooLong(maxLength: number = 255): InvalidCreativeError {
    return new InvalidCreativeError(`Creative name cannot exceed ${maxLength} characters`)
  }

  static primaryTextTooLong(maxLength: number = 500): InvalidCreativeError {
    return new InvalidCreativeError(`Primary text cannot exceed ${maxLength} characters`)
  }

  static headlineTooLong(maxLength: number = 255): InvalidCreativeError {
    return new InvalidCreativeError(`Headline cannot exceed ${maxLength} characters`)
  }

  static invalidLinkUrl(): InvalidCreativeError {
    return new InvalidCreativeError('Link URL must be a valid URL')
  }

  static missingAssets(): InvalidCreativeError {
    return new InvalidCreativeError('At least one asset is required for a creative')
  }
}
