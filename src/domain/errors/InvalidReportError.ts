import { DomainError } from './DomainError'

export class InvalidReportError extends DomainError {
  readonly code = 'INVALID_REPORT'

  constructor(message: string) {
    super(message)
  }

  static emptyCampaignList(): InvalidReportError {
    return new InvalidReportError('At least one campaign is required for report')
  }

  static invalidDateRange(reportType: string, maxDays: number): InvalidReportError {
    return new InvalidReportError(`${reportType} report date range must be ${maxDays} days or less`)
  }

  static invalidConfidence(): InvalidReportError {
    return new InvalidReportError('Confidence must be between 0 and 1')
  }

  static cannotSendBeforeGeneration(): InvalidReportError {
    return new InvalidReportError('Cannot send report that has not been generated')
  }
}
