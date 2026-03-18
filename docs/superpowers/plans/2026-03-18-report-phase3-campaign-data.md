# Phase 3: Campaign Performance Real Data Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix hardcoded zeros in `buildCampaignPerformance` and `buildFunnelPerformance` by aggregating real data from AdKPISnapshot per campaign.

**Architecture:** Add `aggregateByCampaignIds` batch method to `IAdKPIRepository` (single SQL query, N campaigns), integrate into `EnhancedReportDataBuilder.build()` parallel query block, and pipe aggregated data into both campaign performance and funnel sections.

**Tech Stack:** TypeScript, Prisma raw SQL, Vitest

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/domain/repositories/IAdKPIRepository.ts` | Add `CampaignAggregate` interface + `aggregateByCampaignIds` method |
| Modify | `src/infrastructure/database/repositories/PrismaAdKPIRepository.ts` | Implement batch campaign aggregation (raw SQL) |
| Modify | `src/application/services/EnhancedReportDataBuilder.ts` | Wire real data into `buildCampaignPerformance` + `buildFunnelPerformance` |
| Modify | `tests/unit/application/services/EnhancedReportDataBuilder.test.ts` | Add campaign performance + funnel data tests |
| Create | `tests/unit/infrastructure/repositories/PrismaAdKPIRepository.aggregateByCampaignIds.test.ts` | Unit test for new repository method |

---

### Task 1: Add `CampaignAggregate` Interface to Repository

**Files:**
- Modify: `src/domain/repositories/IAdKPIRepository.ts:47-88`

- [ ] **Step 1: Write the new interface and method signature**

Add after `CreativeAggregate` (line 46):

```typescript
export interface CampaignAggregate {
  campaignId: string
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  totalSpend: number
  totalRevenue: number
}
```

Add to `IAdKPIRepository` interface (before closing brace):

```typescript
  aggregateByCampaignIds(
    campaignIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<CampaignAggregate[]>
```

- [ ] **Step 2: Verify type check passes**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: Errors in `PrismaAdKPIRepository.ts` (missing implementation) — this is correct at this stage.

- [ ] **Step 3: Commit**

```bash
git add src/domain/repositories/IAdKPIRepository.ts
git commit -m "feat: add CampaignAggregate interface and aggregateByCampaignIds to IAdKPIRepository"
```

---

### Task 2: Implement `aggregateByCampaignIds` in PrismaAdKPIRepository

**Files:**
- Modify: `src/infrastructure/database/repositories/PrismaAdKPIRepository.ts:264` (before `aggregateByFormat`)

- [ ] **Step 1: Write the failing test**

Create `tests/unit/infrastructure/repositories/PrismaAdKPIRepository.aggregateByCampaignIds.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PrismaAdKPIRepository } from '@infrastructure/database/repositories/PrismaAdKPIRepository'

const mockPrisma = {
  adKPISnapshot: {
    groupBy: vi.fn(),
  },
  $queryRaw: vi.fn(),
  $queryRawUnsafe: vi.fn(),
  $transaction: vi.fn(),
} as any

describe('PrismaAdKPIRepository.aggregateByCampaignIds', () => {
  let repo: PrismaAdKPIRepository

  beforeEach(() => {
    vi.clearAllMocks()
    repo = new PrismaAdKPIRepository(mockPrisma)
  })

  it('should return empty array for empty campaignIds', async () => {
    const result = await repo.aggregateByCampaignIds(
      [],
      new Date('2026-03-10'),
      new Date('2026-03-16')
    )
    expect(result).toEqual([])
  })

  it('should aggregate metrics grouped by campaignId', async () => {
    mockPrisma.adKPISnapshot.groupBy.mockResolvedValue([
      {
        campaignId: 'c-1',
        _sum: {
          impressions: 5000,
          clicks: 250,
          conversions: 25,
          spend: { toNumber: () => 100000 },
          revenue: { toNumber: () => 300000 },
        },
      },
      {
        campaignId: 'c-2',
        _sum: {
          impressions: 3000,
          clicks: 150,
          conversions: 10,
          spend: { toNumber: () => 50000 },
          revenue: { toNumber: () => 80000 },
        },
      },
    ])

    const result = await repo.aggregateByCampaignIds(
      ['c-1', 'c-2'],
      new Date('2026-03-10'),
      new Date('2026-03-16')
    )

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      campaignId: 'c-1',
      totalImpressions: 5000,
      totalClicks: 250,
      totalConversions: 25,
      totalSpend: 100000,
      totalRevenue: 300000,
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/infrastructure/repositories/PrismaAdKPIRepository.aggregateByCampaignIds.test.ts --pool forks`
Expected: FAIL — `aggregateByCampaignIds` not yet implemented

- [ ] **Step 3: Implement the method**

Add to `PrismaAdKPIRepository.ts` (before `aggregateByFormat` method):

```typescript
  async aggregateByCampaignIds(
    campaignIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<CampaignAggregate[]> {
    if (campaignIds.length === 0) return []

    const results = await this.prisma.adKPISnapshot.groupBy({
      by: ['campaignId'],
      where: {
        campaignId: { in: campaignIds },
        date: { gte: startDate, lte: endDate },
      },
      _sum: {
        impressions: true,
        clicks: true,
        conversions: true,
        spend: true,
        revenue: true,
      },
    })

    return results.map((r) => ({
      campaignId: r.campaignId,
      totalImpressions: r._sum.impressions ?? 0,
      totalClicks: r._sum.clicks ?? 0,
      totalConversions: r._sum.conversions ?? 0,
      totalSpend: Number(r._sum.spend ?? 0),
      totalRevenue: Number(r._sum.revenue ?? 0),
    }))
  }
```

Add `CampaignAggregate` to the import from `IAdKPIRepository`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/infrastructure/repositories/PrismaAdKPIRepository.aggregateByCampaignIds.test.ts --pool forks`
Expected: PASS

- [ ] **Step 5: Type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/infrastructure/database/repositories/PrismaAdKPIRepository.ts tests/unit/infrastructure/repositories/
git commit -m "feat: implement aggregateByCampaignIds in PrismaAdKPIRepository"
```

---

### Task 3: Wire Campaign Aggregates into EnhancedReportDataBuilder

**Files:**
- Modify: `src/application/services/EnhancedReportDataBuilder.ts:64-105` (build method), `183-201` (buildCampaignPerformance)

- [ ] **Step 1: Write the failing test**

Add to `tests/unit/application/services/EnhancedReportDataBuilder.test.ts`:

```typescript
  it('should populate campaign metrics from AdKPISnapshot aggregates', async () => {
    const mockCampaignAggregates = [
      {
        campaignId: 'c-1',
        totalImpressions: 10000,
        totalClicks: 500,
        totalConversions: 50,
        totalSpend: 200000,
        totalRevenue: 600000,
      },
    ]

    vi.mocked(mockAdKPIRepository.getDailyAggregatesByCampaignIds).mockResolvedValue([])
    vi.mocked(mockAdKPIRepository.getTopCreatives).mockResolvedValue([])
    vi.mocked(mockAdKPIRepository.aggregateByFormat).mockResolvedValue([])
    vi.mocked(mockAdKPIRepository.aggregateByCampaignIds).mockResolvedValue(mockCampaignAggregates)
    vi.mocked(mockAIService.generateReportInsights).mockResolvedValue({
      title: '', summary: '', keyMetrics: [], recommendations: [],
      insights: [], actionItems: [],
    })

    const result = await builder.build({
      campaignIds: ['c-1'],
      campaigns: [{
        id: 'c-1',
        name: 'Test Campaign',
        objective: 'CONVERSIONS',
        status: 'ACTIVE',
      }],
      startDate: new Date('2026-03-10'),
      endDate: new Date('2026-03-16'),
      previousStartDate: new Date('2026-03-03'),
      previousEndDate: new Date('2026-03-09'),
    })

    const campaign = result.campaignPerformance.campaigns[0]
    expect(campaign.impressions).toBe(10000)
    expect(campaign.clicks).toBe(500)
    expect(campaign.conversions).toBe(50)
    expect(campaign.spend).toBe(200000)
    expect(campaign.revenue).toBe(600000)
    expect(campaign.roas).toBeCloseTo(3.0)
    expect(campaign.ctr).toBeCloseTo(5.0)
  })
```

Also add `aggregateByCampaignIds: vi.fn()` to the `mockAdKPIRepository` setup at the top of the test file.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/application/services/EnhancedReportDataBuilder.test.ts --pool forks`
Expected: FAIL — campaign metrics still 0

- [ ] **Step 3: Implement the fix**

In `EnhancedReportDataBuilder.ts`:

**3a.** Add `CampaignAggregate` to imports:

```typescript
import type { IAdKPIRepository, DailyAdKPIAggregate, CreativeAggregate, FormatAggregate, CampaignAggregate } from '@domain/repositories/IAdKPIRepository'
```

**3b.** Add `aggregateByCampaignIds` to the parallel query block (line 68-78):

```typescript
    const [
      dailyAggregates,
      previousDailyAggregates,
      topCreatives,
      formatAggregates,
      campaignAggregates,
    ] = await Promise.all([
      this.adKPIRepository.getDailyAggregatesByCampaignIds(campaignIds, startDate, endDate),
      this.adKPIRepository.getDailyAggregatesByCampaignIds(campaignIds, previousStartDate, previousEndDate),
      this.adKPIRepository.getTopCreatives(campaignIds, startDate, endDate, 10, 'roas'),
      this.adKPIRepository.aggregateByFormat(campaignIds, startDate, endDate),
      this.adKPIRepository.aggregateByCampaignIds(campaignIds, startDate, endDate),
    ])
```

**3c.** Pass `campaignAggregates` to `buildCampaignPerformance` and `buildFunnelPerformance`:

```typescript
    const campaignPerformance = this.buildCampaignPerformance(campaigns, campaignAggregates)
    // ...
    const funnelPerformance = this.buildFunnelPerformance(campaigns, campaignAggregates)
```

**3d.** Rewrite `buildCampaignPerformance`:

```typescript
  private buildCampaignPerformance(
    campaigns: BuildInput['campaigns'],
    aggregates: CampaignAggregate[]
  ): CampaignPerformanceSection {
    const aggregateMap = new Map(aggregates.map(a => [a.campaignId, a]))

    return {
      campaigns: campaigns.map(c => {
        const agg = aggregateMap.get(c.id)
        const impressions = agg?.totalImpressions ?? 0
        const clicks = agg?.totalClicks ?? 0
        const conversions = agg?.totalConversions ?? 0
        const spend = agg?.totalSpend ?? 0
        const revenue = agg?.totalRevenue ?? 0

        return {
          campaignId: c.id,
          name: c.name,
          objective: c.objective,
          status: c.status,
          impressions,
          clicks,
          conversions,
          spend,
          revenue,
          roas: spend > 0 ? revenue / spend : 0,
          ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        }
      }),
    }
  }
```

**3e.** Rewrite `buildFunnelPerformance` to use real data:

```typescript
  private buildFunnelPerformance(
    campaigns: BuildInput['campaigns'],
    aggregates: CampaignAggregate[]
  ): FunnelPerformanceSection {
    const aggregateMap = new Map(aggregates.map(a => [a.campaignId, a]))

    const stageMap = new Map<string, {
      campaignCount: number
      spend: number
      impressions: number
      clicks: number
      conversions: number
      revenue: number
    }>()

    for (const c of campaigns) {
      const objective = c.objective as CampaignObjective
      const stage = this.funnelService.classifyWithAdvantage(objective, !!c.advantageConfig)
      const agg = aggregateMap.get(c.id)

      const existing = stageMap.get(stage) ?? {
        campaignCount: 0, spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0,
      }
      existing.campaignCount += 1
      existing.spend += agg?.totalSpend ?? 0
      existing.impressions += agg?.totalImpressions ?? 0
      existing.clicks += agg?.totalClicks ?? 0
      existing.conversions += agg?.totalConversions ?? 0
      existing.revenue += agg?.totalRevenue ?? 0
      stageMap.set(stage, existing)
    }

    const totalBudget = Array.from(stageMap.values()).reduce((sum, s) => sum + s.spend, 0)

    return {
      stages: Array.from(stageMap.entries()).map(([stage, data]) => ({
        stage: stage as 'tofu' | 'mofu' | 'bofu' | 'auto',
        stageLabel: this.funnelService.getStageLabel(stage as 'tofu' | 'mofu' | 'bofu' | 'auto'),
        campaignCount: data.campaignCount,
        spend: data.spend,
        budgetRatio: totalBudget > 0 ? (data.spend / totalBudget) * 100 : 0,
        impressions: data.impressions,
        clicks: data.clicks,
        conversions: data.conversions,
        revenue: data.revenue,
        roas: data.spend > 0 ? data.revenue / data.spend : 0,
        ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
      })),
      totalBudget,
    }
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/application/services/EnhancedReportDataBuilder.test.ts --pool forks`
Expected: ALL PASS

- [ ] **Step 5: Type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/application/services/EnhancedReportDataBuilder.ts tests/unit/application/services/EnhancedReportDataBuilder.test.ts
git commit -m "feat: wire real AdKPISnapshot data into campaign performance and funnel sections"
```

---

### Task 4: Add Funnel Performance Test with Real Data

**Files:**
- Modify: `tests/unit/application/services/EnhancedReportDataBuilder.test.ts`

- [ ] **Step 1: Write test for funnel with real spend data**

```typescript
  it('should populate funnel stage spend from AdKPISnapshot aggregates', async () => {
    const mockCampaignAggregates = [
      { campaignId: 'c-1', totalImpressions: 5000, totalClicks: 250, totalConversions: 25, totalSpend: 100000, totalRevenue: 300000 },
      { campaignId: 'c-2', totalImpressions: 8000, totalClicks: 400, totalConversions: 10, totalSpend: 50000, totalRevenue: 20000 },
    ]

    vi.mocked(mockAdKPIRepository.getDailyAggregatesByCampaignIds).mockResolvedValue([])
    vi.mocked(mockAdKPIRepository.getTopCreatives).mockResolvedValue([])
    vi.mocked(mockAdKPIRepository.aggregateByFormat).mockResolvedValue([])
    vi.mocked(mockAdKPIRepository.aggregateByCampaignIds).mockResolvedValue(mockCampaignAggregates)
    vi.mocked(mockAIService.generateReportInsights).mockResolvedValue({
      title: '', summary: '', keyMetrics: [], recommendations: [],
      insights: [], actionItems: [],
    })

    const result = await builder.build({
      campaignIds: ['c-1', 'c-2'],
      campaigns: [
        { id: 'c-1', name: 'Conversion Campaign', objective: 'CONVERSIONS', status: 'ACTIVE' },
        { id: 'c-2', name: 'Awareness Campaign', objective: 'BRAND_AWARENESS', status: 'ACTIVE' },
      ],
      startDate: new Date('2026-03-10'),
      endDate: new Date('2026-03-16'),
      previousStartDate: new Date('2026-03-03'),
      previousEndDate: new Date('2026-03-09'),
    })

    const totalSpend = result.funnelPerformance.stages.reduce((sum, s) => sum + s.spend, 0)
    expect(totalSpend).toBe(150000)
    expect(result.funnelPerformance.totalBudget).toBe(150000)
  })
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx vitest run tests/unit/application/services/EnhancedReportDataBuilder.test.ts --pool forks`
Expected: ALL PASS

- [ ] **Step 3: Commit**

```bash
git add tests/unit/application/services/EnhancedReportDataBuilder.test.ts
git commit -m "test: add funnel performance real data test"
```

---

### Task 5: Update AI Section to Use Real Campaign Data

**Files:**
- Modify: `src/application/services/EnhancedReportDataBuilder.ts:317-381` (buildAISections)

The `buildAISections` method receives `campaignPerformance` which now has real data. But `reportType` is hardcoded to `'weekly'`. This should be configurable.

- [ ] **Step 1: Add `reportType` to BuildInput**

In `EnhancedReportDataBuilder.ts`, add to `BuildInput`:

```typescript
interface BuildInput {
  campaignIds: string[]
  campaigns: Array<{
    id: string
    name: string
    objective: string
    status: string
    advantageConfig?: unknown
  }>
  startDate: Date
  endDate: Date
  previousStartDate: Date
  previousEndDate: Date
  reportType?: 'daily' | 'weekly' | 'monthly'
}
```

- [ ] **Step 2: Pass `reportType` through to `buildAISections`**

In `build()` method, update the AI call:

```typescript
    const [performanceAnalysis, recommendations] = await this.buildAISections(
      overallSummary, campaignPerformance, input.reportType ?? 'weekly'
    )
```

Update `buildAISections` signature:

```typescript
  private async buildAISections(
    overallSummary: OverallSummarySection,
    campaignPerformance: CampaignPerformanceSection,
    reportType: 'daily' | 'weekly' | 'monthly'
  ): Promise<[PerformanceAnalysisSection, RecommendationsSection]> {
```

Replace hardcoded `reportType: 'weekly'` with the parameter:

```typescript
      const result = await this.aiService.generateReportInsights({
        reportType,
        // ... rest stays the same
      })
```

- [ ] **Step 3: Type check + run tests**

Run: `npx tsc --noEmit && npx vitest run tests/unit/application/services/EnhancedReportDataBuilder.test.ts --pool forks`
Expected: All pass

- [ ] **Step 4: Commit**

```bash
git add src/application/services/EnhancedReportDataBuilder.ts
git commit -m "feat: make reportType configurable in EnhancedReportDataBuilder"
```

---

### Task 6: Pass reportType from Use Cases

**Files:**
- Modify: `src/application/use-cases/report/BaseReportGenerationUseCase.ts`

- [ ] **Step 1: Add `reportType` to the enrichedData build call**

In `BaseReportGenerationUseCase.ts`, find the `enhancedReportDataBuilder.build()` call and add `reportType`:

```typescript
      const enrichedData = await this.enhancedReportDataBuilder.build({
        campaignIds: dto.campaignIds,
        campaigns: campaigns.filter(Boolean).map(c => ({ ... })),
        startDate,
        endDate,
        previousStartDate: previousDateRange.start,
        previousEndDate: previousDateRange.end,
        reportType: this.getReportTypeName(),
      })
```

- [ ] **Step 2: Type check + run full test suite**

Run: `npx tsc --noEmit && npx vitest run --pool forks`
Expected: All pass

- [ ] **Step 3: Commit**

```bash
git add src/application/use-cases/report/BaseReportGenerationUseCase.ts
git commit -m "feat: pass reportType from use case to EnhancedReportDataBuilder"
```

---

### Task 7: Full Verification

- [ ] **Step 1: Type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run all report-related tests**

Run: `npx vitest run tests/unit/application/services/EnhancedReportDataBuilder.test.ts tests/unit/application/report/ tests/unit/infrastructure/repositories/ --pool forks`
Expected: All pass

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run --pool forks`
Expected: All pass, no regressions
