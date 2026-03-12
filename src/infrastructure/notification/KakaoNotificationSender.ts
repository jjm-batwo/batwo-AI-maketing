import type { INotificationSender, NotificationSendParams, NotificationSendResult } from '@application/ports/INotificationSender'
import type { KakaoConfig } from '@domain/entities/NotificationChannel'

/**
 * Solapi API를 통한 카카오 알림톡 발송 어댑터
 */
export class KakaoNotificationSender implements INotificationSender {
  async send(params: NotificationSendParams): Promise<NotificationSendResult> {
    try {
      const config = params.config as KakaoConfig
      if (!config?.phoneNumber) {
        return { success: false, error: '전화번호가 설정되지 않았습니다' }
      }

      const apiKey = process.env.SOLAPI_API_KEY
      const senderNumber = process.env.SOLAPI_SENDER_NUMBER
      const pfId = process.env.KAKAO_PF_ID
      const templateId = process.env.KAKAO_ALERT_TEMPLATE_ID

      if (!apiKey || !senderNumber) {
        console.warn('[KakaoNotificationSender] Solapi API 키 또는 발신번호가 설정되지 않았습니다')
        return { success: false, error: 'Solapi API 설정이 되어 있지 않습니다' }
      }

      const response = await fetch('https://api.solapi.com/messages/v4/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          message: {
            to: config.phoneNumber,
            from: senderNumber,
            kakaoOptions: pfId && templateId
              ? {
                  pfId,
                  templateId,
                  variables: {
                    title: params.title,
                    message: params.message,
                    severity: params.severity,
                    ...(params.actionUrl ? { actionUrl: params.actionUrl } : {}),
                  },
                }
              : undefined,
            // 카카오 알림톡이 불가능한 경우 SMS 폴백
            text: `[바투] ${params.title}\n${params.message}${params.actionUrl ? `\n확인: ${params.actionUrl}` : ''}`,
          },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return { success: false, error: `Solapi API 오류: ${response.status} - ${errorText}` }
      }

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[KakaoNotificationSender] 발송 실패:', errorMessage)
      return { success: false, error: errorMessage }
    }
  }
}
