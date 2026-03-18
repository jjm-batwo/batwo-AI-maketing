# Phase 8: Report Test Coverage Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill remaining test gaps: GenerateMonthlyReportUseCase, GenerateDailyReportUseCase, cron route, and PDF template validation with enrichedData.

**Architecture:** Unit tests with mocked dependencies following existing test patterns. Cron route tests verify auth + DI resolution.

**Tech Stack:** Vitest, TypeScript

**Depends on:** Phase 6 (DI registrations) and Phase 7 (web viewer) should be complete first.

---

## File Structure

| Action | File | Coverage |
|--------|------|----------|
| Create | `tests/unit/application/report/GenerateMonthlyReportUseCase.test.ts` | Monthly UC template method + AI options |
| Create | `tests/unit/application/report/GenerateDailyReportUseCase.test.ts` | Daily UC template method + AI options |
| Create | `tests/unit/app/cron/send-scheduled-reports.test.ts` | Cron auth + execution |
| Modify | `tests/unit/infrastructure/repositories/PrismaAdKPIRepository.test.ts` | Add aggregateByFormat with avgFrequency/adCount |

---

### Task 1: GenerateMonthlyReportUseCase Tests

**Files:**
- Create: `tests/unit/application/report/GenerateMonthlyReportUseCase.test.ts`

- [ ] **Step 1: Write tests**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { GenerateMonthlyReportUseCase } from '@application/use-cases/report/GenerateMonthlyReportUseCase'
import { MockReportRepository } from '@tests/mocks/repositories/MockReportRepository'
import { MockCampaignRepository } from '@tests/mocks/repositories/MockCampaignRepository'
import { MockKPIRepository } from '@tests/mocks/repositories/MockKPIRepository'
import { MockAIService } from '@tests/mocks/services/MockAIService'
import { MockUsageLogRepository } from '@tests/mocks/repositories/MockUsageLogRepository'
import { Campaign } from '@domain/entities/Campaign'
import { KPI } from '@domain/entities/KPI'
import { Money } from '@domain/value-objects/Money'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'

describe('GenerateMonthlyReportUseCase', () => {
  let useCase: GenerateMonthlyReportUseCase
  let reportRepository: MockReportRepository
  let campaignRepository: MockCampaignRepository
  let kpiRepository: MockKPIRepository
  let aiService: MockAIService
  let usageLogRepository: MockUsageLogRepository

  beforeEach(() => {
    reportRepository = new MockReportRepository()
    campaignRepository = new MockCampaignRepository()
    kpiRepository = new MockKPIRepository()
    aiService = new MockAIService()
    usageLogRepository = new MockUsageLogRepository()

    useCase = new GenerateMonthlyReportUseCase(
      reportRepository,
      campaignRepository,
      kpiRepository,
      aiService,
      usageLogRepository
    )
  })

  it('should create a MONTHLY type report', async () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const campaign = Campaign.create({
      userId: 'user-123',
      name: 'Monthly Test',
      objective: CampaignObjective.CONVERSIONS,
      dailyBudget: Money.create(50000, 'KRW'),
      startDate: tomorrow,
    })
    await campaignRepository.save(campaign)

    const now = new Date()
    for (let i = 0; i < 30; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const kpi = KPI.create({
        campaignId: campaign.id,
        impressions: 1000,
        clicks: 50,
        conversions: 5,
        spend: Money.create(10000, 'KRW'),
        revenue: Money.create(30000, 'KRW'),
        date,
      })
      await kpiRepository.save(kpi)
    }

    const monthAgo = new Date(now)
    monthAgo.setDate(monthAgo.getDate() - 30)

    const result = await useCase.execute({
      userId: 'user-123',
      campaignIds: [campaign.id],
      startDate: monthAgo.toISOString(),
      endDate: now.toISOString(),
    })

    expect(result.type).toBe('MONTHLY')
  })

  it('should include forecast and benchmark in AI options', () => {
    // Access protected method through type assertion
    const options = (useCase as any).getAIInsightOptions()
    expect(options.includeExtendedInsights).toBe(true)
    expect(options.includeForecast).toBe(true)
    expect(options.includeBenchmark).toBe(true)
  })

  it('should return "월간" as section label', () => {
    const label = (useCase as any).getSectionLabel()
    expect(label).toBe('월간')
  })

  it('should reject date range exceeding 35 days', async () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const campaign = Campaign.create({
      userId: 'user-123',
      name: 'Test',
      objective: CampaignObjective.CONVERSIONS,
      dailyBudget: Money.create(50000, 'KRW'),
      startDate: tomorrow,
    })
    await campaignRepository.save(campaign)

    const now = new Date()
    const twoMonthsAgo = new Date(now)
    twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60)

    await expect(
      useCase.execute({
        userId: 'user-123',
        campaignIds: [campaign.id],
        startDate: twoMonthsAgo.toISOString(),
        endDate: now.toISOString(),
      })
    ).rejects.toThrow()
  })
})
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run tests/unit/application/report/GenerateMonthlyReportUseCase.test.ts --pool forks`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add tests/unit/application/report/GenerateMonthlyReportUseCase.test.ts
git commit -m "test: add GenerateMonthlyReportUseCase unit tests"
```

---

### Task 2: GenerateDailyReportUseCase Tests

**Files:**
- Create: `tests/unit/application/report/GenerateDailyReportUseCase.test.ts`

- [ ] **Step 1: Write tests**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { GenerateDailyReportUseCase } from '@application/use-cases/report/GenerateDailyReportUseCase'
import { MockReportRepository } from '@tests/mocks/repositories/MockReportRepository'
import { MockCampaignRepository } from '@tests/mocks/repositories/MockCampaignRepository'
import { MockKPIRepository } from '@tests/mocks/repositories/MockKPIRepository'
import { MockAIService } from '@tests/mocks/services/MockAIService'
import { MockUsageLogRepository } from '@tests/mocks/repositories/MockUsageLogRepository'

describe('GenerateDailyReportUseCase', () => {
  let useCase: GenerateDailyReportUseCase

  beforeEach(() => {
    useCase = new GenerateDailyReportUseCase(
      new MockReportRepository(),
      new MockCampaignRepository(),
      new MockKPIRepository(),
      new MockAIService(),
      new MockUsageLogRepository()
    )
  })

  it('should return "daily" as report type name', () => {
    expect((useCase as any).getReportTypeName()).toBe('daily')
  })

  it('should return "일일" as section label', () => {
    expect((useCase as any).getSectionLabel()).toBe('일일')
  })

  it('should not include forecast or benchmark in AI options', () => {
    const options = (useCase as any).getAIInsightOptions()
    expect(options.includeExtendedInsights).toBe(true)
    expect(options.includeForecast).toBe(false)
    expect(options.includeBenchmark).toBe(false)
  })

  it('should have max 2-day date range', () => {
    expect((useCase as any).getMaxDateRangeDays()).toBe(2)
  })
})
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run tests/unit/application/report/GenerateDailyReportUseCase.test.ts --pool forks`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add tests/unit/application/report/GenerateDailyReportUseCase.test.ts
git commit -m "test: add GenerateDailyReportUseCase unit tests"
```

---

### Task 3: Add FormatAggregate Test for avgFrequency and adCount

**Files:**
- Modify: `tests/unit/infrastructure/repositories/PrismaAdKPIRepository.test.ts`

- [ ] **Step 1: Add test for aggregateByFormat with new fields**

Add to the existing `aggregateByFormat` describe block:

```typescript
  describe('aggregateByFormat', () => {
    it('should return empty for empty campaignIds', async () => {
      const result = await repo.aggregateByFormat([], new Date(), new Date())
      expect(result).toEqual([])
    })

    it('should include avgFrequency and adCount in results', async () => {
      mockQueryRaw.mockResolvedValue([
        {
          format: 'SINGLE_IMAGE',
          totalimpressions: BigInt(10000),
          totalclicks: BigInt(500),
          totalconversions: BigInt(50),
          totalspend: 200000,
          totalrevenue: 600000,
          avgfrequency: 2.5,
          adcount: BigInt(5),
        },
      ])

      const result = await repo.aggregateByFormat(
        ['c-1'], new Date('2026-03-10'), new Date('2026-03-16')
      )

      expect(result).toHaveLength(1)
      expect(result[0].avgFrequency).toBe(2.5)
      expect(result[0].adCount).toBe(5)
    })
  })
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run tests/unit/infrastructure/repositories/PrismaAdKPIRepository.test.ts --pool forks`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add tests/unit/infrastructure/repositories/PrismaAdKPIRepository.test.ts
git commit -m "test: add FormatAggregate avgFrequency and adCount test"
```

---

### Task 4: Full Test Suite Verification

- [ ] **Step 1: Run all report tests**

Run: `npx vitest run tests/unit/application/report/ tests/unit/application/services/ tests/unit/infrastructure/repositories/PrismaAdKPIRepository.test.ts --pool forks`
Expected: All pass

- [ ] **Step 2: Full regression**

Run: `npx vitest run --pool forks`
Expected: No new failures
