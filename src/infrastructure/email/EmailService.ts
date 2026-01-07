import { Resend } from 'resend'
import type {
  IEmailService,
  SendEmailInput,
  SendEmailResult,
} from '@application/ports/IEmailService'
import { WeeklyReportEmailTemplate } from './templates/WeeklyReportEmailTemplate'

export class EmailService implements IEmailService {
  private readonly resend: Resend
  private readonly fromEmail: string

  constructor(apiKey: string, fromEmail: string = 'noreply@batwo.co.kr') {
    this.resend = new Resend(apiKey)
    this.fromEmail = fromEmail
  }

  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        html: input.html,
        attachments: input.attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
        })),
      })

      if (result.error) {
        return {
          success: false,
          error: result.error.message,
        }
      }

      return {
        success: true,
        messageId: result.data?.id,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return {
        success: false,
        error: message,
      }
    }
  }

  async sendWeeklyReportEmail(params: {
    to: string | string[]
    reportName: string
    dateRange: { startDate: string; endDate: string }
    summaryMetrics: {
      totalImpressions: number
      totalClicks: number
      totalConversions: number
      totalSpend: number
      totalRevenue: number
      overallROAS: number
    }
    pdfAttachment?: {
      filename: string
      content: Buffer
    }
  }): Promise<SendEmailResult> {
    const html = WeeklyReportEmailTemplate({
      reportName: params.reportName,
      dateRange: params.dateRange,
      summaryMetrics: params.summaryMetrics,
    })

    return this.sendEmail({
      to: params.to,
      subject: `[바투] ${params.reportName} 주간 리포트`,
      html,
      attachments: params.pdfAttachment
        ? [
            {
              filename: params.pdfAttachment.filename,
              content: params.pdfAttachment.content,
              contentType: 'application/pdf',
            },
          ]
        : undefined,
    })
  }
}
