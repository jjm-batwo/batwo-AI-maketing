import { DomainError } from './DomainError'

/**
 * BudgetAlertError
 *
 * Base class for budget alert related domain errors.
 */
export abstract class BudgetAlertError extends DomainError {}

/**
 * Thrown when budget alert threshold is invalid (not in 1-100 range).
 */
export class InvalidThresholdError extends BudgetAlertError {
  readonly code = 'INVALID_THRESHOLD'

  constructor(threshold: number) {
    super(`Invalid threshold: ${threshold}. Must be between 1 and 100.`)
  }
}

/**
 * Thrown when attempting to create duplicate budget alert for same campaign.
 */
export class DuplicateBudgetAlertError extends BudgetAlertError {
  readonly code = 'DUPLICATE_BUDGET_ALERT'

  constructor(campaignId: string) {
    super(`Budget alert already exists for campaign ${campaignId}`)
  }
}

/**
 * Thrown when budget alert not found for campaign.
 */
export class BudgetAlertNotFoundError extends BudgetAlertError {
  readonly code = 'BUDGET_ALERT_NOT_FOUND'

  constructor(campaignId: string) {
    super(`Budget alert not found for campaign ${campaignId}`)
  }
}
