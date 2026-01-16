import { DomainError } from './DomainError'

export class InvalidPlatformIntegrationError extends DomainError {
  readonly code = 'INVALID_PLATFORM_INTEGRATION'

  constructor(message: string) {
    super(message)
  }

  static emptyPixelId(): InvalidPlatformIntegrationError {
    return new InvalidPlatformIntegrationError('Pixel ID is required')
  }

  static emptyPlatformStoreId(): InvalidPlatformIntegrationError {
    return new InvalidPlatformIntegrationError('Platform store ID is required')
  }

  static emptyAccessToken(): InvalidPlatformIntegrationError {
    return new InvalidPlatformIntegrationError('Access token is required')
  }

  static invalidStatusTransition(from: string, to: string): InvalidPlatformIntegrationError {
    return new InvalidPlatformIntegrationError(`Cannot transition from ${from} to ${to}`)
  }

  static alreadyDisconnected(): InvalidPlatformIntegrationError {
    return new InvalidPlatformIntegrationError('Integration is already disconnected')
  }
}
