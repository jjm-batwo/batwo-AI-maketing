# Phase 6: Report Quick Fixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 4 bugs: PDF download type hardcoding, DI missing registrations, hardcoded activeDays/adCount/avgFrequency in report builder.

**Architecture:** Minimal surgical fixes across existing files. No new files created. Each task is independently deployable.

**Tech Stack:** TypeScript, Prisma raw SQL, Vitest

---

## File Structure

| Action | File | Fix |
|--------|------|-----|
| Modify | `src/app/api/reports/[id]/download/route.ts:38` | Use `report.type` to select PDF generator method |
| Modify | `src/lib/di/types.ts` | Add `GenerateMonthlyReportUseCase` + `GenerateDailyReportUseCase` tokens |
| Modify | `src/lib/di/modules/report.module.ts` | Register Monthly + Daily use cases |
| Modify | `src/domain/repositories/IAdKPIRepository.ts` | Add `avgFrequency`, `adCount` to `FormatAggregate` |
| Modify | `src/infrastructure/database/repositories/PrismaAdKPIRepository.ts` | Add `AVG(frequency)`, `COUNT(DISTINCT ad_id)` to `aggregateByFormat` SQL |
| Modify | `src/application/services/EnhancedReportDataBuilder.ts` | Fix `activeDays`, `adCount`, `avgFrequency` |

---

### Task 1: Fix PDF Download Route Type Hardcoding

**Files:**
- Modify: `src/application/ports/IReportPDFGenerator.ts` — add `generateReport` method to interface
- Modify: `src/infrastructure/pdf/ReportPDFGenerator.ts` — implement `generateReport` with type-based template selection
- Modify: `src/app/api/reports/[id]/download/route.ts:38` — use `generateReport` with report type

- [ ] **Step 1: Extend IReportPDFGenerator interface**

In `src/application/ports/IReportPDFGenerator.ts`, add method:

```typescript
export interface IReportPDFGenerator {
  generateWeeklyReport(report: ReportDTO): Promise<PDFGeneratorResult>
  generateReport(type: 'DAILY' | 'WEEKLY' | 'MONTHLY', report: ReportDTO): Promise<PDFGeneratorResult>
}
```

- [ ] **Step 2: Implement generateReport in ReportPDFGenerator**

In `src/infrastructure/pdf/ReportPDFGenerator.ts`, add method that selects template by type:

```typescript
  async generateReport(
    type: 'DAILY' | 'WEEKLY' | 'MONTHLY',
    report: ReportDTO
  ): Promise<PDFGeneratorResult> {
    const templateMap: Record<string, React.ComponentType<{ report: ReportDTO }>> = {
      DAILY: DailyReportTemplate,
      WEEKLY: report.overallSummary ? EnhancedWeeklyReportTemplate : WeeklyReportTemplate,
      MONTHLY: MonthlyReportTemplate,
    }
    const Template = templateMap[type] ?? WeeklyReportTemplate

    const document = React.createElement(Template, { report }) as any
    const buffer = await renderToBuffer(document)

    const startDate = new Date(report.dateRange.startDate)
    const endDate = new Date(report.dateRange.endDate)
    const formatDate = (date: Date) => date.toISOString().split('T')[0].replace(/-/g, '')

    const typeLabel: Record<string, string> = { DAILY: '일간', WEEKLY: '주간', MONTHLY: '월간' }
    const label = typeLabel[type] ?? '주간'
    const filename = type === 'DAILY'
      ? `바투_${label}리포트_${formatDate(startDate)}.pdf`
      : `바투_${label}리포트_${formatDate(startDate)}_${formatDate(endDate)}.pdf`

    return { buffer: Buffer.from(buffer), filename, contentType: 'application/pdf' }
  }
```

Ensure imports for `DailyReportTemplate`, `MonthlyReportTemplate` exist at the top of the file.

- [ ] **Step 3: Update download route**

In `src/app/api/reports/[id]/download/route.ts`, replace line 38:

```typescript
// Before:
const { buffer, filename, contentType } = await pdfGenerator.generateWeeklyReport(reportDTO)

// After:
const typeMap: Record<string, 'DAILY' | 'WEEKLY' | 'MONTHLY'> = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
}
const templateType = typeMap[report.type] ?? 'WEEKLY'
const { buffer, filename, contentType } = await pdfGenerator.generateReport(templateType, reportDTO)
```

- [ ] **Step 4: Type check**

Run: `npx tsc --noEmit 2>&1 | grep -E "download/route|IReportPDFGenerator|ReportPDFGenerator" | head -5`
Expected: No errors for these files

- [ ] **Step 5: Commit**

```bash
git add src/application/ports/IReportPDFGenerator.ts src/infrastructure/pdf/ReportPDFGenerator.ts src/app/api/reports/\[id\]/download/route.ts
git commit -m "fix: use report.type for PDF template selection instead of hardcoded weekly"
```

---

### Task 2: Register Daily/Monthly Report Use Cases in DI

**Files:**
- Modify: `src/lib/di/types.ts`
- Modify: `src/lib/di/modules/report.module.ts`

- [ ] **Step 1: Add DI tokens**

In `types.ts`, find `GenerateWeeklyReportUseCase` token and add after it:

```typescript
  GenerateWeeklyReportUseCase: Symbol.for('GenerateWeeklyReportUseCase'),
  GenerateMonthlyReportUseCase: Symbol.for('GenerateMonthlyReportUseCase'),
  GenerateDailyReportUseCase: Symbol.for('GenerateDailyReportUseCase'),
```

- [ ] **Step 2: Register in report module**

In `report.module.ts`, add imports:

```typescript
import { GenerateMonthlyReportUseCase } from '@application/use-cases/report/GenerateMonthlyReportUseCase'
import { GenerateDailyReportUseCase } from '@application/use-cases/report/GenerateDailyReportUseCase'
```

Add registrations after `GenerateWeeklyReportUseCase`:

```typescript
  container.register(
    DI_TOKENS.GenerateMonthlyReportUseCase,
    () =>
      new GenerateMonthlyReportUseCase(
        container.resolve(DI_TOKENS.ReportRepository),
        container.resolve(DI_TOKENS.CampaignRepository),
        container.resolve(DI_TOKENS.KPIRepository),
        container.resolve(DI_TOKENS.AIService),
        container.resolve(DI_TOKENS.UsageLogRepository),
        container.resolve(DI_TOKENS.EnhancedReportDataBuilder)
      )
  )

  container.register(
    DI_TOKENS.GenerateDailyReportUseCase,
    () =>
      new GenerateDailyReportUseCase(
        container.resolve(DI_TOKENS.ReportRepository),
        container.resolve(DI_TOKENS.CampaignRepository),
        container.resolve(DI_TOKENS.KPIRepository),
        container.resolve(DI_TOKENS.AIService),
        container.resolve(DI_TOKENS.UsageLogRepository),
        container.resolve(DI_TOKENS.EnhancedReportDataBuilder)
      )
  )
```

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit 2>&1 | grep -E "report.module|types.ts"`
Expected: No new errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/di/types.ts src/lib/di/modules/report.module.ts
git commit -m "feat: register GenerateMonthlyReportUseCase and GenerateDailyReportUseCase in DI"
```

---

### Task 3: Add avgFrequency and adCount to FormatAggregate

**Files:**
- Modify: `src/domain/repositories/IAdKPIRepository.ts`
- Modify: `src/infrastructure/database/repositories/PrismaAdKPIRepository.ts`
- Modify: `src/application/services/EnhancedReportDataBuilder.ts`

- [ ] **Step 1: Extend FormatAggregate interface**

In `IAdKPIRepository.ts`, update `FormatAggregate`:

```typescript
export interface FormatAggregate {
  format: string
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  totalSpend: number
  totalRevenue: number
  avgFrequency: number
  adCount: number
}
```

- [ ] **Step 2: Update SQL in PrismaAdKPIRepository.aggregateByFormat**

Replace the raw SQL in `aggregateByFormat` to include frequency and ad count:

```typescript
  async aggregateByFormat(
    campaignIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<FormatAggregate[]> {
    if (campaignIds.length === 0) return []

    const results = await this.prisma.$queryRaw<
      Array<{
        format: string
        totalimpressions: bigint
        totalclicks: bigint
        totalconversions: bigint
        totalspend: number
        totalrevenue: number
        avgfrequency: number
        adcount: bigint
      }>
    >`
      SELECT
        c.format,
        SUM(k.impressions)::bigint as totalimpressions,
        SUM(k.clicks)::bigint as totalclicks,
        SUM(k.conversions)::bigint as totalconversions,
        SUM(k.spend)::numeric as totalspend,
        SUM(k.revenue)::numeric as totalrevenue,
        AVG(k.frequency)::numeric as avgfrequency,
        COUNT(DISTINCT k."adId")::bigint as adcount
      FROM "AdKPISnapshot" k
      JOIN "Creative" c ON k."creativeId" = c.id
      WHERE k."campaignId" = ANY(${campaignIds})
        AND k.date >= ${startDate}
        AND k.date <= ${endDate}
      GROUP BY c.format
    `

    return results.map((r) => ({
      format: r.format,
      totalImpressions: Number(r.totalimpressions),
      totalClicks: Number(r.totalclicks),
      totalConversions: Number(r.totalconversions),
      totalSpend: Number(r.totalspend),
      totalRevenue: Number(r.totalrevenue),
      avgFrequency: Number(r.avgfrequency ?? 0),
      adCount: Number(r.adcount),
    }))
  }
```

- [ ] **Step 3: Update buildFormatComparison in EnhancedReportDataBuilder**

Replace hardcoded zeros:

```typescript
  private buildFormatComparison(formatAggregates: FormatAggregate[]): FormatComparisonSection {
    return {
      formats: formatAggregates.map(f => ({
        format: f.format,
        formatLabel: FORMAT_LABELS[f.format] ?? f.format,
        adCount: f.adCount,
        impressions: f.totalImpressions,
        clicks: f.totalClicks,
        conversions: f.totalConversions,
        spend: f.totalSpend,
        revenue: f.totalRevenue,
        roas: f.totalSpend > 0 ? f.totalRevenue / f.totalSpend : 0,
        ctr: f.totalImpressions > 0 ? (f.totalClicks / f.totalImpressions) * 100 : 0,
        avgFrequency: f.avgFrequency,
      })),
    }
  }
```

- [ ] **Step 4: Type check + test**

Run: `npx tsc --noEmit 2>&1 | head -5 && npx vitest run tests/unit/application/services/EnhancedReportDataBuilder.test.ts --pool forks`
Expected: Tests pass

- [ ] **Step 5: Commit**

```bash
git add src/domain/repositories/IAdKPIRepository.ts src/infrastructure/database/repositories/PrismaAdKPIRepository.ts src/application/services/EnhancedReportDataBuilder.ts
git commit -m "fix: populate adCount and avgFrequency from real data in format comparison"
```

---

### Task 4: Fix Hardcoded activeDays in buildCreativeFatigue

**Files:**
- Modify: `src/application/services/EnhancedReportDataBuilder.ts`

- [ ] **Step 1: Pass date range to buildCreativeFatigue**

Update the call in `build()`:

```typescript
    const creativeFatigue = this.buildCreativeFatigue(topCreatives, startDate, endDate)
```

Update the method signature and calculate activeDays:

```typescript
  private buildCreativeFatigue(
    topCreatives: CreativeAggregate[],
    startDate: Date,
    endDate: Date
  ): CreativeFatigueSection {
    const activeDays = Math.max(1, Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ))

    return {
      creatives: topCreatives
        .filter(c => c.avgFrequency > 0)
        .map(c => {
          const initialCtr = c.totalImpressions > 0 ? (c.totalClicks / c.totalImpressions) * 100 : 0
          const currentCtr = initialCtr
          const score = this.fatigueService.calculateFatigueScore({
            frequency: c.avgFrequency,
            currentCtr,
            initialCtr,
            activeDays,
          })
          const level = this.fatigueService.getFatigueLevel(score)

          return {
            creativeId: c.creativeId,
            name: c.name,
            format: c.format,
            frequency: c.avgFrequency,
            ctr: currentCtr,
            ctrTrend: [],
            fatigueScore: score,
            fatigueLevel: level,
            activeDays,
            recommendation: level === 'critical'
              ? '즉시 소재 교체 권장'
              : level === 'warning'
                ? '1주 내 교체 검토 필요'
                : '양호. 현재 소재 유지.',
          }
        }),
    }
  }
```

- [ ] **Step 2: Type check + test**

Run: `npx tsc --noEmit 2>&1 | head -5 && npx vitest run tests/unit/application/services/EnhancedReportDataBuilder.test.ts --pool forks`
Expected: Tests pass

- [ ] **Step 3: Commit**

```bash
git add src/application/services/EnhancedReportDataBuilder.ts
git commit -m "fix: calculate activeDays from date range instead of hardcoded 7"
```

---

### Task 5: Full Verification

- [ ] **Step 1: Run all report tests**

Run: `npx vitest run tests/unit/application/services/EnhancedReportDataBuilder.test.ts tests/unit/application/services/ReportNotificationService.test.ts tests/unit/infrastructure/repositories/PrismaAdKPIRepository.test.ts --pool forks`
Expected: All pass

- [ ] **Step 2: Full test suite**

Run: `npx vitest run --pool forks`
Expected: No new regressions (pre-existing AIService failures only)
