import type { DomainEvent, IEventDispatcher, EventHandler } from '../../domain/events'

/**
 * Simple in-memory implementation of IEventDispatcher.
 * This implementation dispatches events synchronously to all registered handlers.
 *
 * For production, consider:
 * - Using a message queue (RabbitMQ, SQS, etc.)
 * - Implementing retry logic
 * - Adding event persistence
 * - Supporting transaction outbox pattern
 */
export class InMemoryEventDispatcher implements IEventDispatcher {
  private handlers: Map<string, Set<EventHandler>> = new Map()

  register<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set())
    }

    this.handlers.get(eventType)!.add(handler as EventHandler)
  }

  unregister<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(eventType)
    if (handlers) {
      handlers.delete(handler as EventHandler)
      if (handlers.size === 0) {
        this.handlers.delete(eventType)
      }
    }
  }

  async dispatch(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType)
    if (!handlers || handlers.size === 0) {
      return
    }

    // Execute all handlers in parallel
    const promises = Array.from(handlers).map((handler) =>
      Promise.resolve(handler(event)).catch((error) => {
        console.error(`Error handling event ${event.eventType}:`, error)
        // In production, you might want to:
        // - Log to error tracking service
        // - Add to dead letter queue
        // - Retry with exponential backoff
      })
    )

    await Promise.all(promises)
  }

  async dispatchAll(events: DomainEvent[]): Promise<void> {
    // Dispatch events sequentially to maintain order
    for (const event of events) {
      await this.dispatch(event)
    }
  }

  clearAll(): void {
    this.handlers.clear()
  }

  /**
   * Get the count of registered handlers for a specific event type
   * Useful for testing and debugging
   */
  getHandlerCount(eventType: string): number {
    return this.handlers.get(eventType)?.size ?? 0
  }

  /**
   * Get all registered event types
   * Useful for testing and debugging
   */
  getRegisteredEventTypes(): string[] {
    return Array.from(this.handlers.keys())
  }
}
