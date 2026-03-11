import { Resend } from 'resend'
import type {
  IEmailService,
  SendEmailInput,
  SendEmailResult,
} from '@application/ports/IEmailService'
import { WeeklyReportEmailTemplate } from './templates/WeeklyReportEmailTemplate'
import { TrendAlertEmailTemplate } from './templates/TrendAlertEmailTemplate'
import type { TrendAlert } from '@/application/services/TrendAlertService'

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

  async sendTrendAlert(params: {
    to: string | string[]
    userName: string
    digest: TrendAlert
  }): Promise<SendEmailResult> {
    const html = TrendAlertEmailTemplate({
      userName: params.userName,
      digest: params.digest,
    })

    const urgentCount = params.digest.weeklyDigest.urgentCount
    const subjectPrefix = urgentCount > 0 ? `🔥 [긴급] ` : ''

    return this.sendEmail({
      to: params.to,
      subject: `${subjectPrefix}[바투] 이번 주 마케팅 기회 알림`,
      html,
    })
  }

  async sendReportEmail(params: {
    to: string[]
    subject: string
    reportId: string
    reportSummary: import('../../domain/entities/Report').ReportSummaryMetrics
    shareUrl?: string
  }): Promise<{ success: boolean; messageId?: string }> {
    const summary = params.reportSummary
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1f2937;">바투 AI 광고 성과 보고서</h1>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 16px 0;">
          <p><strong>총 지출:</strong> ${summary.totalSpend.toLocaleString()}원</p>
          <p><strong>총 매출:</strong> ${summary.totalRevenue.toLocaleString()}원</p>
          <p><strong>ROAS:</strong> ${summary.overallROAS.toFixed(2)}x</p>
          <p><strong>전환수:</strong> ${summary.totalConversions.toLocaleString()}</p>
        </div>
        ${params.shareUrl ? `<a href="${params.shareUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">상세 보고서 보기</a>` : ''}
      </div>
    `

    const result = await this.sendEmail({
      to: params.to,
      subject: params.subject,
      html,
    })

    return { success: result.success, messageId: result.messageId }
  }
}
