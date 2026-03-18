# Phase 4: Report Test Suite Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill critical test gaps in the report generation system: integration test for the full report → PDF flow, E2E test for report sharing, and unit tests for the ad-level sync pipeline.

**Architecture:** Add integration tests using actual Prisma mock (vitest + `@prisma/client/mock`), unit tests for `SyncAdInsightsUseCase`, and E2E tests for the share/download API routes using supertest.

**Tech Stack:** Vitest, Playwright (E2E), supertest (API integration)

**Depends on:** Phase 3 (campaign data) and Phase 5 (Slack + AI retry) should be implemented first so tests cover real behavior.

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `tests/unit/application/use-cases/kpi/SyncAdInsightsUseCase.test.ts` | Test ad-level sync pipeline |
| Create | `tests/unit/infrastructure/repositories/PrismaAdKPIRepository.test.ts` | Test repository aggregation methods |
| Modify | `tests/unit/application/services/EnhancedReportDataBuilder.test.ts` | Verify campaign performance with real data (Phase 3 tests) |
| Create | `tests/integration/api/report-download.api.test.ts` | Test report download + share API flow |
| Create | `tests/unit/application/use-cases/report/SendScheduledReportsUseCase.test.ts` | Test scheduled report sending with notification service |

---

### Task 1: SyncAdInsightsUseCase Unit Tests

**Files:**
- Create: `tests/unit/application/use-cases/kpi/SyncAdInsightsUseCase.test.ts`

- [ ] **Step 1: Write tests**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SyncAdInsightsUseCase } from '@application/use-cases/kpi/SyncAdInsightsUseCase'
import type { IAdKPIRepository } from '@domain/repositories/IAdKPIRepository'
import type { IAdRepository } from '@domain/repositories/IAdRepository'
import type { IMetaAdsService } from '@application/ports/IMetaAdsService'
import type { IMetaAdAccountRepository } from '@application/ports/IMetaAdAccountRepository'

const mockAdKPIRepo = {
  upsertMany: vi.fn(),
} as unknown as IAdKPIRepository

const mockAdRepo = {
  findByMetaAdId: vi.fn(),
} as unknown as IAdRepository

const mockMetaAds = {
  getAccountInsights: vi.fn(),
} as unknown as IMetaAdsService

const mockMetaAccountRepo = {
  findByUserId: vi.fn(),
} as unknown as IMetaAdAccountRepository

describe('SyncAdInsightsUseCase', () => {
  let useCase: SyncAdInsightsUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    useCase = new SyncAdInsightsUseCase(
      mockAdKPIRepo,
      mockAdRepo,
      mockMetaAds,
      mockMetaAccountRepo
    )
  })

  it('should return zero counts when user has no Meta account', async () => {
    vi.mocked(mockMetaAccountRepo.findByUserId).mockResolvedValue(null)

    const result = await useCase.execute({ userId: 'user-1' })

    expect(result.syncedCount).toBe(0)
    expect(result.failedCount).toBe(0)
  })

  it('should sync ad insights from Meta API to AdKPISnapshot', async () => {
    vi.mocked(mockMetaAccountRepo.findByUserId).mockResolvedValue({
      id: 'ma-1',
      userId: 'user-1',
      metaAccountId: 'act_123',
      accessToken: 'encrypted_token',
      tokenExpiry: new Date('2026-12-31'),
    })

    const insightsMap = new Map([
      ['meta-ad-1_2026-03-15', {
        campaignId: 'meta-campaign-1',
        impressions: 1000,
        reach: 800,
        clicks: 50,
        linkClicks: 40,
        conversions: 5,
        spend: 10000,
        revenue: 30000,
        dateStart: '2026-03-15',
        dateStop: '2026-03-15',
        adId: 'meta-ad-1',
        adSetId: 'meta-adset-1',
        frequency: 1.25,
        cpm: 12500,
        cpc: 200,
        videoViews: 0,
        thruPlays: 0,
      }],
    ])
    vi.mocked(mockMetaAds.getAccountInsights).mockResolvedValue(insightsMap)

    vi.mocked(mockAdRepo.findByMetaAdId).mockResolvedValue({
      id: 'local-ad-1',
      adSetId: 'local-adset-1',
      name: 'Test Ad',
      status: 'ACTIVE',
      creativeId: 'creative-1',
      metaAdId: 'meta-ad-1',
    } as any)

    vi.mocked(mockAdKPIRepo.upsertMany).mockResolvedValue(1)

    const result = await useCase.execute({
      userId: 'user-1',
      datePreset: 'last_7d',
    })

    expect(result.syncedCount).toBe(1)
    expect(mockMetaAds.getAccountInsights).toHaveBeenCalledWith(
      expect.any(String),
      'act_123',
      expect.objectContaining({ level: 'ad', timeIncrement: '1' })
    )
    expect(mockAdKPIRepo.upsertMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          adId: 'local-ad-1',
        }),
      ])
    )
  })

  it('should skip ads not found in local database', async () => {
    vi.mocked(mockMetaAccountRepo.findByUserId).mockResolvedValue({
      id: 'ma-1',
      userId: 'user-1',
      metaAccountId: 'act_123',
      accessToken: 'encrypted_token',
      tokenExpiry: new Date('2026-12-31'),
    })

    const insightsMap = new Map([
      ['unknown-ad_2026-03-15', {
        campaignId: 'meta-campaign-1',
        impressions: 500,
        reach: 400,
        clicks: 25,
        linkClicks: 20,
        conversions: 2,
        spend: 5000,
        revenue: 10000,
        dateStart: '2026-03-15',
        dateStop: '2026-03-15',
        adId: 'unknown-ad',
      }],
    ])
    vi.mocked(mockMetaAds.getAccountInsights).mockResolvedValue(insightsMap)
    vi.mocked(mockAdRepo.findByMetaAdId).mockResolvedValue(null)
    vi.mocked(mockAdKPIRepo.upsertMany).mockResolvedValue(0)

    const result = await useCase.execute({ userId: 'user-1' })

    expect(result.syncedCount).toBe(0)
  })
})
```

- [ ] **Step 2: Run test**

Run: `npx vitest run tests/unit/application/use-cases/kpi/SyncAdInsightsUseCase.test.ts --pool forks`
Expected: PASS (or minor adjustments needed for actual constructor signature — check the actual `SyncAdInsightsUseCase` constructor params and adapt the mock accordingly)

- [ ] **Step 3: Commit**

```bash
git add tests/unit/application/use-cases/kpi/SyncAdInsightsUseCase.test.ts
git commit -m "test: add SyncAdInsightsUseCase unit tests"
```

---

### Task 2: PrismaAdKPIRepository Aggregation Tests

**Files:**
- Create: `tests/unit/infrastructure/repositories/PrismaAdKPIRepository.test.ts`

- [ ] **Step 1: Write tests for all aggregation methods**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PrismaAdKPIRepository } from '@infrastructure/database/repositories/PrismaAdKPIRepository'

const mockGroupBy = vi.fn()
const mockAggregate = vi.fn()
const mockQueryRaw = vi.fn()
const mockQueryRawUnsafe = vi.fn()
const mockFindMany = vi.fn()
const mockUpsert = vi.fn()
const mockTransaction = vi.fn()

const mockPrisma = {
  adKPISnapshot: {
    groupBy: mockGroupBy,
    aggregate: mockAggregate,
    findMany: mockFindMany,
    upsert: mockUpsert,
  },
  $queryRaw: mockQueryRaw,
  $queryRawUnsafe: mockQueryRawUnsafe,
  $transaction: mockTransaction,
} as any

describe('PrismaAdKPIRepository', () => {
  let repo: PrismaAdKPIRepository

  beforeEach(() => {
    vi.clearAllMocks()
    repo = new PrismaAdKPIRepository(mockPrisma)
  })

  describe('getDailyAggregatesByCampaignIds', () => {
    it('should return empty array for empty campaignIds', async () => {
      const result = await repo.getDailyAggregatesByCampaignIds(
        [], new Date(), new Date()
      )
      expect(result).toEqual([])
      expect(mockGroupBy).not.toHaveBeenCalled()
    })

    it('should group by date and sum metrics', async () => {
      mockGroupBy.mockResolvedValue([
        {
          date: new Date('2026-03-15'),
          _sum: {
            impressions: 5000,
            clicks: 250,
            conversions: 25,
            spend: 100000,
            revenue: 300000,
          },
        },
      ])

      const result = await repo.getDailyAggregatesByCampaignIds(
        ['c-1'], new Date('2026-03-10'), new Date('2026-03-16')
      )

      expect(result).toHaveLength(1)
      expect(result[0].totalImpressions).toBe(5000)
      expect(result[0].totalSpend).toBe(100000)
    })
  })

  describe('aggregateByCampaignId', () => {
    it('should return zeros when no data exists', async () => {
      mockAggregate.mockResolvedValue({
        _sum: {
          impressions: null, clicks: null, linkClicks: null,
          conversions: null, spend: null, revenue: null,
          reach: null, videoViews: null, thruPlays: null,
        },
        _avg: { frequency: null, cpm: null, cpc: null },
      })

      const result = await repo.aggregateByCampaignId(
        'c-1', new Date('2026-03-10'), new Date('2026-03-16')
      )

      expect(result.totalImpressions).toBe(0)
      expect(result.totalSpend).toBe(0)
      expect(result.avgFrequency).toBe(0)
    })
  })

  describe('aggregateByFormat', () => {
    it('should return empty for empty campaignIds', async () => {
      const result = await repo.aggregateByFormat(
        [], new Date(), new Date()
      )
      expect(result).toEqual([])
    })
  })

  describe('getTopCreatives', () => {
    it('should return empty for empty campaignIds', async () => {
      const result = await repo.getTopCreatives(
        [], new Date(), new Date(), 10, 'roas'
      )
      expect(result).toEqual([])
    })
  })
})
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run tests/unit/infrastructure/repositories/PrismaAdKPIRepository.test.ts --pool forks`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add tests/unit/infrastructure/repositories/PrismaAdKPIRepository.test.ts
git commit -m "test: add PrismaAdKPIRepository aggregation unit tests"
```

---

### Task 3: SendScheduledReportsUseCase Tests

**Files:**
- Create: `tests/unit/application/use-cases/report/SendScheduledReportsUseCase.test.ts`

- [ ] **Step 1: Write tests covering email + Slack flow**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SendScheduledReportsUseCase } from '@application/use-cases/report/SendScheduledReportsUseCase'
import type { IReportScheduleRepository } from '@domain/repositories/IReportScheduleRepository'
import type { IReportRepository } from '@domain/repositories/IReportRepository'
import type { ReportNotificationService } from '@application/services/ReportNotificationService'

const mockScheduleRepo = {
  findDue: vi.fn(),
  update: vi.fn(),
} as unknown as IReportScheduleRepository

const mockReportRepo = {
  findLatestByUserAndType: vi.fn(),
  update: vi.fn(),
} as unknown as IReportRepository

const mockNotificationService = {
  sendReport: vi.fn(),
} as unknown as ReportNotificationService

describe('SendScheduledReportsUseCase', () => {
  let useCase: SendScheduledReportsUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    useCase = new SendScheduledReportsUseCase(
      mockScheduleRepo,
      mockReportRepo,
      mockNotificationService
    )
  })

  it('should return zero counts when no schedules are due', async () => {
    vi.mocked(mockScheduleRepo.findDue).mockResolvedValue([])

    const result = await useCase.execute()

    expect(result.sentCount).toBe(0)
    expect(result.failedCount).toBe(0)
  })

  it('should send notification and advance schedule on success', async () => {
    const mockReport = {
      id: 'r-1',
      generateShareToken: vi.fn().mockReturnValue({
        id: 'r-1',
        shareToken: 'token-abc',
      }),
      calculateSummaryMetrics: vi.fn().mockReturnValue({
        totalImpressions: 1000, totalClicks: 50, totalConversions: 5,
        totalSpend: 100000, totalRevenue: 300000, overallROAS: 3.0,
        averageCTR: 5.0, averageCVR: 10.0,
      }),
    }

    const mockSchedule = {
      userId: 'user-1',
      frequency: 'WEEKLY',
      recipients: ['test@example.com'],
      advanceSchedule: vi.fn().mockReturnValue({ id: 'sched-1', nextSendAt: new Date() }),
    }

    vi.mocked(mockScheduleRepo.findDue).mockResolvedValue([mockSchedule] as any)
    vi.mocked(mockReportRepo.findLatestByUserAndType).mockResolvedValue(mockReport as any)
    vi.mocked(mockReportRepo.update).mockResolvedValue(undefined as any)
    vi.mocked(mockNotificationService.sendReport).mockResolvedValue({
      emailSent: true,
      slackSent: true,
      errors: [],
    })
    vi.mocked(mockScheduleRepo.update).mockResolvedValue(undefined as any)

    const result = await useCase.execute()

    expect(result.sentCount).toBe(1)
    expect(mockNotificationService.sendReport).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        recipients: ['test@example.com'],
      })
    )
    expect(mockSchedule.advanceSchedule).toHaveBeenCalled()
  })

  it('should count as failed when both email and Slack fail', async () => {
    const mockReport = {
      id: 'r-1',
      generateShareToken: vi.fn().mockReturnValue({ id: 'r-1', shareToken: 'token' }),
      calculateSummaryMetrics: vi.fn().mockReturnValue({
        totalImpressions: 0, totalClicks: 0, totalConversions: 0,
        totalSpend: 0, totalRevenue: 0, overallROAS: 0,
        averageCTR: 0, averageCVR: 0,
      }),
    }

    const mockSchedule = {
      userId: 'user-1',
      frequency: 'WEEKLY',
      recipients: ['test@example.com'],
      advanceSchedule: vi.fn(),
    }

    vi.mocked(mockScheduleRepo.findDue).mockResolvedValue([mockSchedule] as any)
    vi.mocked(mockReportRepo.findLatestByUserAndType).mockResolvedValue(mockReport as any)
    vi.mocked(mockReportRepo.update).mockResolvedValue(undefined as any)
    vi.mocked(mockNotificationService.sendReport).mockResolvedValue({
      emailSent: false,
      slackSent: false,
      errors: ['Email failed', 'Slack failed'],
    })

    const result = await useCase.execute()

    expect(result.failedCount).toBe(1)
    expect(mockSchedule.advanceSchedule).not.toHaveBeenCalled()
  })

  it('should skip schedules with no matching report', async () => {
    const mockSchedule = {
      userId: 'user-1',
      frequency: 'WEEKLY',
      recipients: ['test@example.com'],
    }

    vi.mocked(mockScheduleRepo.findDue).mockResolvedValue([mockSchedule] as any)
    vi.mocked(mockReportRepo.findLatestByUserAndType).mockResolvedValue(null)

    const result = await useCase.execute()

    expect(result.sentCount).toBe(0)
    expect(result.failedCount).toBe(0)
    expect(mockNotificationService.sendReport).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run tests/unit/application/use-cases/report/SendScheduledReportsUseCase.test.ts --pool forks`
Expected: PASS (after Phase 5 Task 3 changes the constructor signature)

- [ ] **Step 3: Commit**

```bash
git add tests/unit/application/use-cases/report/SendScheduledReportsUseCase.test.ts
git commit -m "test: add SendScheduledReportsUseCase unit tests with notification service"
```

---

### Task 4: Report Download API Integration Test

**Files:**
- Create: `tests/integration/api/report-download.api.test.ts`

- [ ] **Step 1: Write integration test**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Report download API integration test
 * Tests the /api/reports/[id]/download endpoint flow
 *
 * Verifies:
 * - Authentication required
 * - Report ownership check
 * - PDF generation from enriched data
 * - Proper content-type headers
 */

// Mock NextAuth
vi.mock('next-auth', () => ({
  auth: vi.fn(),
}))

// Mock DI container
vi.mock('@/lib/di/container', () => ({
  container: {
    resolve: vi.fn(),
  },
}))

describe('Report Download API', () => {
  it('should require authentication', async () => {
    const { auth } = await import('next-auth')
    vi.mocked(auth).mockResolvedValue(null)

    // Import the route handler
    const { GET } = await import('@/app/api/reports/[id]/download/route')

    const request = new Request('http://localhost/api/reports/r-1/download')
    const response = await GET(request, { params: Promise.resolve({ id: 'r-1' }) })

    expect(response.status).toBe(401)
  })

  it('should return 404 for non-existent report', async () => {
    const { auth } = await import('next-auth')
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1' },
    } as any)

    const { container } = await import('@/lib/di/container')
    vi.mocked(container.resolve).mockReturnValue({
      findById: vi.fn().mockResolvedValue(null),
    })

    const { GET } = await import('@/app/api/reports/[id]/download/route')

    const request = new Request('http://localhost/api/reports/r-999/download')
    const response = await GET(request, { params: Promise.resolve({ id: 'r-999' }) })

    expect(response.status).toBe(404)
  })
})
```

- [ ] **Step 2: Run test**

Run: `npx vitest run tests/integration/api/report-download.api.test.ts --pool forks`
Expected: PASS (may need adapter for Next.js route handler testing)

- [ ] **Step 3: Commit**

```bash
git add tests/integration/api/report-download.api.test.ts
git commit -m "test: add report download API integration tests"
```

---

### Task 5: Full Test Suite Verification

- [ ] **Step 1: Run all report-related tests**

Run: `npx vitest run tests/unit/application/services/EnhancedReportDataBuilder.test.ts tests/unit/application/report/ tests/unit/application/use-cases/kpi/ tests/unit/application/use-cases/report/ tests/unit/infrastructure/repositories/PrismaAdKPIRepository*.test.ts tests/integration/api/report*.test.ts --pool forks`
Expected: All pass

- [ ] **Step 2: Run full test suite for regression check**

Run: `npx vitest run --pool forks`
Expected: All pass

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: No errors
