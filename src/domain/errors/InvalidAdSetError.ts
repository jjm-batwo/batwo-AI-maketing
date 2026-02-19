import { DomainError } from './DomainError'

export class InvalidAdSetError extends DomainError {
  readonly code = 'INVALID_ADSET'

  constructor(message: string) {
    super(message)
  }

  static emptyName(): InvalidAdSetError {
    return new InvalidAdSetError('AdSet name is required')
  }

  static nameTooLong(maxLength: number = 255): InvalidAdSetError {
    return new InvalidAdSetError(`AdSet name cannot exceed ${maxLength} characters`)
  }

  static noBudget(): InvalidAdSetError {
    return new InvalidAdSetError('Either daily budget or lifetime budget is required')
  }

  static invalidBudget(): InvalidAdSetError {
    return new InvalidAdSetError('Budget must be greater than zero')
  }

  static pastStartDate(): InvalidAdSetError {
    return new InvalidAdSetError('Start date cannot be in the past')
  }

  static invalidDateRange(): InvalidAdSetError {
    return new InvalidAdSetError('End date cannot be before start date')
  }

  static invalidStatusTransition(from: string, to: string): InvalidAdSetError {
    return new InvalidAdSetError(`Cannot change status from ${from} to ${to}`)
  }
}
