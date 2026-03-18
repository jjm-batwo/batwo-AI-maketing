# 보고서 대폭 개선 -- 디자인 문서

> **결정일**: 2026-03-17
> **Phase**: 2단계 (Phase 1: Ad KPI 인프라 / Phase 2: 9섹션 보고서)
> **핵심 목표**: 부실한 KPI 나열 보고서 -> 커머스 사업자를 위한 전문 마케팅 리포트

---

## 목차

1. [Phase 1: AdKPISnapshot 데이터 모델](#1-phase-1-adkpisnapshot-데이터-모델)
2. [Meta API 연동 (Ad 레벨 인사이트 동기화)](#2-meta-api-연동)
3. [Phase 2: ReportDTO 확장 (9개 섹션)](#3-reportdto-확장)
4. [PDF 템플릿 변경 범위](#4-pdf-템플릿-변경-범위)
5. [샘플 데이터 확장](#5-샘플-데이터-확장)
6. [퍼널 분류 로직](#6-퍼널-분류-로직)
7. [소재 피로도 계산](#7-소재-피로도-계산)
8. [DI 등록](#8-di-등록)
9. [테스트 전략](#9-테스트-전략)
10. [마이그레이션 전략](#10-마이그레이션-전략)
11. [장기 시뮬레이션 검토](#11-장기-시뮬레이션-검토)

---

## 1. Phase 1: AdKPISnapshot 데이터 모델

### 1.1 Prisma 스키마

```prisma
// ========================================
// Ad-Level KPI Tracking
// ========================================

model AdKPISnapshot {
  id          String   @id @default(cuid())
  adId        String
  ad          Ad       @relation(fields: [adId], references: [id], onDelete: Cascade)
  adSetId     String
  campaignId  String
  creativeId  String

  // 기본 메트릭 (KPISnapshot과 동일)
  impressions Int      @default(0)
  clicks      Int      @default(0)
  linkClicks  Int      @default(0)
  conversions Int      @default(0)
  spend       Decimal  @db.Decimal(15, 2)
  currency    String   @default("KRW")
  revenue     Decimal  @db.Decimal(15, 2)

  // 추가 메트릭 (소재 피로도 / 포맷 분석용)
  reach       Int      @default(0)
  frequency   Decimal  @default(0) @db.Decimal(8, 4)   // 평균 빈도 (소수점 4자리)
  cpm         Decimal  @default(0) @db.Decimal(15, 4)   // Cost per 1000 impressions
  cpc         Decimal  @default(0) @db.Decimal(15, 4)   // Cost per click
  videoViews  Int      @default(0)                       // 3초 이상 동영상 조회
  thruPlays   Int      @default(0)                       // 동영상 끝까지 시청 (또는 15초 이상)

  date        DateTime @db.Date
  createdAt   DateTime @default(now())

  @@unique([adId, date])
  @@index([adId])
  @@index([adSetId])
  @@index([campaignId])
  @@index([creativeId])
  @@index([date])
  @@index([campaignId, date])        // 보고서 생성 시 캠페인+기간 조회
  @@index([creativeId, date])        // 소재별 성과 조회
}
```

### 1.2 인덱스 설계 근거

| 인덱스 | 용도 | 예상 쿼리 패턴 |
|--------|------|----------------|
| `@@unique([adId, date])` | 중복 방지 (upsert용) | 동기화 시 같은 날 같은 Ad의 중복 INSERT 방지 |
| `@@index([campaignId, date])` | 보고서 생성 | `WHERE campaignId IN (...) AND date BETWEEN ? AND ?` |
| `@@index([creativeId, date])` | 소재별 성과 | 소재 피로도/포맷별 성과 집계 |
| `@@index([adSetId])` | AdSet별 조회 | 퍼널 단계별 성과 (AdSet -> Campaign -> Objective) |
| `@@index([date])` | 날짜 범위 스캔 | 전체 일별 추이 집계 |

### 1.3 Ad 모델 관계 추가

```prisma
model Ad {
  // ... 기존 필드
  kpiSnapshots AdKPISnapshot[]   // 추가
}
```

### 1.4 도메인 엔티티: AdKPI

```
src/domain/entities/AdKPI.ts
```

기존 `KPI` 엔티티 패턴을 따르되 추가 메트릭 포함:

```typescript
interface CreateAdKPIProps {
  adId: string
  adSetId: string
  campaignId: string
  creativeId: string
  impressions: number
  clicks: number
  linkClicks: number
  conversions: number
  spend: Money
  revenue: Money
  reach: number
  frequency: number
  cpm: number
  cpc: number
  videoViews: number
  thruPlays: number
  date: Date
}
```

- `create()` factory + `restore()` 패턴 유지
- 파생 메트릭은 getter로 계산:
  - `get ctr(): number` -> clicks / impressions * 100
  - `get cvr(): number` -> conversions / clicks * 100
  - `get roas(): number` -> revenue / spend
  - `get thruPlayRate(): number` -> thruPlays / impressions * 100

---

## 2. Meta API 연동

### 2.1 기존 메서드 활용

`MetaAdsClient.getAccountInsights()`는 이미 `level: 'ad'`를 지원한다:

```typescript
// 현재 시그니처 (변경 불필요)
getAccountInsights(
  accessToken: string,
  adAccountId: string,
  options: {
    level: 'campaign' | 'adset' | 'ad'
    datePreset: string
    campaignIds?: string[]
  }
): Promise<Map<string, MetaInsightsData>>
```

### 2.2 fields 확장

현재 `getAccountInsights`의 fields:
```
campaign_id,adset_id,ad_id,impressions,reach,clicks,spend,actions,action_values,date_start,date_stop
```

확장이 필요한 fields:
```
campaign_id,adset_id,ad_id,impressions,reach,clicks,spend,
actions,action_values,frequency,cpm,cpc,
video_views_3s,video_thruplay_watched_actions,
date_start,date_stop
```

**변경 방식**: `getAccountInsights` 메서드에 옵션으로 `extraFields?: string[]`를 추가하거나, 별도 `getAdLevelInsights` 메서드를 신설한다.

**권장**: 기존 `getAccountInsights`의 fields를 확장한다. 추가 fields는 값이 없으면 `undefined`/`"0"` 이므로 하위 호환성에 영향 없음.

### 2.3 MetaInsightsData 확장

```typescript
// 기존 (IMetaAdsService.ts)
export interface MetaInsightsData {
  campaignId: string
  impressions: number
  reach: number
  clicks: number
  linkClicks: number
  spend: number
  conversions: number
  revenue: number
  dateStart: string
  dateStop: string
}

// 확장
export interface MetaInsightsData {
  // ... 기존 필드
  frequency?: number      // 신규
  cpm?: number            // 신규
  cpc?: number            // 신규
  videoViews?: number     // 신규 (3초 이상)
  thruPlays?: number      // 신규 (끝까지 시청)
  adSetId?: string        // 신규 (level='ad' 시)
  adId?: string           // 신규 (level='ad' 시)
}
```

### 2.4 Ad 레벨 동기화 UseCase

```
src/application/use-cases/kpi/SyncAdInsightsUseCase.ts
```

기존 `SyncMetaInsightsUseCase` 패턴을 따르되 Ad 레벨로 확장:

```typescript
interface SyncAdInsightsInput {
  userId: string
  accessToken: string
  adAccountId: string
  campaignIds?: string[]
  datePreset?: 'today' | 'yesterday' | 'last_7d' | 'last_30d'
}

interface SyncAdInsightsResult {
  syncedCount: number
  failedCount: number
  errors: string[]
}
```

**동기화 흐름**:
1. `getAccountInsights(token, accountId, { level: 'ad', datePreset })` -- 1회 벌크 호출
2. 결과를 `Map<adId, MetaInsightsData>`로 수신
3. 각 항목에 대해 DB의 Ad 레코드에서 `creativeId` 조회 (캐싱)
4. `AdKPISnapshot` upsert (`@@unique([adId, date])` 기반)

### 2.5 일별 데이터 동기화 (time_increment)

보고서의 일별 추이 그래프를 위해 `time_increment=1`로 일별 데이터를 가져온다:

```typescript
// getAccountInsights에 timeIncrement 옵션 추가
options: {
  level: 'campaign' | 'adset' | 'ad'
  datePreset?: string
  timeRange?: { since: string; until: string }
  timeIncrement?: '1'     // 일별 분할
  campaignIds?: string[]
}
```

이렇게 하면 단일 API 호출로 7일치 Ad 레벨 일별 데이터를 모두 수신할 수 있다.

### 2.6 Cron Job 통합

```jsonc
// vercel.json cron 추가
{
  "path": "/api/cron/sync-ad-insights",
  "schedule": "30 6 * * *"   // 매일 06:30 (기존 sync 06:00 이후)
}
```

기존 `/api/cron/sync` (06:00)이 캠페인 레벨을 동기화한 후, 30분 뒤 Ad 레벨 동기화 실행. Rate Limit 충돌 방지를 위해 시간차를 둔다.

---

## 3. ReportDTO 확장

### 3.1 현재 ReportDTO 구조

```typescript
interface ReportDTO {
  id: string
  type: ReportType
  userId: string
  campaignIds: string[]
  dateRange: { startDate: string; endDate: string }
  sections: ReportSection[]        // 캠페인별 KPI 나열
  aiInsights: AIInsight[]          // AI 분석
  summaryMetrics: ReportSummaryMetrics
  status: ReportStatus
  // ...timestamps
}
```

### 3.2 확장 ReportDTO

```typescript
interface ReportDTO {
  id: string
  type: ReportType
  userId: string
  campaignIds: string[]
  dateRange: { startDate: string; endDate: string }
  status: ReportStatus

  // === 9개 섹션 데이터 ===

  // 1. 전체 성과 요약
  overallSummary: OverallSummarySection

  // 2. 성과 추이 (일별)
  dailyTrend: DailyTrendSection

  // 3. 캠페인별 성과
  campaignPerformance: CampaignPerformanceSection

  // 4. 소재별 성과 (TOP N)
  creativePerformance: CreativePerformanceSection

  // 5. 소재 피로도 지수
  creativeFatigue: CreativeFatigueSection

  // 6. 소재 포맷별 성과
  formatComparison: FormatComparisonSection

  // 7. 퍼널 단계별 성과
  funnelPerformance: FunnelPerformanceSection

  // 8. 성과 분석 (AI)
  performanceAnalysis: PerformanceAnalysisSection

  // 9. 개선사항 + 추천 액션
  recommendations: RecommendationsSection

  // === 하위 호환 (deprecated, Phase 전환기에 유지) ===
  sections?: ReportSection[]
  aiInsights?: AIInsight[]
  summaryMetrics?: ReportSummaryMetrics

  // ...timestamps
}
```

### 3.3 각 섹션 타입 정의

```typescript
// ── 1. 전체 성과 요약 ──
interface OverallSummarySection {
  totalSpend: number
  totalRevenue: number
  roas: number
  ctr: number
  totalConversions: number
  // 전주 대비 변화율
  changes: {
    spend: ChangeRate
    revenue: ChangeRate
    roas: ChangeRate
    ctr: ChangeRate
    conversions: ChangeRate
  }
}

interface ChangeRate {
  value: number           // 변화율 (%) — 양수: 증가, 음수: 감소
  direction: 'up' | 'down' | 'flat'
  isPositive: boolean     // 이 지표에서 증가가 좋은지 (spend는 false)
}

// ── 2. 성과 추이 ──
interface DailyTrendSection {
  days: DailyDataPoint[]
}

interface DailyDataPoint {
  date: string            // YYYY-MM-DD
  spend: number
  revenue: number
  roas: number
  impressions: number
  clicks: number
  conversions: number
}

// ── 3. 캠페인별 성과 ──
interface CampaignPerformanceSection {
  campaigns: CampaignPerformanceItem[]
}

interface CampaignPerformanceItem {
  campaignId: string
  name: string
  objective: string       // CampaignObjective
  status: string          // CampaignStatus
  impressions: number
  clicks: number
  conversions: number
  spend: number
  revenue: number
  roas: number
  ctr: number
}

// ── 4. 소재별 성과 ──
interface CreativePerformanceSection {
  topN: number            // 표시할 소재 수
  creatives: CreativePerformanceItem[]
}

interface CreativePerformanceItem {
  creativeId: string
  name: string
  format: string          // CreativeFormat
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
interface CreativeFatigueSection {
  creatives: CreativeFatigueItem[]
}

interface CreativeFatigueItem {
  creativeId: string
  name: string
  format: string
  frequency: number
  ctr: number
  ctrTrend: number[]      // 최근 7일 일별 CTR 변화
  fatigueScore: number    // 0-100 (높을수록 피로)
  fatigueLevel: 'healthy' | 'warning' | 'critical'
  activeDays: number      // 소재 집행 일수
  recommendation: string  // 교체 권고 메시지
}

// ── 6. 소재 포맷별 성과 ──
interface FormatComparisonSection {
  formats: FormatPerformanceItem[]
}

interface FormatPerformanceItem {
  format: string          // 'SINGLE_IMAGE' | 'SINGLE_VIDEO' | 'CAROUSEL' | 'REELS'
  formatLabel: string     // '이미지' | '동영상' | '카루셀' | '릴스'
  adCount: number
  impressions: number
  clicks: number
  conversions: number
  spend: number
  revenue: number
  roas: number
  ctr: number
  avgFrequency: number
  // 동영상 전용
  videoViews?: number
  thruPlayRate?: number
}

// ── 7. 퍼널 단계별 성과 ──
interface FunnelPerformanceSection {
  stages: FunnelStageItem[]
  totalBudget: number
}

interface FunnelStageItem {
  stage: 'tofu' | 'mofu' | 'bofu'
  stageLabel: string      // '인지 (ToFu)' | '고려 (MoFu)' | '전환 (BoFu)'
  campaignCount: number
  spend: number
  budgetRatio: number     // 전체 예산 대비 % (0-100)
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  roas: number
  ctr: number
}

// ── 8. 성과 분석 (AI) ──
interface PerformanceAnalysisSection {
  positiveFactors: AnalysisFactor[]    // 잘된 이유
  negativeFactors: AnalysisFactor[]    // 안된 이유
  summary: string                       // 종합 분석 요약
}

interface AnalysisFactor {
  title: string
  description: string
  relatedCampaigns?: string[]
  relatedCreatives?: string[]
  impact: 'high' | 'medium' | 'low'
}

// ── 9. 개선사항 + 추천 액션 ──
interface RecommendationsSection {
  actions: RecommendedAction[]
}

interface RecommendedAction {
  priority: 'high' | 'medium' | 'low'
  category: 'budget' | 'creative' | 'targeting' | 'funnel' | 'general'
  title: string
  description: string
  expectedImpact: string
  deadline?: string       // 권장 실행 기한
}
```

### 3.4 Report 도메인 엔티티 변경

`Report` 엔티티의 `sections: ReportSection[]`와 `aiInsights: AIInsight[]`는 유지하되, 새로운 9개 섹션을 `enrichedData` JSON 필드로 저장한다.

**이유**: 기존 `sections`/`aiInsights` 구조를 변경하면 이미 생성된 보고서 데이터가 깨진다. 새 필드를 추가하여 병행 운영한다.

```prisma
model Report {
  // ... 기존 필드 유지
  enrichedData   Json?    // 9개 섹션 데이터 (nullable -> 기존 보고서 호환)
}
```

`toReportDTO()` 변환 시:
- `enrichedData`가 있으면 -> 9개 섹션으로 매핑
- `enrichedData`가 없으면 -> 기존 `sections`/`aiInsights`로 폴백

---

## 4. PDF 템플릿 변경 범위

### 4.1 현재 구조 (WeeklyReportTemplate.tsx)

| 페이지 | 내용 |
|--------|------|
| Page 1 | 종합 평가 + 성과 요약 (MetricCard) + ROAS 차트 (BarChart) + 캠페인별 성과 |
| Page 2 | 상세 인사이트 (InsightCard) + 실행 과제 (ActionItemCard) + 성과 예측 테이블 + 업계 대비 개선점 |
| Page 3 | AI 인사이트 (Legacy) |

### 4.2 변경 후 구조 (EnhancedWeeklyReportTemplate.tsx)

| 페이지 | 섹션 | 주요 컴포넌트 |
|--------|------|-------------|
| Page 1 | 표지 + 전체 성과 요약 (1) | SummaryCard (변화율 색상 코딩) |
| Page 2 | 성과 추이 (2) | LineChart (7일 일별 지출/매출/ROAS) |
| Page 3 | 캠페인별 성과 (3) | 테이블 (캠페인 x 지표 매트릭스) |
| Page 4 | 소재별 성과 TOP 10 (4) | 테이블 + 썸네일 |
| Page 5 | 소재 피로도 지수 (5) | FatigueMatrix (Frequency x CTR 매트릭스), 교체 권고 리스트 |
| Page 6 | 소재 포맷별 성과 (6) | BarChart (포맷별 ROAS/CTR 비교) |
| Page 7 | 퍼널 단계별 성과 (7) | FunnelChart (ToFu/MoFu/BoFu) + 예산 파이 |
| Page 8 | 성과 분석 (8) | 잘된 이유 (초록) + 안된 이유 (빨강) |
| Page 9 | 개선사항 + 추천 액션 (9) | 우선순위 카드 (high/medium/low 색상) |

### 4.3 신규 컴포넌트

```
src/infrastructure/pdf/components/
  LineChart.tsx           -- 일별 추이 라인 차트 (react-pdf의 SVG 기반)
  SummaryCard.tsx         -- 변화율 포함 KPI 카드 (초록/빨강 화살표)
  FatigueMatrix.tsx       -- 피로도 매트릭스 시각화
  FunnelChart.tsx         -- ToFu/MoFu/BoFu 퍼널 도식
  FormatComparisonChart.tsx -- 포맷별 비교 차트
  PriorityActionCard.tsx  -- 우선순위별 액션 카드
```

### 4.4 디자인 규칙 적용

**원화 표기 수정**:
```typescript
// AS-IS (깨지는 코드)
function formatCurrency(num: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(num)
}
// 결과: "₩2,450,000" -> PDF에서 ₩ 깨짐

// TO-BE
function formatCurrency(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.round(num)) + '원'
}
// 결과: "2,450,000원"
```

**변화율 색상 코딩**:
```typescript
function getChangeColor(change: ChangeRate): string {
  if (change.direction === 'flat') return '#64748b'  // 회색
  if (change.isPositive) return '#16a34a'             // 초록
  return '#dc2626'                                     // 빨강
}

function formatChange(change: ChangeRate): string {
  const arrow = change.direction === 'up' ? '+' : change.direction === 'down' ? '' : ''
  return `${arrow}${change.value.toFixed(1)}%`
}
```

**폰트**: 기존 `NotoSansKR` 등록 로직 유지 (이미 WeeklyReportTemplate.tsx에 구현됨).

### 4.5 기존 템플릿 유지

`WeeklyReportTemplate.tsx`는 삭제하지 않는다. 새로운 `EnhancedWeeklyReportTemplate.tsx`를 생성하고, `ReportPDFGenerator`에서 `enrichedData` 유무에 따라 분기한다:

```typescript
class ReportPDFGenerator {
  async generateWeeklyReport(report: ReportDTO): Promise<PDFGeneratorResult> {
    const Template = report.overallSummary
      ? EnhancedWeeklyReportTemplate
      : WeeklyReportTemplate
    // ...
  }
}
```

---

## 5. 샘플 데이터 확장

### 5.1 파일 위치

```
src/lib/sample-report-data.ts   -- 기존 (유지)
src/lib/sample-enhanced-report-data.ts   -- 신규
```

### 5.2 샘플 데이터 개요

```typescript
// src/lib/sample-enhanced-report-data.ts

export function getSampleEnhancedReportDTO(): ReportDTO {
  return {
    id: 'sample-enhanced-001',
    type: ReportType.WEEKLY,
    userId: 'sample-user-001',
    campaignIds: ['campaign-001', 'campaign-002', 'campaign-003'],
    dateRange: getSampleDateRange(),
    status: 'GENERATED',

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

    // 2. 성과 추이 (7일)
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

    // 3. 캠페인별 성과
    campaignPerformance: {
      campaigns: [
        {
          campaignId: 'campaign-001',
          name: '프리미엄 스킨케어 세트 - 전환',
          objective: 'CONVERSIONS',
          status: 'ACTIVE',
          impressions: 425000, clicks: 12750, conversions: 128,
          spend: 1250000, revenue: 6400000, roas: 5.12, ctr: 3.0,
        },
        {
          campaignId: 'campaign-002',
          name: '신규 고객 유치 - 브랜드 인지도',
          objective: 'AWARENESS',
          status: 'ACTIVE',
          impressions: 318000, clicks: 6360, conversions: 38,
          spend: 750000, revenue: 1710000, roas: 2.28, ctr: 2.0,
        },
        {
          campaignId: 'campaign-003',
          name: '리타겟팅 - 장바구니 이탈',
          objective: 'CONVERSIONS',
          status: 'ACTIVE',
          impressions: 100000, clicks: 2510, conversions: 20,
          spend: 450000, revenue: 1200000, roas: 2.67, ctr: 2.51,
        },
      ],
    },

    // 4. 소재별 성과 TOP 5
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

    // 5. 소재 피로도
    creativeFatigue: {
      creatives: [
        {
          creativeId: 'cr-005', name: '할인 배너 D', format: 'SINGLE_IMAGE',
          frequency: 4.2, ctr: 1.8,
          ctrTrend: [2.8, 2.5, 2.3, 2.1, 2.0, 1.9, 1.8],
          fatigueScore: 78, fatigueLevel: 'critical', activeDays: 21,
          recommendation: 'CTR이 7일간 36% 하락. 즉시 소재 교체 권장.',
        },
        {
          creativeId: 'cr-004', name: '리뷰 영상 C', format: 'SINGLE_VIDEO',
          frequency: 3.1, ctr: 2.0,
          ctrTrend: [2.4, 2.3, 2.2, 2.1, 2.1, 2.0, 2.0],
          fatigueScore: 52, fatigueLevel: 'warning', activeDays: 14,
          recommendation: 'Frequency 3.1 도달. 1주 내 교체 검토 필요.',
        },
        {
          creativeId: 'cr-001', name: '봄 신상 세트 A', format: 'SINGLE_IMAGE',
          frequency: 1.8, ctr: 3.0,
          ctrTrend: [2.9, 2.9, 3.0, 3.0, 3.1, 3.0, 3.0],
          fatigueScore: 15, fatigueLevel: 'healthy', activeDays: 7,
          recommendation: '양호. 현재 소재 유지.',
        },
      ],
    },

    // 6. 포맷별 성과
    formatComparison: {
      formats: [
        { format: 'SINGLE_IMAGE', formatLabel: '이미지', adCount: 5, impressions: 300000, clicks: 7800, conversions: 77, spend: 820000, revenue: 3850000, roas: 4.70, ctr: 2.6, avgFrequency: 2.5 },
        { format: 'SINGLE_VIDEO', formatLabel: '동영상', adCount: 3, impressions: 250000, clicks: 6500, conversions: 63, spend: 670000, revenue: 3150000, roas: 4.70, ctr: 2.6, avgFrequency: 2.2, videoViews: 180000, thruPlayRate: 28.5 },
        { format: 'CAROUSEL', formatLabel: '카루셀', adCount: 2, impressions: 95000, clicks: 2850, conversions: 21, spend: 310000, revenue: 1050000, roas: 3.39, ctr: 3.0, avgFrequency: 1.9 },
      ],
    },

    // 7. 퍼널 단계별 성과
    funnelPerformance: {
      stages: [
        { stage: 'tofu', stageLabel: '인지 (ToFu)', campaignCount: 1, spend: 750000, budgetRatio: 30.6, impressions: 318000, clicks: 6360, conversions: 38, revenue: 1710000, roas: 2.28, ctr: 2.0 },
        { stage: 'mofu', stageLabel: '고려 (MoFu)', campaignCount: 0, spend: 0, budgetRatio: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0, roas: 0, ctr: 0 },
        { stage: 'bofu', stageLabel: '전환 (BoFu)', campaignCount: 2, spend: 1700000, budgetRatio: 69.4, impressions: 525000, clicks: 15260, conversions: 148, revenue: 7600000, roas: 4.47, ctr: 2.91 },
      ],
      totalBudget: 2450000,
    },

    // 8. 성과 분석 (AI)
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

    // 9. 추천 액션
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

---

## 6. 퍼널 분류 로직

### 6.1 CampaignObjective -> 퍼널 매핑 규칙

```typescript
// src/domain/value-objects/FunnelStage.ts

export type FunnelStage = 'tofu' | 'mofu' | 'bofu'

export const OBJECTIVE_TO_FUNNEL: Record<CampaignObjective, FunnelStage> = {
  // ToFu (Top of Funnel) — 인지
  AWARENESS:     'tofu',

  // MoFu (Middle of Funnel) — 고려
  TRAFFIC:       'mofu',
  ENGAGEMENT:    'mofu',
  LEADS:         'mofu',
  APP_PROMOTION: 'mofu',

  // BoFu (Bottom of Funnel) — 전환
  SALES:         'bofu',
  CONVERSIONS:   'bofu',
}
```

### 6.2 Advantage+ 캠페인 예외 처리

Advantage+ 쇼핑 캠페인(`advantageConfig`가 존재)은 Meta가 자동으로 ToFu/MoFu/BoFu를 오가며 배치한다. 이런 캠페인은 퍼널 분류가 모호하므로:

```typescript
function classifyFunnelStage(campaign: Campaign): FunnelStage | 'auto' {
  // Advantage+ 캠페인 감지
  if (campaign.advantageConfig) {
    return 'auto'
  }
  return OBJECTIVE_TO_FUNNEL[campaign.objective]
}
```

**PDF 표시**: `auto` 스테이지는 퍼널 차트에서 별도 행으로 표시한다 ("자동 배치 (Advantage+)"). 예산 배분 비율 계산에서는 제외하거나 별도 표기한다.

### 6.3 퍼널 분류 근거

| Objective | 퍼널 | 근거 |
|-----------|------|------|
| AWARENESS | ToFu | 도달/인지 극대화 목적 |
| TRAFFIC | MoFu | 웹사이트/앱 방문 유도 = 관심 단계 |
| ENGAGEMENT | MoFu | 상호작용 증가 = 브랜드 친밀도 |
| LEADS | MoFu | 리드 수집 = 고려 단계 |
| APP_PROMOTION | MoFu | 앱 설치 = 관심/고려 |
| SALES | BoFu | 직접 구매 유도 |
| CONVERSIONS | BoFu | 특정 전환 행동 유도 |

---

## 7. 소재 피로도 계산

### 7.1 피로도 점수 공식

```typescript
function calculateFatigueScore(data: {
  frequency: number
  currentCtr: number
  initialCtr: number        // 첫 3일 평균 CTR
  activeDays: number
  campaignObjective?: CampaignObjective
}): number {
  // 1. Frequency Factor (0-40점)
  //    Frequency 1.0 이하 = 0점, 5.0 이상 = 40점 (선형)
  const freqFactor = Math.min(40, Math.max(0, (data.frequency - 1.0) / 4.0 * 40))

  // 2. CTR Decay Factor (0-40점)
  //    CTR이 초기 대비 몇 % 하락했는지
  const ctrDecay = data.initialCtr > 0
    ? Math.max(0, (data.initialCtr - data.currentCtr) / data.initialCtr * 100)
    : 0
  const ctrFactor = Math.min(40, ctrDecay)

  // 3. Duration Factor (0-20점)
  //    7일까지 0점, 30일 이상 20점 (선형)
  const durFactor = Math.min(20, Math.max(0, (data.activeDays - 7) / 23 * 20))

  return Math.round(freqFactor + ctrFactor + durFactor)
}
```

### 7.2 경고 기준

| 피로도 점수 | 레벨 | 의미 | PDF 색상 |
|------------|------|------|---------|
| 0-30 | `healthy` | 양호 | 초록 (#16a34a) |
| 31-60 | `warning` | 주의 (1주 내 교체 검토) | 노랑 (#ca8a04) |
| 61-100 | `critical` | 위험 (즉시 교체 권장) | 빨강 (#dc2626) |

### 7.3 브랜딩 캠페인 예외 (오탐 방지)

Frequency가 높아도 성과가 좋은 경우(브랜딩 캠페인):

```typescript
function adjustFatigueForBranding(
  score: number,
  objective: CampaignObjective,
  currentCtr: number,
  initialCtr: number
): { score: number; fatigueLevel: FatigueLevel; note?: string } {
  // AWARENESS 캠페인이면서 CTR 하락이 10% 미만이면 경고 완화
  if (objective === CampaignObjective.AWARENESS) {
    const ctrDecayPercent = initialCtr > 0
      ? ((initialCtr - currentCtr) / initialCtr) * 100
      : 0

    if (ctrDecayPercent < 10) {
      const adjustedScore = Math.max(0, score - 20)  // 20점 감점
      return {
        score: adjustedScore,
        fatigueLevel: getFatigueLevel(adjustedScore),
        note: '브랜딩 캠페인: 반복 노출이 브랜드 인지에 긍정적일 수 있음',
      }
    }
  }

  return { score, fatigueLevel: getFatigueLevel(score) }
}
```

### 7.4 Frequency x CTR 매트릭스 시각화

```
               CTR (높음)
                  |
    [양호]        |    [주의: 빈도 높으나 성과 유지]
    Freq 낮음     |    Freq 높음
    CTR 높음      |    CTR 높음
                  |
  ────────────────┼─────────────────> Frequency (높음)
                  |
    [모니터링]    |    [위험: 즉시 교체]
    Freq 낮음     |    Freq 높음
    CTR 낮음      |    CTR 낮음
                  |
               CTR (낮음)
```

PDF에서는 4사분면 매트릭스를 dot chart로 시각화한다. 각 소재가 점으로 표시되며, 빨강/노랑/초록 색상으로 피로도 수준을 나타낸다.

---

## 8. DI 등록

### 8.1 DI 토큰 추가 (types.ts)

```typescript
export const DI_TOKENS = {
  // ... 기존 토큰

  // Ad KPI (Phase 1)
  AdKPIRepository: Symbol.for('AdKPIRepository'),
  SyncAdInsightsUseCase: Symbol.for('SyncAdInsightsUseCase'),

  // Enhanced Report (Phase 2)
  EnhancedReportDataBuilder: Symbol.for('EnhancedReportDataBuilder'),
  CreativeFatigueService: Symbol.for('CreativeFatigueService'),
  FunnelClassificationService: Symbol.for('FunnelClassificationService'),
} as const
```

### 8.2 Repository 인터페이스

```typescript
// src/domain/repositories/IAdKPIRepository.ts
export interface IAdKPIRepository {
  save(kpi: AdKPI): Promise<AdKPI>
  saveMany(kpis: AdKPI[]): Promise<AdKPI[]>
  upsertMany(kpis: AdKPI[]): Promise<number>   // @@unique([adId, date]) 기반

  findByAdId(adId: string, startDate: Date, endDate: Date): Promise<AdKPI[]>
  findByCampaignId(campaignId: string, startDate: Date, endDate: Date): Promise<AdKPI[]>
  findByCreativeId(creativeId: string, startDate: Date, endDate: Date): Promise<AdKPI[]>

  aggregateByCampaignId(campaignId: string, startDate: Date, endDate: Date): Promise<AdKPIAggregate>
  aggregateByCreativeId(creativeId: string, startDate: Date, endDate: Date): Promise<AdKPIAggregate>
  aggregateByFormat(campaignIds: string[], startDate: Date, endDate: Date): Promise<FormatAggregate[]>

  getDailyAggregatesByCampaignIds(
    campaignIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<DailyAdKPIAggregate[]>

  getTopCreatives(
    campaignIds: string[],
    startDate: Date,
    endDate: Date,
    limit: number,
    sortBy: 'roas' | 'conversions' | 'spend'
  ): Promise<CreativeAggregate[]>
}
```

### 8.3 모듈 등록 (report.module.ts 확장)

```typescript
// src/lib/di/modules/report.module.ts

import { PrismaAdKPIRepository } from '@infrastructure/database/repositories/PrismaAdKPIRepository'
import { SyncAdInsightsUseCase } from '@application/use-cases/kpi/SyncAdInsightsUseCase'
import { EnhancedReportDataBuilder } from '@application/services/EnhancedReportDataBuilder'
import { CreativeFatigueService } from '@application/services/CreativeFatigueService'
import { FunnelClassificationService } from '@application/services/FunnelClassificationService'

export function registerReportModule(container: Container): void {
  // ... 기존 등록 유지

  // --- Phase 1: Ad KPI ---
  container.registerSingleton(
    DI_TOKENS.AdKPIRepository,
    () => new PrismaAdKPIRepository(prisma)
  )

  container.register(
    DI_TOKENS.SyncAdInsightsUseCase,
    () => new SyncAdInsightsUseCase(
      container.resolve(DI_TOKENS.AdKPIRepository),
      container.resolve(DI_TOKENS.AdRepository),
      container.resolve(DI_TOKENS.MetaAdsService),
      container.resolve(DI_TOKENS.MetaAdAccountRepository)
    )
  )

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
}
```

### 8.4 새 파일 목록

| 레이어 | 파일 | 역할 |
|--------|------|------|
| domain | `src/domain/entities/AdKPI.ts` | AdKPI 엔티티 |
| domain | `src/domain/repositories/IAdKPIRepository.ts` | Repository 인터페이스 |
| domain | `src/domain/value-objects/FunnelStage.ts` | 퍼널 분류 매핑 |
| application | `src/application/use-cases/kpi/SyncAdInsightsUseCase.ts` | Ad 인사이트 동기화 |
| application | `src/application/services/EnhancedReportDataBuilder.ts` | 9개 섹션 데이터 빌더 |
| application | `src/application/services/CreativeFatigueService.ts` | 소재 피로도 계산 |
| application | `src/application/services/FunnelClassificationService.ts` | 퍼널 분류 |
| application | `src/application/dto/report/EnhancedReportSections.ts` | 9개 섹션 타입 정의 |
| infrastructure | `src/infrastructure/database/repositories/PrismaAdKPIRepository.ts` | Prisma 구현체 |
| infrastructure | `src/infrastructure/pdf/templates/EnhancedWeeklyReportTemplate.tsx` | 개선 PDF 템플릿 |
| infrastructure | `src/infrastructure/pdf/components/LineChart.tsx` | 라인 차트 |
| infrastructure | `src/infrastructure/pdf/components/SummaryCard.tsx` | 변화율 카드 |
| infrastructure | `src/infrastructure/pdf/components/FatigueMatrix.tsx` | 피로도 매트릭스 |
| infrastructure | `src/infrastructure/pdf/components/FunnelChart.tsx` | 퍼널 차트 |
| infrastructure | `src/infrastructure/pdf/components/FormatComparisonChart.tsx` | 포맷 비교 |
| infrastructure | `src/infrastructure/pdf/components/PriorityActionCard.tsx` | 액션 카드 |
| lib | `src/lib/sample-enhanced-report-data.ts` | 샘플 데이터 |
| api | `src/app/api/cron/sync-ad-insights/route.ts` | Ad 인사이트 Cron |

---

## 9. 테스트 전략

### 9.1 단위 테스트

| 테스트 대상 | 파일 | 테스트 항목 |
|------------|------|------------|
| AdKPI 엔티티 | `AdKPI.test.ts` | create/restore, 파생 메트릭 계산 (ctr, cvr, roas, thruPlayRate), validation |
| FunnelStage | `FunnelStage.test.ts` | 모든 CampaignObjective 매핑, Advantage+ 예외 처리 |
| CreativeFatigueService | `CreativeFatigueService.test.ts` | 점수 계산 정확성, 경계값 (0/30/60/100), 브랜딩 예외 보정 |
| EnhancedReportDataBuilder | `EnhancedReportDataBuilder.test.ts` | 9개 섹션 생성, 빈 데이터 처리, 전주 대비 변화율 계산 |
| FunnelClassificationService | `FunnelClassificationService.test.ts` | 퍼널 분류, 예산 배분 비율 계산 |
| formatCurrency | `formatHelpers.test.ts` | "원" 접미사 확인, 음수/0/소수점 처리 |
| ChangeRate 계산 | `changeRate.test.ts` | 증가/감소/동일, spend의 isPositive=false 검증 |

### 9.2 통합 테스트

| 테스트 대상 | 파일 | 테스트 항목 |
|------------|------|------------|
| PrismaAdKPIRepository | `PrismaAdKPIRepository.integration.test.ts` | upsert, 집계 쿼리, 인덱스 활용 확인 |
| SyncAdInsightsUseCase | `SyncAdInsightsUseCase.integration.test.ts` | Meta API Mock -> DB 저장 전체 흐름 |
| ReportPDFGenerator | `ReportPDFGenerator.integration.test.ts` | 개선 템플릿 PDF 생성 성공, 파일 크기 확인 |
| Cron API Route | `sync-ad-insights.route.test.ts` | 인증, 성공/실패 응답 |

### 9.3 PDF 렌더링 테스트

```typescript
// EnhancedWeeklyReportTemplate.test.tsx
describe('EnhancedWeeklyReportTemplate', () => {
  it('should render 9 pages for full report', async () => {
    const report = getSampleEnhancedReportDTO()
    const element = React.createElement(EnhancedWeeklyReportTemplate, { report })
    const buffer = await renderToBuffer(element)
    expect(buffer.length).toBeGreaterThan(0)
    // PDF 크기가 합리적 범위 내 (< 5MB)
    expect(buffer.length).toBeLessThan(5 * 1024 * 1024)
  })

  it('should not contain won symbol (₩)', async () => {
    // PDF 텍스트 추출 후 ₩ 기호 없음 확인
  })

  it('should gracefully handle empty sections', async () => {
    const report = getSampleEnhancedReportDTO()
    report.creativeFatigue.creatives = []
    report.funnelPerformance.stages = []
    // 빈 섹션이 있어도 에러 없이 렌더링
  })
})
```

### 9.4 예상 테스트 수

| 카테고리 | 예상 수 |
|---------|--------|
| 도메인 단위 | ~35개 |
| 서비스 단위 | ~45개 |
| Repository 통합 | ~15개 |
| PDF 렌더링 | ~10개 |
| API Route | ~5개 |
| **합계** | **~110개** |

---

## 10. 마이그레이션 전략

### 10.1 스키마 마이그레이션

```bash
npx prisma migrate dev --name add_ad_kpi_snapshot
npx prisma migrate dev --name add_report_enriched_data
```

**다운타임 영향**: 없음.
- `AdKPISnapshot`은 완전히 새로운 테이블이므로 기존 테이블에 영향 없음.
- `Report.enrichedData`는 nullable `Json?` 필드 추가이므로 기존 행에 영향 없음 (ALTER TABLE ADD COLUMN ... NULL).

### 10.2 기존 보고서 호환성

| 시나리오 | 처리 방식 |
|---------|----------|
| 기존 보고서 PDF 다운로드 | `enrichedData`가 null -> 기존 `WeeklyReportTemplate` 사용 |
| 기존 보고서 웹 뷰 | `enrichedData`가 null -> 기존 `sections`/`aiInsights` 기반 렌더링 |
| 신규 보고서 | `enrichedData` 채워짐 -> `EnhancedWeeklyReportTemplate` 사용 |

`toReportDTO()` 함수에서 분기:

```typescript
export function toReportDTO(report: Report): ReportDTO {
  const base = { /* 기존 로직 */ }

  if (report.enrichedData) {
    return { ...base, ...report.enrichedData as EnhancedSections }
  }

  return base
}
```

### 10.3 롤백 전략

- 문제 발생 시 `EnhancedWeeklyReportTemplate` 대신 기존 `WeeklyReportTemplate`으로 즉시 복귀 가능 (feature flag 또는 `enrichedData` null 체크로 자동 폴백).
- `AdKPISnapshot` 테이블은 독립적이므로 삭제해도 기존 기능에 영향 없음.

### 10.4 배포 순서

1. **Phase 1-A**: Prisma 마이그레이션 (AdKPISnapshot 테이블 + Report.enrichedData 필드)
2. **Phase 1-B**: SyncAdInsightsUseCase + Cron Job 배포 (데이터 수집 시작)
3. **Phase 1-C**: 3~7일 데이터 축적 대기
4. **Phase 2-A**: EnhancedReportDataBuilder + 새 PDF 템플릿 배포
5. **Phase 2-B**: GenerateWeeklyReportUseCase에서 EnhancedReportDataBuilder 호출 연결
6. **Phase 2-C**: 모니터링 (PDF 생성 시간, 메모리 사용량, AI 비용)

---

## 11. 장기 시뮬레이션 검토

### 11.1 데이터 볼륨

**예상 규모**:
- 현재 KPISnapshot: 캠페인 x 일수 (예: 10캠페인 x 365일 = 3,650행/년)
- AdKPISnapshot: Ad x 일수 (예: 10캠페인 x 5AdSet x 3Ad x 365일 = 54,750행/년)
- **15배 차이** (10-100배 범위의 하단)

**대응**:
- 복합 인덱스 `@@index([campaignId, date])`로 보고서 쿼리 성능 보장.
- 1년 이상 된 데이터는 월별 집계 테이블로 롤업하는 배치 작성 예정 (v2).
- Supabase (PostgreSQL)의 파티셔닝은 현재 데이터 규모(~55K행/년)에서는 불필요. 연 500K행 초과 시 date 기반 range partition 검토.

### 11.2 Meta API Rate Limit

**현재 호출 패턴**:
- `/api/cron/sync` (06:00): 계정별 `getAccountInsights(level='campaign')` 1회
- 신규 `/api/cron/sync-ad-insights` (06:30): 계정별 `getAccountInsights(level='ad')` 1회

**Rate Limit 분석**:
- Meta Marketing API는 계정당 시간 기준 Rate Limit 적용 (일반적으로 200회/시간).
- 두 Cron이 30분 간격이므로 동일 시간대에 호출되지 않음.
- `level='ad'`는 `limit: 500`으로 한 번에 최대 500개 Ad 인사이트를 가져옴. 대부분의 계정에서 1회 호출로 충분.
- 500개 이상 Ad가 있는 대형 계정: 페이지네이션 필요. `paging.next` URL로 추가 요청 (최대 2~3회).

**리스크**: 낮음. 기존 벌크 조회와 시간차를 두어 충돌 방지.

### 11.3 보고서 생성 시간

**현재**: ~3~5초 (3섹션 + AI 분석 1회)

**예상 (9섹션)**:
- DB 쿼리 (5개): ~500ms (병렬 실행)
- AI 분석 (성과 분석 + 추천 액션): ~3~5초 (기존과 동일, 프롬프트만 확장)
- PDF 렌더링 (9페이지): ~3~5초 (기존 3페이지 -> 9페이지로 3배)
- **총 예상: ~7~12초**

**Vercel Serverless 함수 타임아웃**:
- Pro Plan: 60초 (충분)
- Hobby Plan: 10초 (위험 -> Pro Plan 필수)

**최적화 전략**:
1. DB 쿼리 병렬화 (`Promise.all`)
2. AI 프롬프트 최적화 (성과 분석 + 추천 액션을 하나의 API 호출로 통합)
3. PDF 렌더링 전에 데이터를 완전히 준비하여 렌더링 시간 단축

### 11.4 PDF 크기

**현재**: ~200KB (3페이지)
**예상**: ~800KB~1.5MB (9페이지, 차트 포함)

**Vercel Serverless 메모리**:
- 기본 1024MB -> PDF 렌더링에 충분.
- `@react-pdf/renderer`의 메모리 사용량은 페이지 수에 비례하나, 9페이지 정도는 안전 범위.

**리스크 완화**:
- 이미지/썸네일은 PDF에 직접 포함하지 않고, 텍스트 + SVG 차트로만 구성.
- PDF 크기가 5MB를 초과하면 이메일 전송 실패 가능. 5MB 미만 유지 필수.

### 11.5 AI 분석 비용

**현재 호출 패턴**:
- 보고서당 `generateReportInsights` 1회 호출
- 입력: 캠페인 요약 JSON (~500 토큰)
- 출력: 인사이트 + 추천 (~1,500 토큰)
- 비용: ~0.003 USD/보고서 (GPT-4o 기준)

**개선 후 예상**:
- 입력 확장: 캠페인 + 소재 + 피로도 + 퍼널 데이터 (~2,000 토큰)
- 출력 확장: 성과 분석 + 추천 액션 상세 (~3,000 토큰)
- 비용: ~0.01 USD/보고서

**월간 비용 시뮬레이션**:
| 플랜 | 보고서/월 | AI 비용/월 |
|------|----------|-----------|
| FREE (10 사업자) | 40건 (주간) | ~0.40 USD |
| STARTER (50 사업자) | 200건 | ~2.00 USD |
| PRO (200 사업자) | 800건 | ~8.00 USD |
| 전체 (1,000 사업자) | 4,000건 | ~40.00 USD |

**리스크**: 매우 낮음. 월 40 USD 수준은 SaaS 수익 대비 미미.

### 11.6 스키마 마이그레이션 다운타임

- `CREATE TABLE AdKPISnapshot`: DDL 완료 즉시 (빈 테이블). **다운타임 0.**
- `ALTER TABLE Report ADD COLUMN enrichedData JSONB`: nullable 컬럼 추가. PostgreSQL 11+에서 즉시 완료. **다운타임 0.**
- Prisma 7.x의 `prisma migrate deploy`는 트랜잭션 내에서 실행되므로 안전.

### 11.7 기존 보고서 하위 호환성

이미 생성된 보고서(`enrichedData = null`)는:
- **웹 뷰**: 기존 `sections`/`aiInsights` 기반 렌더링 (현재 코드 그대로)
- **PDF 다운로드**: 기존 `WeeklyReportTemplate` 사용
- **API 응답**: `overallSummary` 등 신규 필드가 `undefined`로 반환

클라이언트(프론트엔드)에서는 `overallSummary`의 존재 여부로 신/구 보고서를 구분하여 UI를 분기한다:

```typescript
// 프론트엔드
{report.overallSummary ? (
  <EnhancedReportView report={report} />
) : (
  <LegacyReportView report={report} />
)}
```

### 11.8 Cron Job 영향

| 기존 Cron | 영향 |
|-----------|------|
| `/api/cron/sync` (06:00) | 변경 없음. 기존 캠페인 레벨 동기화 유지. |
| `/api/cron/generate-reports` (월 00:00) | **변경 필요**. `EnhancedReportDataBuilder`를 호출하도록 수정. |
| `/api/cron/send-scheduled-reports` (09:00) | **변경 필요**. 개선 PDF 생성 지원. |
| 신규 `/api/cron/sync-ad-insights` (06:30) | 신규 추가. |

`generate-reports`의 변경은 Phase 2-B에서 수행한다. 그 전까지는 기존 로직으로 보고서를 생성하며, Ad KPI 데이터만 축적한다.

### 11.9 소재 피로도 오탐

**시나리오**: 브랜딩 캠페인에서 Frequency 5.0이지만 CTR 유지, 전환도 꾸준한 경우.

**대응 (7.3 참조)**:
1. `CampaignObjective.AWARENESS`인 경우 CTR 하락 10% 미만이면 피로도 점수 20점 감점.
2. PDF에 "브랜딩 캠페인: 반복 노출이 브랜드 인지에 긍정적일 수 있음" 주석 표시.
3. 소재 교체 권고 대신 "현재 성과 유지 중, 모니터링 지속 권장"으로 메시지 변경.

**추가 안전장치**: 피로도 `critical` 판정이라도 지난 3일 CTR이 상승 추세이면 `warning`으로 하향 조정.

### 11.10 퍼널 분류 예외

**Advantage+ 쇼핑 캠페인**:
- Meta가 자동으로 전체 퍼널을 오가며 배치.
- `campaign.advantageConfig`가 존재하면 `auto` 스테이지로 분류.
- 퍼널 차트에서 별도 행 "자동 배치 (Advantage+)"로 표시.
- 예산 배분 비율 계산 시 `auto` 비용은 별도 표시하되, ToFu/MoFu/BoFu 비율에는 포함하지 않음.

**기타 예외**:
- `objective`가 `TRAFFIC`이지만 실제로는 구매 유도 목적인 캠페인 -> 사용자가 수동으로 퍼널 오버라이드 가능하도록 향후 UI 추가 (v2).
- 현재는 objective 기반 자동 분류만 적용.

---

## 부록: 변경 파일 요약

### 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `prisma/schema.prisma` | AdKPISnapshot 모델 추가, Ad 관계 추가, Report.enrichedData 필드 추가 |
| `src/lib/di/types.ts` | DI 토큰 5개 추가 |
| `src/lib/di/modules/report.module.ts` | 새 Repository/UseCase/Service DI 등록 |
| `src/application/dto/report/ReportDTO.ts` | 9개 섹션 타입 정의 추가, toReportDTO 분기 |
| `src/infrastructure/pdf/ReportPDFGenerator.ts` | 템플릿 분기 로직 추가 |
| `src/infrastructure/pdf/templates/WeeklyReportTemplate.tsx` | formatCurrency "원" 수정 (기존 템플릿도 깨짐 수정) |
| `src/infrastructure/external/meta-ads/MetaAdsClient.ts` | getAccountInsights fields 확장 |
| `src/application/ports/IMetaAdsService.ts` | MetaInsightsData에 추가 필드 |
| `src/domain/entities/Report.ts` | enrichedData 속성 추가 |
| `vercel.json` | sync-ad-insights cron 추가 |

### 신규 파일

| 파일 | 역할 |
|------|------|
| `src/domain/entities/AdKPI.ts` | Ad KPI 엔티티 |
| `src/domain/repositories/IAdKPIRepository.ts` | Repository 인터페이스 |
| `src/domain/value-objects/FunnelStage.ts` | 퍼널 분류 매핑 |
| `src/application/use-cases/kpi/SyncAdInsightsUseCase.ts` | Ad 인사이트 동기화 |
| `src/application/services/EnhancedReportDataBuilder.ts` | 9개 섹션 데이터 빌더 |
| `src/application/services/CreativeFatigueService.ts` | 소재 피로도 계산 |
| `src/application/services/FunnelClassificationService.ts` | 퍼널 분류 서비스 |
| `src/application/dto/report/EnhancedReportSections.ts` | 9개 섹션 DTO 타입 |
| `src/infrastructure/database/repositories/PrismaAdKPIRepository.ts` | Prisma 구현체 |
| `src/infrastructure/pdf/templates/EnhancedWeeklyReportTemplate.tsx` | 개선 PDF |
| `src/infrastructure/pdf/components/LineChart.tsx` | 라인 차트 |
| `src/infrastructure/pdf/components/SummaryCard.tsx` | 변화율 카드 |
| `src/infrastructure/pdf/components/FatigueMatrix.tsx` | 피로도 매트릭스 |
| `src/infrastructure/pdf/components/FunnelChart.tsx` | 퍼널 차트 |
| `src/infrastructure/pdf/components/FormatComparisonChart.tsx` | 포맷 비교 |
| `src/infrastructure/pdf/components/PriorityActionCard.tsx` | 액션 카드 |
| `src/lib/sample-enhanced-report-data.ts` | 9개 섹션 샘플 데이터 |
| `src/app/api/cron/sync-ad-insights/route.ts` | Ad 인사이트 Cron API |

---

## 부록: 작업량 추정

| Phase | 작업 | 예상 일수 |
|-------|------|----------|
| Phase 1-A | Prisma 스키마 + 마이그레이션 + AdKPI 엔티티 | 1일 |
| Phase 1-B | IAdKPIRepository + PrismaAdKPIRepository | 1일 |
| Phase 1-C | SyncAdInsightsUseCase + Cron | 1일 |
| Phase 1-D | Meta API fields 확장 + MetaInsightsData 확장 | 0.5일 |
| Phase 1-E | Phase 1 테스트 | 1일 |
| Phase 2-A | 9개 섹션 DTO 타입 정의 | 0.5일 |
| Phase 2-B | EnhancedReportDataBuilder (퍼널/피로도/포맷) | 2일 |
| Phase 2-C | AI 프롬프트 확장 (성과 분석 + 추천 액션) | 1일 |
| Phase 2-D | PDF 컴포넌트 6개 + EnhancedWeeklyReportTemplate | 3일 |
| Phase 2-E | formatCurrency "원" 수정 + 색상 코딩 | 0.5일 |
| Phase 2-F | 샘플 데이터 + 웹 프리뷰 연동 | 0.5일 |
| Phase 2-G | Phase 2 테스트 (110개) | 2일 |
| Phase 2-H | 기존 보고서 호환성 검증 + 롤백 테스트 | 1일 |
| **합계** | | **~15일 (3주)** |
