import { DomainError } from './DomainError'

export class UnauthorizedCampaignError extends DomainError {
  readonly code = 'UNAUTHORIZED_CAMPAIGN'

  constructor(campaignId: string) {
    super(`Campaign ${campaignId} not found or unauthorized`)
  }

  static notFound(campaignId: string): UnauthorizedCampaignError {
    return new UnauthorizedCampaignError(campaignId)
  }
}
