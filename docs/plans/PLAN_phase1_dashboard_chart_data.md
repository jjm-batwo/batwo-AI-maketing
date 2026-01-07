# Phase 1: 대시보드 차트 데이터 구현 계획

**목표**: 실제 KPI 추이 데이터로 대시보드 차트 완성
**예상 시간**: 2-3시간
**우선순위**: P1 (고영향/저노력)

**Last Updated**: 2026-01-07
**Status**: ✅ Complete

---

## CRITICAL INSTRUCTIONS

1. ✅ 각 단계 완료 후 체크박스 표시
2. 🧪 모든 품질 게이트 검증 명령 실행
3. ⚠️ 모든 품질 게이트 통과 확인
4. 📝 Notes 섹션에 학습 내용 기록
5. ➡️ 다음 단계로 진행하기 전 검증 완료

⛔ 품질 게이트 스킵 금지, 실패한 체크로 진행 금지

---

## 개요

### 현재 상태 분석
- ✅ `IKPIRepository` - getDailyAggregates 추가됨
- ✅ `PrismaKPIRepository` - getDailyAggregates 구현됨
- ✅ `GetDashboardKPIUseCase` - chartData 반환
- ✅ API Route - chartData 응답 포함
- ✅ `KPIChart` 컴포넌트 - DataPoint[] 수신 가능
- ✅ Dashboard Page - chartData 실제 데이터 사용

### 목표 상태
- 일별 KPI 스냅샷 조회 메서드 추가
- UseCase에서 chartData 집계 및 반환
- API 응답에 chartData 포함
- 프론트엔드 차트에 실제 데이터 표시

---

## 아키텍처 결정

### 데이터 흐름
```
Frontend (useDashboardKPI)
    ↓
API Route (/api/dashboard/kpi)
    ↓
GetDashboardKPIUseCase
    ↓
IKPIRepository.getDailyAggregates()
    ↓
PrismaKPIRepository (Prisma groupBy)
```

### 차트 데이터 구조
```typescript
interface ChartDataPoint {
  date: string        // YYYY-MM-DD
  spend: number       // 원 단위
  revenue: number     // 원 단위
  roas: number        // 배수 (revenue/spend)
  impressions: number
  clicks: number
  conversions: number
}
```

---

## Phase 1.1: Repository 레이어 (TDD)

### 🔴 RED - 테스트 먼저 작성

**테스트 파일**: `tests/unit/domain/repositories/IKPIRepository.getDailyAggregates.test.ts`

**테스트 케이스**:
- [x] 캠페인 ID와 날짜 범위로 일별 집계 조회 ✅
- [x] 빈 결과 처리 (데이터 없는 경우) ✅
- [x] 여러 캠페인 데이터 합산 ✅
- [x] 날짜순 정렬 확인 ✅

**테스트 코드 예시**:
```typescript
describe('IKPIRepository.getDailyAggregates', () => {
  it('should return daily aggregated KPIs for date range', async () => {
    // Arrange
    const campaignIds = ['campaign-1', 'campaign-2']
    const startDate = new Date('2025-01-01')
    const endDate = new Date('2025-01-07')

    // Act
    const result = await repository.getDailyAggregates(
      campaignIds,
      startDate,
      endDate
    )

    // Assert
    expect(result).toHaveLength(7) // 7일치 데이터
    expect(result[0].date).toBe('2025-01-01')
    expect(result[0]).toHaveProperty('totalSpend')
    expect(result[0]).toHaveProperty('totalRevenue')
  })
})
```

### 🟢 GREEN - 최소 구현

**수정 파일**:
1. `src/domain/repositories/IKPIRepository.ts` - 인터페이스 추가
2. `src/infrastructure/database/repositories/PrismaKPIRepository.ts` - 구현

**인터페이스 추가**:
```typescript
interface DailyKPIAggregate {
  date: Date
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  totalSpend: number
  totalRevenue: number
}

interface IKPIRepository {
  // 기존 메서드...
  getDailyAggregates(
    campaignIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<DailyKPIAggregate[]>
}
```

**Prisma 구현**:
```typescript
async getDailyAggregates(
  campaignIds: string[],
  startDate: Date,
  endDate: Date
): Promise<DailyKPIAggregate[]> {
  const results = await this.prisma.kPISnapshot.groupBy({
    by: ['date'],
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
    orderBy: { date: 'asc' },
  })

  return results.map(r => ({
    date: r.date,
    totalImpressions: r._sum.impressions ?? 0,
    totalClicks: r._sum.clicks ?? 0,
    totalConversions: r._sum.conversions ?? 0,
    totalSpend: Number(r._sum.spend ?? 0),
    totalRevenue: Number(r._sum.revenue ?? 0),
  }))
}
```

### 🔵 REFACTOR - 코드 정리

- [x] 타입 정의 별도 파일로 분리 (필요시) ✅
- [x] 에러 처리 추가 ✅
- [x] 테스트 유지 확인 ✅

### ✅ Phase 1.1 품질 게이트

```bash
# 실행 명령어
npm test -- --grep "getDailyAggregates"
npm run type-check
```

- [x] 새 테스트 4개+ 통과 ✅
- [x] 타입 체크 통과 ✅
- [x] 기존 테스트 모두 통과 ✅

---

## Phase 1.2: Application 레이어 (TDD)

### 🔴 RED - 테스트 먼저 작성

**테스트 파일**: `tests/unit/application/kpi/GetDashboardKPIUseCase.chartData.test.ts`

**테스트 케이스**:
- [x] chartData 반환 확인 (일별 데이터 포인트) ✅
- [x] ROAS 계산 정확성 (revenue/spend) ✅
- [x] 빈 chartData 처리 (캠페인 없음) ✅
- [x] 날짜 범위 필터링 동작 ✅

**테스트 코드 예시**:
```typescript
describe('GetDashboardKPIUseCase - chartData', () => {
  it('should return chartData with daily KPI points', async () => {
    // Arrange
    await seedDailyKPIData(campaignRepository, kpiRepository)

    // Act
    const result = await useCase.execute({
      userId: 'user-123',
      dateRange: 'last_7d',
    })

    // Assert
    expect(result.chartData).toBeDefined()
    expect(result.chartData.length).toBeGreaterThan(0)
    expect(result.chartData[0]).toMatchObject({
      date: expect.any(String),
      spend: expect.any(Number),
      revenue: expect.any(Number),
      roas: expect.any(Number),
    })
  })

  it('should calculate ROAS correctly', async () => {
    // Arrange: spend=1000, revenue=3000

    // Act
    const result = await useCase.execute({...})

    // Assert
    expect(result.chartData[0].roas).toBe(3.0)
  })
})
```

### 🟢 GREEN - 최소 구현

**수정 파일**:
1. `src/application/dto/kpi/DashboardKPIDTO.ts` - ChartDataPoint 타입 추가
2. `src/application/use-cases/kpi/GetDashboardKPIUseCase.ts` - chartData 로직

**DTO 추가**:
```typescript
export interface ChartDataPoint {
  date: string
  spend: number
  revenue: number
  roas: number
  impressions: number
  clicks: number
  conversions: number
}

export interface DashboardKPIResult {
  // 기존 필드...
  chartData: ChartDataPoint[]
}
```

**UseCase 수정**:
```typescript
async execute(input: GetDashboardKPIInput): Promise<DashboardKPIResult> {
  // 기존 로직...

  // 일별 집계 데이터 조회
  const dailyAggregates = await this.kpiRepository.getDailyAggregates(
    campaignIds,
    dateRange.startDate,
    dateRange.endDate
  )

  // ChartDataPoint로 변환
  const chartData = dailyAggregates.map(daily => ({
    date: daily.date.toISOString().split('T')[0],
    spend: daily.totalSpend,
    revenue: daily.totalRevenue,
    roas: daily.totalSpend > 0
      ? Number((daily.totalRevenue / daily.totalSpend).toFixed(2))
      : 0,
    impressions: daily.totalImpressions,
    clicks: daily.totalClicks,
    conversions: daily.totalConversions,
  }))

  return {
    // 기존 필드...
    chartData,
  }
}
```

### 🔵 REFACTOR - 코드 정리

- [x] ROAS 계산 로직 추출 (value object 또는 helper) ✅
- [x] 날짜 포맷팅 유틸리티 사용 ✅
- [x] 테스트 유지 확인 ✅

### ✅ Phase 1.2 품질 게이트

```bash
npm test -- --grep "chartData"
npm run type-check
```

- [x] 새 테스트 10개 통과 ✅
- [x] 타입 체크 통과 ✅
- [x] 기존 테스트 모두 통과 ✅

---

## Phase 1.3: API & Presentation 레이어

### 🔴 RED - E2E 테스트 작성

**테스트 파일**: `tests/integration/api/dashboard-kpi-chart.test.ts`

**테스트 케이스**:
- [x] GET /api/dashboard/kpi 응답에 chartData 포함 ✅
- [x] chartData 배열 구조 검증 ✅

### 🟢 GREEN - 최소 구현

**수정 파일**:
1. `src/app/api/dashboard/kpi/route.ts` - chartData 응답 추가
2. `src/app/(dashboard)/dashboard/page.tsx` - 실제 데이터 사용

**API Route 수정**:
```typescript
const response = {
  summary: { /* 기존 */ },
  campaignBreakdown: result.campaignBreakdown,
  chartData: result.chartData, // 추가
}
```

**Dashboard Page 수정**:
```typescript
// 기존 빈 배열 대신 실제 데이터 사용
const chartData = data?.chartData ?? []

// 차트 컴포넌트에 전달
<KPIChart
  data={chartData.map((d) => ({ label: d.date, value: d.spend }))}
  isLoading={isLoading}
/>
```

### 🔵 REFACTOR - 코드 정리

- [x] 차트 데이터 매핑 로직 정리 ✅
- [x] 로딩/에러 상태 처리 확인 ✅
- [x] 테스트 유지 확인 ✅

### ✅ Phase 1.3 품질 게이트

```bash
npm test
npm run type-check
npm run lint
npm run build
```

- [x] 모든 테스트 통과 ✅
- [x] 타입 체크 통과 ✅
- [x] 린트 통과 ✅
- [x] 빌드 성공 ✅

---

## Mock Repository 업데이트

**파일**: `tests/mocks/repositories/MockKPIRepository.ts`

```typescript
async getDailyAggregates(
  campaignIds: string[],
  startDate: Date,
  endDate: Date
): Promise<DailyKPIAggregate[]> {
  const kpis = this.kpis.filter(
    kpi =>
      campaignIds.includes(kpi.campaignId) &&
      kpi.date >= startDate &&
      kpi.date <= endDate
  )

  // Group by date
  const grouped = new Map<string, DailyKPIAggregate>()
  for (const kpi of kpis) {
    const dateKey = kpi.date.toISOString().split('T')[0]
    const existing = grouped.get(dateKey) || {
      date: kpi.date,
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0,
      totalSpend: 0,
      totalRevenue: 0,
    }
    // Aggregate...
    grouped.set(dateKey, existing)
  }

  return Array.from(grouped.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}
```

---

## 위험 요소

| 위험 | 확률 | 영향 | 완화 전략 |
|------|------|------|----------|
| Prisma groupBy 성능 이슈 | 낮음 | 중간 | 인덱스 추가, 캐싱 고려 |
| 날짜 타임존 문제 | 중간 | 낮음 | UTC 기준 처리, 테스트 검증 |
| 빈 데이터 UI 처리 | 낮음 | 낮음 | 빈 상태 UI 컴포넌트 |

---

## 롤백 전략

### Phase 1.1 롤백
```bash
git checkout -- src/domain/repositories/IKPIRepository.ts
git checkout -- src/infrastructure/database/repositories/PrismaKPIRepository.ts
```

### Phase 1.2 롤백
```bash
git checkout -- src/application/dto/kpi/DashboardKPIDTO.ts
git checkout -- src/application/use-cases/kpi/GetDashboardKPIUseCase.ts
```

### Phase 1.3 롤백
```bash
git checkout -- src/app/api/dashboard/kpi/route.ts
git checkout -- src/app/(dashboard)/dashboard/page.tsx
```

---

## Notes & Learnings

- Prisma groupBy를 활용한 일별 집계 구현
- ChartDataPointDTO로 프론트엔드와 타입 공유
- ROAS 계산 시 0 나누기 방지 처리
- KPIChart 컴포넌트 재사용으로 spend/roas 차트 구현

---

## 완료 기준

- [x] getDailyAggregates 메서드 구현 및 테스트 통과 ✅
- [x] GetDashboardKPIUseCase에서 chartData 반환 ✅
- [x] API 응답에 chartData 포함 ✅
- [x] 대시보드 차트에 실제 KPI 추이 표시 ✅
- [x] 모든 테스트 통과 (30개 KPI 테스트) ✅
- [x] Application 레이어 커버리지 ≥90% ✅

**완료일**: 2026-01-07
