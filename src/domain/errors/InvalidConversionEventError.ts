import { DomainError } from './DomainError'

export class InvalidConversionEventError extends DomainError {
  readonly code = 'INVALID_CONVERSION_EVENT'

  constructor(message: string) {
    super(message)
  }

  static emptyPixelId(): InvalidConversionEventError {
    return new InvalidConversionEventError('Pixel ID is required')
  }

  static emptyEventName(): InvalidConversionEventError {
    return new InvalidConversionEventError('Event name is required')
  }

  static emptyEventId(): InvalidConversionEventError {
    return new InvalidConversionEventError('Event ID is required')
  }

  static futureEventTime(): InvalidConversionEventError {
    return new InvalidConversionEventError('Event time cannot be in the future')
  }

  static alreadySentToMeta(): InvalidConversionEventError {
    return new InvalidConversionEventError('Event has already been sent to Meta')
  }

  static missingPurchaseValue(): InvalidConversionEventError {
    return new InvalidConversionEventError('Purchase 이벤트는 customData.value가 필수입니다')
  }

  static missingPurchaseCurrency(): InvalidConversionEventError {
    return new InvalidConversionEventError('Purchase 이벤트는 customData.currency가 필수입니다')
  }
}
