import type { NotificationChannelType } from '../entities/NotificationChannel'

export type AlertType = 'anomaly' | 'budget' | 'milestone' | 'recommendation'
export type MinSeverity = 'INFO' | 'WARNING' | 'CRITICAL'

const SEVERITY_ORDER: Record<MinSeverity, number> = {
  INFO: 0,
  WARNING: 1,
  CRITICAL: 2,
}

export interface NotificationPreferenceProps {
  id: string
  userId: string
  alertType: AlertType
  channels: NotificationChannelType[]
  minSeverity: MinSeverity
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export class NotificationPreference {
  private constructor(private readonly props: NotificationPreferenceProps) {}

  static create(params: {
    userId: string
    alertType: AlertType
    channels: NotificationChannelType[]
    minSeverity?: MinSeverity
  }): NotificationPreference {
    if (!params.channels || params.channels.length === 0) {
      throw new Error('최소 하나의 알림 채널을 선택해야 합니다')
    }

    const validAlertTypes: AlertType[] = ['anomaly', 'budget', 'milestone', 'recommendation']
    if (!validAlertTypes.includes(params.alertType)) {
      throw new Error(`알 수 없는 알림 유형: ${params.alertType}`)
    }

    return new NotificationPreference({
      id: '',
      userId: params.userId,
      alertType: params.alertType,
      channels: [...params.channels],
      minSeverity: params.minSeverity ?? 'WARNING',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  static restore(props: NotificationPreferenceProps): NotificationPreference {
    return new NotificationPreference(props)
  }

  /**
   * 지정된 심각도가 최소 심각도 이상인지 확인
   */
  meetsSeverity(severity: MinSeverity): boolean {
    return SEVERITY_ORDER[severity] >= SEVERITY_ORDER[this.props.minSeverity]
  }

  updateChannels(channels: NotificationChannelType[]): NotificationPreference {
    if (!channels || channels.length === 0) {
      throw new Error('최소 하나의 알림 채널을 선택해야 합니다')
    }
    return new NotificationPreference({
      ...this.props,
      channels: [...channels],
      updatedAt: new Date(),
    })
  }

  updateMinSeverity(minSeverity: MinSeverity): NotificationPreference {
    return new NotificationPreference({
      ...this.props,
      minSeverity,
      updatedAt: new Date(),
    })
  }

  deactivate(): NotificationPreference {
    return new NotificationPreference({
      ...this.props,
      isActive: false,
      updatedAt: new Date(),
    })
  }

  activate(): NotificationPreference {
    return new NotificationPreference({
      ...this.props,
      isActive: true,
      updatedAt: new Date(),
    })
  }

  get id(): string { return this.props.id }
  get userId(): string { return this.props.userId }
  get alertType(): AlertType { return this.props.alertType }
  get channels(): NotificationChannelType[] { return [...this.props.channels] }
  get minSeverity(): MinSeverity { return this.props.minSeverity }
  get isActive(): boolean { return this.props.isActive }
  get createdAt(): Date { return this.props.createdAt }
  get updatedAt(): Date { return this.props.updatedAt }

  toJSON(): NotificationPreferenceProps {
    return { ...this.props, channels: [...this.props.channels] }
  }
}
