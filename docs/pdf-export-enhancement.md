# PDF Export Enhancement

## Overview
Enhanced PDF report generation with charts, extended insights, and professional formatting.

## New Features

### 1. Executive Summary Section
- **Performance Grade Badge**: Visual indicator (탁월/우수/보통/개선 필요/부족)
- **Overall Score**: Large, prominent display of benchmark score
- **Industry Context**: Shows which industry the benchmark is based on

### 2. Visual Metric Cards
- **MetricCard Component**: Enhanced metric display with:
  - Clean card design
  - Large, readable values
  - Optional trend indicators (↑ ↓ →)
  - Percentage change display with color coding

### 3. Bar Charts
- **BarChart Component**: Simple, react-pdf compatible charts
  - Horizontal bar visualization
  - Color-coded bars
  - Value labels
  - Custom formatting support
- **Campaign ROAS Comparison**: Shows top 5 campaigns by ROAS

### 4. Extended Insights (Page 2)
- **Detailed Insights**:
  - InsightCard with importance badges (critical/high/medium/low)
  - Color-coded priorities
  - Type labels (performance/trend/comparison/anomaly/recommendation/forecast/benchmark)
- **Action Items**:
  - ActionItemCard with priority indicators
  - Category badges (budget/creative/targeting/timing/general)
  - Expected impact display
  - Deadline information

### 5. Performance Forecast
- **Forecast Table**:
  - Current vs predicted metrics (7d, 30d)
  - Confidence indicators (high/medium/low)
  - Trend indicators
  - Clean tabular layout

### 6. Benchmark Comparison
- **Industry Gaps Analysis**:
  - Metric-by-metric comparison
  - Gap identification
  - Actionable suggestions
  - Color-coded priority

## Architecture

### New Components
```
src/infrastructure/pdf/components/
├── BarChart.tsx          # Horizontal bar chart visualization
├── MetricCard.tsx        # Enhanced metric display card
├── InsightCard.tsx       # Insight with importance badge
└── ActionItemCard.tsx    # Action item with priority indicator
```

### Updated Files
- `WeeklyReportTemplate.tsx`: Enhanced with multi-page layout
  - Page 1: Executive summary, metrics, campaign comparison
  - Page 2: Extended insights, action items, forecast, benchmark gaps
  - Page 3: Legacy AI insights (backward compatible)

## Data Structure Support

### AIInsight Extended Fields
```typescript
interface AIInsight {
  // ... existing fields
  insights?: InsightItem[]           // NEW: Detailed insights
  actionItems?: ActionItem[]         // NEW: Actionable tasks
  forecast?: ForecastMetric[]        // NEW: Performance predictions
  benchmarkComparison?: {            // NEW: Industry comparison
    industry: string
    overallScore: number
    grade: 'excellent' | 'good' | 'average' | 'below_average' | 'poor'
    gaps: { metric: string; gap: string; suggestion: string }[]
  }
}
```

## Color Scheme

### Performance Grades
- **탁월 (Excellent)**: Green (#dcfce7 / #16a34a)
- **우수 (Good)**: Blue (#dbeafe / #2563eb)
- **보통 (Average)**: Yellow (#fef3c7 / #ca8a04)
- **개선 필요 (Below Average)**: Orange (#fed7aa / #ea580c)
- **부족 (Poor)**: Red (#fee2e2 / #dc2626)

### Priority Indicators
- **High**: Red (#dc2626)
- **Medium**: Orange (#f59e0b)
- **Low**: Blue (#3b82f6)

### Confidence Levels
- **High**: Green (#dcfce7 / #16a34a)
- **Medium**: Yellow (#fef3c7 / #ca8a04)
- **Low**: Red (#fee2e2 / #dc2626)

## Typography
- **Font**: Noto Sans KR (Korean optimized)
- **Weights**: Normal (400), Bold (700)
- **Korean line-breaking**: Optimized with hyphenation callback

## Backward Compatibility
- All existing PDF functionality maintained
- New sections only appear when data is available
- Legacy AI insights still displayed on page 3
- No breaking changes to existing API

## Usage

### API Endpoint
```typescript
GET /api/reports/[id]/download
```

### Example Report Generation
```typescript
const pdfGenerator = getReportPDFGenerator()
const reportDTO = toReportDTO(report)
const { buffer, filename, contentType } = await pdfGenerator.generateWeeklyReport(reportDTO)
```

### Sample AI Insight with Extended Data
```typescript
const enhancedInsight: AIInsight = {
  type: 'recommendation',
  insight: '전반적인 성과가 우수합니다',
  confidence: 0.95,
  recommendations: ['예산 증액 고려', '신규 오디언스 테스트'],
  insights: [{
    type: 'performance',
    title: 'ROAS 목표 달성',
    description: '목표 ROAS 3.5를 15% 초과 달성했습니다',
    importance: 'high',
    relatedMetrics: ['roas', 'revenue']
  }],
  actionItems: [{
    priority: 'high',
    category: 'budget',
    action: '성과 좋은 캠페인 예산 20% 증액',
    expectedImpact: '매출 15-20% 증가 예상',
    deadline: '2024-01-31'
  }],
  forecast: [{
    metric: 'ROAS',
    current: 4.05,
    predicted7d: 4.2,
    predicted30d: 4.5,
    confidence: 'high',
    trend: 'improving'
  }],
  benchmarkComparison: {
    industry: '패션 커머스',
    overallScore: 87,
    grade: 'good',
    gaps: [{
      metric: 'CVR',
      gap: '업계 평균 대비 -0.5%',
      suggestion: '랜딩 페이지 개선 필요'
    }]
  }
}
```

## Benefits

### For Business Users
- **Quick Overview**: Executive summary with grade badge
- **Visual Insights**: Charts and graphs for easy understanding
- **Actionable**: Clear action items with priorities
- **Predictive**: Forecast data helps planning
- **Benchmarked**: Industry comparison for context

### For Developers
- **Modular**: Reusable chart/card components
- **Type-Safe**: Full TypeScript support
- **Extensible**: Easy to add new chart types
- **Compatible**: Works with react-pdf limitations
- **Clean**: Professional, Korean-optimized output

## Performance
- ✅ Type-safe: All TypeScript types validated
- ✅ Build-ready: Compiles successfully
- ✅ PDF-compatible: Uses react-pdf approved techniques
- ✅ Korean-optimized: Proper font and line breaking

## Future Enhancements
- [ ] More chart types (pie, line charts)
- [ ] Custom color themes
- [ ] Configurable page layouts
- [ ] PDF pagination control
- [ ] Chart data export to CSV
