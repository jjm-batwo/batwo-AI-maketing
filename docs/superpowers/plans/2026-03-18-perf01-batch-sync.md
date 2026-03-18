# PERF-01: Campaign Insights Bulk Sync Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce Meta API calls during campaign KPI sync from N calls (1 per campaign) to 1-2 calls by using the existing `getAccountInsights(level='campaign')` bulk method.

**Architecture:** Replace the per-campaign loop in `SyncAllInsightsUseCase` with a single bulk `getAccountInsights(level='campaign', timeIncrement='1')` call. Map results back to local campaign IDs. KPI save uses existing `kpiRepository.save()`. No new API methods needed — reuses existing infrastructure.

**Tech Stack:** TypeScript, Vitest

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/application/use-cases/kpi/SyncAllInsightsUseCase.ts` | Replace per-campaign loop with bulk getAccountInsights |
| Create | `tests/unit/application/use-cases/kpi/SyncAllInsightsUseCase.test.ts` | Test bulk sync behavior |

---

### Task 1: Rewrite SyncAllInsightsUseCase to Use Bulk API

**Files:**
- Modify: `src/application/use-cases/kpi/SyncAllInsightsUseCase.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/application/use-cases/kpi/SyncAllInsightsUseCase.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SyncAllInsightsUseCase } from '@application/use-cases/kpi/SyncAllInsightsUseCase'
import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import type { IKPIRepository } from '@domain/repositories/IKPIRepository'
import type { IMetaAdsService } from '@application/ports/IMetaAdsService'
import type { IMetaAdAccountRepository } from '@application/ports/IMetaAdAccountRepository'

const mockCampaignRepo = {
  findByUserId: vi.fn(),
} as unknown as ICampaignRepository

const mockKPIRepo = {
  save: vi.fn(),
  saveMany: vi.fn(),
} as unknown as IKPIRepository

const mockMetaAds = {
  getCampaignDailyInsights: vi.fn(),
  getAccountInsights: vi.fn(),
} as unknown as IMetaAdsService

const mockMetaAccountRepo = {
  findByUserId: vi.fn(),
} as unknown as IMetaAdAccountRepository

describe('SyncAllInsightsUseCase', () => {
  let useCase: SyncAllInsightsUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    useCase = new SyncAllInsightsUseCase(
      mockCampaignRepo,
      mockKPIRepo,
      mockMetaAds,
      mockMetaAccountRepo
    )
  })

  it('should return empty result when no Meta account', async () => {
    vi.mocked(mockMetaAccountRepo.findByUserId).mockResolvedValue(null)

    const result = await useCase.execute({ userId: 'user-1' })

    expect(result.synced).toBe(0)
    expect(result.total).toBe(0)
  })

  it('should use getAccountInsights instead of per-campaign calls', async () => {
    vi.mocked(mockMetaAccountRepo.findByUserId).mockResolvedValue({
      id: 'ma-1',
      userId: 'user-1',
      metaAccountId: 'act_123',
      accessToken: 'encrypted_token',
      tokenExpiry: new Date('2026-12-31'),
    } as any)

    vi.mocked(mockCampaignRepo.findByUserId).mockResolvedValue([
      { id: 'local-c1', metaCampaignId: 'meta-c1', name: 'Campaign 1' },
      { id: 'local-c2', metaCampaignId: 'meta-c2', name: 'Campaign 2' },
      { id: 'local-c3', metaCampaignId: null, name: 'No Meta Campaign' },
    ] as any)

    // Bulk insights: key = campaignId_dateStart when timeIncrement='1'
    const insightsMap = new Map([
      ['meta-c1_2026-03-15', {
        campaignId: 'meta-c1',
        impressions: 1000, reach: 800, clicks: 50, linkClicks: 40,
        conversions: 5, spend: 10000, revenue: 30000,
        dateStart: '2026-03-15', dateStop: '2026-03-15',
      }],
      ['meta-c1_2026-03-16', {
        campaignId: 'meta-c1',
        impressions: 1200, reach: 900, clicks: 60, linkClicks: 45,
        conversions: 6, spend: 12000, revenue: 36000,
        dateStart: '2026-03-16', dateStop: '2026-03-16',
      }],
      ['meta-c2_2026-03-15', {
        campaignId: 'meta-c2',
        impressions: 500, reach: 400, clicks: 25, linkClicks: 20,
        conversions: 2, spend: 5000, revenue: 10000,
        dateStart: '2026-03-15', dateStop: '2026-03-15',
      }],
    ])
    vi.mocked(mockMetaAds.getAccountInsights).mockResolvedValue(insightsMap)
    vi.mocked(mockKPIRepo.saveMany).mockResolvedValue([] as any)

    const result = await useCase.execute({ userId: 'user-1', datePreset: 'last_7d' })

    // Should call getAccountInsights once (bulk), NOT getCampaignDailyInsights
    expect(mockMetaAds.getAccountInsights).toHaveBeenCalledTimes(1)
    expect(mockMetaAds.getAccountInsights).toHaveBeenCalledWith(
      expect.any(String),
      'act_123',
      expect.objectContaining({
        level: 'campaign',
        timeIncrement: '1',
      })
    )
    expect(mockMetaAds.getCampaignDailyInsights).not.toHaveBeenCalled()

    // 3 daily records saved (2 for c1, 1 for c2)
    expect(result.synced).toBe(3)
    expect(result.total).toBe(2) // 2 meta campaigns
    expect(mockKPIRepo.saveMany).toHaveBeenCalledTimes(1)
    expect(mockKPIRepo.saveMany).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ campaignId: 'local-c1' }),
    ]))
  })

  it('should skip campaigns without metaCampaignId', async () => {
    vi.mocked(mockMetaAccountRepo.findByUserId).mockResolvedValue({
      id: 'ma-1', userId: 'user-1', metaAccountId: 'act_123',
      accessToken: 'encrypted_token', tokenExpiry: new Date('2026-12-31'),
    } as any)

    vi.mocked(mockCampaignRepo.findByUserId).mockResolvedValue([
      { id: 'local-c1', metaCampaignId: null, name: 'Local Only' },
    ] as any)

    vi.mocked(mockMetaAds.getAccountInsights).mockResolvedValue(new Map())

    const result = await useCase.execute({ userId: 'user-1' })

    expect(result.total).toBe(0)
    expect(mockMetaAds.getAccountInsights).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/application/use-cases/kpi/SyncAllInsightsUseCase.test.ts --pool forks`
Expected: FAIL — still uses per-campaign loop

- [ ] **Step 3: Rewrite SyncAllInsightsUseCase**

Replace the `execute()` method body:

```typescript
import { KPI } from '@domain/entities/KPI'
import { Money } from '@domain/value-objects/Money'
import { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import { IKPIRepository } from '@domain/repositories/IKPIRepository'
import { IMetaAdsService } from '@application/ports/IMetaAdsService'
import { IMetaAdAccountRepository } from '@application/ports/IMetaAdAccountRepository'
import { safeDecryptToken } from '@application/utils/TokenEncryption'

export interface SyncAllInsightsInput {
  userId: string
  datePreset?: 'today' | 'yesterday' | 'last_7d' | 'last_30d' | 'last_90d'
  includeTodayData?: boolean
}

export interface SyncAllInsightsResult {
  synced: number
  failed: number
  total: number
  errors: Array<{ campaignId: string; error: string }>
}

export class SyncAllInsightsUseCase {
  constructor(
    private readonly campaignRepository: ICampaignRepository,
    private readonly kpiRepository: IKPIRepository,
    private readonly metaAdsService: IMetaAdsService,
    private readonly metaAdAccountRepository: IMetaAdAccountRepository
  ) {}

  async execute(input: SyncAllInsightsInput): Promise<SyncAllInsightsResult> {
    const metaAccount = await this.metaAdAccountRepository.findByUserId(input.userId)

    if (!metaAccount?.accessToken) {
      return { synced: 0, failed: 0, total: 0, errors: [] }
    }

    const campaigns = await this.campaignRepository.findByUserId(input.userId)
    const metaCampaigns = campaigns.filter((c) => c.metaCampaignId)

    const result: SyncAllInsightsResult = {
      synced: 0,
      failed: 0,
      total: metaCampaigns.length,
      errors: [],
    }

    if (metaCampaigns.length === 0) return result

    // Build metaCampaignId → localCampaignId map
    const metaToLocalMap = new Map<string, string>()
    for (const c of metaCampaigns) {
      metaToLocalMap.set(c.metaCampaignId!, c.id)
    }

    // Date range
    const until = new Date().toISOString().split('T')[0]
    const presetDays: Record<string, number> = {
      today: 0, yesterday: 1, last_7d: 7, last_30d: 30, last_90d: 90,
    }
    const days = presetDays[input.datePreset || 'last_7d'] ?? 7
    const sinceDate = new Date()
    sinceDate.setDate(sinceDate.getDate() - days)
    const since = sinceDate.toISOString().split('T')[0]

    try {
      // PERF-01: Single bulk API call instead of N per-campaign calls
      const insightsMap = await this.metaAdsService.getAccountInsights(
        safeDecryptToken(metaAccount.accessToken),
        metaAccount.metaAccountId,
        {
          level: 'campaign',
          timeRange: { since, until },
          timeIncrement: '1',
          campaignIds: metaCampaigns.map(c => c.metaCampaignId!),
        }
      )

      // Build KPI records and batch save
      const kpisToSave: import('@domain/entities/KPI').KPI[] = []
      for (const [, insight] of insightsMap) {
        const localCampaignId = metaToLocalMap.get(insight.campaignId)
        if (!localCampaignId) continue

        try {
          kpisToSave.push(KPI.create({
            campaignId: localCampaignId,
            impressions: insight.impressions,
            clicks: insight.clicks,
            conversions: insight.conversions,
            linkClicks: insight.linkClicks || 0,
            spend: Money.create(Math.round(insight.spend), 'KRW'),
            revenue: Money.create(Math.round(insight.revenue), 'KRW'),
            date: new Date(insight.dateStart + 'T00:00:00.000Z'),
          }))
        } catch (error) {
          result.failed++
          result.errors.push({
            campaignId: localCampaignId,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      if (kpisToSave.length > 0) {
        await this.kpiRepository.saveMany(kpisToSave)
        result.synced = kpisToSave.length
      }
    } catch (error) {
      console.error('[SyncInsights] Bulk sync failed:', error)
      // Mark all campaigns as failed
      for (const c of metaCampaigns) {
        result.failed++
        result.errors.push({
          campaignId: c.id,
          error: error instanceof Error ? error.message : 'Bulk sync failed',
        })
      }
    }

    return result
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/application/use-cases/kpi/SyncAllInsightsUseCase.test.ts --pool forks`
Expected: ALL PASS

- [ ] **Step 5: Run full test suite**

Run: `npx vitest run --pool forks 2>&1 | tail -5`
Expected: No new regressions

- [ ] **Step 6: Commit**

```bash
git add src/application/use-cases/kpi/SyncAllInsightsUseCase.ts tests/unit/application/use-cases/kpi/SyncAllInsightsUseCase.test.ts
git commit -m "perf: replace per-campaign insight sync with bulk getAccountInsights (PERF-01)

Reduces Meta API calls from N (1 per campaign) to 1-2 bulk calls by
using getAccountInsights(level='campaign', timeIncrement='1'). Maps
results back to local campaign IDs via metaCampaignId lookup."
```
