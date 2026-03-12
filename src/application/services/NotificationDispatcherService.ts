import type { INotificationSender } from '@application/ports/INotificationSender'
import type { INotificationChannelRepository } from '@domain/repositories/INotificationChannelRepository'
import type { INotificationPreferenceRepository } from '@domain/repositories/INotificationPreferenceRepository'
import type { NotificationChannelType } from '@domain/entities/NotificationChannel'
import type { MinSeverity } from '@domain/value-objects/NotificationPreference'

export interface DispatchParams {
  userId: string
  alertType: string
  severity: MinSeverity
  title: string
  message: string
  actionUrl?: string
}

export interface DispatchResult {
  sent: number
  failed: number
  errors: string[]
}

const SEVERITY_ORDER: Record<MinSeverity, number> = {
  INFO: 0,
  WARNING: 1,
  CRITICAL: 2,
}

/**
 * 알림 디스패처 서비스
 *
 * 사용자의 알림 선호도에 따라 적절한 채널로 알림을 발송합니다.
 * 1. 사용자 선호도 조회
 * 2. 최소 심각도 필터
 * 3. 설정된 채널로 발송
 */
export class NotificationDispatcherService {
  private senders: Map<NotificationChannelType, INotificationSender>

  constructor(
    private readonly channelRepository: INotificationChannelRepository,
    private readonly preferenceRepository: INotificationPreferenceRepository,
    slackSender: INotificationSender,
    kakaoSender: INotificationSender,
  ) {
    this.senders = new Map<NotificationChannelType, INotificationSender>([
      ['SLACK', slackSender],
      ['KAKAO', kakaoSender],
    ])
  }

  async dispatch(params: DispatchParams): Promise<DispatchResult> {
    const result: DispatchResult = { sent: 0, failed: 0, errors: [] }

    try {
      // 1. 사용자 선호도 조회
      const preference = await this.preferenceRepository.findByUserAndType(
        params.userId,
        params.alertType,
      )

      if (!preference || !preference.isActive) {
        return result
      }

      // 2. 최소 심각도 필터
      if (!this.meetsMinSeverity(params.severity, preference.minSeverity)) {
        return result
      }

      // 3. 설정된 채널로 발송
      for (const channelType of preference.channels) {
        const channel = await this.channelRepository.findByUserAndType(
          params.userId,
          channelType,
        )

        if (!channel || !channel.isActive) continue

        const sender = this.senders.get(channelType)
        if (!sender) continue

        const sendResult = await sender.send({
          config: channel.config,
          title: params.title,
          message: params.message,
          severity: params.severity,
          actionUrl: params.actionUrl,
        })

        if (sendResult.success) {
          result.sent++
        } else {
          result.failed++
          if (sendResult.error) {
            result.errors.push(`${channelType}: ${sendResult.error}`)
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[NotificationDispatcherService] dispatch error:', errorMessage)
      result.errors.push(errorMessage)
    }

    return result
  }

  private meetsMinSeverity(severity: MinSeverity, minSeverity: MinSeverity): boolean {
    return SEVERITY_ORDER[severity] >= SEVERITY_ORDER[minSeverity]
  }
}
