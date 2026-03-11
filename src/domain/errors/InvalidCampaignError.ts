import { DomainError } from './DomainError'

export class InvalidCampaignError extends DomainError {
  readonly code = 'INVALID_CAMPAIGN'

  constructor(message: string) {
    super(message)
  }

  static emptyName(): InvalidCampaignError {
    return new InvalidCampaignError('Campaign name is required')
  }

  static nameTooLong(maxLength: number = 255): InvalidCampaignError {
    return new InvalidCampaignError(`Campaign name cannot exceed ${maxLength} characters`)
  }

  static invalidBudget(): InvalidCampaignError {
    return new InvalidCampaignError('Daily budget must be greater than zero')
  }

  static pastStartDate(): InvalidCampaignError {
    return new InvalidCampaignError('Start date cannot be in the past')
  }

  static invalidDateRange(): InvalidCampaignError {
    return new InvalidCampaignError('End date cannot be before start date')
  }

  static invalidStatusTransition(from: string, to: string): InvalidCampaignError {
    return new InvalidCampaignError(`Cannot change status from ${from} to ${to}`)
  }

  static completedCampaignModification(): InvalidCampaignError {
    return new InvalidCampaignError('Cannot modify a completed campaign')
  }

  static metaCampaignIdAlreadySet(): InvalidCampaignError {
    return new InvalidCampaignError('Meta campaign ID is already set')
  }

  static terminalStatusChange(): InvalidCampaignError {
    return new InvalidCampaignError('Cannot change status of a completed campaign')
  }

  static terminalBudgetUpdate(): InvalidCampaignError {
    return new InvalidCampaignError('Cannot update budget of a completed campaign')
  }

  static terminalCampaignUpdate(): InvalidCampaignError {
    return new InvalidCampaignError('Cannot update a completed campaign')
  }

  static activeCampaignLimitedUpdate(): InvalidCampaignError {
    return new InvalidCampaignError('Only budget can be updated for active campaigns')
  }
}
