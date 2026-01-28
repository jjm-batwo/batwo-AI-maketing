import { BaseDomainEvent } from '../DomainEvent'
import type { CampaignStatus } from '../../value-objects/CampaignStatus'

/**
 * Event raised when a campaign's status changes.
 * This event can trigger:
 * - Status change notifications
 * - Activation/deactivation of external platform campaigns
 * - Analytics tracking
 * - Workflow transitions
 */
export class CampaignStatusChangedEvent extends BaseDomainEvent {
  public static readonly EVENT_TYPE = 'campaign.status_changed'

  constructor(
    aggregateId: string,
    public readonly userId: string,
    public readonly previousStatus: CampaignStatus,
    public readonly newStatus: CampaignStatus,
    public readonly metaCampaignId?: string
  ) {
    super(CampaignStatusChangedEvent.EVENT_TYPE, aggregateId)
  }
}
