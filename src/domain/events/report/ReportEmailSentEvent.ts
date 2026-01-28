import { BaseDomainEvent } from '../DomainEvent'
import type { ReportType } from '../../entities/Report'

/**
 * Event raised when a report email is successfully sent.
 * This event can trigger:
 * - Delivery confirmation notifications
 * - Analytics tracking
 * - Delivery status updates
 * - Audit logging
 */
export class ReportEmailSentEvent extends BaseDomainEvent {
  public static readonly EVENT_TYPE = 'report.email_sent'

  constructor(
    aggregateId: string,
    public readonly userId: string,
    public readonly reportType: ReportType,
    public readonly recipientEmail: string,
    public readonly emailProvider?: string
  ) {
    super(ReportEmailSentEvent.EVENT_TYPE, aggregateId)
  }
}
