// Core domain events infrastructure
export { BaseDomainEvent } from './DomainEvent'
export type { DomainEvent } from './DomainEvent'
export type { IEventDispatcher, EventHandler } from './EventDispatcher'
export { AggregateRoot } from './AggregateRoot'

// Campaign events
export {
  CampaignCreatedEvent,
  CampaignStatusChangedEvent,
  CampaignBudgetUpdatedEvent,
} from './campaign'

// Report events
export { ReportGeneratedEvent, ReportEmailSentEvent } from './report'
