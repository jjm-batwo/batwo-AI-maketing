# Phase 5: Slack Delivery + AI Error Handling + Validation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Slack notification into report delivery, add retry/logging for AI insight failures, and add date range + data validation for report generation.

**Architecture:** Extend `SendScheduledReportsUseCase` to dispatch via `NotificationDispatcherService` (Slack/Email). Wrap AI calls with `withRetry` + structured logging. Add validation guards in `BaseReportGenerationUseCase` and `EnhancedReportDataBuilder`.

**Tech Stack:** TypeScript, Vitest, existing Slack/Notification infrastructure

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/application/use-cases/report/SendScheduledReportsUseCase.ts` | Add Slack delivery alongside email |
| Create | `src/application/services/ReportNotificationService.ts` | Unified report notification (email + Slack) |
| Modify | `src/application/services/EnhancedReportDataBuilder.ts` | Add retry + logging for AI failures |
| Modify | `src/application/use-cases/report/BaseReportGenerationUseCase.ts` | Add date range validation |
| Modify | `src/lib/di/modules/report.module.ts` | Register ReportNotificationService |
| Modify | `src/lib/di/types.ts` | Add DI token for ReportNotificationService |
| Create | `tests/unit/application/services/ReportNotificationService.test.ts` | Test unified notification |
| Modify | `tests/unit/application/services/EnhancedReportDataBuilder.test.ts` | Test AI retry + logging |

---

### Task 1: Create ReportNotificationService

**Files:**
- Create: `src/application/services/ReportNotificationService.ts`
- Create: `tests/unit/application/services/ReportNotificationService.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ReportNotificationService } from '@application/services/ReportNotificationService'
import type { IEmailService } from '@application/ports/IEmailService'
import type { INotificationChannelRepository } from '@domain/repositories/INotificationChannelRepository'

const mockEmailService = {
  sendReportEmail: vi.fn(),
} as unknown as IEmailService

const mockSlackSender = {
  send: vi.fn(),
} as any

const mockChannelRepository = {
  findByUserId: vi.fn(),
} as unknown as INotificationChannelRepository

describe('ReportNotificationService', () => {
  let service: ReportNotificationService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new ReportNotificationService(
      mockEmailService,
      mockSlackSender,
      mockChannelRepository
    )
  })

  it('should send email when schedule has recipients', async () => {
    vi.mocked(mockEmailService.sendReportEmail).mockResolvedValue({ success: true })
    vi.mocked(mockChannelRepository.findByUserId).mockResolvedValue([])

    const result = await service.sendReport({
      userId: 'user-1',
      recipients: ['test@example.com'],
      subject: '주간 보고서',
      reportId: 'r-1',
      reportSummary: { totalImpressions: 0, totalClicks: 0, totalConversions: 0, totalSpend: 0, totalRevenue: 0, overallROAS: 0, averageCTR: 0, averageCVR: 0 },
      shareUrl: 'https://app.batwo.ai/reports/share/abc',
    })

    expect(result.emailSent).toBe(true)
    expect(mockEmailService.sendReportEmail).toHaveBeenCalled()
  })

  it('should send Slack notification when user has active Slack channel', async () => {
    vi.mocked(mockEmailService.sendReportEmail).mockResolvedValue({ success: true })
    vi.mocked(mockSlackSender.send).mockResolvedValue({ success: true })
    vi.mocked(mockChannelRepository.findByUserId).mockResolvedValue([
      {
        id: 'ch-1',
        userId: 'user-1',
        type: 'SLACK',
        config: { webhookUrl: 'https://hooks.slack.com/xxx' },
        isActive: true,
      },
    ])

    const result = await service.sendReport({
      userId: 'user-1',
      recipients: ['test@example.com'],
      subject: '주간 보고서',
      reportId: 'r-1',
      reportSummary: { totalImpressions: 1000, totalClicks: 50, totalConversions: 5, totalSpend: 100000, totalRevenue: 300000, overallROAS: 3.0, averageCTR: 5.0, averageCVR: 10.0 },
      shareUrl: 'https://app.batwo.ai/reports/share/abc',
    })

    expect(result.slackSent).toBe(true)
    expect(mockSlackSender.send).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('보고서'),
        severity: 'INFO',
      })
    )
  })

  it('should not fail if Slack sending fails', async () => {
    vi.mocked(mockEmailService.sendReportEmail).mockResolvedValue({ success: true })
    vi.mocked(mockSlackSender.send).mockResolvedValue({ success: false, error: 'webhook error' })
    vi.mocked(mockChannelRepository.findByUserId).mockResolvedValue([
      { id: 'ch-1', userId: 'user-1', type: 'SLACK', config: { webhookUrl: 'https://hooks.slack.com/xxx' }, isActive: true },
    ])

    const result = await service.sendReport({
      userId: 'user-1',
      recipients: ['test@example.com'],
      subject: '주간 보고서',
      reportId: 'r-1',
      reportSummary: { totalImpressions: 0, totalClicks: 0, totalConversions: 0, totalSpend: 0, totalRevenue: 0, overallROAS: 0, averageCTR: 0, averageCVR: 0 },
      shareUrl: 'https://app.batwo.ai/reports/share/abc',
    })

    expect(result.emailSent).toBe(true)
    expect(result.slackSent).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/application/services/ReportNotificationService.test.ts --pool forks`
Expected: FAIL — module not found

- [ ] **Step 3: Implement ReportNotificationService**

Create `src/application/services/ReportNotificationService.ts`:

```typescript
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
          errors.push(`Email failed: ${result.error ?? 'unknown'}`)
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/application/services/ReportNotificationService.test.ts --pool forks`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/application/services/ReportNotificationService.ts tests/unit/application/services/ReportNotificationService.test.ts
git commit -m "feat: create ReportNotificationService with email + Slack delivery"
```

---

### Task 2: Register ReportNotificationService in DI

**Files:**
- Modify: `src/lib/di/types.ts` — add token
- Modify: `src/lib/di/modules/report.module.ts` — register service

- [ ] **Step 1: Add DI token**

In `src/lib/di/types.ts`, add under the report section:

```typescript
  ReportNotificationService: Symbol.for('ReportNotificationService'),
```

- [ ] **Step 2: Register in report module**

In `src/lib/di/modules/report.module.ts`, add import and registration:

```typescript
import { ReportNotificationService } from '@application/services/ReportNotificationService'
```

Add before the use case registrations:

```typescript
  container.register(
    DI_TOKENS.ReportNotificationService,
    () => new ReportNotificationService(
      container.resolve(DI_TOKENS.EmailService),
      container.resolve(DI_TOKENS.SlackNotificationSender),
      container.resolve(DI_TOKENS.NotificationChannelRepository)
    )
  )
```

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/di/types.ts src/lib/di/modules/report.module.ts
git commit -m "chore: register ReportNotificationService in DI container"
```

---

### Task 3: Integrate into SendScheduledReportsUseCase

**Files:**
- Modify: `src/application/use-cases/report/SendScheduledReportsUseCase.ts`

- [ ] **Step 1: Replace direct email call with ReportNotificationService**

```typescript
import { IReportScheduleRepository } from '@domain/repositories/IReportScheduleRepository'
import { IReportRepository } from '@domain/repositories/IReportRepository'
import { ReportNotificationService } from '@application/services/ReportNotificationService'
import { ReportType } from '@domain/entities/Report'

export class SendScheduledReportsUseCase {
  constructor(
    private readonly scheduleRepository: IReportScheduleRepository,
    private readonly reportRepository: IReportRepository,
    private readonly notificationService: ReportNotificationService
  ) {}

  async execute(): Promise<{ sentCount: number; failedCount: number }> {
    const now = new Date()
    const dueSchedules = await this.scheduleRepository.findDue(now)

    let sentCount = 0
    let failedCount = 0

    for (const schedule of dueSchedules) {
      try {
        const type = schedule.frequency as ReportType
        const latestReport = await this.reportRepository.findLatestByUserAndType(
          schedule.userId,
          type
        )

        if (!latestReport) continue

        const sharedReport = latestReport.generateShareToken(7)
        await this.reportRepository.update(sharedReport)

        const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reports/share/${sharedReport.shareToken}`

        const result = await this.notificationService.sendReport({
          userId: schedule.userId,
          recipients: schedule.recipients,
          subject: `[바투 AI] ${this.getSubjectByFrequency(schedule.frequency)} 광고 성과 보고서`,
          reportId: latestReport.id,
          reportSummary: latestReport.calculateSummaryMetrics(),
          shareUrl,
        })

        if (result.emailSent || result.slackSent) {
          sentCount++
          const advanced = schedule.advanceSchedule()
          await this.scheduleRepository.update(advanced)
        } else {
          failedCount++
        }
      } catch (err) {
        console.error('Failed to send scheduled report:', err)
        failedCount++
      }
    }

    return { sentCount, failedCount }
  }

  private getSubjectByFrequency(frequency: string): string {
    switch (frequency) {
      case 'DAILY': return '일간'
      case 'WEEKLY': return '주간'
      case 'MONTHLY': return '월간'
      default: return ''
    }
  }
}
```

- [ ] **Step 2: Update DI registration**

In `src/lib/di/modules/report.module.ts`, update SendScheduledReportsUseCase registration:

```typescript
  container.register(
    DI_TOKENS.SendScheduledReportsUseCase,
    () =>
      new SendScheduledReportsUseCase(
        container.resolve(DI_TOKENS.ReportScheduleRepository),
        container.resolve(DI_TOKENS.ReportRepository),
        container.resolve(DI_TOKENS.ReportNotificationService)
      )
  )
```

- [ ] **Step 3: Type check + test**

Run: `npx tsc --noEmit && npx vitest run --pool forks`
Expected: All pass

- [ ] **Step 4: Commit**

```bash
git add src/application/use-cases/report/SendScheduledReportsUseCase.ts src/lib/di/modules/report.module.ts
git commit -m "feat: integrate ReportNotificationService into SendScheduledReportsUseCase"
```

---

### Task 4: Add AI Retry + Structured Logging

**Files:**
- Modify: `src/application/services/EnhancedReportDataBuilder.ts:317-381`

- [ ] **Step 1: Write the failing test**

Add to `tests/unit/application/services/EnhancedReportDataBuilder.test.ts`:

```typescript
  it('should retry AI service once on failure before falling back', async () => {
    vi.mocked(mockAdKPIRepository.getDailyAggregatesByCampaignIds).mockResolvedValue([])
    vi.mocked(mockAdKPIRepository.getTopCreatives).mockResolvedValue([])
    vi.mocked(mockAdKPIRepository.aggregateByFormat).mockResolvedValue([])
    vi.mocked(mockAdKPIRepository.aggregateByCampaignIds).mockResolvedValue([])

    // First call fails, second succeeds
    vi.mocked(mockAIService.generateReportInsights)
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockResolvedValueOnce({
        title: '', summary: 'Retry succeeded',
        keyMetrics: [], recommendations: [],
        insights: [], actionItems: [],
      })

    const result = await builder.build({
      campaignIds: [],
      campaigns: [],
      startDate: new Date('2026-03-10'),
      endDate: new Date('2026-03-16'),
      previousStartDate: new Date('2026-03-03'),
      previousEndDate: new Date('2026-03-09'),
    })

    expect(mockAIService.generateReportInsights).toHaveBeenCalledTimes(2)
    expect(result.performanceAnalysis.summary).toBe('Retry succeeded')
  })

  it('should fallback gracefully after retry exhaustion', async () => {
    vi.mocked(mockAdKPIRepository.getDailyAggregatesByCampaignIds).mockResolvedValue([])
    vi.mocked(mockAdKPIRepository.getTopCreatives).mockResolvedValue([])
    vi.mocked(mockAdKPIRepository.aggregateByFormat).mockResolvedValue([])
    vi.mocked(mockAdKPIRepository.aggregateByCampaignIds).mockResolvedValue([])

    vi.mocked(mockAIService.generateReportInsights)
      .mockRejectedValue(new Error('Persistent failure'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await builder.build({
      campaignIds: [],
      campaigns: [],
      startDate: new Date('2026-03-10'),
      endDate: new Date('2026-03-16'),
      previousStartDate: new Date('2026-03-03'),
      previousEndDate: new Date('2026-03-09'),
    })

    expect(result.performanceAnalysis.summary).toContain('사용할 수 없습니다')
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[EnhancedReportDataBuilder]'),
      expect.any(Error)
    )
    consoleSpy.mockRestore()
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/application/services/EnhancedReportDataBuilder.test.ts --pool forks`
Expected: FAIL — retry logic not yet implemented

- [ ] **Step 3: Implement retry + logging in buildAISections**

Replace the try/catch in `buildAISections`:

```typescript
  private async buildAISections(
    overallSummary: OverallSummarySection,
    campaignPerformance: CampaignPerformanceSection,
    reportType: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): Promise<[PerformanceAnalysisSection, RecommendationsSection]> {
    const maxRetries = 2
    let lastError: unknown

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const campaignSummaries = campaignPerformance.campaigns.map(c => ({
          name: c.name,
          objective: c.objective ?? 'CONVERSIONS',
          metrics: {
            impressions: c.impressions ?? 0,
            clicks: c.clicks ?? 0,
            conversions: c.conversions ?? 0,
            spend: c.spend ?? 0,
            revenue: c.revenue ?? 0,
          },
        }))

        const result = await this.aiService.generateReportInsights({
          reportType,
          campaignSummaries,
          includeExtendedInsights: true,
          includeForecast: false,
          includeBenchmark: false,
          comparisonPeriod: overallSummary.changes ? {
            previousMetrics: {
              impressions: 0,
              clicks: 0,
              conversions: 0,
              spend: overallSummary.totalSpend / (1 + (overallSummary.changes.spend.value / 100)),
              revenue: overallSummary.totalRevenue / (1 + (overallSummary.changes.revenue.value / 100)),
            },
          } : undefined,
        })

        const insights = result.insights ?? []
        const mapImpact = (importance: string): 'high' | 'medium' | 'low' =>
          importance === 'critical' ? 'high' : (importance as 'high' | 'medium' | 'low')

        return [
          {
            summary: result.summary,
            positiveFactors: insights
              .filter(i => i.type === 'performance' || i.type === 'trend' || i.type === 'comparison')
              .map(i => ({ title: i.title, description: i.description, impact: mapImpact(i.importance) })),
            negativeFactors: insights
              .filter(i => i.type === 'anomaly' || i.type === 'recommendation')
              .map(i => ({ title: i.title, description: i.description, impact: mapImpact(i.importance) })),
          },
          {
            actions: (result.actionItems ?? []).map(item => ({
              priority: item.priority,
              category: ACTION_CATEGORY_MAP[item.category] ?? 'general',
              title: item.action,
              description: item.action,
              expectedImpact: item.expectedImpact,
              deadline: item.deadline,
            })),
          },
        ]
      } catch (error) {
        lastError = error
        if (attempt < maxRetries) {
          console.warn(`[EnhancedReportDataBuilder] AI attempt ${attempt} failed, retrying...`)
        }
      }
    }

    console.error('[EnhancedReportDataBuilder] AI analysis failed after retries:', lastError)
    return [
      { summary: 'AI 분석을 사용할 수 없습니다. 잠시 후 다시 시도해주세요.', positiveFactors: [], negativeFactors: [] },
      { actions: [] },
    ]
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/application/services/EnhancedReportDataBuilder.test.ts --pool forks`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/application/services/EnhancedReportDataBuilder.ts tests/unit/application/services/EnhancedReportDataBuilder.test.ts
git commit -m "feat: add retry logic and structured logging for AI insight generation"
```

---

### Task 5: Add Date Range Validation

**Files:**
- Modify: `src/application/use-cases/report/BaseReportGenerationUseCase.ts`

- [ ] **Step 1: Write the test**

Add validation test to `tests/unit/application/report/GenerateWeeklyReportUseCase.test.ts`:

```typescript
  it('should reject date range longer than 8 days for weekly report', async () => {
    const campaign = await createTestCampaign('user-123', 'Test Campaign')

    const now = new Date()
    const twoWeeksAgo = new Date(now)
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    await expect(
      useCase.execute({
        userId: 'user-123',
        campaignIds: [campaign.id],
        startDate: twoWeeksAgo,
        endDate: now,
      })
    ).rejects.toThrow('날짜 범위')
  })
```

- [ ] **Step 2: Add validation in BaseReportGenerationUseCase**

Add a protected method and call it in `execute()`:

```typescript
  protected validateDateRange(startDate: Date, endDate: Date): void {
    const diffMs = endDate.getTime() - startDate.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    if (diffDays < 0) {
      throw new Error('날짜 범위가 유효하지 않습니다: 시작일이 종료일보다 늦습니다')
    }

    const maxDays = this.getMaxDateRangeDays()
    if (diffDays > maxDays) {
      throw new Error(`날짜 범위가 최대 ${maxDays}일을 초과합니다 (${Math.round(diffDays)}일)`)
    }
  }

  protected getMaxDateRangeDays(): number {
    switch (this.getReportTypeName()) {
      case 'daily': return 2
      case 'weekly': return 8
      case 'monthly': return 35
      default: return 35
    }
  }
```

Call in `execute()` right after input validation:

```typescript
    this.validateDateRange(startDate, endDate)
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run tests/unit/application/report/ --pool forks`
Expected: All pass

- [ ] **Step 4: Commit**

```bash
git add src/application/use-cases/report/BaseReportGenerationUseCase.ts tests/unit/application/report/
git commit -m "feat: add date range validation for report generation"
```

---

### Task 6: Add Report Data Validation Before PDF

**Files:**
- Modify: `src/application/services/EnhancedReportDataBuilder.ts`

- [ ] **Step 1: Add data completeness warning**

Add a method to check if the report has meaningful data:

```typescript
  private warnIfEmptyData(
    campaignPerformance: CampaignPerformanceSection,
    dailyTrend: DailyTrendSection
  ): void {
    const allZeroMetrics = campaignPerformance.campaigns.every(
      c => c.impressions === 0 && c.spend === 0
    )
    if (allZeroMetrics && campaignPerformance.campaigns.length > 0) {
      console.warn(
        '[EnhancedReportDataBuilder] 모든 캠페인 지표가 0입니다. AdKPISnapshot 동기화 상태를 확인하세요.',
        { campaignIds: campaignPerformance.campaigns.map(c => c.campaignId) }
      )
    }

    if (dailyTrend.days.length === 0) {
      console.warn('[EnhancedReportDataBuilder] 일별 데이터가 없습니다.')
    }
  }
```

Call it in `build()` after building sections:

```typescript
    this.warnIfEmptyData(campaignPerformance, dailyTrend)
```

- [ ] **Step 2: Type check + test**

Run: `npx tsc --noEmit && npx vitest run tests/unit/application/services/EnhancedReportDataBuilder.test.ts --pool forks`
Expected: All pass

- [ ] **Step 3: Commit**

```bash
git add src/application/services/EnhancedReportDataBuilder.ts
git commit -m "feat: add data completeness warnings for empty report data"
```

---

### Task 7: Full Verification

- [ ] **Step 1: Type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run all related tests**

Run: `npx vitest run tests/unit/application/services/ tests/unit/application/report/ --pool forks`
Expected: All pass

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run --pool forks`
Expected: All pass, no regressions
