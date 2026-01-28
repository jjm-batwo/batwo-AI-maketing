import type { DomainEvent } from './DomainEvent'

/**
 * Base class for aggregate roots that can raise domain events.
 *
 * Aggregate roots are entities that maintain invariants across a cluster of domain objects.
 * They can raise domain events to notify other parts of the system about state changes.
 */
export abstract class AggregateRoot {
  private _domainEvents: DomainEvent[] = []

  /**
   * Get all domain events raised by this aggregate
   */
  get domainEvents(): ReadonlyArray<DomainEvent> {
    return Object.freeze([...this._domainEvents])
  }

  /**
   * Add a domain event to be dispatched later
   * @param event - The domain event to add
   */
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event)
  }

  /**
   * Clear all domain events from this aggregate.
   * Should be called after events have been dispatched.
   */
  public clearDomainEvents(): void {
    this._domainEvents = []
  }

  /**
   * Check if this aggregate has any pending domain events
   */
  public hasDomainEvents(): boolean {
    return this._domainEvents.length > 0
  }
}
