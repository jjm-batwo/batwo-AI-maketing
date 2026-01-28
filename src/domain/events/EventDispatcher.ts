import type { DomainEvent } from './DomainEvent'

/**
 * Event handler function type
 */
export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => void | Promise<void>

/**
 * Interface for dispatching domain events.
 * Implementations can dispatch events synchronously or asynchronously,
 * to in-process handlers or external message brokers.
 */
export interface IEventDispatcher {
  /**
   * Register a handler for a specific event type
   * @param eventType - The type of event to listen for
   * @param handler - The handler function to invoke when event is dispatched
   */
  register<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void

  /**
   * Unregister a handler for a specific event type
   * @param eventType - The type of event to stop listening for
   * @param handler - The handler function to remove
   */
  unregister<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void

  /**
   * Dispatch a single event to all registered handlers
   * @param event - The domain event to dispatch
   */
  dispatch(event: DomainEvent): Promise<void>

  /**
   * Dispatch multiple events to all registered handlers
   * @param events - Array of domain events to dispatch
   */
  dispatchAll(events: DomainEvent[]): Promise<void>

  /**
   * Clear all registered handlers
   */
  clearAll(): void
}
