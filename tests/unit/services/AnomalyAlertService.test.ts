import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AnomalyAlertService } from '@application/services/AnomalyAlertService'
import type { IEmailService } from '@application/ports/IEmailService'
import type { Anomaly } from '@application/services/AnomalyDetectionService'

describe('AnomalyAlertService', () => {
  let emailService: IEmailService
  let alertService: AnomalyAlertService

  beforeEach(() => {
    emailService = {
      sendEmail: vi.fn().mockResolvedValue({ success: true }),
      sendWeeklyReportEmail: vi.fn().mockResolvedValue({ success: true }),
    }
    alertService = new AnomalyAlertService(emailService)
    alertService.clearHistory()
  })

  const createMockAnomaly = (
    overrides?: Partial<Anomaly>
  ): Anomaly => ({
    id: 'test-anomaly-1',
    campaignId: 'campaign-1',
    campaignName: 'Test Campaign',
    type: 'spike',
    severity: 'warning',
    metric: 'cpa',
    currentValue: 15000,
    previousValue: 10000,
    changePercent: 50,
    message: 'CPA가 50% 상승했습니다.',
    detectedAt: new Date(),
    detail: {
      detectionMethod: 'zscore',
      zScore: 3.2,
    },
    recommendations: ['타겟 오디언스를 검토하세요'],
    ...overrides,
  })

  describe('sendAlerts', () => {
    it('should send email alerts for critical anomalies', async () => {
      const anomaly = createMockAnomaly({ severity: 'critical' })

      const result = await alertService.sendAlerts({
        userId: 'user-1',
        userEmail: 'test@example.com',
        userName: 'Test User',
        anomalies: [anomaly],
      })

      expect(result.sent).toHaveLength(1)
      expect(result.sent[0].id).toBe(anomaly.id)
      expect(result.skipped).toHaveLength(0)
      expect(result.errors).toHaveLength(0)
      expect(emailService.sendEmail).toHaveBeenCalledTimes(1)
    })

    it('should send alerts for warning anomalies with default config', async () => {
      const anomaly = createMockAnomaly({ severity: 'warning' })

      const result = await alertService.sendAlerts({
        userId: 'user-1',
        userEmail: 'test@example.com',
        anomalies: [anomaly],
      })

      expect(result.sent).toHaveLength(1)
      expect(emailService.sendEmail).toHaveBeenCalledTimes(1)
    })

    it('should skip info anomalies with default config', async () => {
      const anomaly = createMockAnomaly({ severity: 'info' })

      const result = await alertService.sendAlerts({
        userId: 'user-1',
        userEmail: 'test@example.com',
        anomalies: [anomaly],
      })

      expect(result.sent).toHaveLength(0)
      expect(result.skipped).toHaveLength(1)
      expect(emailService.sendEmail).not.toHaveBeenCalled()
    })

    it('should filter by minimum severity', async () => {
      const service = new AnomalyAlertService(emailService, {
        minimumSeverity: 'critical',
      })

      const anomalies = [
        createMockAnomaly({ id: '1', severity: 'critical' }),
        createMockAnomaly({ id: '2', severity: 'warning' }),
        createMockAnomaly({ id: '3', severity: 'info' }),
      ]

      const result = await service.sendAlerts({
        userId: 'user-1',
        userEmail: 'test@example.com',
        anomalies,
      })

      expect(result.sent).toHaveLength(1)
      expect(result.sent[0].id).toBe('1')
      expect(result.skipped).toHaveLength(2)
    })

    it('should deduplicate alerts within 24h window', async () => {
      const anomaly1 = createMockAnomaly({
        id: 'anomaly-1',
        campaignId: 'campaign-1',
        metric: 'cpa',
      })
      const anomaly2 = createMockAnomaly({
        id: 'anomaly-2',
        campaignId: 'campaign-1',
        metric: 'cpa',
      })

      // First alert should be sent
      const result1 = await alertService.sendAlerts({
        userId: 'user-1',
        userEmail: 'test@example.com',
        anomalies: [anomaly1],
      })

      expect(result1.sent).toHaveLength(1)

      // Second alert for same campaign+metric should be skipped
      const result2 = await alertService.sendAlerts({
        userId: 'user-1',
        userEmail: 'test@example.com',
        anomalies: [anomaly2],
      })

      expect(result2.sent).toHaveLength(0)
      expect(result2.skipped).toHaveLength(1)
      expect(emailService.sendEmail).toHaveBeenCalledTimes(1)
    })

    it('should enforce rate limit per campaign per day', async () => {
      const service = new AnomalyAlertService(emailService, {
        maxAlertsPerCampaignPerDay: 2,
      })

      const anomalies = [
        createMockAnomaly({ id: '1', metric: 'cpa' }),
        createMockAnomaly({ id: '2', metric: 'ctr' }),
        createMockAnomaly({ id: '3', metric: 'roas' }),
      ]

      // First alert
      await service.sendAlerts({
        userId: 'user-1',
        userEmail: 'test@example.com',
        anomalies: [anomalies[0]],
      })

      // Second alert
      await service.sendAlerts({
        userId: 'user-1',
        userEmail: 'test@example.com',
        anomalies: [anomalies[1]],
      })

      // Third alert should be rate limited
      const result3 = await service.sendAlerts({
        userId: 'user-1',
        userEmail: 'test@example.com',
        anomalies: [anomalies[2]],
      })

      expect(result3.sent).toHaveLength(0)
      expect(result3.skipped).toHaveLength(1)
      expect(emailService.sendEmail).toHaveBeenCalledTimes(2)
    })

    it('should handle email send failures gracefully', async () => {
      vi.mocked(emailService.sendEmail).mockResolvedValueOnce({
        success: false,
        error: 'SMTP error',
      })

      const anomaly = createMockAnomaly({ severity: 'critical' })

      const result = await alertService.sendAlerts({
        userId: 'user-1',
        userEmail: 'test@example.com',
        anomalies: [anomaly],
      })

      expect(result.sent).toHaveLength(0)
      expect(result.skipped).toHaveLength(1)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('SMTP error')
    })

    it('should not send emails when emailAlerts disabled', async () => {
      const service = new AnomalyAlertService(emailService, {
        enableEmailAlerts: false,
      })

      const anomaly = createMockAnomaly({ severity: 'critical' })

      const result = await service.sendAlerts({
        userId: 'user-1',
        userEmail: 'test@example.com',
        anomalies: [anomaly],
      })

      expect(result.sent).toHaveLength(0)
      expect(result.skipped).toHaveLength(1)
      expect(emailService.sendEmail).not.toHaveBeenCalled()
    })

    it('should include market context in email when available', async () => {
      const anomaly = createMockAnomaly({
        severity: 'warning',
        marketContext: {
          isSpecialDay: true,
          events: ['블랙프라이데이', '연말 쇼핑 시즌'],
          isWithinExpectedRange: false,
        },
      })

      await alertService.sendAlerts({
        userId: 'user-1',
        userEmail: 'test@example.com',
        anomalies: [anomaly],
      })

      const emailCall = vi.mocked(emailService.sendEmail).mock.calls[0][0]
      expect(emailCall.html).toContain('블랙프라이데이')
      expect(emailCall.html).toContain('시장 컨텍스트')
    })
  })

  describe('email formatting', () => {
    it('should format subject with severity emoji', async () => {
      const critical = createMockAnomaly({ severity: 'critical' })

      await alertService.sendAlerts({
        userId: 'user-1',
        userEmail: 'test@example.com',
        anomalies: [critical],
      })

      const emailCall = vi.mocked(emailService.sendEmail).mock.calls[0][0]
      expect(emailCall.subject).toContain('🚨')
      expect(emailCall.subject).toContain('Test Campaign')
    })

    it('should format metric values correctly', async () => {
      const anomalies = [
        createMockAnomaly({ metric: 'spend', currentValue: 500000 }),
        createMockAnomaly({ metric: 'roas', currentValue: 3.5 }),
        createMockAnomaly({ metric: 'ctr', currentValue: 2.3 }),
      ]

      for (const anomaly of anomalies) {
        await alertService.sendAlerts({
          userId: 'user-1',
          userEmail: 'test@example.com',
          anomalies: [anomaly],
        })
      }

      const calls = vi.mocked(emailService.sendEmail).mock.calls

      // Check spend formatting (KRW)
      expect(calls[0][0].html).toContain('₩500,000')

      // Check ROAS formatting (multiplier)
      expect(calls[1][0].html).toContain('3.50x')

      // Check CTR formatting (percentage)
      expect(calls[2][0].html).toContain('2.30%')
    })
  })
})
