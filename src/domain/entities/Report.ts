import { DateRange } from '../value-objects/DateRange'
import { InvalidReportError } from '../errors/InvalidReportError'

export enum ReportType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export type ReportStatus = 'DRAFT' | 'GENERATED' | 'SENT'

export interface ReportSection {
  title: string
  content: string
  metrics?: {
    impressions?: number
    clicks?: number
    conversions?: number
    spend?: number
    revenue?: number
    [key: string]: number | undefined
  }
}

export interface AIInsight {
  type: 'performance' | 'recommendation' | 'trend' | 'anomaly'
  insight: string
  confidence: number
  recommendations: string[]
}

export interface ReportSummaryMetrics {
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  totalSpend: number
  totalRevenue: number
  overallROAS: number
  averageCTR: number
  averageCVR: number
}

export interface CreateReportProps {
  userId: string
  campaignIds: string[]
  dateRange: DateRange
}

export interface ReportProps extends CreateReportProps {
  id: string
  type: ReportType
  sections: ReportSection[]
  aiInsights: AIInsight[]
  status: ReportStatus
  generatedAt?: Date
  sentAt?: Date
  createdAt: Date
  updatedAt: Date
}

export class Report {
  private constructor(
    private readonly _id: string,
    private readonly _type: ReportType,
    private readonly _userId: string,
    private readonly _campaignIds: string[],
    private readonly _dateRange: DateRange,
    private readonly _sections: ReportSection[],
    private readonly _aiInsights: AIInsight[],
    private readonly _status: ReportStatus,
    private readonly _generatedAt: Date | undefined,
    private readonly _sentAt: Date | undefined,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date
  ) {}

  static createWeekly(props: CreateReportProps): Report {
    Report.validateCampaignIds(props.campaignIds)
    Report.validateDateRangeForType(props.dateRange, ReportType.WEEKLY)

    const now = new Date()

    return new Report(
      crypto.randomUUID(),
      ReportType.WEEKLY,
      props.userId,
      [...props.campaignIds],
      props.dateRange,
      [],
      [],
      'DRAFT',
      undefined,
      undefined,
      now,
      now
    )
  }

  static createDaily(props: CreateReportProps): Report {
    Report.validateCampaignIds(props.campaignIds)

    const now = new Date()

    return new Report(
      crypto.randomUUID(),
      ReportType.DAILY,
      props.userId,
      [...props.campaignIds],
      props.dateRange,
      [],
      [],
      'DRAFT',
      undefined,
      undefined,
      now,
      now
    )
  }

  static restore(props: ReportProps): Report {
    return new Report(
      props.id,
      props.type,
      props.userId,
      [...props.campaignIds],
      props.dateRange,
      [...props.sections],
      [...props.aiInsights],
      props.status,
      props.generatedAt,
      props.sentAt,
      props.createdAt,
      props.updatedAt
    )
  }

  private static validateCampaignIds(campaignIds: string[]): void {
    if (campaignIds.length === 0) {
      throw InvalidReportError.emptyCampaignList()
    }
  }

  private static validateDateRangeForType(dateRange: DateRange, type: ReportType): void {
    const days = dateRange.getDurationInDays()

    if (type === ReportType.WEEKLY && days !== undefined && days > 7) {
      throw InvalidReportError.invalidDateRange('Weekly', 7)
    }

    if (type === ReportType.DAILY && days !== undefined && days > 1) {
      throw InvalidReportError.invalidDateRange('Daily', 1)
    }
  }

  // Getters
  get id(): string {
    return this._id
  }
  get type(): ReportType {
    return this._type
  }
  get userId(): string {
    return this._userId
  }
  get campaignIds(): string[] {
    return [...this._campaignIds]
  }
  get dateRange(): DateRange {
    return this._dateRange
  }
  get sections(): ReportSection[] {
    return [...this._sections]
  }
  get aiInsights(): AIInsight[] {
    return [...this._aiInsights]
  }
  get status(): ReportStatus {
    return this._status
  }
  get generatedAt(): Date | undefined {
    return this._generatedAt ? new Date(this._generatedAt) : undefined
  }
  get sentAt(): Date | undefined {
    return this._sentAt ? new Date(this._sentAt) : undefined
  }
  get createdAt(): Date {
    return new Date(this._createdAt)
  }
  get updatedAt(): Date {
    return new Date(this._updatedAt)
  }

  // Commands
  addSection(section: ReportSection): Report {
    return new Report(
      this._id,
      this._type,
      this._userId,
      this._campaignIds,
      this._dateRange,
      [...this._sections, section],
      this._aiInsights,
      this._status,
      this._generatedAt,
      this._sentAt,
      this._createdAt,
      new Date()
    )
  }

  addAIInsight(insight: AIInsight): Report {
    if (insight.confidence < 0 || insight.confidence > 1) {
      throw InvalidReportError.invalidConfidence()
    }

    return new Report(
      this._id,
      this._type,
      this._userId,
      this._campaignIds,
      this._dateRange,
      this._sections,
      [...this._aiInsights, insight],
      this._status,
      this._generatedAt,
      this._sentAt,
      this._createdAt,
      new Date()
    )
  }

  markAsGenerated(): Report {
    return new Report(
      this._id,
      this._type,
      this._userId,
      this._campaignIds,
      this._dateRange,
      this._sections,
      this._aiInsights,
      'GENERATED',
      new Date(),
      this._sentAt,
      this._createdAt,
      new Date()
    )
  }

  markAsSent(): Report {
    if (this._status !== 'GENERATED') {
      throw InvalidReportError.cannotSendBeforeGeneration()
    }

    return new Report(
      this._id,
      this._type,
      this._userId,
      this._campaignIds,
      this._dateRange,
      this._sections,
      this._aiInsights,
      'SENT',
      this._generatedAt,
      new Date(),
      this._createdAt,
      new Date()
    )
  }

  calculateSummaryMetrics(): ReportSummaryMetrics {
    let totalImpressions = 0
    let totalClicks = 0
    let totalConversions = 0
    let totalSpend = 0
    let totalRevenue = 0

    for (const section of this._sections) {
      if (section.metrics) {
        totalImpressions += section.metrics.impressions || 0
        totalClicks += section.metrics.clicks || 0
        totalConversions += section.metrics.conversions || 0
        totalSpend += section.metrics.spend || 0
        totalRevenue += section.metrics.revenue || 0
      }
    }

    const overallROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0
    const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    const averageCVR = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0

    return {
      totalImpressions,
      totalClicks,
      totalConversions,
      totalSpend,
      totalRevenue,
      overallROAS,
      averageCTR,
      averageCVR,
    }
  }

  toJSON(): ReportProps {
    return {
      id: this._id,
      type: this._type,
      userId: this._userId,
      campaignIds: this._campaignIds,
      dateRange: this._dateRange,
      sections: this._sections,
      aiInsights: this._aiInsights,
      status: this._status,
      generatedAt: this._generatedAt,
      sentAt: this._sentAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    }
  }
}
