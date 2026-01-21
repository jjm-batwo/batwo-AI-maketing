import { DomainError } from './DomainError'

export class InvalidInvoiceError extends DomainError {
  readonly code = 'INVALID_INVOICE'

  constructor(message: string) {
    super(message)
  }

  static invalidStatusTransition(from: string, to: string): InvalidInvoiceError {
    return new InvalidInvoiceError(
      `Cannot transition invoice from ${from} to ${to}`
    )
  }

  static invalidAmount(): InvalidInvoiceError {
    return new InvalidInvoiceError('Invoice amount must be positive')
  }

  static alreadyRefunded(): InvalidInvoiceError {
    return new InvalidInvoiceError('Invoice is already fully refunded')
  }

  static cannotRefundUnpaidInvoice(): InvalidInvoiceError {
    return new InvalidInvoiceError('Cannot refund an unpaid invoice')
  }

  static refundExceedsAmount(): InvalidInvoiceError {
    return new InvalidInvoiceError('Refund amount cannot exceed the original invoice amount')
  }

  static refundExceedsRemaining(): InvalidInvoiceError {
    return new InvalidInvoiceError('Refund amount exceeds remaining refundable amount')
  }

  static invalidRefundAmount(): InvalidInvoiceError {
    return new InvalidInvoiceError('Refund amount must be positive')
  }

  static refundReasonRequired(): InvalidInvoiceError {
    return new InvalidInvoiceError('Refund reason is required')
  }
}
