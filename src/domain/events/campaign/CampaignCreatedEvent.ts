import { BaseDomainEvent } from '../DomainEvent'
import type { CampaignObjective } from '../../value-objects/CampaignObjective'
import type { Money } from '../../value-objects/Money'
import type { TargetAudience } from '../../entities/Campaign'

/**
 * Event raised when a new campaign is created.
 * This event can trigger:
 * - Sending welcome notifications
 * - Setting up initial tracking
 * - Creating default campaign settings
 */
export class CampaignCreatedEvent extends BaseDomainEvent {
  public static readonly EVENT_TYPE = 'campaign.created'

  constructor(
    aggregateId: string,
    public readonly userId: string,
    public readonly name: string,
    public readonly objective: CampaignObjective,
    public readonly dailyBudget: Money,
    public readonly startDate: Date,
    public readonly endDate?: Date,
    public readonly targetAudience?: TargetAudience
  ) {
    super(CampaignCreatedEvent.EVENT_TYPE, aggregateId)
  }
}
