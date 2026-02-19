import { DomainError } from './DomainError'

export class InvalidAdError extends DomainError {
  readonly code = 'INVALID_AD'

  constructor(message: string) {
    super(message)
  }

  static emptyName(): InvalidAdError {
    return new InvalidAdError('Ad name is required')
  }

  static nameTooLong(maxLength: number = 255): InvalidAdError {
    return new InvalidAdError(`Ad name cannot exceed ${maxLength} characters`)
  }

  static invalidStatusTransition(from: string, to: string): InvalidAdError {
    return new InvalidAdError(`Cannot change ad status from ${from} to ${to}`)
  }

  static missingCreativeId(): InvalidAdError {
    return new InvalidAdError('Creative ID is required for an ad')
  }
}
