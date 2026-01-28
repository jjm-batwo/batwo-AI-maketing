/**
 * Anomaly Alert Service
 *
 * Sends push notifications (email) for critical anomalies.
 * - Rate limiting to prevent alert fatigue
 * - Deduplication within 24h window
 * - Configurable severity thresholds
 */

import type { IEmailService } from '@application/ports/IEmailService'
import type { Anomaly, AnomalySeverity } from './AnomalyDetectionService'

export interface AnomalyAlertConfig {
  /**
   * Minimum severity level to trigger alerts
   * - 'critical': Only critical anomalies
   * - 'warning': Warning and critical
   * - 'info': All anomalies
   */
  minimumSeverity: AnomalySeverity

  /**
   * Maximum alerts per campaign per day
   */
  maxAlertsPerCampaignPerDay: number

  /**
   * Deduplication window in hours
   */
  deduplicationWindowHours: number

  /**
   * Enable email notifications
   */
  enableEmailAlerts: boolean
}

interface AlertRecord {
  campaignId: string
  metric: string
  severity: AnomalySeverity
  timestamp: Date
}

const DEFAULT_CONFIG: AnomalyAlertConfig = {
  minimumSeverity: 'warning',
  maxAlertsPerCampaignPerDay: 5,
  deduplicationWindowHours: 24,
  enableEmailAlerts: true,
}

const SEVERITY_ORDER: Record<AnomalySeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
}

export class AnomalyAlertService {
  private readonly config: AnomalyAlertConfig
  private readonly alertHistory: Map<string, AlertRecord[]>

  constructor(
    private readonly emailService: IEmailService,
    config: Partial<AnomalyAlertConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.alertHistory = new Map()
  }

  /**
   * Send alerts for anomalies
   * Returns list of anomalies for which alerts were sent
   */
  async sendAlerts(params: {
    userId: string
    userEmail: string
    userName?: string
    anomalies: Anomaly[]
  }): Promise<{ sent: Anomaly[]; skipped: Anomaly[]; errors: string[] }> {
    const { userEmail, userName, anomalies } = params

    const sent: Anomaly[] = []
    const skipped: Anomaly[] = []
    const errors: string[] = []

    // Filter anomalies by severity
    const { alertable, filtered } = this.filterBySeverity(anomalies)

    // Add filtered anomalies to skipped
    skipped.push(...filtered)

    if (alertable.length === 0) {
      return { sent, skipped, errors }
    }

    // Check rate limits and deduplicate
    for (const anomaly of alertable) {
      if (this.shouldSkipAlert(anomaly)) {
        skipped.push(anomaly)
        continue
      }

      // Send email alert
      if (this.config.enableEmailAlerts) {
        try {
          await this.sendEmailAlert({
            userEmail,
            userName,
            anomaly,
          })
          sent.push(anomaly)
          this.recordAlert(anomaly)
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unknown error'
          errors.push(`Failed to send alert for ${anomaly.id}: ${message}`)
          skipped.push(anomaly)
        }
      } else {
        // Email alerts disabled, skip
        skipped.push(anomaly)
      }
    }

    return { sent, skipped, errors }
  }

  /**
   * Send email alert for a single anomaly
   */
  private async sendEmailAlert(params: {
    userEmail: string
    userName?: string
    anomaly: Anomaly
  }): Promise<void> {
    const { userEmail, userName, anomaly } = params

    const html = this.generateEmailHTML({
      userName: userName || '고객',
      anomaly,
    })

    const severityEmoji = this.getSeverityEmoji(anomaly.severity)
    const subject = `[바투] ${severityEmoji} 캠페인 이상 징후 감지: ${anomaly.campaignName}`

    const result = await this.emailService.sendEmail({
      to: userEmail,
      subject,
      html,
    })

    if (!result.success) {
      throw new Error(result.error || 'Failed to send email')
    }
  }

  /**
   * Generate email HTML
   */
  private generateEmailHTML(params: {
    userName: string
    anomaly: Anomaly
  }): string {
    const { userName, anomaly } = params

    const severityColor = this.getSeverityColor(anomaly.severity)
    const severityLabel = this.getSeverityLabel(anomaly.severity)
    const changeDirection =
      anomaly.changePercent >= 0 ? '상승' : '하락'
    const changeAbs = Math.abs(anomaly.changePercent).toFixed(1)

    const recommendations = anomaly.recommendations
      .map((rec) => `<li style="margin-bottom: 8px;">${rec}</li>`)
      .join('')

    const marketContextSection = anomaly.marketContext?.isSpecialDay
      ? `
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 8px 0; color: #92400e; font-size: 14px; font-weight: 600;">
          🗓️ 시장 컨텍스트
        </h3>
        <p style="margin: 0; color: #92400e; font-size: 13px;">
          ${anomaly.marketContext.events.join(', ')} 기간입니다.
          ${anomaly.marketContext.isWithinExpectedRange ? '예상 범위 내 변동입니다.' : '예상을 벗어난 변동입니다.'}
        </p>
      </div>
    `
      : ''

    return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>캠페인 이상 징후 알림</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                바투 AI 마케팅
              </h1>
              <p style="margin: 8px 0 0; color: #e0e7ff; font-size: 14px;">
                Campaign Anomaly Detection
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px;">
                안녕하세요, ${userName}님
              </p>

              <!-- Alert Badge -->
              <div style="background-color: ${severityColor}15; border-left: 4px solid ${severityColor}; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
                <h2 style="margin: 0 0 8px; color: ${severityColor}; font-size: 18px; font-weight: 600;">
                  ${severityLabel} ${anomaly.message}
                </h2>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                  캠페인: <strong>${anomaly.campaignName}</strong>
                </p>
              </div>

              <!-- Metrics -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px; background-color: #f9fafb; border-radius: 4px; width: 50%;">
                    <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px;">이전 값</p>
                    <p style="margin: 0; color: #111827; font-size: 20px; font-weight: 600;">
                      ${this.formatMetricValue(anomaly.metric, anomaly.previousValue)}
                    </p>
                  </td>
                  <td style="width: 16px;"></td>
                  <td style="padding: 12px; background-color: #f9fafb; border-radius: 4px; width: 50%;">
                    <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px;">현재 값</p>
                    <p style="margin: 0; color: #111827; font-size: 20px; font-weight: 600;">
                      ${this.formatMetricValue(anomaly.metric, anomaly.currentValue)}
                    </p>
                  </td>
                </tr>
              </table>

              <div style="text-align: center; padding: 16px; background-color: #fef3c7; border-radius: 4px; margin-bottom: 24px;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>${changeAbs}% ${changeDirection}</strong>
                </p>
              </div>

              ${marketContextSection}

              <!-- Recommendations -->
              ${recommendations ? `
              <div style="margin-top: 24px;">
                <h3 style="margin: 0 0 12px; color: #111827; font-size: 16px; font-weight: 600;">
                  💡 권장 조치
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.6;">
                  ${recommendations}
                </ul>
              </div>
              ` : ''}

              <!-- Detection Details -->
              <div style="margin-top: 24px; padding: 16px; background-color: #f9fafb; border-radius: 4px;">
                <h3 style="margin: 0 0 8px; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                  감지 정보
                </h3>
                <p style="margin: 0; color: #6b7280; font-size: 13px;">
                  감지 방법: ${this.getDetectionMethodLabel(anomaly.detail.detectionMethod)}<br>
                  감지 시각: ${new Date(anomaly.detectedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
                  ${anomaly.detail.zScore ? `<br>Z-Score: ${anomaly.detail.zScore.toFixed(2)}` : ''}
                  ${anomaly.detail.historicalTrend ? `<br>트렌드: ${this.getTrendLabel(anomaly.detail.historicalTrend)}` : ''}
                </p>
              </div>

              <!-- CTA Button -->
              <div style="margin-top: 32px; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                   style="display: inline-block; padding: 12px 32px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                  대시보드에서 확인하기
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                이 메일은 바투 AI 마케팅 솔루션에서 자동으로 발송되었습니다.<br>
                알림 설정을 변경하려면 <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color: #667eea; text-decoration: none;">설정 페이지</a>를 방문하세요.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  }

  /**
   * Check if alert should be skipped (rate limiting + deduplication)
   */
  private shouldSkipAlert(anomaly: Anomaly): boolean {
    const campaignHistory = this.alertHistory.get(anomaly.campaignId) || []

    // Clean up old history
    const cutoffTime = new Date()
    cutoffTime.setHours(
      cutoffTime.getHours() - this.config.deduplicationWindowHours
    )

    const recentHistory = campaignHistory.filter(
      (record) => record.timestamp > cutoffTime
    )

    // Update history
    this.alertHistory.set(anomaly.campaignId, recentHistory)

    // Check rate limit (per campaign per day)
    const oneDayAgo = new Date()
    oneDayAgo.setHours(oneDayAgo.getHours() - 24)
    const alertsInLastDay = recentHistory.filter(
      (record) => record.timestamp > oneDayAgo
    ).length

    if (alertsInLastDay >= this.config.maxAlertsPerCampaignPerDay) {
      return true // Rate limit exceeded
    }

    // Check deduplication (same campaign + metric within window)
    const isDuplicate = recentHistory.some(
      (record) =>
        record.campaignId === anomaly.campaignId &&
        record.metric === anomaly.metric
    )

    return isDuplicate
  }

  /**
   * Record alert in history
   */
  private recordAlert(anomaly: Anomaly): void {
    const campaignHistory = this.alertHistory.get(anomaly.campaignId) || []
    campaignHistory.push({
      campaignId: anomaly.campaignId,
      metric: anomaly.metric,
      severity: anomaly.severity,
      timestamp: new Date(),
    })
    this.alertHistory.set(anomaly.campaignId, campaignHistory)
  }

  /**
   * Filter anomalies by minimum severity
   */
  private filterBySeverity(anomalies: Anomaly[]): {
    alertable: Anomaly[]
    filtered: Anomaly[]
  } {
    const minOrder = SEVERITY_ORDER[this.config.minimumSeverity]
    const alertable: Anomaly[] = []
    const filtered: Anomaly[] = []

    for (const anomaly of anomalies) {
      if (SEVERITY_ORDER[anomaly.severity] <= minOrder) {
        alertable.push(anomaly)
      } else {
        filtered.push(anomaly)
      }
    }

    return { alertable, filtered }
  }

  /**
   * Format metric value for display
   */
  private formatMetricValue(
    metric: string,
    value: number
  ): string {
    switch (metric) {
      case 'spend':
      case 'cpa':
      case 'cpc':
        return `₩${value.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}`
      case 'roas':
        return `${value.toFixed(2)}x`
      case 'ctr':
      case 'cvr':
        return `${value.toFixed(2)}%`
      case 'impressions':
      case 'clicks':
      case 'conversions':
        return value.toLocaleString('ko-KR')
      default:
        return value.toFixed(2)
    }
  }

  /**
   * Get severity color
   */
  private getSeverityColor(severity: AnomalySeverity): string {
    const colors: Record<AnomalySeverity, string> = {
      critical: '#dc2626',
      warning: '#f59e0b',
      info: '#3b82f6',
    }
    return colors[severity]
  }

  /**
   * Get severity label
   */
  private getSeverityLabel(severity: AnomalySeverity): string {
    const labels: Record<AnomalySeverity, string> = {
      critical: '🚨 긴급',
      warning: '⚠️ 경고',
      info: 'ℹ️ 정보',
    }
    return labels[severity]
  }

  /**
   * Get severity emoji
   */
  private getSeverityEmoji(severity: AnomalySeverity): string {
    const emojis: Record<AnomalySeverity, string> = {
      critical: '🚨',
      warning: '⚠️',
      info: 'ℹ️',
    }
    return emojis[severity]
  }

  /**
   * Get detection method label
   */
  private getDetectionMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      zscore: 'Z-Score 통계 분석',
      iqr: 'IQR 사분위수 분석',
      moving_average: '이동 평균 분석',
      threshold: '임계값 기반',
    }
    return labels[method] || method
  }

  /**
   * Get trend label
   */
  private getTrendLabel(
    trend: 'increasing' | 'decreasing' | 'stable' | 'volatile'
  ): string {
    const labels = {
      increasing: '상승세',
      decreasing: '하락세',
      stable: '안정',
      volatile: '변동성 높음',
    }
    return labels[trend]
  }

  /**
   * Clear alert history (for testing)
   */
  clearHistory(): void {
    this.alertHistory.clear()
  }
}
