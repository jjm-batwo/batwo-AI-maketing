import { DomainError } from './DomainError'

export class InvalidSubscriptionError extends DomainError {
  readonly code = 'INVALID_SUBSCRIPTION'

  constructor(message: string) {
    super(message)
  }

  static invalidStatusTransition(from: string, to: string): InvalidSubscriptionError {
    return new InvalidSubscriptionError(
      `Cannot transition subscription from ${from} to ${to}`
    )
  }

  static alreadyCancelled(): InvalidSubscriptionError {
    return new InvalidSubscriptionError('Subscription is already cancelled')
  }

  static alreadyExpired(): InvalidSubscriptionError {
    return new InvalidSubscriptionError('Subscription is already expired')
  }

  static invalidPeriod(): InvalidSubscriptionError {
    return new InvalidSubscriptionError('Period end must be after period start')
  }

  static cannotRenewInactiveSubscription(): InvalidSubscriptionError {
    return new InvalidSubscriptionError('Cannot renew an inactive subscription')
  }

  static invalidPlanChange(from: string, to: string): InvalidSubscriptionError {
    return new InvalidSubscriptionError(
      `Cannot change plan from ${from} to ${to}`
    )
  }
}
