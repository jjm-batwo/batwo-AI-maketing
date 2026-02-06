export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL'
export type AlertStatus = 'UNREAD' | 'READ' | 'DISMISSED' | 'ACTED_ON'
export type AlertType = 'anomaly' | 'budget' | 'milestone' | 'recommendation'

export interface AlertProps {
  id: string
  userId: string
  type: AlertType
  severity: AlertSeverity
  status: AlertStatus
  title: string
  message: string
  data: Record<string, unknown> | null
  campaignId: string | null
  pushedToChat: boolean
  createdAt: Date
  readAt: Date | null
  expiresAt: Date | null
}

export class Alert {
  private constructor(private readonly props: AlertProps) {}

  static create(params: {
    userId: string
    type: AlertType
    severity: AlertSeverity
    title: string
    message: string
    data?: Record<string, unknown>
    campaignId?: string
    expiresAt?: Date
  }): Alert {
    return new Alert({
      id: '',
      userId: params.userId,
      type: params.type,
      severity: params.severity,
      status: 'UNREAD',
      title: params.title,
      message: params.message,
      data: params.data ?? null,
      campaignId: params.campaignId ?? null,
      pushedToChat: false,
      createdAt: new Date(),
      readAt: null,
      expiresAt: params.expiresAt ?? null,
    })
  }

  static fromPersistence(props: AlertProps): Alert {
    return new Alert(props)
  }

  get id(): string {
    return this.props.id
  }
  get userId(): string {
    return this.props.userId
  }
  get type(): AlertType {
    return this.props.type
  }
  get severity(): AlertSeverity {
    return this.props.severity
  }
  get status(): AlertStatus {
    return this.props.status
  }
  get title(): string {
    return this.props.title
  }
  get message(): string {
    return this.props.message
  }
  get data(): Record<string, unknown> | null {
    return this.props.data
  }
  get campaignId(): string | null {
    return this.props.campaignId
  }
  get pushedToChat(): boolean {
    return this.props.pushedToChat
  }
  get createdAt(): Date {
    return this.props.createdAt
  }
  get readAt(): Date | null {
    return this.props.readAt
  }
  get expiresAt(): Date | null {
    return this.props.expiresAt
  }

  markRead(): Alert {
    return new Alert({ ...this.props, status: 'READ', readAt: new Date() })
  }

  dismiss(): Alert {
    return new Alert({ ...this.props, status: 'DISMISSED' })
  }

  markActedOn(): Alert {
    return new Alert({ ...this.props, status: 'ACTED_ON' })
  }

  markPushedToChat(): Alert {
    return new Alert({ ...this.props, pushedToChat: true })
  }

  toJSON(): AlertProps {
    return { ...this.props }
  }
}
