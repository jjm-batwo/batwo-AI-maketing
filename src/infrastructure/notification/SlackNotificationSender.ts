import type {
  INotificationSender,
  NotificationSendParams,
  NotificationSendResult,
} from '@application/ports/INotificationSender'
import type { SlackConfig } from '@domain/entities/NotificationChannel'

/**
 * Slack Webhook을 통한 알림 발송 어댑터
 */
export class SlackNotificationSender implements INotificationSender {
  async send(params: NotificationSendParams): Promise<NotificationSendResult> {
    try {
      const config = params.config as SlackConfig
      if (!config?.webhookUrl) {
        return { success: false, error: 'Slack webhook URL이 설정되지 않았습니다' }
      }

      const emoji =
        params.severity === 'CRITICAL'
          ? ':rotating_light:'
          : params.severity === 'WARNING'
            ? ':warning:'
            : ':information_source:'

      const colorMap: Record<string, string> = {
        CRITICAL: '#dc2626',
        WARNING: '#f59e0b',
        INFO: '#3b82f6',
      }

      const blocks = [
        {
          type: 'header',
          text: { type: 'plain_text', text: `${emoji} ${params.title}`, emoji: true },
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: params.message },
        },
        ...(params.actionUrl
          ? [
              {
                type: 'actions',
                elements: [
                  {
                    type: 'button',
                    text: { type: 'plain_text', text: '바투에서 확인', emoji: true },
                    url: params.actionUrl,
                    style: 'primary',
                  },
                ],
              },
            ]
          : []),
      ]

      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attachments: [
            {
              color: colorMap[params.severity] || colorMap.INFO,
              blocks,
            },
          ],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return { success: false, error: `Slack API 오류: ${response.status} - ${errorText}` }
      }

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[SlackNotificationSender] 발송 실패:', errorMessage)
      return { success: false, error: errorMessage }
    }
  }
}
