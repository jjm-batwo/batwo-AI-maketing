/**
 * Base interface for all domain events.
 * Domain events represent something significant that happened in the domain.
 */
export interface DomainEvent {
  /** Unique identifier for this event instance */
  readonly id: string

  /** Type of event (discriminator for event handlers) */
  readonly eventType: string

  /** When the event occurred */
  readonly occurredAt: Date

  /** Aggregate ID that generated this event */
  readonly aggregateId: string
}

/**
 * Base class for domain events with common functionality
 */
export abstract class BaseDomainEvent implements DomainEvent {
  public readonly id: string
  public readonly occurredAt: Date

  constructor(
    public readonly eventType: string,
    public readonly aggregateId: string
  ) {
    this.id = crypto.randomUUID()
    this.occurredAt = new Date()
  }
}
