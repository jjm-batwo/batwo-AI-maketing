# 보고서 개선 Phase 2: 9개 섹션 보고서 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 부실한 KPI 나열 보고서를 9개 섹션의 전문 마케팅 리포트로 개선

**Architecture:** EnhancedReportDataBuilder가 AdKPIRepository + KPIRepository + CreativeFatigueService + FunnelClassificationService를 조합하여 enrichedData 생성. BaseReportGenerationUseCase가 이를 호출. WeeklyReportTemplate이 enrichedData를 9페이지 PDF로 렌더링.

**Tech Stack:** React PDF (@react-pdf/renderer), TypeScript, Vitest, OpenAI API (AI 분석)

**Spec:** `docs/superpowers/specs/2026-03-17-report-enhancement-design.md` (섹션 3-11)
**Phase 1 Plan:** `docs/superpowers/plans/2026-03-17-report-phase1-ad-kpi.md`

---

## 어드바이저리 노트

구현 시 반드시 확인해야 할 사항:

| 코드 | 내용 | 적용 태스크 |
|------|------|------------|
| B1 | `enrichedData`가 `null`이면 기존 3페이지 템플릿으로 fallback. 신규 보고서만 9페이지 적용. | Task 5, 10, 11 |
| B2 | `formatCurrency`는 `Intl.NumberFormat('ko-KR').format(Math.round(num)) + '원'`으로 변경. `₩` 기호는 PDF 폰트에서 깨짐. | Task 8 |
| B3 | 브랜딩 캠페인(`AWARENESS` objective)의 소재 피로도는 CTR 하락 10% 미만 시 20점 감점. 오탐 방지. | Task 3 |
| B4 | Advantage+ 캠페인(`advantageConfig` 존재)은 퍼널 분류에서 `auto`로 처리. 예산 비율 계산에서 제외. | Task 4 |
| B5 | PDF 생성 시간 9페이지 기준 7-12초 예상. Vercel Pro Plan 60초 타임아웃 내 안전. DB 쿼리는 `Promise.all`로 병렬화 필수. | Task 5 |
| B6 | AI 분석 프롬프트는 1회 호출로 통합 (성과 분석 + 추천 액션). 월 40 USD 이내 유지. | Task 6 |
| B7 | `ChangeRate.isPositive`: spend는 `false` (지출 증가는 부정적), revenue/roas/conversions는 `true` (증가가 긍정적). | Task 1, 8 |
| B8 | 피로도 `critical` 판정이라도 최근 3일 CTR 상승 추세이면 `warning`으로 하향 조정. | Task 3 |

---

## Phase 1 완료 전제 (이미 존재하는 것들)

Phase 2는 Phase 1이 완료된 상태를 전제한다. Phase 1에서 만들어진 것:

| 항목 | 파일 |
|------|------|
| AdKPISnapshot Prisma 모델 | `prisma/schema.prisma` |
| AdKPI 도메인 엔티티 | `src/domain/entities/AdKPI.ts` |
| IAdKPIRepository 포트 | `src/domain/repositories/IAdKPIRepository.ts` |
| PrismaAdKPIRepository | `src/infrastructure/database/repositories/PrismaAdKPIRepository.ts` |
| MetaInsightsData 확장 | `src/application/ports/IMetaAdsService.ts` |
| getAccountInsights 확장 | `src/infrastructure/external/meta-ads/MetaAdsClient.ts` |
| SyncAdInsightsUseCase | `src/application/use-cases/kpi/SyncAdInsightsUseCase.ts` |
| DI 토큰 (AdKPIRepository, SyncAdInsightsUseCase) | `src/lib/di/types.ts` |

---

## Task 1: 9개 섹션 DTO 타입 정의

**예상 시간:** 15분
**파일:**
- `src/application/dto/report/EnhancedReportSections.ts` (신규)
- `src/application/dto/report/ReportDTO.ts` (수정)

### Steps

- [x] **1.1** `src/application/dto/report/EnhancedReportSections.ts` 신규 파일 생성 -- 9개 섹션 타입 정의

```typescript
// src/application/dto/report/EnhancedReportSections.ts

// ── 공통 ──

export interface ChangeRate {
  value: number           // 변화율 (%) — 양수: 증가, 음수: 감소
  direction: 'up' | 'down' | 'flat'
  isPositive: boolean     // 이 지표에서 증가가 좋은지 (spend는 false)
}

// ── 1. 전체 성과 요약 ──

export interface OverallSummarySection {
  totalSpend: number
  totalRevenue: number
  roas: number
  ctr: number
  totalConversions: number
  changes: {
    spend: ChangeRate
    revenue: ChangeRate
    roas: ChangeRate
    ctr: ChangeRate
    conversions: ChangeRate
  }
}

// ── 2. 성과 추이 (일별) ──

export interface DailyTrendSection {
  days: DailyDataPoint[]
}

export interface DailyDataPoint {
  date: string            // YYYY-MM-DD
  spend: number
  revenue: number
  roas: number
  impressions: number
  clicks: number
  conversions: number
}

// ── 3. 캠페인별 성과 ──

export interface CampaignPerformanceSection {
  campaigns: CampaignPerformanceItem[]
}

export interface CampaignPerformanceItem {
  campaignId: string
  name: string
  objective: string
  status: string
  impressions: number
  clicks: number
  conversions: number
  spend: number
  revenue: number
  roas: number
  ctr: number
}

// ── 4. 소재별 성과 (TOP N) ──

export interface CreativePerformanceSection {
  topN: number
  creatives: CreativePerformanceItem[]
}

export interface CreativePerformanceItem {
  creativeId: string
  name: string
  format: string
  thumbnailUrl?: string
  impressions: number
  clicks: number
  conversions: number
  spend: number
  revenue: number
  roas: number
  ctr: number
}

// ── 5. 소재 피로도 지수 ──

export interface CreativeFatigueSection {
  creatives: CreativeFatigueItem[]
}

export type FatigueLevel = 'healthy' | 'warning' | 'critical'

export interface CreativeFatigueItem {
  creativeId: string
  name: string
  format: string
  frequency: number
  ctr: number
  ctrTrend: number[]      // 최근 7일 일별 CTR 변화
  fatigueScore: number    // 0-100 (높을수록 피로)
  fatigueLevel: FatigueLevel
  activeDays: number
  recommendation: string
}

// ── 6. 소재 포맷별 성과 ──

export interface FormatComparisonSection {
  formats: FormatPerformanceItem[]
}

export interface FormatPerformanceItem {
  format: string
  formatLabel: string
  adCount: number
  impressions: number
  clicks: number
  conversions: number
  spend: number
  revenue: number
  roas: number
  ctr: number
  avgFrequency: number
  videoViews?: number
  thruPlayRate?: number
}

// ── 7. 퍼널 단계별 성과 ──

export interface FunnelPerformanceSection {
  stages: FunnelStageItem[]
  totalBudget: number
}

export interface FunnelStageItem {
  stage: 'tofu' | 'mofu' | 'bofu' | 'auto'
  stageLabel: string
  campaignCount: number
  spend: number
  budgetRatio: number
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  roas: number
  ctr: number
}

// ── 8. 성과 분석 (AI) ──

export interface PerformanceAnalysisSection {
  positiveFactors: AnalysisFactor[]
  negativeFactors: AnalysisFactor[]
  summary: string
}

export interface AnalysisFactor {
  title: string
  description: string
  relatedCampaigns?: string[]
  relatedCreatives?: string[]
  impact: 'high' | 'medium' | 'low'
}

// ── 9. 개선사항 + 추천 액션 ──

export interface RecommendationsSection {
  actions: RecommendedAction[]
}

export interface RecommendedAction {
  priority: 'high' | 'medium' | 'low'
  category: 'budget' | 'creative' | 'targeting' | 'funnel' | 'general'
  title: string
  description: string
  expectedImpact: string
  deadline?: string
}

// ── 통합 타입 (9개 섹션 합체) ──

export interface EnhancedReportSections {
  overallSummary: OverallSummarySection
  dailyTrend: DailyTrendSection
  campaignPerformance: CampaignPerformanceSection
  creativePerformance: CreativePerformanceSection
  creativeFatigue: CreativeFatigueSection
  formatComparison: FormatComparisonSection
  funnelPerformance: FunnelPerformanceSection
  performanceAnalysis: PerformanceAnalysisSection
  recommendations: RecommendationsSection
}
```

- [x] **1.2** `src/application/dto/report/ReportDTO.ts` 수정 -- `EnhancedReportSections` 필드 추가

기존 `ReportDTO` 인터페이스에 optional 필드로 9개 섹션을 추가하고, `toReportDTO`에 분기 로직을 추가한다:

```typescript
// 추가 import
import type { EnhancedReportSections } from './EnhancedReportSections'

// ReportDTO 확장 (기존 필드 유지 + 신규 필드 추가)
export interface ReportDTO {
  // ... 기존 필드 전부 유지
  id: string
  type: ReportType
  userId: string
  campaignIds: string[]
  dateRange: { startDate: string; endDate: string }
  sections: ReportSection[]
  aiInsights: AIInsight[]
  summaryMetrics: ReportSummaryMetrics
  status: ReportStatus
  generatedAt?: string
  sentAt?: string
  createdAt: string
  updatedAt: string

  // 9개 섹션 (Phase 2) -- enrichedData가 있을 때만 채워짐
  overallSummary?: EnhancedReportSections['overallSummary']
  dailyTrend?: EnhancedReportSections['dailyTrend']
  campaignPerformance?: EnhancedReportSections['campaignPerformance']
  creativePerformance?: EnhancedReportSections['creativePerformance']
  creativeFatigue?: EnhancedReportSections['creativeFatigue']
  formatComparison?: EnhancedReportSections['formatComparison']
  funnelPerformance?: EnhancedReportSections['funnelPerformance']
  performanceAnalysis?: EnhancedReportSections['performanceAnalysis']
  recommendations?: EnhancedReportSections['recommendations']
}
```

`toReportDTO` 함수에서 `report.enrichedData`가 있으면 9개 섹션으로 매핑:

```typescript
export function toReportDTO(report: Report): ReportDTO {
  const metrics = report.calculateSummaryMetrics()

  const base: ReportDTO = {
    // ... 기존 매핑 유지
    id: report.id,
    type: report.type,
    userId: report.userId,
    campaignIds: report.campaignIds,
    dateRange: {
      startDate: report.dateRange.startDate.toISOString(),
      endDate: report.dateRange.endDate?.toISOString() ?? report.dateRange.startDate.toISOString(),
    },
    sections: report.sections,
    aiInsights: report.aiInsights,
    summaryMetrics: metrics,
    status: report.status,
    generatedAt: report.generatedAt?.toISOString(),
    sentAt: report.sentAt?.toISOString(),
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  }

  // enrichedData가 있으면 9개 섹션 매핑
  if (report.enrichedData) {
    const enriched = report.enrichedData as EnhancedReportSections
    return {
      ...base,
      overallSummary: enriched.overallSummary,
      dailyTrend: enriched.dailyTrend,
      campaignPerformance: enriched.campaignPerformance,
      creativePerformance: enriched.creativePerformance,
      creativeFatigue: enriched.creativeFatigue,
      formatComparison: enriched.formatComparison,
      funnelPerformance: enriched.funnelPerformance,
      performanceAnalysis: enriched.performanceAnalysis,
      recommendations: enriched.recommendations,
    }
  }

  return base
}
```

### 테스트 (RED -> GREEN)

- [x] **1.3** `src/application/dto/report/__tests__/EnhancedReportSections.test.ts` 신규 -- 타입 호환성 테스트

```typescript
import { describe, it, expect } from 'vitest'
import type {
  EnhancedReportSections,
  OverallSummarySection,
  ChangeRate,
  FatigueLevel,
} from '../EnhancedReportSections'

describe('EnhancedReportSections types', () => {
  it('should accept valid ChangeRate with direction up', () => {
    const change: ChangeRate = {
      value: 12.5,
      direction: 'up',
      isPositive: true,
    }
    expect(change.direction).toBe('up')
    expect(change.isPositive).toBe(true)
  })

  it('should accept spend change where increase is negative (isPositive=false)', () => {
    const spendChange: ChangeRate = {
      value: 5.2,
      direction: 'up',
      isPositive: false, // 지출 증가는 부정적
    }
    expect(spendChange.isPositive).toBe(false)
  })

  it('should accept valid OverallSummarySection', () => {
    const summary: OverallSummarySection = {
      totalSpend: 2_450_000,
      totalRevenue: 9_310_000,
      roas: 3.80,
      ctr: 2.56,
      totalConversions: 186,
      changes: {
        spend:       { value: 5.2,  direction: 'up',   isPositive: false },
        revenue:     { value: 12.8, direction: 'up',   isPositive: true },
        roas:        { value: 7.2,  direction: 'up',   isPositive: true },
        ctr:         { value: -1.3, direction: 'down', isPositive: false },
        conversions: { value: 15.4, direction: 'up',   isPositive: true },
      },
    }
    expect(summary.roas).toBe(3.80)
  })

  it('should accept all fatigue levels', () => {
    const levels: FatigueLevel[] = ['healthy', 'warning', 'critical']
    expect(levels).toHaveLength(3)
  })

  it('should accept valid full EnhancedReportSections', () => {
    const sections: EnhancedReportSections = {
      overallSummary: {
        totalSpend: 2_450_000, totalRevenue: 9_310_000,
        roas: 3.80, ctr: 2.56, totalConversions: 186,
        changes: {
          spend: { value: 5.2, direction: 'up', isPositive: false },
          revenue: { value: 12.8, direction: 'up', isPositive: true },
          roas: { value: 7.2, direction: 'up', isPositive: true },
          ctr: { value: -1.3, direction: 'down', isPositive: false },
          conversions: { value: 15.4, direction: 'up', isPositive: true },
        },
      },
      dailyTrend: { days: [] },
      campaignPerformance: { campaigns: [] },
      creativePerformance: { topN: 5, creatives: [] },
      creativeFatigue: { creatives: [] },
      formatComparison: { formats: [] },
      funnelPerformance: { stages: [], totalBudget: 0 },
      performanceAnalysis: { positiveFactors: [], negativeFactors: [], summary: '' },
      recommendations: { actions: [] },
    }
    expect(sections.overallSummary.roas).toBe(3.80)
  })
})
```

### 검증

```bash
npx vitest run src/application/dto/report/__tests__/EnhancedReportSections.test.ts --pool forks
npx tsc --noEmit
```

예상 출력: 5 tests passed, 0 errors

---

## Task 2: Report 엔티티에 enrichedData 필드 추가

**예상 시간:** 15분
**파일:**
- `prisma/schema.prisma` (수정)
- `src/domain/entities/Report.ts` (수정)

### Steps

- [x] **2.1** `prisma/schema.prisma` -- Report 모델에 `enrichedData` 필드 추가

```prisma
model Report {
  // ... 기존 필드 유지
  enrichedData   Json?    // 9개 섹션 데이터 (nullable -> 기존 보고서 호환)
}
```

- [x] **2.2** Prisma 마이그레이션 생성

```bash
npx prisma migrate dev --name add_report_enriched_data
npx prisma generate
```

- [x] **2.3** `src/domain/entities/Report.ts` -- enrichedData 속성 추가

`Report` 엔티티의 14개 파라미터를 15개로 확장. 수정 대상 위치 8~10곳:

**(a) ReportProps 인터페이스에 추가:**

```typescript
export interface ReportProps extends CreateReportProps {
  // ... 기존 필드 유지
  id: string
  type: ReportType
  sections: ReportSection[]
  aiInsights: AIInsight[]
  status: ReportStatus
  generatedAt?: Date
  sentAt?: Date
  shareToken?: string | null
  shareExpiresAt?: Date | null
  createdAt: Date
  updatedAt: Date
  enrichedData?: Record<string, unknown> | null  // 추가
}
```

**(b) private constructor에 15번째 파라미터 추가:**

```typescript
private constructor(
  private readonly _id: string,
  private readonly _type: ReportType,
  private readonly _userId: string,
  private readonly _campaignIds: string[],
  private readonly _dateRange: DateRange,
  private readonly _sections: ReportSection[],
  private readonly _aiInsights: AIInsight[],
  private readonly _status: ReportStatus,
  private readonly _shareToken: string | null | undefined,
  private readonly _shareExpiresAt: Date | null | undefined,
  private readonly _generatedAt: Date | undefined,
  private readonly _sentAt: Date | undefined,
  private readonly _createdAt: Date,
  private readonly _updatedAt: Date,
  private readonly _enrichedData: Record<string, unknown> | null | undefined  // 추가
) {
  super()
}
```

**(c) createWeekly / createDaily / createMonthly -- 마지막 인자에 `undefined` 추가:**

각 factory 메서드의 `new Report(...)` 호출 마지막에 `undefined` 추가:

```typescript
static createWeekly(props: CreateReportProps): Report {
  // ... validation 유지
  const now = new Date()
  return new Report(
    crypto.randomUUID(),
    ReportType.WEEKLY,
    props.userId,
    [...props.campaignIds],
    props.dateRange,
    [], [], 'DRAFT',
    undefined, undefined, undefined, undefined,
    now, now,
    undefined  // enrichedData -- 추가
  )
}
```

`createDaily`와 `createMonthly`도 동일하게 마지막 `undefined` 추가.

**(d) restore 메서드:**

```typescript
static restore(props: ReportProps): Report {
  return new Report(
    props.id, props.type, props.userId,
    [...props.campaignIds], props.dateRange,
    [...props.sections], [...props.aiInsights],
    props.status,
    props.shareToken, props.shareExpiresAt,
    props.generatedAt, props.sentAt,
    props.createdAt, props.updatedAt,
    props.enrichedData ?? null  // 추가
  )
}
```

**(e) addSection, addAIInsight, markAsGenerated, markAsSent -- 마지막 인자에 `this._enrichedData` 전달:**

각 메서드의 `new Report(...)` 호출 마지막에 `this._enrichedData` 추가. 예시 (addSection):

```typescript
addSection(section: ReportSection): Report {
  return new Report(
    this._id, this._type, this._userId, this._campaignIds,
    this._dateRange,
    [...this._sections, section],
    this._aiInsights, this._status,
    this._shareToken, this._shareExpiresAt,
    this._generatedAt, this._sentAt,
    this._createdAt, new Date(),
    this._enrichedData  // 추가
  )
}
```

`addAIInsight`, `markAsGenerated`, `markAsSent` 모두 동일 패턴.

**(f) getter 추가:**

```typescript
get enrichedData(): Record<string, unknown> | null {
  return this._enrichedData ?? null
}
```

**(g) toJSON 확장:**

```typescript
toJSON(): ReportProps {
  return {
    // ... 기존 필드 유지
    id: this._id,
    type: this._type,
    userId: this._userId,
    campaignIds: this._campaignIds,
    dateRange: this._dateRange,
    sections: this._sections,
    aiInsights: this._aiInsights,
    status: this._status,
    shareToken: this._shareToken ?? null,
    shareExpiresAt: this._shareExpiresAt ?? null,
    generatedAt: this._generatedAt,
    sentAt: this._sentAt,
    createdAt: this._createdAt,
    updatedAt: this._updatedAt,
    enrichedData: this._enrichedData ?? null,  // 추가
  }
}
```

**(h) setEnrichedData 커맨드 추가 (새 Report 반환):**

```typescript
setEnrichedData(data: Record<string, unknown>): Report {
  return new Report(
    this._id, this._type, this._userId, this._campaignIds,
    this._dateRange, this._sections, this._aiInsights,
    this._status,
    this._shareToken, this._shareExpiresAt,
    this._generatedAt, this._sentAt,
    this._createdAt, new Date(),
    data
  )
}
```

### 테스트 (RED -> GREEN)

- [x] **2.4** 기존 Report 테스트 파일에 enrichedData 관련 테스트 추가

기존 Report.test.ts 위치를 확인하여 추가:

```typescript
describe('Report enrichedData', () => {
  it('should create report with null enrichedData by default', () => {
    const report = Report.createWeekly({
      userId: 'user-1',
      campaignIds: ['c-1'],
      dateRange: DateRange.create(new Date('2026-03-10'), new Date('2026-03-16')),
    })
    expect(report.enrichedData).toBeNull()
  })

  it('should set enrichedData and return new report', () => {
    const report = Report.createWeekly({
      userId: 'user-1',
      campaignIds: ['c-1'],
      dateRange: DateRange.create(new Date('2026-03-10'), new Date('2026-03-16')),
    })
    const enriched = report.setEnrichedData({ overallSummary: { totalSpend: 100 } })
    expect(enriched.enrichedData).toEqual({ overallSummary: { totalSpend: 100 } })
    expect(report.enrichedData).toBeNull() // immutable
  })

  it('should preserve enrichedData through restore', () => {
    const report = Report.createWeekly({
      userId: 'user-1',
      campaignIds: ['c-1'],
      dateRange: DateRange.create(new Date('2026-03-10'), new Date('2026-03-16')),
    })
    const enriched = report.setEnrichedData({ test: 'data' })
    const restored = Report.restore(enriched.toJSON())
    expect(restored.enrichedData).toEqual({ test: 'data' })
  })

  it('should include enrichedData in toJSON', () => {
    const report = Report.createWeekly({
      userId: 'user-1',
      campaignIds: ['c-1'],
      dateRange: DateRange.create(new Date('2026-03-10'), new Date('2026-03-16')),
    })
    const enriched = report.setEnrichedData({ foo: 'bar' })
    const json = enriched.toJSON()
    expect(json.enrichedData).toEqual({ foo: 'bar' })
  })
})
```

### 검증

```bash
npx vitest run src/domain/entities/__tests__/Report.test.ts --pool forks
npx tsc --noEmit
```

예상 출력: 기존 테스트 + 4개 신규 테스트 통과, 타입 에러 0

---

## Task 3: CreativeFatigueService -- 소재 피로도 계산 서비스

**예상 시간:** 20분
**파일:**
- `src/application/services/CreativeFatigueService.ts` (신규)
- `src/application/services/__tests__/CreativeFatigueService.test.ts` (신규)

### Steps

- [x] **3.1** 테스트 먼저 작성 (RED)

```typescript
// src/application/services/__tests__/CreativeFatigueService.test.ts

import { describe, it, expect } from 'vitest'
import { CreativeFatigueService } from '../CreativeFatigueService'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'

describe('CreativeFatigueService', () => {
  const service = new CreativeFatigueService()

  describe('calculateFatigueScore', () => {
    it('should return 0 for fresh creative (freq=1.0, no CTR decay, 7 days)', () => {
      const score = service.calculateFatigueScore({
        frequency: 1.0,
        currentCtr: 3.0,
        initialCtr: 3.0,
        activeDays: 7,
      })
      expect(score).toBe(0)
    })

    it('should return 40 for max frequency (5.0+)', () => {
      const score = service.calculateFatigueScore({
        frequency: 5.0,
        currentCtr: 3.0,
        initialCtr: 3.0,
        activeDays: 7,
      })
      expect(score).toBe(40) // freq=40, ctr=0, dur=0
    })

    it('should return 40 for max CTR decay (100% decline)', () => {
      const score = service.calculateFatigueScore({
        frequency: 1.0,
        currentCtr: 0,
        initialCtr: 3.0,
        activeDays: 7,
      })
      expect(score).toBe(40) // freq=0, ctr=40, dur=0
    })

    it('should return 20 for max duration (30+ days)', () => {
      const score = service.calculateFatigueScore({
        frequency: 1.0,
        currentCtr: 3.0,
        initialCtr: 3.0,
        activeDays: 30,
      })
      expect(score).toBe(20) // freq=0, ctr=0, dur=20
    })

    it('should return 100 for worst case (all factors maxed)', () => {
      const score = service.calculateFatigueScore({
        frequency: 5.0,
        currentCtr: 0,
        initialCtr: 3.0,
        activeDays: 30,
      })
      expect(score).toBe(100)
    })

    it('should handle frequency below 1.0 as 0 factor', () => {
      const score = service.calculateFatigueScore({
        frequency: 0.5,
        currentCtr: 3.0,
        initialCtr: 3.0,
        activeDays: 7,
      })
      expect(score).toBe(0)
    })

    it('should handle initialCtr=0 gracefully', () => {
      const score = service.calculateFatigueScore({
        frequency: 1.0,
        currentCtr: 0,
        initialCtr: 0,
        activeDays: 7,
      })
      expect(score).toBe(0)
    })

    it('should calculate mid-range score correctly', () => {
      // freq=3.0 -> (3.0-1.0)/4.0*40 = 20
      // ctr 50% decay: 1.5/3.0*100 = 50% -> min(40, 50) = 40? NO: (3.0-1.5)/3.0*100=50 -> min(40,50)=40
      // Wait: ctrFactor = min(40, ctrDecay) where ctrDecay = (initial-current)/initial * 100
      // ctrDecay = (3.0-1.5)/3.0*100 = 50, ctrFactor = min(40, 50) = 40
      // dur=14 -> (14-7)/23*20 = 6.09
      // total = 20 + 40 + 6 = 66
      const score = service.calculateFatigueScore({
        frequency: 3.0,
        currentCtr: 1.5,
        initialCtr: 3.0,
        activeDays: 14,
      })
      expect(score).toBe(66)
    })
  })

  describe('getFatigueLevel', () => {
    it('should return healthy for score 0-30', () => {
      expect(service.getFatigueLevel(0)).toBe('healthy')
      expect(service.getFatigueLevel(15)).toBe('healthy')
      expect(service.getFatigueLevel(30)).toBe('healthy')
    })

    it('should return warning for score 31-60', () => {
      expect(service.getFatigueLevel(31)).toBe('warning')
      expect(service.getFatigueLevel(45)).toBe('warning')
      expect(service.getFatigueLevel(60)).toBe('warning')
    })

    it('should return critical for score 61-100', () => {
      expect(service.getFatigueLevel(61)).toBe('critical')
      expect(service.getFatigueLevel(78)).toBe('critical')
      expect(service.getFatigueLevel(100)).toBe('critical')
    })
  })

  describe('adjustFatigueForBranding (B3)', () => {
    it('should reduce score by 20 for AWARENESS campaign with <10% CTR decay', () => {
      const result = service.adjustFatigueForBranding(
        50,
        CampaignObjective.AWARENESS,
        2.8,  // currentCtr
        3.0   // initialCtr -> 6.7% decay
      )
      expect(result.score).toBe(30) // 50 - 20
      expect(result.fatigueLevel).toBe('healthy')
      expect(result.note).toContain('브랜딩')
    })

    it('should NOT reduce score for AWARENESS campaign with >=10% CTR decay', () => {
      const result = service.adjustFatigueForBranding(
        50,
        CampaignObjective.AWARENESS,
        2.5,  // currentCtr
        3.0   // initialCtr -> 16.7% decay
      )
      expect(result.score).toBe(50) // unchanged
    })

    it('should NOT reduce score for CONVERSIONS campaign', () => {
      const result = service.adjustFatigueForBranding(
        50,
        CampaignObjective.CONVERSIONS,
        2.8,
        3.0
      )
      expect(result.score).toBe(50) // unchanged
    })

    it('should not go below 0', () => {
      const result = service.adjustFatigueForBranding(
        10,
        CampaignObjective.AWARENESS,
        3.0,
        3.0
      )
      expect(result.score).toBe(0) // max(0, 10 - 20)
    })
  })

  describe('adjustForRecentTrend (B8)', () => {
    it('should downgrade critical to warning if last 3 days CTR is rising', () => {
      const result = service.adjustForRecentTrend(
        65, // critical
        [1.8, 1.7, 1.9, 2.0, 2.1, 2.2, 2.3] // last 3 days rising
      )
      expect(result.fatigueLevel).toBe('warning')
    })

    it('should NOT downgrade if last 3 days CTR is falling', () => {
      const result = service.adjustForRecentTrend(
        65,
        [2.3, 2.2, 2.1, 2.0, 1.9, 1.8, 1.7]
      )
      expect(result.fatigueLevel).toBe('critical')
    })

    it('should NOT downgrade warning level', () => {
      const result = service.adjustForRecentTrend(
        45, // warning
        [1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.4]
      )
      expect(result.fatigueLevel).toBe('warning') // stays warning
    })
  })
})
```

- [x] **3.2** 구현 (GREEN)

```typescript
// src/application/services/CreativeFatigueService.ts

import { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import type { FatigueLevel } from '@application/dto/report/EnhancedReportSections'

interface FatigueScoreInput {
  frequency: number
  currentCtr: number
  initialCtr: number    // 첫 3일 평균 CTR
  activeDays: number
}

interface BrandingAdjustResult {
  score: number
  fatigueLevel: FatigueLevel
  note?: string
}

interface TrendAdjustResult {
  fatigueLevel: FatigueLevel
}

export class CreativeFatigueService {
  /**
   * 피로도 점수 계산 (0-100)
   * Frequency Factor 40 + CTR Decay 40 + Duration 20 = 100
   */
  calculateFatigueScore(input: FatigueScoreInput): number {
    // 1. Frequency Factor (0-40)
    const freqFactor = Math.min(40, Math.max(0, ((input.frequency - 1.0) / 4.0) * 40))

    // 2. CTR Decay Factor (0-40)
    const ctrDecay = input.initialCtr > 0
      ? Math.max(0, ((input.initialCtr - input.currentCtr) / input.initialCtr) * 100)
      : 0
    const ctrFactor = Math.min(40, ctrDecay)

    // 3. Duration Factor (0-20)
    const durFactor = Math.min(20, Math.max(0, ((input.activeDays - 7) / 23) * 20))

    return Math.round(freqFactor + ctrFactor + durFactor)
  }

  /**
   * 피로도 레벨 판정
   */
  getFatigueLevel(score: number): FatigueLevel {
    if (score <= 30) return 'healthy'
    if (score <= 60) return 'warning'
    return 'critical'
  }

  /**
   * 브랜딩 캠페인 피로도 보정 (B3)
   * AWARENESS 캠페인이면서 CTR 하락 10% 미만이면 20점 감점
   */
  adjustFatigueForBranding(
    score: number,
    objective: CampaignObjective,
    currentCtr: number,
    initialCtr: number
  ): BrandingAdjustResult {
    if (objective === CampaignObjective.AWARENESS) {
      const ctrDecayPercent = initialCtr > 0
        ? ((initialCtr - currentCtr) / initialCtr) * 100
        : 0

      if (ctrDecayPercent < 10) {
        const adjustedScore = Math.max(0, score - 20)
        return {
          score: adjustedScore,
          fatigueLevel: this.getFatigueLevel(adjustedScore),
          note: '브랜딩 캠페인: 반복 노출이 브랜드 인지에 긍정적일 수 있음',
        }
      }
    }

    return { score, fatigueLevel: this.getFatigueLevel(score) }
  }

  /**
   * 최근 CTR 추세 보정 (B8)
   * critical 판정이라도 최근 3일 CTR 상승 추세이면 warning으로 하향
   */
  adjustForRecentTrend(
    score: number,
    ctrTrend: number[]
  ): TrendAdjustResult {
    const level = this.getFatigueLevel(score)

    if (level !== 'critical' || ctrTrend.length < 3) {
      return { fatigueLevel: level }
    }

    const last3 = ctrTrend.slice(-3)
    const isRising = last3[0] < last3[1] && last3[1] < last3[2]

    if (isRising) {
      return { fatigueLevel: 'warning' }
    }

    return { fatigueLevel: level }
  }
}
```

### 검증

```bash
npx vitest run src/application/services/__tests__/CreativeFatigueService.test.ts --pool forks
npx tsc --noEmit
```

예상 출력: ~15 tests passed

---

## Task 4: FunnelClassificationService -- 퍼널 분류 서비스

**예상 시간:** 15분
**파일:**
- `src/domain/value-objects/FunnelStage.ts` (신규)
- `src/application/services/FunnelClassificationService.ts` (신규)
- `src/application/services/__tests__/FunnelClassificationService.test.ts` (신규)

### Steps

- [x] **4.1** `src/domain/value-objects/FunnelStage.ts` 신규 -- 퍼널 스테이지 정의

```typescript
// src/domain/value-objects/FunnelStage.ts

import { CampaignObjective } from './CampaignObjective'

export type FunnelStage = 'tofu' | 'mofu' | 'bofu'

export const FUNNEL_STAGE_LABELS: Record<FunnelStage | 'auto', string> = {
  tofu: '인지 (ToFu)',
  mofu: '고려 (MoFu)',
  bofu: '전환 (BoFu)',
  auto: '자동 배치 (Advantage+)',
}

export const OBJECTIVE_TO_FUNNEL: Record<CampaignObjective, FunnelStage> = {
  [CampaignObjective.AWARENESS]:     'tofu',
  [CampaignObjective.TRAFFIC]:       'mofu',
  [CampaignObjective.ENGAGEMENT]:    'mofu',
  [CampaignObjective.LEADS]:         'mofu',
  [CampaignObjective.APP_PROMOTION]: 'mofu',
  [CampaignObjective.SALES]:         'bofu',
  [CampaignObjective.CONVERSIONS]:   'bofu',
}
```

- [x] **4.2** 테스트 먼저 작성 (RED)

```typescript
// src/application/services/__tests__/FunnelClassificationService.test.ts

import { describe, it, expect } from 'vitest'
import { FunnelClassificationService } from '../FunnelClassificationService'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'

describe('FunnelClassificationService', () => {
  const service = new FunnelClassificationService()

  describe('classifyFunnelStage', () => {
    it('should classify AWARENESS as tofu', () => {
      expect(service.classifyFunnelStage(CampaignObjective.AWARENESS)).toBe('tofu')
    })

    it('should classify TRAFFIC as mofu', () => {
      expect(service.classifyFunnelStage(CampaignObjective.TRAFFIC)).toBe('mofu')
    })

    it('should classify ENGAGEMENT as mofu', () => {
      expect(service.classifyFunnelStage(CampaignObjective.ENGAGEMENT)).toBe('mofu')
    })

    it('should classify LEADS as mofu', () => {
      expect(service.classifyFunnelStage(CampaignObjective.LEADS)).toBe('mofu')
    })

    it('should classify APP_PROMOTION as mofu', () => {
      expect(service.classifyFunnelStage(CampaignObjective.APP_PROMOTION)).toBe('mofu')
    })

    it('should classify SALES as bofu', () => {
      expect(service.classifyFunnelStage(CampaignObjective.SALES)).toBe('bofu')
    })

    it('should classify CONVERSIONS as bofu', () => {
      expect(service.classifyFunnelStage(CampaignObjective.CONVERSIONS)).toBe('bofu')
    })
  })

  describe('classifyWithAdvantage (B4)', () => {
    it('should return auto for campaign with advantageConfig', () => {
      const result = service.classifyWithAdvantage(
        CampaignObjective.SALES,
        true  // hasAdvantageConfig
      )
      expect(result).toBe('auto')
    })

    it('should classify normally without advantageConfig', () => {
      const result = service.classifyWithAdvantage(
        CampaignObjective.SALES,
        false
      )
      expect(result).toBe('bofu')
    })
  })

  describe('calculateBudgetRatios', () => {
    it('should calculate correct budget ratios excluding auto', () => {
      const stages = [
        { stage: 'tofu' as const, spend: 300_000 },
        { stage: 'mofu' as const, spend: 200_000 },
        { stage: 'bofu' as const, spend: 500_000 },
      ]
      const ratios = service.calculateBudgetRatios(stages)
      expect(ratios.get('tofu')).toBeCloseTo(30.0)
      expect(ratios.get('mofu')).toBeCloseTo(20.0)
      expect(ratios.get('bofu')).toBeCloseTo(50.0)
    })

    it('should exclude auto from ratio calculation', () => {
      const stages = [
        { stage: 'tofu' as const, spend: 300_000 },
        { stage: 'auto' as const, spend: 200_000 },
        { stage: 'bofu' as const, spend: 500_000 },
      ]
      const ratios = service.calculateBudgetRatios(stages)
      // auto 제외하면 total = 800_000
      expect(ratios.get('tofu')).toBeCloseTo(37.5)
      expect(ratios.get('bofu')).toBeCloseTo(62.5)
      expect(ratios.get('auto')).toBe(0)
    })

    it('should handle all-zero spend', () => {
      const stages = [
        { stage: 'tofu' as const, spend: 0 },
        { stage: 'mofu' as const, spend: 0 },
      ]
      const ratios = service.calculateBudgetRatios(stages)
      expect(ratios.get('tofu')).toBe(0)
    })
  })

  describe('getStageLabel', () => {
    it('should return Korean labels', () => {
      expect(service.getStageLabel('tofu')).toBe('인지 (ToFu)')
      expect(service.getStageLabel('mofu')).toBe('고려 (MoFu)')
      expect(service.getStageLabel('bofu')).toBe('전환 (BoFu)')
      expect(service.getStageLabel('auto')).toBe('자동 배치 (Advantage+)')
    })
  })
})
```

- [x] **4.3** 구현 (GREEN)

```typescript
// src/application/services/FunnelClassificationService.ts

import { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import { type FunnelStage, OBJECTIVE_TO_FUNNEL, FUNNEL_STAGE_LABELS } from '@domain/value-objects/FunnelStage'

type FunnelStageOrAuto = FunnelStage | 'auto'

interface StageSpend {
  stage: FunnelStageOrAuto
  spend: number
}

export class FunnelClassificationService {
  /**
   * CampaignObjective -> FunnelStage 매핑
   */
  classifyFunnelStage(objective: CampaignObjective): FunnelStage {
    return OBJECTIVE_TO_FUNNEL[objective]
  }

  /**
   * Advantage+ 예외를 포함한 퍼널 분류 (B4)
   */
  classifyWithAdvantage(
    objective: CampaignObjective,
    hasAdvantageConfig: boolean
  ): FunnelStageOrAuto {
    if (hasAdvantageConfig) return 'auto'
    return this.classifyFunnelStage(objective)
  }

  /**
   * 퍼널 단계별 예산 비율 계산
   * auto 스테이지는 비율 계산에서 제외 (0으로 반환)
   */
  calculateBudgetRatios(stages: StageSpend[]): Map<FunnelStageOrAuto, number> {
    const totalExcludingAuto = stages
      .filter(s => s.stage !== 'auto')
      .reduce((sum, s) => sum + s.spend, 0)

    const ratios = new Map<FunnelStageOrAuto, number>()

    for (const { stage, spend } of stages) {
      if (stage === 'auto') {
        ratios.set('auto', 0)
      } else {
        ratios.set(stage, totalExcludingAuto > 0 ? (spend / totalExcludingAuto) * 100 : 0)
      }
    }

    return ratios
  }

  /**
   * 퍼널 스테이지 한국어 라벨
   */
  getStageLabel(stage: FunnelStageOrAuto): string {
    return FUNNEL_STAGE_LABELS[stage]
  }
}
```

### 검증

```bash
npx vitest run src/application/services/__tests__/FunnelClassificationService.test.ts --pool forks
npx vitest run src/domain/value-objects/__tests__/FunnelStage.test.ts --pool forks 2>/dev/null || true
npx tsc --noEmit
```

예상 출력: ~12 tests passed

---

## Task 5: EnhancedReportDataBuilder -- 9개 섹션 데이터 조합 서비스

**예상 시간:** 40분
**파일:**
- `src/application/services/EnhancedReportDataBuilder.ts` (신규)
- `src/application/services/__tests__/EnhancedReportDataBuilder.test.ts` (신규)

### Steps

- [x] **5.1** 테스트 먼저 작성 (RED)

```typescript
// src/application/services/__tests__/EnhancedReportDataBuilder.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EnhancedReportDataBuilder } from '../EnhancedReportDataBuilder'
import { CreativeFatigueService } from '../CreativeFatigueService'
import { FunnelClassificationService } from '../FunnelClassificationService'
import type { IKPIRepository } from '@domain/repositories/IKPIRepository'
import type { IAdKPIRepository } from '@domain/repositories/IAdKPIRepository'
import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import type { IAIService } from '@application/ports/IAIService'

// 각 repository의 mock을 설정
const mockKPIRepository = {
  aggregateByCampaignId: vi.fn(),
  // ... 필요한 메서드
} as unknown as IKPIRepository

const mockAdKPIRepository = {
  getDailyAggregatesByCampaignIds: vi.fn(),
  getTopCreatives: vi.fn(),
  findByCampaignId: vi.fn(),
  aggregateByFormat: vi.fn(),
  findByCreativeId: vi.fn(),
} as unknown as IAdKPIRepository

const mockCampaignRepository = {
  findById: vi.fn(),
  findByIds: vi.fn(),
} as unknown as ICampaignRepository

const mockCreativeRepository = {
  findById: vi.fn(),
} as any

const mockAIService = {
  generateReportInsights: vi.fn(),
} as unknown as IAIService

describe('EnhancedReportDataBuilder', () => {
  let builder: EnhancedReportDataBuilder

  beforeEach(() => {
    vi.clearAllMocks()
    builder = new EnhancedReportDataBuilder(
      mockKPIRepository,
      mockAdKPIRepository,
      mockCampaignRepository,
      mockCreativeRepository,
      new CreativeFatigueService(),
      new FunnelClassificationService(),
      mockAIService
    )
  })

  describe('build', () => {
    it('should return EnhancedReportSections with all 9 sections', async () => {
      // Mock 데이터 설정 -- 최소한의 빈 데이터
      vi.mocked(mockAdKPIRepository.getDailyAggregatesByCampaignIds).mockResolvedValue([])
      vi.mocked(mockAdKPIRepository.getTopCreatives).mockResolvedValue([])
      vi.mocked(mockAdKPIRepository.aggregateByFormat).mockResolvedValue([])
      vi.mocked(mockAIService.generateReportInsights).mockResolvedValue({
        summary: '분석 요약',
        recommendations: [],
        insights: [],
        actionItems: [],
      })

      const result = await builder.build({
        campaignIds: ['c-1'],
        campaigns: [],
        startDate: new Date('2026-03-10'),
        endDate: new Date('2026-03-16'),
        previousStartDate: new Date('2026-03-03'),
        previousEndDate: new Date('2026-03-09'),
      })

      expect(result).toHaveProperty('overallSummary')
      expect(result).toHaveProperty('dailyTrend')
      expect(result).toHaveProperty('campaignPerformance')
      expect(result).toHaveProperty('creativePerformance')
      expect(result).toHaveProperty('creativeFatigue')
      expect(result).toHaveProperty('formatComparison')
      expect(result).toHaveProperty('funnelPerformance')
      expect(result).toHaveProperty('performanceAnalysis')
      expect(result).toHaveProperty('recommendations')
    })

    it('should calculate ChangeRate correctly (B7)', async () => {
      // 전주 spend=100, 이번주 spend=110 -> +10%
      // spend 증가는 isPositive=false
      vi.mocked(mockAdKPIRepository.getDailyAggregatesByCampaignIds)
        .mockResolvedValueOnce([]) // 이번 주
        .mockResolvedValueOnce([]) // 전주
      vi.mocked(mockAdKPIRepository.getTopCreatives).mockResolvedValue([])
      vi.mocked(mockAdKPIRepository.aggregateByFormat).mockResolvedValue([])
      vi.mocked(mockAIService.generateReportInsights).mockResolvedValue({
        summary: '', recommendations: [], insights: [], actionItems: [],
      })

      const result = await builder.build({
        campaignIds: [],
        campaigns: [],
        startDate: new Date('2026-03-10'),
        endDate: new Date('2026-03-16'),
        previousStartDate: new Date('2026-03-03'),
        previousEndDate: new Date('2026-03-09'),
      })

      // spend의 isPositive는 항상 false
      expect(result.overallSummary.changes.spend.isPositive).toBe(false)
      // revenue의 isPositive는 항상 true
      expect(result.overallSummary.changes.revenue.isPositive).toBe(true)
    })

    it('should handle empty campaign list gracefully', async () => {
      vi.mocked(mockAdKPIRepository.getDailyAggregatesByCampaignIds).mockResolvedValue([])
      vi.mocked(mockAdKPIRepository.getTopCreatives).mockResolvedValue([])
      vi.mocked(mockAdKPIRepository.aggregateByFormat).mockResolvedValue([])
      vi.mocked(mockAIService.generateReportInsights).mockResolvedValue({
        summary: '', recommendations: [], insights: [], actionItems: [],
      })

      const result = await builder.build({
        campaignIds: [],
        campaigns: [],
        startDate: new Date('2026-03-10'),
        endDate: new Date('2026-03-16'),
        previousStartDate: new Date('2026-03-03'),
        previousEndDate: new Date('2026-03-09'),
      })

      expect(result.overallSummary.totalSpend).toBe(0)
      expect(result.dailyTrend.days).toEqual([])
      expect(result.campaignPerformance.campaigns).toEqual([])
    })

    it('should run DB queries in parallel for performance (B5)', async () => {
      // 호출이 병렬로 발생하는지 확인: Promise.all 사용 검증
      // 각 mock이 호출되어야 함
      vi.mocked(mockAdKPIRepository.getDailyAggregatesByCampaignIds).mockResolvedValue([])
      vi.mocked(mockAdKPIRepository.getTopCreatives).mockResolvedValue([])
      vi.mocked(mockAdKPIRepository.aggregateByFormat).mockResolvedValue([])
      vi.mocked(mockAIService.generateReportInsights).mockResolvedValue({
        summary: '', recommendations: [], insights: [], actionItems: [],
      })

      await builder.build({
        campaignIds: ['c-1'],
        campaigns: [],
        startDate: new Date('2026-03-10'),
        endDate: new Date('2026-03-16'),
        previousStartDate: new Date('2026-03-03'),
        previousEndDate: new Date('2026-03-09'),
      })

      expect(mockAdKPIRepository.getDailyAggregatesByCampaignIds).toHaveBeenCalled()
      expect(mockAdKPIRepository.getTopCreatives).toHaveBeenCalled()
      expect(mockAdKPIRepository.aggregateByFormat).toHaveBeenCalled()
    })
  })
})
```

- [x] **5.2** 구현 (GREEN)

```typescript
// src/application/services/EnhancedReportDataBuilder.ts

import type { IKPIRepository } from '@domain/repositories/IKPIRepository'
import type { IAdKPIRepository } from '@domain/repositories/IAdKPIRepository'
import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import type { IAIService } from '@application/ports/IAIService'
import { CreativeFatigueService } from './CreativeFatigueService'
import { FunnelClassificationService } from './FunnelClassificationService'
import type {
  EnhancedReportSections,
  ChangeRate,
  OverallSummarySection,
  DailyTrendSection,
  CampaignPerformanceSection,
  CreativePerformanceSection,
  CreativeFatigueSection,
  FormatComparisonSection,
  FunnelPerformanceSection,
  PerformanceAnalysisSection,
  RecommendationsSection,
} from '@application/dto/report/EnhancedReportSections'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'

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
}

export class EnhancedReportDataBuilder {
  constructor(
    private readonly kpiRepository: IKPIRepository,
    private readonly adKPIRepository: IAdKPIRepository,
    private readonly campaignRepository: ICampaignRepository,
    private readonly creativeRepository: { findById(id: string): Promise<unknown> },
    private readonly fatigueService: CreativeFatigueService,
    private readonly funnelService: FunnelClassificationService,
    private readonly aiService: IAIService
  ) {}

  async build(input: BuildInput): Promise<EnhancedReportSections> {
    const { campaignIds, campaigns, startDate, endDate, previousStartDate, previousEndDate } = input

    // 1. DB 쿼리 병렬 실행 (B5)
    const [
      dailyAggregates,
      previousDailyAggregates,
      topCreatives,
      formatAggregates,
    ] = await Promise.all([
      this.adKPIRepository.getDailyAggregatesByCampaignIds(campaignIds, startDate, endDate),
      this.adKPIRepository.getDailyAggregatesByCampaignIds(campaignIds, previousStartDate, previousEndDate),
      this.adKPIRepository.getTopCreatives(campaignIds, startDate, endDate, 10, 'roas'),
      this.adKPIRepository.aggregateByFormat(campaignIds, startDate, endDate),
    ])

    // 2. 각 섹션 빌드
    const overallSummary = this.buildOverallSummary(dailyAggregates, previousDailyAggregates)
    const dailyTrend = this.buildDailyTrend(dailyAggregates)
    const campaignPerformance = this.buildCampaignPerformance(campaigns, campaignIds, startDate, endDate)
    const creativePerformance = this.buildCreativePerformance(topCreatives)
    const creativeFatigue = await this.buildCreativeFatigue(topCreatives, campaigns)
    const formatComparison = this.buildFormatComparison(formatAggregates)
    const funnelPerformance = this.buildFunnelPerformance(campaigns, campaignIds, startDate, endDate)

    // 3. AI 분석 (B6: 1회 호출로 통합)
    const [performanceAnalysis, recommendations] = await this.buildAISections(
      overallSummary, campaignPerformance, creativeFatigue, funnelPerformance
    )

    return {
      overallSummary,
      dailyTrend,
      campaignPerformance: await campaignPerformance,
      creativePerformance,
      creativeFatigue,
      formatComparison,
      funnelPerformance: await funnelPerformance,
      performanceAnalysis,
      recommendations,
    }
  }

  private buildOverallSummary(
    currentDaily: Array<{ spend: number; revenue: number; impressions: number; clicks: number; conversions: number }>,
    previousDaily: Array<{ spend: number; revenue: number; impressions: number; clicks: number; conversions: number }>
  ): OverallSummarySection {
    const current = this.aggregateDaily(currentDaily)
    const previous = this.aggregateDaily(previousDaily)

    return {
      totalSpend: current.spend,
      totalRevenue: current.revenue,
      roas: current.spend > 0 ? current.revenue / current.spend : 0,
      ctr: current.impressions > 0 ? (current.clicks / current.impressions) * 100 : 0,
      totalConversions: current.conversions,
      changes: {
        spend: this.calculateChangeRate(previous.spend, current.spend, false), // B7
        revenue: this.calculateChangeRate(previous.revenue, current.revenue, true),
        roas: this.calculateChangeRate(
          previous.spend > 0 ? previous.revenue / previous.spend : 0,
          current.spend > 0 ? current.revenue / current.spend : 0,
          true
        ),
        ctr: this.calculateChangeRate(
          previous.impressions > 0 ? (previous.clicks / previous.impressions) * 100 : 0,
          current.impressions > 0 ? (current.clicks / current.impressions) * 100 : 0,
          true
        ),
        conversions: this.calculateChangeRate(previous.conversions, current.conversions, true),
      },
    }
  }

  private calculateChangeRate(
    previous: number,
    current: number,
    isPositive: boolean
  ): ChangeRate {
    if (previous === 0 && current === 0) {
      return { value: 0, direction: 'flat', isPositive }
    }
    if (previous === 0) {
      return { value: 100, direction: 'up', isPositive }
    }

    const value = ((current - previous) / previous) * 100
    const direction = Math.abs(value) < 0.1 ? 'flat' : value > 0 ? 'up' : 'down'

    return { value: Math.round(value * 10) / 10, direction, isPositive }
  }

  private aggregateDaily(
    daily: Array<{ spend: number; revenue: number; impressions: number; clicks: number; conversions: number }>
  ) {
    return daily.reduce(
      (acc, d) => ({
        spend: acc.spend + d.spend,
        revenue: acc.revenue + d.revenue,
        impressions: acc.impressions + d.impressions,
        clicks: acc.clicks + d.clicks,
        conversions: acc.conversions + d.conversions,
      }),
      { spend: 0, revenue: 0, impressions: 0, clicks: 0, conversions: 0 }
    )
  }

  private buildDailyTrend(
    dailyAggregates: Array<{
      date: string; spend: number; revenue: number;
      impressions: number; clicks: number; conversions: number
    }>
  ): DailyTrendSection {
    return {
      days: dailyAggregates.map(d => ({
        date: d.date,
        spend: d.spend,
        revenue: d.revenue,
        roas: d.spend > 0 ? d.revenue / d.spend : 0,
        impressions: d.impressions,
        clicks: d.clicks,
        conversions: d.conversions,
      })),
    }
  }

  // 나머지 빌드 메서드는 동일 패턴으로 구현
  // (campaignPerformance, creativePerformance, creativeFatigue,
  //  formatComparison, funnelPerformance, buildAISections)
  // 각각 repository 데이터를 해당 섹션 타입으로 변환

  private async buildCampaignPerformance(
    campaigns: BuildInput['campaigns'],
    _campaignIds: string[],
    _startDate: Date,
    _endDate: Date
  ): Promise<CampaignPerformanceSection> {
    // campaigns 데이터를 CampaignPerformanceItem[]으로 변환
    // 각 캠페인의 KPI 집계를 adKPIRepository에서 조회
    // ... 상세 구현
    return { campaigns: [] } // placeholder
  }

  private buildCreativePerformance(
    topCreatives: Array<{
      creativeId: string; name: string; format: string;
      impressions: number; clicks: number; conversions: number;
      spend: number; revenue: number
    }>
  ): CreativePerformanceSection {
    return {
      topN: 10,
      creatives: topCreatives.map(c => ({
        creativeId: c.creativeId,
        name: c.name,
        format: c.format,
        impressions: c.impressions,
        clicks: c.clicks,
        conversions: c.conversions,
        spend: c.spend,
        revenue: c.revenue,
        roas: c.spend > 0 ? c.revenue / c.spend : 0,
        ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
      })),
    }
  }

  private async buildCreativeFatigue(
    _topCreatives: unknown[],
    _campaigns: BuildInput['campaigns']
  ): Promise<CreativeFatigueSection> {
    // 각 소재의 일별 데이터 조회 -> fatigueService.calculateFatigueScore 호출
    // B3: 브랜딩 캠페인 보정 적용
    // B8: 최근 추세 보정 적용
    return { creatives: [] } // placeholder
  }

  private buildFormatComparison(
    formatAggregates: Array<{
      format: string; adCount: number;
      impressions: number; clicks: number; conversions: number;
      spend: number; revenue: number; avgFrequency: number;
      videoViews?: number; thruPlays?: number
    }>
  ): FormatComparisonSection {
    const FORMAT_LABELS: Record<string, string> = {
      SINGLE_IMAGE: '이미지',
      SINGLE_VIDEO: '동영상',
      CAROUSEL: '카루셀',
      REELS: '릴스',
    }

    return {
      formats: formatAggregates.map(f => ({
        format: f.format,
        formatLabel: FORMAT_LABELS[f.format] ?? f.format,
        adCount: f.adCount,
        impressions: f.impressions,
        clicks: f.clicks,
        conversions: f.conversions,
        spend: f.spend,
        revenue: f.revenue,
        roas: f.spend > 0 ? f.revenue / f.spend : 0,
        ctr: f.impressions > 0 ? (f.clicks / f.impressions) * 100 : 0,
        avgFrequency: f.avgFrequency,
        videoViews: f.videoViews,
        thruPlayRate: f.thruPlays && f.impressions > 0
          ? (f.thruPlays / f.impressions) * 100
          : undefined,
      })),
    }
  }

  private async buildFunnelPerformance(
    campaigns: BuildInput['campaigns'],
    _campaignIds: string[],
    _startDate: Date,
    _endDate: Date
  ): Promise<FunnelPerformanceSection> {
    // funnelService를 사용하여 캠페인을 퍼널 단계별로 그룹화
    // B4: advantageConfig 있으면 auto로 분류
    // 각 단계의 KPI 집계
    const totalBudget = 0 // sum of all spend
    return { stages: [], totalBudget } // placeholder
  }

  private async buildAISections(
    _overallSummary: OverallSummarySection,
    _campaignPerformance: CampaignPerformanceSection | Promise<CampaignPerformanceSection>,
    _creativeFatigue: CreativeFatigueSection,
    _funnelPerformance: FunnelPerformanceSection | Promise<FunnelPerformanceSection>
  ): Promise<[PerformanceAnalysisSection, RecommendationsSection]> {
    // B6: AI 분석 1회 호출로 성과 분석 + 추천 액션 통합
    try {
      const result = await this.aiService.generateReportInsights({
        reportType: 'weekly',
        campaignSummaries: [],
        includeExtendedInsights: true,
        includeForecast: false,
        includeBenchmark: false,
      })

      return [
        {
          summary: result.summary,
          positiveFactors: [],
          negativeFactors: [],
        },
        {
          actions: (result.actionItems ?? []).map(item => ({
            priority: item.priority,
            category: item.category,
            title: item.action,
            description: item.action,
            expectedImpact: item.expectedImpact,
            deadline: item.deadline,
          })),
        },
      ]
    } catch {
      // Graceful degradation
      return [
        { summary: 'AI 분석을 사용할 수 없습니다.', positiveFactors: [], negativeFactors: [] },
        { actions: [] },
      ]
    }
  }
}
```

**주의**: 위 구현은 placeholder가 포함된 스켈레톤이다. 실제 구현 시 각 빌드 메서드의 repository 호출과 데이터 변환을 완성해야 한다. 테스트에서 mock을 사용하므로 단계적으로 완성 가능.

### 검증

```bash
npx vitest run src/application/services/__tests__/EnhancedReportDataBuilder.test.ts --pool forks
npx tsc --noEmit
```

예상 출력: ~5 tests passed

---

## Task 6: BaseReportGenerationUseCase 확장

**예상 시간:** 15분
**파일:**
- `src/application/use-cases/report/BaseReportGenerationUseCase.ts` (수정)

### Steps

- [x] **6.1** `BaseReportGenerationUseCase` 생성자에 `EnhancedReportDataBuilder` 추가

현재 생성자:
```typescript
constructor(
  protected readonly reportRepository: IReportRepository,
  protected readonly campaignRepository: ICampaignRepository,
  protected readonly kpiRepository: IKPIRepository,
  protected readonly aiService: IAIService,
  protected readonly usageLogRepository: IUsageLogRepository
) {}
```

확장:
```typescript
constructor(
  protected readonly reportRepository: IReportRepository,
  protected readonly campaignRepository: ICampaignRepository,
  protected readonly kpiRepository: IKPIRepository,
  protected readonly aiService: IAIService,
  protected readonly usageLogRepository: IUsageLogRepository,
  protected readonly enhancedReportDataBuilder?: EnhancedReportDataBuilder  // optional
) {}
```

- [x] **6.2** `execute()` 메서드에 Step 3.5 추가 (buildCampaignSections 후, markAsGenerated 전)

```typescript
async execute(dto: GenerateReportDTO): Promise<ReportDTO> {
  // ... Steps 1-3 기존 유지

  // Step 3.5: Enhanced Report Data (enrichedData) 빌드
  if (this.enhancedReportDataBuilder) {
    try {
      const previousDateRange = this.calculatePreviousDateRange(startDate, endDate)
      const enrichedData = await this.enhancedReportDataBuilder.build({
        campaignIds: dto.campaignIds,
        campaigns: campaigns.filter(Boolean).map(c => ({
          id: c!.id,
          name: c!.name,
          objective: c!.objective,
          status: c!.status,
          advantageConfig: (c as any)?.advantageConfig,
        })),
        startDate,
        endDate,
        previousStartDate: previousDateRange.start,
        previousEndDate: previousDateRange.end,
      })
      report = report.setEnrichedData(enrichedData as unknown as Record<string, unknown>)
    } catch (error) {
      // Graceful degradation: enrichedData 빌드 실패 시 기존 보고서로 fallback (B1)
      console.warn('Enhanced report data build failed, falling back to basic report:', error)
    }
  }

  // Step 4-5: 기존 유지
}
```

- [x] **6.3** 전주 날짜 범위 계산 헬퍼 추가

```typescript
private calculatePreviousDateRange(startDate: Date, endDate: Date): { start: Date; end: Date } {
  const durationMs = endDate.getTime() - startDate.getTime()
  return {
    start: new Date(startDate.getTime() - durationMs),
    end: new Date(startDate.getTime() - 1), // 전주 마지막 날
  }
}
```

- [x] **6.4** GenerateWeeklyReportUseCase 생성자 업데이트

`src/application/use-cases/report/GenerateWeeklyReportUseCase.ts`에서 super() 호출에 `enhancedReportDataBuilder` 추가:

```typescript
constructor(
  reportRepository: IReportRepository,
  campaignRepository: ICampaignRepository,
  kpiRepository: IKPIRepository,
  aiService: IAIService,
  usageLogRepository: IUsageLogRepository,
  enhancedReportDataBuilder?: EnhancedReportDataBuilder
) {
  super(reportRepository, campaignRepository, kpiRepository, aiService, usageLogRepository, enhancedReportDataBuilder)
}
```

### 테스트

- [x] **6.5** 기존 BaseReportGenerationUseCase 테스트에 enrichedData 빌드 테스트 추가

```typescript
describe('BaseReportGenerationUseCase with EnhancedReportDataBuilder', () => {
  it('should set enrichedData when builder is provided', async () => {
    // ... mock 설정
  })

  it('should gracefully degrade when builder throws (B1)', async () => {
    // builder.build가 에러를 던져도 보고서 생성은 계속됨
  })

  it('should work without builder (backward compatible)', async () => {
    // builder가 undefined일 때 기존 동작 유지
  })
})
```

### 검증

```bash
npx vitest run src/application/use-cases/report/__tests__/ --pool forks
npx tsc --noEmit
```

예상 출력: 기존 테스트 통과 + 신규 3개 통과

---

## Task 7: 샘플 데이터 확장

**예상 시간:** 15분
**파일:**
- `src/lib/sample-enhanced-report-data.ts` (신규)
- `src/app/api/reports/sample/route.ts` (수정)
- `src/app/api/reports/sample/download/route.ts` (수정)

### Steps

- [x] **7.1** `src/lib/sample-enhanced-report-data.ts` 신규 -- 9개 섹션 목업 데이터

스펙 문서 섹션 5.2의 데이터를 그대로 사용. "플로라 뷰티" 가상 데이터 기반:

```typescript
// src/lib/sample-enhanced-report-data.ts

import { ReportType } from '@domain/entities/Report'
import type { ReportDTO } from '@application/dto/report/ReportDTO'

function getSampleDateRange(): { startDate: string; endDate: string } {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - 6)
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  }
}

export function getSampleEnhancedReportDTO(): ReportDTO {
  const dateRange = getSampleDateRange()

  return {
    id: 'sample-enhanced-001',
    type: ReportType.WEEKLY,
    userId: 'sample-user-001',
    campaignIds: ['campaign-001', 'campaign-002', 'campaign-003'],
    dateRange,
    status: 'GENERATED',

    // 기존 필드 (하위 호환)
    sections: [],
    aiInsights: [],
    summaryMetrics: {
      totalImpressions: 843000,
      totalClicks: 21620,
      totalConversions: 186,
      totalSpend: 2_450_000,
      totalRevenue: 9_310_000,
      overallROAS: 3.80,
      averageCTR: 2.56,
      averageCVR: 0.86,
    },

    // 1. 전체 성과 요약
    overallSummary: {
      totalSpend: 2_450_000,
      totalRevenue: 9_310_000,
      roas: 3.80,
      ctr: 2.56,
      totalConversions: 186,
      changes: {
        spend:       { value: 5.2,  direction: 'up',   isPositive: false },
        revenue:     { value: 12.8, direction: 'up',   isPositive: true },
        roas:        { value: 7.2,  direction: 'up',   isPositive: true },
        ctr:         { value: -1.3, direction: 'down', isPositive: false },
        conversions: { value: 15.4, direction: 'up',   isPositive: true },
      },
    },

    // 2~9 섹션: 스펙 문서 섹션 5.2의 데이터를 그대로 복사
    dailyTrend: {
      days: [
        { date: '2026-03-10', spend: 340000, revenue: 1280000, roas: 3.76, impressions: 120000, clicks: 3100, conversions: 24 },
        { date: '2026-03-11', spend: 355000, revenue: 1350000, roas: 3.80, impressions: 125000, clicks: 3200, conversions: 26 },
        { date: '2026-03-12', spend: 360000, revenue: 1420000, roas: 3.94, impressions: 128000, clicks: 3350, conversions: 28 },
        { date: '2026-03-13', spend: 345000, revenue: 1310000, roas: 3.80, impressions: 122000, clicks: 3100, conversions: 25 },
        { date: '2026-03-14', spend: 350000, revenue: 1350000, roas: 3.86, impressions: 124000, clicks: 3180, conversions: 27 },
        { date: '2026-03-15', spend: 360000, revenue: 1400000, roas: 3.89, impressions: 130000, clicks: 3400, conversions: 29 },
        { date: '2026-03-16', spend: 340000, revenue: 1200000, roas: 3.53, impressions: 118000, clicks: 2950, conversions: 27 },
      ],
    },

    campaignPerformance: {
      campaigns: [
        { campaignId: 'campaign-001', name: '프리미엄 스킨케어 세트 - 전환', objective: 'CONVERSIONS', status: 'ACTIVE', impressions: 425000, clicks: 12750, conversions: 128, spend: 1250000, revenue: 6400000, roas: 5.12, ctr: 3.0 },
        { campaignId: 'campaign-002', name: '신규 고객 유치 - 브랜드 인지도', objective: 'AWARENESS', status: 'ACTIVE', impressions: 318000, clicks: 6360, conversions: 38, spend: 750000, revenue: 1710000, roas: 2.28, ctr: 2.0 },
        { campaignId: 'campaign-003', name: '리타겟팅 - 장바구니 이탈', objective: 'CONVERSIONS', status: 'ACTIVE', impressions: 100000, clicks: 2510, conversions: 20, spend: 450000, revenue: 1200000, roas: 2.67, ctr: 2.51 },
      ],
    },

    creativePerformance: {
      topN: 5,
      creatives: [
        { creativeId: 'cr-001', name: '봄 신상 세트 A', format: 'SINGLE_IMAGE', impressions: 180000, clicks: 5400, conversions: 62, spend: 520000, revenue: 3100000, roas: 5.96, ctr: 3.0 },
        { creativeId: 'cr-002', name: '모델 착용 영상 B', format: 'SINGLE_VIDEO', impressions: 150000, clicks: 4500, conversions: 45, spend: 420000, revenue: 2250000, roas: 5.36, ctr: 3.0 },
        { creativeId: 'cr-003', name: '베스트셀러 카루셀', format: 'CAROUSEL', impressions: 95000, clicks: 2850, conversions: 21, spend: 310000, revenue: 1050000, roas: 3.39, ctr: 3.0 },
        { creativeId: 'cr-004', name: '리뷰 영상 C', format: 'SINGLE_VIDEO', impressions: 100000, clicks: 2000, conversions: 18, spend: 250000, revenue: 900000, roas: 3.60, ctr: 2.0 },
        { creativeId: 'cr-005', name: '할인 배너 D', format: 'SINGLE_IMAGE', impressions: 120000, clicks: 2400, conversions: 15, spend: 300000, revenue: 750000, roas: 2.50, ctr: 2.0 },
      ],
    },

    creativeFatigue: {
      creatives: [
        { creativeId: 'cr-005', name: '할인 배너 D', format: 'SINGLE_IMAGE', frequency: 4.2, ctr: 1.8, ctrTrend: [2.8, 2.5, 2.3, 2.1, 2.0, 1.9, 1.8], fatigueScore: 78, fatigueLevel: 'critical', activeDays: 21, recommendation: 'CTR이 7일간 36% 하락. 즉시 소재 교체 권장.' },
        { creativeId: 'cr-004', name: '리뷰 영상 C', format: 'SINGLE_VIDEO', frequency: 3.1, ctr: 2.0, ctrTrend: [2.4, 2.3, 2.2, 2.1, 2.1, 2.0, 2.0], fatigueScore: 52, fatigueLevel: 'warning', activeDays: 14, recommendation: 'Frequency 3.1 도달. 1주 내 교체 검토 필요.' },
        { creativeId: 'cr-001', name: '봄 신상 세트 A', format: 'SINGLE_IMAGE', frequency: 1.8, ctr: 3.0, ctrTrend: [2.9, 2.9, 3.0, 3.0, 3.1, 3.0, 3.0], fatigueScore: 15, fatigueLevel: 'healthy', activeDays: 7, recommendation: '양호. 현재 소재 유지.' },
      ],
    },

    formatComparison: {
      formats: [
        { format: 'SINGLE_IMAGE', formatLabel: '이미지', adCount: 5, impressions: 300000, clicks: 7800, conversions: 77, spend: 820000, revenue: 3850000, roas: 4.70, ctr: 2.6, avgFrequency: 2.5 },
        { format: 'SINGLE_VIDEO', formatLabel: '동영상', adCount: 3, impressions: 250000, clicks: 6500, conversions: 63, spend: 670000, revenue: 3150000, roas: 4.70, ctr: 2.6, avgFrequency: 2.2, videoViews: 180000, thruPlayRate: 28.5 },
        { format: 'CAROUSEL', formatLabel: '카루셀', adCount: 2, impressions: 95000, clicks: 2850, conversions: 21, spend: 310000, revenue: 1050000, roas: 3.39, ctr: 3.0, avgFrequency: 1.9 },
      ],
    },

    funnelPerformance: {
      stages: [
        { stage: 'tofu', stageLabel: '인지 (ToFu)', campaignCount: 1, spend: 750000, budgetRatio: 30.6, impressions: 318000, clicks: 6360, conversions: 38, revenue: 1710000, roas: 2.28, ctr: 2.0 },
        { stage: 'mofu', stageLabel: '고려 (MoFu)', campaignCount: 0, spend: 0, budgetRatio: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0, roas: 0, ctr: 0 },
        { stage: 'bofu', stageLabel: '전환 (BoFu)', campaignCount: 2, spend: 1700000, budgetRatio: 69.4, impressions: 525000, clicks: 15260, conversions: 148, revenue: 7600000, roas: 4.47, ctr: 2.91 },
      ],
      totalBudget: 2450000,
    },

    performanceAnalysis: {
      summary: '이번 주 전체 ROAS 3.80x로 전주(3.55x) 대비 7.2% 상승했습니다. 프리미엄 스킨케어 세트 캠페인이 5.12x ROAS로 전체 수익의 68.7%를 견인했으며, 봄 시즌 수요 증가와 25-34세 여성 타겟의 높은 전환율이 주요 성공 요인입니다.',
      positiveFactors: [
        { title: '시즌 수요 증가', description: '봄 시즌 진입으로 스킨케어 카테고리 검색량 22% 증가. 적시에 프로모션을 배치한 것이 효과적이었습니다.', impact: 'high' },
        { title: '소재 최적화 효과', description: '"봄 신상 세트 A" 소재가 CTR 3.0%로 계정 평균 대비 17% 높은 성과를 기록했습니다.', relatedCreatives: ['cr-001'], impact: 'medium' },
      ],
      negativeFactors: [
        { title: '리타겟팅 효율 저하', description: 'CPC가 전주 대비 15% 상승하여 리타겟팅 캠페인의 ROAS가 2.67x로 목표(3.0x) 미달.', relatedCampaigns: ['campaign-003'], impact: 'high' },
        { title: '소재 피로도 증가', description: '"할인 배너 D" 소재의 CTR이 7일간 36% 하락. Frequency 4.2로 소재 수명 초과.', relatedCreatives: ['cr-005'], impact: 'medium' },
      ],
    },

    recommendations: {
      actions: [
        { priority: 'high', category: 'creative', title: '할인 배너 D 소재 교체', description: 'Frequency 4.2, CTR 36% 하락. 새로운 프로모션 소재로 즉시 교체하세요.', expectedImpact: 'CTR 1.5~2.0% 회복, 전환 10~15건/주 증가 예상' },
        { priority: 'high', category: 'budget', title: '프리미엄 스킨케어 캠페인 예산 증액', description: 'ROAS 5.12x로 우수한 성과. 일 예산 20% 증액 권장.', expectedImpact: '주당 매출 약 1,280,000원 추가 예상' },
        { priority: 'medium', category: 'funnel', title: 'MoFu 캠페인 신설', description: '현재 MoFu 단계 캠페인 부재. 인지 -> 전환 사이 고려 단계 캠페인으로 전환율 개선 가능.', expectedImpact: '전체 퍼널 전환율 15~20% 개선 예상' },
        { priority: 'medium', category: 'targeting', title: '리타겟팅 타겟 세분화', description: '장바구니 이탈 고객 중 최근 7일 이탈자와 30일 이탈자를 분리하여 메시지 차별화.', expectedImpact: 'CPC 10~15% 절감, 전환율 0.3%p 개선 예상' },
        { priority: 'low', category: 'creative', title: '동영상 소재 비중 확대', description: '동영상 포맷이 이미지 대비 동일 ROAS이나, 완전 재생율(thruPlayRate) 28.5%로 브랜드 인지 효과 우수.', expectedImpact: '장기적 브랜드 인지도 향상, 리타겟팅 풀 확대' },
      ],
    },

    generatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
```

- [x] **7.2** `src/app/api/reports/sample/route.ts` 수정 -- enhanced 샘플 데이터 옵션 추가

```typescript
import { NextResponse } from 'next/server'
import { getSampleReportDTO } from '@/lib/sample-report-data'
import { getSampleEnhancedReportDTO } from '@/lib/sample-enhanced-report-data'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const enhanced = searchParams.get('enhanced') === 'true'

    const sampleReport = enhanced
      ? getSampleEnhancedReportDTO()
      : getSampleReportDTO()

    return NextResponse.json({
      success: true,
      data: sampleReport,
    })
  } catch (error) {
    console.error('Sample report API error:', error)
    return NextResponse.json(
      { success: false, error: '예시 보고서 생성에 실패했습니다' },
      { status: 500 }
    )
  }
}
```

- [x] **7.3** `src/app/api/reports/sample/download/route.ts` 수정 -- enhanced PDF 분기

```typescript
import { NextResponse } from 'next/server'
import { ReportPDFGenerator } from '@/infrastructure/pdf/ReportPDFGenerator'
import { getSampleReportDTO } from '@/lib/sample-report-data'
import { getSampleEnhancedReportDTO } from '@/lib/sample-enhanced-report-data'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const enhanced = searchParams.get('enhanced') === 'true'

    const sampleReport = enhanced
      ? getSampleEnhancedReportDTO()
      : getSampleReportDTO()

    const generator = new ReportPDFGenerator()
    const result = await generator.generateWeeklyReport(sampleReport)
    const uint8Array = new Uint8Array(result.buffer)

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(result.filename)}"`,
        'Content-Length': result.buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Sample PDF generation error:', error)
    return NextResponse.json(
      { success: false, error: 'PDF 생성에 실패했습니다', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
```

### 검증

```bash
npx tsc --noEmit
```

예상 출력: 0 errors

---

## Task 8: PDF 컴포넌트 신규 생성 (6개)

**예상 시간:** 60분
**파일:**
- `src/infrastructure/pdf/components/SummaryCard.tsx` (신규)
- `src/infrastructure/pdf/components/LineChart.tsx` (신규)
- `src/infrastructure/pdf/components/FatigueMatrix.tsx` (신규)
- `src/infrastructure/pdf/components/FunnelChart.tsx` (신규)
- `src/infrastructure/pdf/components/FormatComparisonChart.tsx` (신규)
- `src/infrastructure/pdf/components/PriorityActionCard.tsx` (신규)

### 디자인 규칙

모든 컴포넌트에서 사용할 공통 헬퍼:

```typescript
// formatCurrency 수정 (B2)
function formatCurrency(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.round(num)) + '원'
}

// 변화율 색상 코딩 (B7)
function getChangeColor(change: ChangeRate): string {
  if (change.direction === 'flat') return '#64748b'   // 회색
  if (change.isPositive) return '#16a34a'              // 초록
  return '#dc2626'                                      // 빨강
}

function formatChange(change: ChangeRate): string {
  const arrow = change.direction === 'up' ? '+' : change.direction === 'down' ? '' : ''
  return `${arrow}${change.value.toFixed(1)}%`
}
```

### Steps

- [x] **8.1** `SummaryCard.tsx` -- 변화율 포함 KPI 카드

```typescript
// src/infrastructure/pdf/components/SummaryCard.tsx
// Props: label, value, change (ChangeRate)
// 디자인: MetricCard와 동일 레이아웃 + 변화율 색상 코딩
// - value: 큰 글씨 (18pt)
// - change: 작은 글씨 (10pt), 초록/빨강 색상
// - 화살표: direction에 따라 +/-
```

- [x] **8.2** `LineChart.tsx` -- 일별 추이 라인 차트

```typescript
// src/infrastructure/pdf/components/LineChart.tsx
// Props: data (DailyDataPoint[]), metrics (표시할 지표 목록)
// 디자인: react-pdf의 Svg 기반 라인 차트
// - X축: 날짜 (7일)
// - Y축: 값 (자동 스케일)
// - 라인: 각 지표별 색상
// - 포인트: 각 데이터 포인트에 원형 마커
// - 범례: 차트 하단에 지표명 + 색상
```

- [x] **8.3** `FatigueMatrix.tsx` -- 소재 피로도 매트릭스

```typescript
// src/infrastructure/pdf/components/FatigueMatrix.tsx
// Props: creatives (CreativeFatigueItem[])
// 디자인: 리스트 형태의 소재별 피로도 표시
// - 각 소재: 이름, 피로도 점수 바, 레벨 색상 (초록/노랑/빨강)
// - 피로도 바: 0-100 스케일, 색상으로 구간 표시
// - CTR 추이: 7일치 미니 차트 (Svg 기반)
// - 교체 권고: 피로도 레벨에 따른 메시지
// 색상: healthy=#16a34a, warning=#ca8a04, critical=#dc2626
```

- [x] **8.4** `FunnelChart.tsx` -- ToFu/MoFu/BoFu 퍼널 도식

```typescript
// src/infrastructure/pdf/components/FunnelChart.tsx
// Props: stages (FunnelStageItem[]), totalBudget
// 디자인: 퍼널 형태 (위에서 아래로 좁아지는 도형)
// - 각 단계: 배경색 + 라벨 + KPI (spend, conversions, ROAS)
// - 예산 비율: 각 단계의 budgetRatio% 표시
// - ToFu 색상: #dbeafe (연한 파랑)
// - MoFu 색상: #fef3c7 (연한 노랑)
// - BoFu 색상: #dcfce7 (연한 초록)
// - auto 색상: #f3e8ff (연한 보라)
```

- [x] **8.5** `FormatComparisonChart.tsx` -- 포맷별 성과 비교 차트

```typescript
// src/infrastructure/pdf/components/FormatComparisonChart.tsx
// Props: formats (FormatPerformanceItem[])
// 디자인: 기존 BarChart 컴포넌트 패턴 활용
// - 포맷별 ROAS / CTR 가로 막대 차트
// - 동영상 포맷에 thruPlayRate 추가 표시
// - 각 포맷의 adCount 표시
```

- [x] **8.6** `PriorityActionCard.tsx` -- 우선순위별 액션 카드

```typescript
// src/infrastructure/pdf/components/PriorityActionCard.tsx
// Props: action (RecommendedAction)
// 디자인: 기존 ActionItemCard 패턴 활용
// - 우선순위 뱃지: high=#dc2626, medium=#ca8a04, low=#3b82f6
// - 카테고리 아이콘 (텍스트): [예산] [소재] [타겟팅] [퍼널] [일반]
// - title: 굵은 글씨 12pt
// - description: 일반 글씨 10pt
// - expectedImpact: 파란색 글씨 9pt
```

### 검증

```bash
npx tsc --noEmit
```

예상 출력: 0 errors (컴포넌트가 올바르게 타이핑되어야 함)

---

## Task 9: EnhancedWeeklyReportTemplate -- 9페이지 PDF 템플릿

**예상 시간:** 45분
**파일:**
- `src/infrastructure/pdf/templates/EnhancedWeeklyReportTemplate.tsx` (신규)

### Steps

- [x] **9.1** 템플릿 생성 -- 9페이지 구성

```typescript
// src/infrastructure/pdf/templates/EnhancedWeeklyReportTemplate.tsx

import React from 'react'
import { Document, Page, Text, View } from '@react-pdf/renderer'
import type { ReportDTO } from '@application/dto/report/ReportDTO'
import { BaseDocument, BasePage, baseStyles, formatDate } from './BaseReportTemplate'
import { SummaryCard } from '../components/SummaryCard'
import { LineChart } from '../components/LineChart'
import { FatigueMatrix } from '../components/FatigueMatrix'
import { FunnelChart } from '../components/FunnelChart'
import { FormatComparisonChart } from '../components/FormatComparisonChart'
import { PriorityActionCard } from '../components/PriorityActionCard'
import { BarChart } from '../components/BarChart'

interface EnhancedWeeklyReportTemplateProps {
  report: ReportDTO
}

function formatCurrency(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.round(num)) + '원'
}

export function EnhancedWeeklyReportTemplate({ report }: EnhancedWeeklyReportTemplateProps) {
  const {
    overallSummary,
    dailyTrend,
    campaignPerformance,
    creativePerformance,
    creativeFatigue,
    formatComparison,
    funnelPerformance,
    performanceAnalysis,
    recommendations,
    dateRange,
  } = report

  return (
    <Document>
      {/* Page 1: 표지 + 전체 성과 요약 */}
      <BasePage pageNumber={1}>
        <View style={baseStyles.header}>
          <Text style={baseStyles.title}>주간 마케팅 리포트</Text>
          <Text style={baseStyles.subtitle}>바투 AI 마케팅 솔루션</Text>
          <Text style={baseStyles.dateRange}>
            {formatDate(dateRange.startDate)} ~ {formatDate(dateRange.endDate)}
          </Text>
        </View>
        {overallSummary && (
          <View>
            <Text style={baseStyles.sectionTitle}>전체 성과 요약</Text>
            {/* SummaryCard x 5개: spend, revenue, roas, ctr, conversions */}
            {/* 각 카드에 변화율 색상 코딩 */}
          </View>
        )}
      </BasePage>

      {/* Page 2: 성과 추이 */}
      {dailyTrend && dailyTrend.days.length > 0 && (
        <BasePage pageNumber={2}>
          <Text style={baseStyles.sectionTitle}>성과 추이 (일별)</Text>
          {/* LineChart: spend + revenue + roas */}
          {/* 테이블: 일별 수치 */}
        </BasePage>
      )}

      {/* Page 3: 캠페인별 성과 */}
      {campaignPerformance && campaignPerformance.campaigns.length > 0 && (
        <BasePage pageNumber={3}>
          <Text style={baseStyles.sectionTitle}>캠페인별 성과</Text>
          {/* 테이블: 캠페인 x 지표 매트릭스 */}
          {/* BarChart: ROAS 비교 */}
        </BasePage>
      )}

      {/* Page 4: 소재별 성과 TOP N */}
      {creativePerformance && creativePerformance.creatives.length > 0 && (
        <BasePage pageNumber={4}>
          <Text style={baseStyles.sectionTitle}>
            소재별 성과 TOP {creativePerformance.topN}
          </Text>
          {/* 테이블: 소재 이름, 포맷, 노출, 클릭, 전환, ROAS, CTR */}
        </BasePage>
      )}

      {/* Page 5: 소재 피로도 지수 */}
      {creativeFatigue && creativeFatigue.creatives.length > 0 && (
        <BasePage pageNumber={5}>
          <Text style={baseStyles.sectionTitle}>소재 피로도 지수</Text>
          {/* FatigueMatrix */}
        </BasePage>
      )}

      {/* Page 6: 소재 포맷별 성과 */}
      {formatComparison && formatComparison.formats.length > 0 && (
        <BasePage pageNumber={6}>
          <Text style={baseStyles.sectionTitle}>소재 포맷별 성과</Text>
          {/* FormatComparisonChart */}
        </BasePage>
      )}

      {/* Page 7: 퍼널 단계별 성과 */}
      {funnelPerformance && funnelPerformance.stages.length > 0 && (
        <BasePage pageNumber={7}>
          <Text style={baseStyles.sectionTitle}>퍼널 단계별 성과</Text>
          {/* FunnelChart */}
        </BasePage>
      )}

      {/* Page 8: 성과 분석 */}
      {performanceAnalysis && (
        <BasePage pageNumber={8}>
          <Text style={baseStyles.sectionTitle}>성과 분석</Text>
          {/* summary 텍스트 */}
          {/* 잘된 이유 (초록 배경) */}
          {/* 안된 이유 (빨강 배경) */}
        </BasePage>
      )}

      {/* Page 9: 추천 액션 */}
      {recommendations && recommendations.actions.length > 0 && (
        <BasePage pageNumber={9}>
          <Text style={baseStyles.sectionTitle}>추천 액션</Text>
          {/* PriorityActionCard x N */}
        </BasePage>
      )}
    </Document>
  )
}
```

**참고**: 위는 골격. 각 페이지의 상세 렌더링은 Task 8의 컴포넌트를 사용하여 완성한다.

- [x] **9.2** 기존 `formatCurrency` 수정 (B2) -- `WeeklyReportTemplate.tsx`와 `BaseReportTemplate.tsx`

두 파일 모두 `formatCurrency`를 수정:

```typescript
// AS-IS
function formatCurrency(num: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency', currency: 'KRW', maximumFractionDigits: 0,
  }).format(num)
}

// TO-BE
function formatCurrency(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.round(num)) + '원'
}
```

수정 대상:
- `src/infrastructure/pdf/templates/WeeklyReportTemplate.tsx` (315~321행)
- `src/infrastructure/pdf/templates/BaseReportTemplate.tsx` (114~120행)

### 검증

```bash
npx tsc --noEmit
```

예상 출력: 0 errors

---

## Task 10: ReportPDFGenerator 템플릿 분기

**예상 시간:** 5분
**파일:**
- `src/infrastructure/pdf/ReportPDFGenerator.ts` (수정)

### Steps

- [x] **10.1** `ReportPDFGenerator.generateWeeklyReport` 수정 -- enrichedData 기반 템플릿 분기 (B1)

```typescript
// src/infrastructure/pdf/ReportPDFGenerator.ts

import { EnhancedWeeklyReportTemplate } from './templates/EnhancedWeeklyReportTemplate'
// ... 기존 import 유지

export class ReportPDFGenerator implements IReportPDFGenerator {
  async generateWeeklyReport(report: ReportDTO): Promise<PDFGeneratorResult> {
    // B1: enrichedData(overallSummary) 유무로 템플릿 분기
    const Template = report.overallSummary
      ? EnhancedWeeklyReportTemplate
      : WeeklyReportTemplate

    const document = React.createElement(Template, { report }) as any
    const buffer = await renderToBuffer(document)

    // ... 파일명 생성 기존 로직 유지
    const startDate = new Date(report.dateRange.startDate)
    const endDate = new Date(report.dateRange.endDate)
    const formatDate = (date: Date) => date.toISOString().split('T')[0].replace(/-/g, '')
    const filename = `바투_주간리포트_${formatDate(startDate)}_${formatDate(endDate)}.pdf`

    return {
      buffer: Buffer.from(buffer),
      filename,
      contentType: 'application/pdf',
    }
  }
}
```

### 검증

```bash
npx tsc --noEmit
```

---

## Task 11: DI 등록 -- Phase 2 서비스

**예상 시간:** 10분
**파일:**
- `src/lib/di/types.ts` (수정)
- `src/lib/di/modules/report.module.ts` (수정)

### Steps

- [x] **11.1** `src/lib/di/types.ts`에 Phase 2 DI 토큰 추가

```typescript
export const DI_TOKENS = {
  // ... 기존 토큰 유지

  // Enhanced Report (Phase 2)
  EnhancedReportDataBuilder: Symbol.for('EnhancedReportDataBuilder'),
  CreativeFatigueService: Symbol.for('CreativeFatigueService'),
  FunnelClassificationService: Symbol.for('FunnelClassificationService'),
} as const
```

- [x] **11.2** `src/lib/di/modules/report.module.ts` 확장

```typescript
import { EnhancedReportDataBuilder } from '@application/services/EnhancedReportDataBuilder'
import { CreativeFatigueService } from '@application/services/CreativeFatigueService'
import { FunnelClassificationService } from '@application/services/FunnelClassificationService'

export function registerReportModule(container: Container): void {
  // --- 기존 등록 유지 ---

  // ... (기존 ReportRepository, ReportScheduleRepository, GenerateWeeklyReportUseCase, SendScheduledReportsUseCase)

  // --- Phase 2: Enhanced Report ---
  container.registerSingleton(
    DI_TOKENS.CreativeFatigueService,
    () => new CreativeFatigueService()
  )

  container.registerSingleton(
    DI_TOKENS.FunnelClassificationService,
    () => new FunnelClassificationService()
  )

  container.register(
    DI_TOKENS.EnhancedReportDataBuilder,
    () => new EnhancedReportDataBuilder(
      container.resolve(DI_TOKENS.KPIRepository),
      container.resolve(DI_TOKENS.AdKPIRepository),
      container.resolve(DI_TOKENS.CampaignRepository),
      container.resolve(DI_TOKENS.CreativeRepository),
      container.resolve(DI_TOKENS.CreativeFatigueService),
      container.resolve(DI_TOKENS.FunnelClassificationService),
      container.resolve(DI_TOKENS.AIService)
    )
  )

  // --- GenerateWeeklyReportUseCase 수정 (builder 주입) ---
  // 기존 등록을 교체:
  container.register(
    DI_TOKENS.GenerateWeeklyReportUseCase,
    () =>
      new GenerateWeeklyReportUseCase(
        container.resolve(DI_TOKENS.ReportRepository),
        container.resolve(DI_TOKENS.CampaignRepository),
        container.resolve(DI_TOKENS.KPIRepository),
        container.resolve(DI_TOKENS.AIService),
        container.resolve(DI_TOKENS.UsageLogRepository),
        container.resolve(DI_TOKENS.EnhancedReportDataBuilder)  // 추가
      )
  )
}
```

### 검증

```bash
npx tsc --noEmit
```

---

## Task 12: 테스트 -- PDF 렌더링 + 통합

**예상 시간:** 30분
**파일:**
- `src/infrastructure/pdf/templates/__tests__/EnhancedWeeklyReportTemplate.test.tsx` (신규)
- `src/infrastructure/pdf/__tests__/ReportPDFGenerator.test.ts` (수정)
- `src/app/api/reports/sample/__tests__/route.test.ts` (수정 또는 신규)

### Steps

- [x] **12.1** EnhancedWeeklyReportTemplate 렌더링 테스트

```typescript
// src/infrastructure/pdf/templates/__tests__/EnhancedWeeklyReportTemplate.test.tsx

import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { EnhancedWeeklyReportTemplate } from '../EnhancedWeeklyReportTemplate'
import { getSampleEnhancedReportDTO } from '@/lib/sample-enhanced-report-data'

describe('EnhancedWeeklyReportTemplate', () => {
  it('should render without errors for full enhanced report', async () => {
    const report = getSampleEnhancedReportDTO()
    const element = React.createElement(EnhancedWeeklyReportTemplate, { report })
    const buffer = await renderToBuffer(element as any)
    expect(buffer.length).toBeGreaterThan(0)
  })

  it('should produce PDF smaller than 5MB', async () => {
    const report = getSampleEnhancedReportDTO()
    const element = React.createElement(EnhancedWeeklyReportTemplate, { report })
    const buffer = await renderToBuffer(element as any)
    expect(buffer.length).toBeLessThan(5 * 1024 * 1024)
  })

  it('should handle empty sections gracefully', async () => {
    const report = getSampleEnhancedReportDTO()
    report.creativeFatigue = { creatives: [] }
    report.funnelPerformance = { stages: [], totalBudget: 0 }
    report.recommendations = { actions: [] }

    const element = React.createElement(EnhancedWeeklyReportTemplate, { report })
    const buffer = await renderToBuffer(element as any)
    expect(buffer.length).toBeGreaterThan(0)
  })
})
```

- [x] **12.2** ReportPDFGenerator 분기 테스트

```typescript
describe('ReportPDFGenerator template selection', () => {
  it('should use EnhancedWeeklyReportTemplate when overallSummary exists (B1)', async () => {
    const report = getSampleEnhancedReportDTO()
    const generator = new ReportPDFGenerator()
    const result = await generator.generateWeeklyReport(report)
    expect(result.buffer.length).toBeGreaterThan(0)
    expect(result.filename).toContain('바투_주간리포트_')
  })

  it('should use WeeklyReportTemplate when overallSummary is absent (B1 fallback)', async () => {
    const report = getSampleReportDTO() // 기존 샘플 (overallSummary 없음)
    const generator = new ReportPDFGenerator()
    const result = await generator.generateWeeklyReport(report)
    expect(result.buffer.length).toBeGreaterThan(0)
  })
})
```

- [x] **12.3** 샘플 API 라우트 테스트

```typescript
describe('GET /api/reports/sample', () => {
  it('should return enhanced report when enhanced=true', async () => {
    // request with ?enhanced=true
    // response.data should have overallSummary
  })

  it('should return legacy report without enhanced param', async () => {
    // response.data should NOT have overallSummary
  })
})

describe('GET /api/reports/sample/download', () => {
  it('should return PDF for enhanced report', async () => {
    // request with ?enhanced=true
    // Content-Type: application/pdf
  })
})
```

- [x] **12.4** formatCurrency 테스트

```typescript
describe('formatCurrency (B2)', () => {
  it('should format with 원 suffix instead of ₩', () => {
    expect(formatCurrency(2450000)).toBe('2,450,000원')
  })

  it('should handle 0', () => {
    expect(formatCurrency(0)).toBe('0원')
  })

  it('should handle negative numbers', () => {
    expect(formatCurrency(-100000)).toBe('-100,000원')
  })

  it('should round decimal values', () => {
    expect(formatCurrency(1234.56)).toBe('1,235원')
  })
})
```

### 검증

```bash
npx vitest run --pool forks
npx tsc --noEmit
```

예상 출력: 전체 테스트 통과 (기존 ~2,770 + 신규 ~60 = ~2,830)

---

## Task 13: 전체 검증 + 디버그 코드 정리

**예상 시간:** 10분

### Steps

- [x] **13.1** 타입 체크

```bash
npx tsc --noEmit
```

예상 출력: 0 errors

- [x] **13.2** 전체 테스트

```bash
npx vitest run --pool forks
```

예상 출력: ~2,830 tests passed, 0 failed

- [x] **13.3** 린트

```bash
npm run lint
```

예상 출력: 0 errors

- [x] **13.4** 디버그 코드 확인

```bash
grep -rn "console.log\|debugger\|TODO\|HACK" \
  src/application/services/CreativeFatigueService.ts \
  src/application/services/FunnelClassificationService.ts \
  src/application/services/EnhancedReportDataBuilder.ts \
  src/application/dto/report/EnhancedReportSections.ts \
  src/infrastructure/pdf/templates/EnhancedWeeklyReportTemplate.tsx \
  src/infrastructure/pdf/components/SummaryCard.tsx \
  src/infrastructure/pdf/components/LineChart.tsx \
  src/infrastructure/pdf/components/FatigueMatrix.tsx \
  src/infrastructure/pdf/components/FunnelChart.tsx \
  src/infrastructure/pdf/components/FormatComparisonChart.tsx \
  src/infrastructure/pdf/components/PriorityActionCard.tsx \
  src/lib/sample-enhanced-report-data.ts \
  src/domain/value-objects/FunnelStage.ts
```

예상 출력: 매칭 없음 (console.warn은 의도적인 graceful degradation이므로 허용)

- [x] **13.5** 빌드 확인

```bash
npx next build
```

예상 출력: Build successful

- [x] **13.6** 샘플 PDF E2E 확인

```bash
# 개발 서버 실행 후
curl -o /tmp/enhanced-report.pdf "http://localhost:3000/api/reports/sample/download?enhanced=true"
ls -la /tmp/enhanced-report.pdf
# 파일 크기가 100KB 이상이면 성공
```

---

## 파일 목록 요약

### 신규 파일 (13개)

| 파일 | 역할 | Task |
|------|------|------|
| `src/application/dto/report/EnhancedReportSections.ts` | 9개 섹션 타입 정의 | 1 |
| `src/domain/value-objects/FunnelStage.ts` | 퍼널 매핑 + 라벨 | 4 |
| `src/application/services/CreativeFatigueService.ts` | 소재 피로도 계산 | 3 |
| `src/application/services/FunnelClassificationService.ts` | 퍼널 분류 서비스 | 4 |
| `src/application/services/EnhancedReportDataBuilder.ts` | 9개 섹션 데이터 빌더 | 5 |
| `src/infrastructure/pdf/components/SummaryCard.tsx` | 변화율 KPI 카드 | 8 |
| `src/infrastructure/pdf/components/LineChart.tsx` | 일별 추이 차트 | 8 |
| `src/infrastructure/pdf/components/FatigueMatrix.tsx` | 피로도 매트릭스 | 8 |
| `src/infrastructure/pdf/components/FunnelChart.tsx` | 퍼널 도식 | 8 |
| `src/infrastructure/pdf/components/FormatComparisonChart.tsx` | 포맷 비교 차트 | 8 |
| `src/infrastructure/pdf/components/PriorityActionCard.tsx` | 우선순위 액션 카드 | 8 |
| `src/infrastructure/pdf/templates/EnhancedWeeklyReportTemplate.tsx` | 9페이지 PDF 템플릿 | 9 |
| `src/lib/sample-enhanced-report-data.ts` | 9개 섹션 샘플 데이터 | 7 |

### 수정 파일 (8개)

| 파일 | 변경 | Task |
|------|------|------|
| `prisma/schema.prisma` | Report.enrichedData Json? 추가 | 2 |
| `src/domain/entities/Report.ts` | enrichedData 속성 (8~10곳) | 2 |
| `src/application/dto/report/ReportDTO.ts` | 9개 섹션 optional 필드 + toReportDTO 분기 | 1 |
| `src/application/use-cases/report/BaseReportGenerationUseCase.ts` | EnhancedReportDataBuilder 호출 추가 | 6 |
| `src/infrastructure/pdf/ReportPDFGenerator.ts` | 템플릿 분기 로직 | 10 |
| `src/infrastructure/pdf/templates/WeeklyReportTemplate.tsx` | formatCurrency "원" 수정 | 9 |
| `src/lib/di/types.ts` | DI 토큰 3개 추가 | 11 |
| `src/lib/di/modules/report.module.ts` | Phase 2 서비스 DI 등록 | 11 |

### 수정 API 라우트 (2개)

| 파일 | 변경 | Task |
|------|------|------|
| `src/app/api/reports/sample/route.ts` | enhanced 쿼리 파라미터 분기 | 7 |
| `src/app/api/reports/sample/download/route.ts` | enhanced PDF 분기 | 7 |

### 테스트 파일 (신규 ~7개)

| 파일 | 예상 테스트 수 | Task |
|------|-------------|------|
| `src/application/dto/report/__tests__/EnhancedReportSections.test.ts` | ~5 | 1 |
| `src/domain/entities/__tests__/Report.test.ts` (추가분) | ~4 | 2 |
| `src/application/services/__tests__/CreativeFatigueService.test.ts` | ~15 | 3 |
| `src/application/services/__tests__/FunnelClassificationService.test.ts` | ~12 | 4 |
| `src/application/services/__tests__/EnhancedReportDataBuilder.test.ts` | ~5 | 5 |
| `src/infrastructure/pdf/templates/__tests__/EnhancedWeeklyReportTemplate.test.tsx` | ~3 | 12 |
| `src/infrastructure/pdf/__tests__/ReportPDFGenerator.test.ts` (추가분) | ~2 | 12 |
| formatCurrency 테스트 | ~4 | 12 |
| API 라우트 테스트 | ~3 | 12 |
| **합계** | **~53** | |

---

## 구현 순서 (의존성 기반)

```
Task 1 (DTO 타입)  ────────────────────────────────────────┐
Task 2 (Report 엔티티)  ──────────────────────────────────┤
                                                            ├── Task 5 (DataBuilder)
Task 3 (CreativeFatigueService) ──────────────────────────┤
Task 4 (FunnelClassificationService + FunnelStage) ───────┘
                                                            ├── Task 6 (UseCase 확장)
Task 7 (샘플 데이터) ── Task 1에 의존                        ├── Task 11 (DI 등록)
Task 8 (PDF 컴포넌트 6개) ── Task 1에 의존                   │
Task 9 (EnhancedTemplate) ── Task 8에 의존  ────────────────┤
Task 10 (PDFGenerator 분기) ── Task 9에 의존 ───────────────┘
Task 12 (테스트) ── 모든 Task에 의존
Task 13 (전체 검증) ── Task 12에 의존
```

**병렬 가능 그룹**:
- Group A: Task 1, 2, 3, 4 (동시 착수 가능)
- Group B: Task 5, 7, 8 (Group A 완료 후)
- Group C: Task 6, 9, 10, 11 (Group B 완료 후)
- Group D: Task 12, 13 (모든 Task 완료 후)

---

## 장기 시뮬레이션 요약

| 항목 | 현재 | Phase 2 후 | 리스크 |
|------|------|-----------|--------|
| PDF 페이지 수 | 3 | 9 | 낮음 (12초 이내) |
| PDF 크기 | ~200KB | ~800KB-1.5MB | 낮음 (5MB 미만) |
| 보고서 생성 시간 | 3-5초 | 7-12초 | 중간 (Pro Plan 필수) |
| AI API 호출 | 1회/보고서 | 1회/보고서 (통합) | 낮음 (월 40 USD) |
| 하위 호환 | - | enrichedData null fallback | 낮음 |
| 소재 피로도 오탐 | - | 브랜딩 캠페인 보정 | 낮음 |
| 퍼널 분류 예외 | - | Advantage+ auto 처리 | 낮음 |
| DB 데이터 볼륨 | 3,650행/년 | +54,750행/년 | 낮음 (인덱스 커버) |
| Prisma 마이그레이션 | - | 다운타임 0 | 낮음 |

---

## 예상 작업량

| Task | 내용 | 예상 시간 |
|------|------|----------|
| 1 | DTO 타입 정의 | 15분 |
| 2 | Report 엔티티 확장 | 15분 |
| 3 | CreativeFatigueService | 20분 |
| 4 | FunnelClassificationService | 15분 |
| 5 | EnhancedReportDataBuilder | 40분 |
| 6 | BaseReportGenerationUseCase 확장 | 15분 |
| 7 | 샘플 데이터 확장 | 15분 |
| 8 | PDF 컴포넌트 6개 | 60분 |
| 9 | EnhancedWeeklyReportTemplate | 45분 |
| 10 | ReportPDFGenerator 분기 | 5분 |
| 11 | DI 등록 | 10분 |
| 12 | 테스트 | 30분 |
| 13 | 전체 검증 | 10분 |
| **합계** | | **~295분 (~5시간)** |
