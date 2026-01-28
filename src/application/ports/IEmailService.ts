/**
 * Email Service Port
 *
 * Defines the contract for sending emails in the application.
 */

import type { TrendAlert } from '@/application/services/TrendAlertService'

export interface SendEmailInput {
  to: string | string[]
  subject: string
  html: string
  attachments?: EmailAttachment[]
}

export interface EmailAttachment {
  filename: string
  content: Buffer
  contentType: string
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface IEmailService {
  /**
   * Send an email
   */
  sendEmail(input: SendEmailInput): Promise<SendEmailResult>

  /**
   * Send a weekly report email with PDF attachment
   */
  sendWeeklyReportEmail(params: {
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
  }): Promise<SendEmailResult>

  /**
   * Send a trend alert email
   */
  sendTrendAlert(params: {
    to: string | string[]
    userName: string
    digest: TrendAlert
  }): Promise<SendEmailResult>
}
