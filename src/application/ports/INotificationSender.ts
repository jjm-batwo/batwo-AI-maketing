/**
 * INotificationSender 포트
 *
 * 외부 알림 채널(Slack, KakaoTalk, Email)로 메시지를 발송하기 위한 인터페이스
 */
export interface NotificationSendParams {
  config: unknown
  title: string
  message: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  actionUrl?: string
}

export interface NotificationSendResult {
  success: boolean
  error?: string
}

export interface INotificationSender {
  send(params: NotificationSendParams): Promise<NotificationSendResult>
}
