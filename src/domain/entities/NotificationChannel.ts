export type NotificationChannelType = 'SLACK' | 'KAKAO' | 'EMAIL'

export interface SlackConfig {
  webhookUrl: string
  channelName?: string
}

export interface KakaoConfig {
  phoneNumber: string
}

export interface EmailConfig {
  email: string
}

export type ChannelConfig = SlackConfig | KakaoConfig | EmailConfig

export interface NotificationChannelProps {
  id: string
  userId: string
  type: NotificationChannelType
  config: ChannelConfig
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export class NotificationChannel {
  private constructor(private readonly props: NotificationChannelProps) {}

  static create(params: {
    userId: string
    type: NotificationChannelType
    config: ChannelConfig
  }): NotificationChannel {
    NotificationChannel.validateConfig(params.type, params.config)

    return new NotificationChannel({
      id: '',
      userId: params.userId,
      type: params.type,
      config: params.config,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  static restore(props: NotificationChannelProps): NotificationChannel {
    return new NotificationChannel(props)
  }

  private static validateConfig(type: NotificationChannelType, config: ChannelConfig): void {
    switch (type) {
      case 'SLACK': {
        const slackConfig = config as SlackConfig
        if (!slackConfig.webhookUrl || !slackConfig.webhookUrl.startsWith('https://hooks.slack.com/')) {
          throw new Error('유효한 Slack Webhook URL이 필요합니다')
        }
        break
      }
      case 'KAKAO': {
        const kakaoConfig = config as KakaoConfig
        if (!kakaoConfig.phoneNumber || !/^01[016789]\d{7,8}$/.test(kakaoConfig.phoneNumber)) {
          throw new Error('유효한 휴대폰 번호가 필요합니다')
        }
        break
      }
      case 'EMAIL': {
        const emailConfig = config as EmailConfig
        if (!emailConfig.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailConfig.email)) {
          throw new Error('유효한 이메일 주소가 필요합니다')
        }
        break
      }
      default:
        throw new Error(`알 수 없는 채널 타입: ${type}`)
    }
  }

  deactivate(): NotificationChannel {
    return new NotificationChannel({
      ...this.props,
      isActive: false,
      updatedAt: new Date(),
    })
  }

  activate(): NotificationChannel {
    return new NotificationChannel({
      ...this.props,
      isActive: true,
      updatedAt: new Date(),
    })
  }

  updateConfig(config: ChannelConfig): NotificationChannel {
    NotificationChannel.validateConfig(this.props.type, config)
    return new NotificationChannel({
      ...this.props,
      config,
      updatedAt: new Date(),
    })
  }

  get id(): string { return this.props.id }
  get userId(): string { return this.props.userId }
  get type(): NotificationChannelType { return this.props.type }
  get config(): ChannelConfig { return this.props.config }
  get isActive(): boolean { return this.props.isActive }
  get createdAt(): Date { return this.props.createdAt }
  get updatedAt(): Date { return this.props.updatedAt }

  toJSON(): NotificationChannelProps {
    return { ...this.props }
  }
}
