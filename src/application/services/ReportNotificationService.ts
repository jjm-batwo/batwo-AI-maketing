import type { IEmailService } from '@application/ports/IEmailService'
import type { INotificationSender } from '@application/ports/INotificationSender'
import type { INotificationChannelRepository } from '@domain/repositories/INotificationChannelRepository'
import type { ReportSummaryMetrics } from '@domain/entities/Report'

interface SendReportParams {
  userId: string
  recipients: string[]
  subject: string
  reportId: string
  reportSummary: ReportSummaryMetrics
  shareUrl: string
}

interface SendReportResult {
  emailSent: boolean
  slackSent: boolean
  errors: string[]
}

export class ReportNotificationService {
  constructor(
    private readonly emailService: IEmailService,
    private readonly slackSender: INotificationSender,
    private readonly channelRepository: INotificationChannelRepository
  ) {}

  async sendReport(params: SendReportParams): Promise<SendReportResult> {
    const errors: string[] = []
    let emailSent = false
    let slackSent = false

    // 1. Email delivery
    if (params.recipients.length > 0) {
      try {
        const result = await this.emailService.sendReportEmail({
          to: params.recipients,
          subject: params.subject,
          reportId: params.reportId,
          reportSummary: params.reportSummary,
          shareUrl: params.shareUrl,
        })
        emailSent = result.success
        if (!result.success) {
          errors.push('Email delivery failed')
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown email error'
        errors.push(`Email error: ${msg}`)
      }
    }

    // 2. Slack delivery (if user has active Slack channel)
    try {
      const channels = await this.channelRepository.findByUserId(params.userId)
      const slackChannel = channels.find(
        (ch) => ch.type === 'SLACK' && ch.isActive
      )

      if (slackChannel) {
        const { totalSpend, totalRevenue, overallROAS } = params.reportSummary
        const formatWon = (v: number) => `${v.toLocaleString('ko-KR')}원`

        const result = await this.slackSender.send({
          title: `${params.subject} 발송 완료`,
          message: [
            `*지출:* ${formatWon(totalSpend)} | *매출:* ${formatWon(totalRevenue)} | *ROAS:* ${overallROAS.toFixed(2)}x`,
            `<${params.shareUrl}|보고서 보기>`,
          ].join('\n'),
          severity: 'INFO',
          config: slackChannel.config,
          actionUrl: params.shareUrl,
        })
        slackSent = result.success
        if (!result.success) {
          errors.push(`Slack failed: ${result.error ?? 'unknown'}`)
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown Slack error'
      errors.push(`Slack error: ${msg}`)
      console.error('[ReportNotificationService] Slack delivery failed:', msg)
    }

    return { emailSent, slackSent, errors }
  }
}
