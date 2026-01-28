import { BaseDomainEvent } from '../DomainEvent'
import type { Money } from '../../value-objects/Money'

/**
 * Event raised when a campaign's budget is updated.
 * This event can trigger:
 * - Budget change notifications
 * - External platform budget updates
 * - Budget alert recalculations
 * - Analytics tracking
 */
export class CampaignBudgetUpdatedEvent extends BaseDomainEvent {
  public static readonly EVENT_TYPE = 'campaign.budget_updated'

  constructor(
    aggregateId: string,
    public readonly userId: string,
    public readonly previousBudget: Money,
    public readonly newBudget: Money,
    public readonly metaCampaignId?: string
  ) {
    super(CampaignBudgetUpdatedEvent.EVENT_TYPE, aggregateId)
  }
}
