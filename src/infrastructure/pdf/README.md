# PDF 보고서 템플릿 시스템

바투 AI 마케팅 솔루션의 PDF 보고서 생성 시스템입니다.

## 개요

다양한 보고서 유형을 지원하는 확장 가능한 템플릿 시스템으로, @react-pdf/renderer를 사용하여 고품질 PDF를 생성합니다.

## 디렉토리 구조

```
src/infrastructure/pdf/
├── templates/
│   ├── BaseReportTemplate.tsx      # 공통 베이스 클래스 및 유틸리티
│   ├── DailyReportTemplate.tsx     # 일간 성과 보고서
│   ├── WeeklyReportTemplate.tsx    # 주간 종합 보고서
│   ├── MonthlyReportTemplate.tsx   # 월간 분석 보고서
│   ├── CampaignReportTemplate.tsx  # 캠페인별 상세 보고서
│   └── ExecutiveReportTemplate.tsx # 경영진 요약 보고서
├── components/
│   ├── BarChart.tsx                # 막대 차트 컴포넌트
│   ├── MetricCard.tsx              # 지표 카드
│   ├── InsightCard.tsx             # 인사이트 카드
│   └── ActionItemCard.tsx          # 액션 아이템 카드
├── PDFReportService.ts             # 보고서 생성 서비스
├── ReportPDFGenerator.ts           # 레거시 생성기 (하위 호환성)
├── types.ts                        # 공통 타입 정의
└── index.ts                        # 모듈 내보내기
```

## 사용법

### 1. 기본 사용 예제

```typescript
import { pdfReportService } from '@infrastructure/pdf'
import type { ReportDTO } from '@application/dto/report/ReportDTO'

// 주간 보고서 생성
const report: ReportDTO = {
  // ... 보고서 데이터
}

const result = await pdfReportService.generateWeeklyReport(report)

// 결과
// result.buffer: Buffer (PDF 파일)
// result.filename: string (예: "바투_주간리포트_20240108_20240114.pdf")
// result.contentType: "application/pdf"
```

### 2. 다양한 템플릿 사용

```typescript
// 일간 보고서
const daily = await pdfReportService.generateDailyReport(report)

// 월간 보고서
const monthly = await pdfReportService.generateMonthlyReport(report)

// 캠페인 상세 보고서
const campaign = await pdfReportService.generateCampaignReport(report)

// 경영진 요약 보고서 (1페이지)
const executive = await pdfReportService.generateExecutiveReport(report)
```

### 3. 옵션과 함께 생성

```typescript
import type { PDFGenerationOptions } from '@infrastructure/pdf'

const options: PDFGenerationOptions = {
  includeCharts: true,
  includeBenchmarks: true,
  includeForecasts: true,
  includeActionItems: true,
  maxCampaigns: 10,
  locale: 'ko-KR',
}

const result = await pdfReportService.generateReport('WEEKLY', report, options)
```

### 4. 사용 가능한 템플릿 조회

```typescript
const templates = pdfReportService.getAvailableTemplates()

templates.forEach(template => {
  console.log(template.type)        // 'DAILY' | 'WEEKLY' | ...
  console.log(template.name)        // '일간 성과 보고서'
  console.log(template.description) // '일별 KPI 요약, ...'
})
```

### 5. 보고서 데이터 검증

```typescript
const validation = pdfReportService.validateReportData(report)

if (!validation.valid) {
  console.error('검증 실패:', validation.errors)
  // ['Start date is required', 'At least one section is required']
}
```

## 템플릿 유형

### 1. DailyReportTemplate (일간 보고서)

**특징:**
- 1페이지 간결한 형식
- 전일 대비 변화율 표시
- 주요 캠페인 성과 하이라이트
- 오늘의 하이라이트 박스

**섹션:**
- 오늘의 성과 (8개 핵심 지표)
- 전일 대비 변화 (4개 주요 지표)
- 주요 캠페인 성과 (상위 5개 차트)
- 오늘의 하이라이트

### 2. WeeklyReportTemplate (주간 보고서)

**특징:**
- 2-3페이지 상세 분석
- 종합 평가 및 등급
- 캠페인별 ROAS 비교
- AI 인사이트 및 액션 아이템

**섹션:**
- 종합 평가 (업계 벤치마크)
- 성과 요약
- 캠페인별 성과
- 상세 인사이트
- 실행 과제
- 성과 예측
- 업계 대비 개선점

### 3. MonthlyReportTemplate (월간 보고서)

**특징:**
- 3페이지 심층 분석
- 목표 달성률 진행 바
- 주차별 성과 분해
- 경영진 요약

**섹션:**
- 경영진 요약
- 월간 성과
- 목표 달성률 (진행 바)
- 캠페인별 성과 분석
- 주차별 성과
- AI 월간 인사이트

### 4. CampaignReportTemplate (캠페인 보고서)

**특징:**
- 2페이지 단일 캠페인 집중 분석
- 일별 성과 추이
- 일별 상세 타임라인
- 최적화 제안

**섹션:**
- 캠페인 정보
- 요약 지표 (9개)
- 일별 성과 추이
- 일별 상세 성과
- 최적화 제안
- 타겟팅 설정

### 5. ExecutiveReportTemplate (경영진 보고서)

**특징:**
- 1페이지 요약
- 핵심 KPI만 표시
- 전기 대비 비교
- 주요 인사이트만 3개

**섹션:**
- 핵심 KPI (2x2 그리드)
- 핵심 요약
- 주요 인사이트 (최대 3개)

## API 엔드포인트에서 사용

```typescript
// app/api/reports/[id]/pdf/route.ts
import { pdfReportService } from '@infrastructure/pdf'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 1. 보고서 데이터 조회
  const report = await getReportById(params.id)

  // 2. PDF 생성
  const pdf = await pdfReportService.generateReport(
    report.type,
    toReportDTO(report)
  )

  // 3. 응답 반환
  return new Response(pdf.buffer, {
    headers: {
      'Content-Type': pdf.contentType,
      'Content-Disposition': `attachment; filename="${pdf.filename}"`,
    },
  })
}
```

## 커스텀 템플릿 추가

### 1. 새 템플릿 생성

```typescript
// templates/QuarterlyReportTemplate.tsx
import React from 'react'
import { Document, Page, Text, View } from '@react-pdf/renderer'
import { baseStyles, formatNumber, formatCurrency } from './BaseReportTemplate'

export function QuarterlyReportTemplate({ report }: { report: ReportDTO }) {
  return (
    <Document>
      <Page size="A4" style={baseStyles.page}>
        {/* 템플릿 내용 */}
      </Page>
    </Document>
  )
}
```

### 2. PDFReportService에 등록

```typescript
// PDFReportService.ts
const AVAILABLE_TEMPLATES: ReportTemplate[] = [
  // ... 기존 템플릿
  {
    type: 'QUARTERLY',
    name: '분기별 보고서',
    description: '분기별 성과 및 목표 달성률',
    component: QuarterlyReportTemplate,
  },
]
```

### 3. 타입 추가

```typescript
// types.ts
export type ReportTemplateType =
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'CAMPAIGN'
  | 'EXECUTIVE'
  | 'QUARTERLY' // 추가
```

## 유틸리티 함수

### 포맷팅 함수

```typescript
import {
  formatNumber,
  formatCurrency,
  formatPercent,
  formatDate,
  formatDateShort,
} from '@infrastructure/pdf'

formatNumber(1234567)           // "1,234,567"
formatCurrency(10000)           // "₩10,000"
formatCurrency(10000, 'USD')    // "$10,000"
formatPercent(12.3456)          // "12.35%"
formatPercent(12.3456, 1)       // "12.3%"
formatDate('2024-01-15')        // "2024년 1월 15일"
formatDateShort('2024-01-15')   // "1월 15일"
```

### 베이스 스타일 사용

```typescript
import { baseStyles } from '@infrastructure/pdf'

const styles = StyleSheet.create({
  ...baseStyles,
  customStyle: {
    backgroundColor: '#f0f0f0',
  },
})
```

## 스케줄링 (향후 구현)

```typescript
// 주간 보고서 자동 생성 스케줄 등록
await pdfReportService.scheduleReport(
  'WEEKLY',
  '0 9 * * 1', // 매주 월요일 오전 9시
  'user-123'
)
```

## 테스트

```bash
# 전체 PDF 테스트 실행
npm run test:unit tests/unit/infrastructure/pdf

# 특정 템플릿 테스트
npm run test:unit tests/unit/infrastructure/pdf/templates/DailyReportTemplate.test.tsx

# 서비스 테스트
npm run test:unit tests/unit/infrastructure/pdf/PDFReportService.test.ts
```

## 성능 고려사항

1. **폰트 로딩**: Noto Sans KR 폰트는 CDN에서 로드되므로 첫 생성 시 약간의 지연이 있을 수 있습니다.

2. **대용량 보고서**: 캠페인이 많거나 데이터가 방대한 경우 생성 시간이 증가할 수 있습니다. 옵션의 `maxCampaigns`로 제한하세요.

3. **메모리**: PDF 생성은 메모리를 사용하므로 서버리스 환경에서는 메모리 제한에 주의하세요.

## 문제 해결

### 한글 깨짐
- Noto Sans KR 폰트가 올바르게 로드되었는지 확인
- CDN 접근이 가능한지 확인

### 생성 실패
- `validateReportData()`로 데이터 검증
- 필수 필드 확인 (dateRange, summaryMetrics, sections)

### 스타일 적용 안됨
- @react-pdf/renderer의 StyleSheet 사용
- 일반 CSS는 지원되지 않음

## 라이센스

MIT License - 바투 AI 마케팅 솔루션
