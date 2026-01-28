import { BaseDomainEvent } from '../DomainEvent'
import type { ReportType } from '../../entities/Report'
import type { DateRange } from '../../value-objects/DateRange'

/**
 * Event raised when a report is successfully generated.
 * This event can trigger:
 * - Email sending workflow
 * - Notification to users
 * - Analytics tracking
 * - PDF generation
 * - External integrations
 */
export class ReportGeneratedEvent extends BaseDomainEvent {
  public static readonly EVENT_TYPE = 'report.generated'

  constructor(
    aggregateId: string,
    public readonly userId: string,
    public readonly reportType: ReportType,
    public readonly campaignIds: string[],
    public readonly dateRange: DateRange,
    public readonly sectionCount: number,
    public readonly insightCount: number
  ) {
    super(ReportGeneratedEvent.EVENT_TYPE, aggregateId)
  }
}
