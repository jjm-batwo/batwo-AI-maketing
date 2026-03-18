# Phase 7: Web Viewer Enhanced Sections Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update ReportDetail.tsx to display all 9 enhanced report sections with proper UI components, while maintaining backward compatibility with old reports.

**Architecture:** Add section sub-components under `report/sections/` directory. ReportDetail checks if `enrichedData` fields exist (optional in ReportDTO) and renders enhanced view, otherwise falls back to current basic view. Uses existing shadcn/ui components + Tailwind.

**Tech Stack:** React 19, TypeScript, shadcn/ui, Tailwind CSS, Recharts (for trend chart)

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/presentation/components/report/sections/OverallSummarySection.tsx` | 5 KPI cards with change indicators |
| Create | `src/presentation/components/report/sections/DailyTrendSection.tsx` | Line chart (Recharts) for daily metrics |
| Create | `src/presentation/components/report/sections/CampaignPerformanceSection.tsx` | Table of campaign metrics |
| Create | `src/presentation/components/report/sections/CreativePerformanceSection.tsx` | Top N creative cards |
| Create | `src/presentation/components/report/sections/CreativeFatigueSection.tsx` | Fatigue score badges + recommendations |
| Create | `src/presentation/components/report/sections/FormatComparisonSection.tsx` | Format metric comparison grid |
| Create | `src/presentation/components/report/sections/FunnelPerformanceSection.tsx` | Funnel stage bars |
| Create | `src/presentation/components/report/sections/PerformanceAnalysisSection.tsx` | AI positive/negative factors |
| Create | `src/presentation/components/report/sections/RecommendationsSection.tsx` | Action cards with priority |
| Create | `src/presentation/components/report/sections/index.ts` | Barrel export |
| Modify | `src/presentation/components/report/ReportDetail.tsx` | Integrate enhanced sections with fallback |

---

### Task 1: Create Section Sub-Components (batch)

**Files:**
- Create: `src/presentation/components/report/sections/OverallSummarySection.tsx`
- Create: `src/presentation/components/report/sections/CampaignPerformanceSection.tsx`
- Create: `src/presentation/components/report/sections/CreativePerformanceSection.tsx`
- Create: `src/presentation/components/report/sections/CreativeFatigueSection.tsx`
- Create: `src/presentation/components/report/sections/FormatComparisonSection.tsx`
- Create: `src/presentation/components/report/sections/FunnelPerformanceSection.tsx`
- Create: `src/presentation/components/report/sections/PerformanceAnalysisSection.tsx`
- Create: `src/presentation/components/report/sections/RecommendationsSection.tsx`
- Create: `src/presentation/components/report/sections/DailyTrendSection.tsx`
- Create: `src/presentation/components/report/sections/index.ts`

- [ ] **Step 1: Create OverallSummarySection**

```tsx
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import type { OverallSummarySection as OverallSummaryData } from '@application/dto/report/EnhancedReportSections'

function ChangeIndicator({ value, direction, isPositive }: { value: number; direction: string; isPositive: boolean }) {
  const isGood = (direction === 'up' && isPositive) || (direction === 'down' && !isPositive)
  const color = direction === 'flat' ? 'text-muted-foreground' : isGood ? 'text-green-600' : 'text-red-600'
  const Icon = direction === 'up' ? ArrowUp : direction === 'down' ? ArrowDown : Minus

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${color}`}>
      <Icon className="h-3 w-3" />
      {Math.abs(value).toFixed(1)}%
    </span>
  )
}

function formatWon(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toLocaleString('ko-KR')
}

export function OverallSummarySection({ data }: { data: OverallSummaryData }) {
  const metrics = [
    { label: '총 지출', value: `${formatWon(data.totalSpend)}원`, change: data.changes.spend },
    { label: '총 매출', value: `${formatWon(data.totalRevenue)}원`, change: data.changes.revenue },
    { label: 'ROAS', value: `${data.roas.toFixed(2)}x`, change: data.changes.roas },
    { label: 'CTR', value: `${data.ctr.toFixed(2)}%`, change: data.changes.ctr },
    { label: '전환수', value: data.totalConversions.toLocaleString('ko-KR'), change: data.changes.conversions },
  ]

  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
      {metrics.map((m) => (
        <Card key={m.label}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className="text-lg font-bold whitespace-nowrap">{m.value}</p>
            <ChangeIndicator {...m.change} />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create CampaignPerformanceSection**

```tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CampaignPerformanceSection as CampaignData } from '@application/dto/report/EnhancedReportSections'

export function CampaignPerformanceSection({ data }: { data: CampaignData }) {
  if (data.campaigns.length === 0) return null

  return (
    <Card>
      <CardHeader><CardTitle>캠페인별 성과</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">캠페인</th>
                <th className="pb-2 pr-4 text-right">지출</th>
                <th className="pb-2 pr-4 text-right">매출</th>
                <th className="pb-2 pr-4 text-right">ROAS</th>
                <th className="pb-2 pr-4 text-right">CTR</th>
                <th className="pb-2 text-right">전환</th>
              </tr>
            </thead>
            <tbody>
              {data.campaigns.map((c) => (
                <tr key={c.campaignId} className="border-b last:border-0">
                  <td className="py-2 pr-4">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.objective} · {c.status}</p>
                  </td>
                  <td className="py-2 pr-4 text-right whitespace-nowrap">{c.spend.toLocaleString('ko-KR')}원</td>
                  <td className="py-2 pr-4 text-right whitespace-nowrap">{c.revenue.toLocaleString('ko-KR')}원</td>
                  <td className="py-2 pr-4 text-right">{c.roas.toFixed(2)}x</td>
                  <td className="py-2 pr-4 text-right">{c.ctr.toFixed(2)}%</td>
                  <td className="py-2 text-right">{c.conversions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Create CreativePerformanceSection**

```tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CreativePerformanceSection as CreativeData } from '@application/dto/report/EnhancedReportSections'

export function CreativePerformanceSection({ data }: { data: CreativeData }) {
  if (data.creatives.length === 0) return null

  return (
    <Card>
      <CardHeader><CardTitle>소재별 성과 TOP {data.topN}</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">소재</th>
                <th className="pb-2 pr-4">포맷</th>
                <th className="pb-2 pr-4 text-right">ROAS</th>
                <th className="pb-2 pr-4 text-right">CTR</th>
                <th className="pb-2 pr-4 text-right">전환</th>
                <th className="pb-2 text-right">지출</th>
              </tr>
            </thead>
            <tbody>
              {data.creatives.map((c, i) => (
                <tr key={c.creativeId} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{i + 1}. {c.name}</td>
                  <td className="py-2 pr-4 text-xs text-muted-foreground">{c.format}</td>
                  <td className="py-2 pr-4 text-right font-medium">{c.roas.toFixed(2)}x</td>
                  <td className="py-2 pr-4 text-right">{c.ctr.toFixed(2)}%</td>
                  <td className="py-2 pr-4 text-right">{c.conversions}</td>
                  <td className="py-2 text-right whitespace-nowrap">{c.spend.toLocaleString('ko-KR')}원</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: Create CreativeFatigueSection**

```tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CreativeFatigueSection as FatigueData, FatigueLevel } from '@application/dto/report/EnhancedReportSections'

const LEVEL_STYLES: Record<FatigueLevel, { bg: string; text: string; label: string }> = {
  healthy: { bg: 'bg-green-100', text: 'text-green-800', label: '양호' },
  warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '주의' },
  critical: { bg: 'bg-red-100', text: 'text-red-800', label: '위험' },
}

export function CreativeFatigueSection({ data }: { data: FatigueData }) {
  if (data.creatives.length === 0) return null

  return (
    <Card>
      <CardHeader><CardTitle>소재 피로도</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {data.creatives.map((c) => {
          const style = LEVEL_STYLES[c.fatigueLevel]
          return (
            <div key={c.creativeId} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium text-sm">{c.name}</p>
                <p className="text-xs text-muted-foreground">Frequency: {c.frequency.toFixed(1)} · CTR: {c.ctr.toFixed(2)}% · {c.activeDays}일 운영</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">피로도</p>
                  <p className="font-bold">{c.fatigueScore}/100</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${style.bg} ${style.text}`}>
                  {style.label}
                </span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 5: Create FormatComparisonSection**

```tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { FormatComparisonSection as FormatData } from '@application/dto/report/EnhancedReportSections'

export function FormatComparisonSection({ data }: { data: FormatData }) {
  if (data.formats.length === 0) return null

  return (
    <Card>
      <CardHeader><CardTitle>소재 포맷별 성과</CardTitle></CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {data.formats.map((f) => (
            <div key={f.format} className="rounded-lg border p-4">
              <p className="font-semibold">{f.formatLabel}</p>
              <p className="text-xs text-muted-foreground mb-2">{f.adCount}개 광고</p>
              <div className="grid grid-cols-2 gap-y-1 text-sm">
                <span className="text-muted-foreground">ROAS</span>
                <span className="text-right font-medium">{f.roas.toFixed(2)}x</span>
                <span className="text-muted-foreground">CTR</span>
                <span className="text-right">{f.ctr.toFixed(2)}%</span>
                <span className="text-muted-foreground">지출</span>
                <span className="text-right whitespace-nowrap">{f.spend.toLocaleString('ko-KR')}원</span>
                <span className="text-muted-foreground">전환</span>
                <span className="text-right">{f.conversions}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 6: Create FunnelPerformanceSection**

```tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { FunnelPerformanceSection as FunnelData } from '@application/dto/report/EnhancedReportSections'

export function FunnelPerformanceSection({ data }: { data: FunnelData }) {
  if (data.stages.length === 0) return null

  return (
    <Card>
      <CardHeader><CardTitle>퍼널 단계별 성과</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {data.stages.map((s) => (
          <div key={s.stage} className="rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-semibold">{s.stageLabel}</span>
                <span className="ml-2 text-xs text-muted-foreground">{s.campaignCount}개 캠페인</span>
              </div>
              <span className="text-sm text-muted-foreground">예산 비중 {s.budgetRatio.toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(s.budgetRatio, 100)}%` }} />
            </div>
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div><p className="text-xs text-muted-foreground">지출</p><p className="font-medium">{s.spend.toLocaleString('ko-KR')}원</p></div>
              <div><p className="text-xs text-muted-foreground">ROAS</p><p className="font-medium">{s.roas.toFixed(2)}x</p></div>
              <div><p className="text-xs text-muted-foreground">CTR</p><p className="font-medium">{s.ctr.toFixed(2)}%</p></div>
              <div><p className="text-xs text-muted-foreground">전환</p><p className="font-medium">{s.conversions}</p></div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 7: Create PerformanceAnalysisSection**

```tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'
import type { PerformanceAnalysisSection as AnalysisData } from '@application/dto/report/EnhancedReportSections'

const IMPACT_STYLES = {
  high: 'border-l-4 border-l-red-500',
  medium: 'border-l-4 border-l-yellow-500',
  low: 'border-l-4 border-l-blue-500',
}

export function PerformanceAnalysisSection({ data }: { data: AnalysisData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI 성과 분석
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.summary && (
          <p className="text-sm text-muted-foreground whitespace-pre-line">{data.summary}</p>
        )}

        {data.positiveFactors.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-green-700 mb-2">잘된 점</h4>
            <div className="space-y-2">
              {data.positiveFactors.map((f, i) => (
                <div key={i} className={`rounded-lg bg-green-50 p-3 ${IMPACT_STYLES[f.impact]}`}>
                  <p className="text-sm font-medium text-green-900">{f.title}</p>
                  <p className="text-xs text-green-700 mt-1 whitespace-pre-line">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.negativeFactors.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-red-700 mb-2">개선 필요</h4>
            <div className="space-y-2">
              {data.negativeFactors.map((f, i) => (
                <div key={i} className={`rounded-lg bg-red-50 p-3 ${IMPACT_STYLES[f.impact]}`}>
                  <p className="text-sm font-medium text-red-900">{f.title}</p>
                  <p className="text-xs text-red-700 mt-1 whitespace-pre-line">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 8: Create RecommendationsSection**

```tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RecommendationsSection as RecsData } from '@application/dto/report/EnhancedReportSections'

const PRIORITY_STYLES = {
  high: { bg: 'bg-red-100', text: 'text-red-800', label: '긴급' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '중간' },
  low: { bg: 'bg-blue-100', text: 'text-blue-800', label: '낮음' },
}

const CATEGORY_LABELS: Record<string, string> = {
  budget: '예산', creative: '소재', targeting: '타겟팅', funnel: '퍼널', general: '일반',
}

export function RecommendationsSection({ data }: { data: RecsData }) {
  if (data.actions.length === 0) return null

  return (
    <Card>
      <CardHeader><CardTitle>추천 액션</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {data.actions.map((a, i) => {
          const priority = PRIORITY_STYLES[a.priority]
          return (
            <div key={i} className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priority.bg} ${priority.text}`}>
                  {priority.label}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                  {CATEGORY_LABELS[a.category] ?? a.category}
                </span>
              </div>
              <p className="font-medium text-sm">{a.title}</p>
              <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{a.description}</p>
              {a.expectedImpact && (
                <p className="text-xs text-primary mt-1">예상 효과: {a.expectedImpact}</p>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 9: Create DailyTrendSection (simple table, no chart dependency)**

```tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DailyTrendSection as TrendData } from '@application/dto/report/EnhancedReportSections'

export function DailyTrendSection({ data }: { data: TrendData }) {
  if (data.days.length === 0) return null

  return (
    <Card>
      <CardHeader><CardTitle>일별 성과 추이</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">날짜</th>
                <th className="pb-2 pr-4 text-right">지출</th>
                <th className="pb-2 pr-4 text-right">매출</th>
                <th className="pb-2 pr-4 text-right">ROAS</th>
                <th className="pb-2 text-right">전환</th>
              </tr>
            </thead>
            <tbody>
              {data.days.map((d) => (
                <tr key={d.date} className="border-b last:border-0">
                  <td className="py-1.5 pr-4">{d.date}</td>
                  <td className="py-1.5 pr-4 text-right whitespace-nowrap">{d.spend.toLocaleString('ko-KR')}원</td>
                  <td className="py-1.5 pr-4 text-right whitespace-nowrap">{d.revenue.toLocaleString('ko-KR')}원</td>
                  <td className="py-1.5 pr-4 text-right">{d.roas.toFixed(2)}x</td>
                  <td className="py-1.5 text-right">{d.conversions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 10: Create barrel export**

```typescript
// src/presentation/components/report/sections/index.ts
export { OverallSummarySection } from './OverallSummarySection'
export { DailyTrendSection } from './DailyTrendSection'
export { CampaignPerformanceSection } from './CampaignPerformanceSection'
export { CreativePerformanceSection } from './CreativePerformanceSection'
export { CreativeFatigueSection } from './CreativeFatigueSection'
export { FormatComparisonSection } from './FormatComparisonSection'
export { FunnelPerformanceSection } from './FunnelPerformanceSection'
export { PerformanceAnalysisSection } from './PerformanceAnalysisSection'
export { RecommendationsSection } from './RecommendationsSection'
```

- [ ] **Step 11: Commit all section components**

```bash
git add src/presentation/components/report/sections/
git commit -m "feat: create 9 enhanced report section components for web viewer"
```

---

### Task 2: Integrate Enhanced Sections into ReportDetail

**Files:**
- Modify: `src/presentation/components/report/ReportDetail.tsx`

- [ ] **Step 1: Update ReportDetail to render enhanced sections with fallback**

The key change: if `report.overallSummary` exists (enrichedData present), show the 9-section enhanced view. Otherwise, show the current basic view.

Update the `ReportDetailProps` interface to accept the enriched fields from `ReportDTO`, and conditionally render the enhanced sections after the header.

The enhanced view replaces the basic KPI cards + AI insights + sections with:
1. `OverallSummarySection` (replaces KPI cards)
2. `DailyTrendSection`
3. `CampaignPerformanceSection`
4. `CreativePerformanceSection` + `CreativeFatigueSection`
5. `FormatComparisonSection` + `FunnelPerformanceSection`
6. `PerformanceAnalysisSection` (replaces AI insights)
7. `RecommendationsSection`

Import sections from barrel:
```typescript
import {
  OverallSummarySection,
  DailyTrendSection,
  CampaignPerformanceSection,
  CreativePerformanceSection,
  CreativeFatigueSection,
  FormatComparisonSection,
  FunnelPerformanceSection,
  PerformanceAnalysisSection,
  RecommendationsSection,
} from './sections'
```

Add enriched fields to the report prop interface (matching ReportDTO optional fields).

In the render body, add a check:
```tsx
const hasEnhancedData = !!report.overallSummary
```

If `hasEnhancedData`, render the 9 sections. Otherwise, render the existing basic view (unchanged).

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit 2>&1 | grep -i "reportdetail\|sections/" | head -10`
Expected: No errors in these files

- [ ] **Step 3: Commit**

```bash
git add src/presentation/components/report/ReportDetail.tsx
git commit -m "feat: integrate 9 enhanced sections into ReportDetail with backward compatibility"
```

---

### Task 3: Verification

- [ ] **Step 1: Type check**

Run: `npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 2: Visual verification**

Start dev server and navigate to a report detail page to confirm enhanced sections render correctly.
If no real report data exists, verify that the fallback (basic view) renders without errors.
