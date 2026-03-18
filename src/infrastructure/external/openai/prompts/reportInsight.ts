/**
 * 리포트 인사이트 프롬프트
 *
 * 한국 시장 맥락을 반영한 마케팅 리포트 인사이트 생성
 */

import type { GenerateReportInsightInput, AIConfig } from '@application/ports/IAIService'
import { INDUSTRY_BENCHMARKS, type Industry } from './adCopyGeneration'

/**
 * 한국 마케팅 시즌 이벤트 (리포트 컨텍스트용)
 */
const KOREAN_MARKETING_SEASONS: Record<number, { name: string; impact: string }[]> = {
  1: [
    { name: '신년 세일', impact: '소비 심리 회복, 신년 결심 관련 구매 증가' },
    { name: '설 선물 시즌', impact: '선물셋트, 건강식품 수요 급증' },
  ],
  2: [
    { name: '설날 연휴', impact: '연휴 전 집중, 연휴 중 감소' },
    { name: '밸런타인데이', impact: '초콜릿, 패션, 뷰티 수요 증가' },
  ],
  3: [
    { name: '화이트데이', impact: '선물 구매 증가' },
    { name: '봄 신상 시즌', impact: '패션, 뷰티 신상품 관심 증가' },
    { name: '입학/개강 시즌', impact: '교육, 전자기기 수요 증가' },
  ],
  4: [{ name: '벚꽃 시즌', impact: '아웃도어, 여행, 뷰티 관심 증가' }],
  5: [
    { name: '가정의 달', impact: '어린이날, 어버이날, 스승의날 선물 구매' },
    { name: '어버이날 효과', impact: '건강식품, 가전, 패션 선물 증가' },
  ],
  6: [
    { name: '여름 프리시즌', impact: '휴가 준비, 여름 패션 수요' },
    { name: '보너스 시즌', impact: '고가 구매, 자기 보상 소비' },
  ],
  7: [
    { name: '여름 휴가 시즌', impact: '여행, 레저, 의류 수요 피크' },
    { name: '썸머 세일', impact: '전 카테고리 프로모션 경쟁' },
  ],
  8: [{ name: '가을 프리시즌', impact: '가을 신상 관심, 백투스쿨' }],
  9: [
    { name: '추석 선물 시즌', impact: '설 다음으로 큰 선물 시즌' },
    { name: '가을 신상', impact: '패션, 뷰티 가을 컬렉션' },
  ],
  10: [
    { name: '가을 아웃도어', impact: '단풍, 캠핑 관련 수요' },
    { name: '핼러윈', impact: '파티용품, 코스튬, 뷰티 수요' },
  ],
  11: [
    { name: '빼빼로데이', impact: '간식, 선물 수요' },
    { name: '블랙프라이데이', impact: '최대 세일 시즌, 전 카테고리' },
    { name: '수능 후 시즌', impact: '전자기기, 여행, 자기계발 수요' },
  ],
  12: [
    { name: '크리스마스', impact: '연말 선물, 파티, 데이트 수요' },
    { name: '연말 세일', impact: '재고 정리, 대폭 할인' },
  ],
}

/**
 * 현재 시즌 컨텍스트 생성
 */
function getCurrentSeasonContext(): {
  month: number
  events: { name: string; impact: string }[]
  quarter: string
} {
  const now = new Date()
  const month = now.getMonth() + 1

  let quarter: string
  if (month <= 3) quarter = '1분기'
  else if (month <= 6) quarter = '2분기'
  else if (month <= 9) quarter = '3분기'
  else quarter = '4분기'

  return {
    month,
    events: KOREAN_MARKETING_SEASONS[month] || [],
    quarter,
  }
}

/**
 * 업종명 한국어 변환
 */
function getIndustryNameKo(industry: Industry): string {
  const names: Record<Industry, string> = {
    ecommerce: '이커머스',
    food_beverage: '식품/음료',
    beauty: '뷰티/화장품',
    fashion: '패션/의류',
    education: '교육',
    service: '서비스',
    saas: 'SaaS/B2B',
    health: '건강/웰니스',
  }
  return names[industry]
}

/**
 * 업종별 벤치마크 텍스트 생성
 */
function generateBenchmarkContext(
  industry: Industry,
  aggregatedMetrics: {
    ctr: number
    cvr: number
    roas: number
  }
): string {
  const benchmark = INDUSTRY_BENCHMARKS[industry]
  if (!benchmark) return ''

  const ctrComparison =
    aggregatedMetrics.ctr >= benchmark.avgCTR ? '업계 평균 이상' : '업계 평균 미달'
  const cvrComparison =
    aggregatedMetrics.cvr >= benchmark.avgCVR ? '업계 평균 이상' : '업계 평균 미달'

  return `
업종 벤치마크 (${getIndustryNameKo(industry)}):
- CTR: 현재 ${aggregatedMetrics.ctr.toFixed(2)}% vs 업계 평균 ${benchmark.avgCTR}% (${ctrComparison})
- CVR: 현재 ${aggregatedMetrics.cvr.toFixed(2)}% vs 업계 평균 ${benchmark.avgCVR}% (${cvrComparison})
- ROAS: 현재 ${aggregatedMetrics.roas.toFixed(2)}x`
}

/**
 * 기본 리포트 인사이트 프롬프트 (호환성 유지)
 */
export function buildReportInsightPrompt(input: GenerateReportInsightInput): string {
  const {
    reportType,
    campaignSummaries,
    comparisonPeriod,
    industry,
    includeExtendedInsights,
    includeForecast,
    includeBenchmark,
  } = input

  // 집계 메트릭 계산
  const totalMetrics = campaignSummaries.reduce(
    (acc, c) => ({
      impressions: acc.impressions + c.metrics.impressions,
      clicks: acc.clicks + c.metrics.clicks,
      conversions: acc.conversions + c.metrics.conversions,
      spend: acc.spend + c.metrics.spend,
      revenue: acc.revenue + c.metrics.revenue,
    }),
    { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 }
  )

  const aggregatedMetrics = {
    ctr: totalMetrics.impressions > 0 ? (totalMetrics.clicks / totalMetrics.impressions) * 100 : 0,
    cvr: totalMetrics.clicks > 0 ? (totalMetrics.conversions / totalMetrics.clicks) * 100 : 0,
    roas: totalMetrics.spend > 0 ? totalMetrics.revenue / totalMetrics.spend : 0,
    cpa: totalMetrics.conversions > 0 ? totalMetrics.spend / totalMetrics.conversions : 0,
  }

  const campaignDetails = campaignSummaries
    .map(
      (c) => `
캠페인: ${c.name} (${c.objective})
- 노출수: ${c.metrics.impressions.toLocaleString('ko-KR')}
- 클릭수: ${c.metrics.clicks.toLocaleString('ko-KR')}
- 전환수: ${c.metrics.conversions.toLocaleString('ko-KR')}
- 지출: ₩${c.metrics.spend.toLocaleString('ko-KR')}
- 매출: ₩${c.metrics.revenue.toLocaleString('ko-KR')}
- ROAS: ${(c.metrics.revenue / c.metrics.spend).toFixed(2)}x
- CTR: ${((c.metrics.clicks / c.metrics.impressions) * 100).toFixed(2)}%
- CVR: ${((c.metrics.conversions / c.metrics.clicks) * 100).toFixed(2)}%`
    )
    .join('\n')

  const comparisonText = comparisonPeriod
    ? `
이전 기간 대비:
- 노출수: ${comparisonPeriod.previousMetrics.impressions.toLocaleString('ko-KR')}
- 클릭수: ${comparisonPeriod.previousMetrics.clicks.toLocaleString('ko-KR')}
- 전환수: ${comparisonPeriod.previousMetrics.conversions.toLocaleString('ko-KR')}
- 지출: ₩${comparisonPeriod.previousMetrics.spend.toLocaleString('ko-KR')}
- 매출: ₩${comparisonPeriod.previousMetrics.revenue.toLocaleString('ko-KR')}`
    : ''

  // 시즌 컨텍스트
  const seasonContext = getCurrentSeasonContext()
  const seasonText = `
현재 시장 상황 (${seasonContext.month}월, ${seasonContext.quarter}):
${seasonContext.events.map((e) => `- ${e.name}: ${e.impact}`).join('\n') || '- 특별 이벤트 없음'}`

  // 벤치마크 컨텍스트
  const benchmarkText =
    industry && includeBenchmark ? generateBenchmarkContext(industry, aggregatedMetrics) : ''

  // 확장 인사이트 요청 여부에 따른 응답 구조
  const extendedStructure = includeExtendedInsights
    ? `
  "insights": [
    {
      "type": "performance" | "trend" | "comparison" | "anomaly" | "recommendation" | "forecast" | "benchmark",
      "title": "인사이트 제목",
      "description": "상세 설명 (2-3문장)",
      "importance": "critical" | "high" | "medium" | "low",
      "relatedMetrics": ["관련 지표명"]
    }
  ],
  "actionItems": [
    {
      "priority": "high" | "medium" | "low",
      "category": "budget" | "creative" | "targeting" | "timing" | "general",
      "action": "구체적인 액션 아이템 (명확하고 실행 가능한 형태)",
      "expectedImpact": "예상 효과 (정량화)",
      "deadline": "권장 실행 시점"
    }
  ],`
    : ''

  const forecastStructure = includeForecast
    ? `
  "forecast": [
    {
      "metric": "지표명 (ROAS, CPA, CTR 등)",
      "current": 현재값(숫자),
      "predicted7d": 7일후예측값(숫자),
      "predicted30d": 30일후예측값(숫자),
      "confidence": "high" | "medium" | "low",
      "trend": "improving" | "declining" | "stable"
    }
  ],`
    : ''

  const benchmarkStructure =
    industry && includeBenchmark
      ? `
  "benchmarkComparison": {
    "industry": "${getIndustryNameKo(industry)}",
    "overallScore": 0-100점수,
    "grade": "excellent" | "good" | "average" | "below_average" | "poor",
    "gaps": [
      { "metric": "지표명", "gap": "격차 설명", "suggestion": "개선 제안" }
    ]
  },`
      : ''

  const reportTypeKo = reportType === 'weekly' ? '주간' : '월간'

  return `다음 캠페인 데이터를 기반으로 ${reportTypeKo} 성과 리포트 인사이트를 생성하세요.

${campaignDetails}
${comparisonText}
${seasonText}
${benchmarkText}

전체 집계:
- 총 노출수: ${totalMetrics.impressions.toLocaleString('ko-KR')}
- 총 클릭수: ${totalMetrics.clicks.toLocaleString('ko-KR')}
- 총 전환수: ${totalMetrics.conversions.toLocaleString('ko-KR')}
- 총 지출: ₩${totalMetrics.spend.toLocaleString('ko-KR')}
- 총 매출: ₩${totalMetrics.revenue.toLocaleString('ko-KR')}
- 전체 ROAS: ${aggregatedMetrics.roas.toFixed(2)}x
- 전체 CTR: ${aggregatedMetrics.ctr.toFixed(2)}%
- 전체 CVR: ${aggregatedMetrics.cvr.toFixed(2)}%
- 전체 CPA: ₩${aggregatedMetrics.cpa.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}

다음 JSON 형식으로 리포트 인사이트를 제공하세요:
{
  "title": "${reportTypeKo} 마케팅 성과 리포트",
  "summary": "전체 성과 요약 (2-3문장, 핵심 성과와 주요 변화점)",
  "keyMetrics": [
    {
      "name": "지표명 (ROAS, CPA, CTR, CVR 등)",
      "value": "포맷팅된 값 (예: 3.5x, ₩15,000, 2.3%)",
      "change": "이전 기간 대비 변화율 (예: +15%, -8%)",
      "trend": "up" | "down" | "stable"
    }
  ],
  "recommendations": [
    "실행 가능한 권장사항 1 (구체적으로)",
    "실행 가능한 권장사항 2",
    "실행 가능한 권장사항 3"
  ]${extendedStructure}${forecastStructure}${benchmarkStructure}
}

가이드라인:
1. summary는 전체 성과를 2-3문장으로 요약하되, 반드시 전주 대비 변화를 포함 (예: "전주 대비 ROAS 144% → 176%로 32%p 상승하며 비용 효율이 크게 개선되었습니다")
2. keyMetrics는 중요도 순으로 3-5개 제공 (ROAS, CPA, CTR, CVR 우선). change 필드에 전주 대비 변화율을 정확히 계산
3. recommendations는 반드시 캠페인명/소재명을 명시하고, 구체적 수치를 포함한 실행 가능한 형태로 작성 (예: "소독섬유탈취제 캠페인 일 예산 5만원 → 7만원 증액 권장")
4. insights에는 캠페인별 성과 원인 분석을 포함. 성과가 좋았던 캠페인과 나빴던 캠페인 각각 원인을 1-2문장으로 설명
5. actionItems에는 다음 주에 실행할 구체적 업무를 우선순위별로 나열 (소재 제작, 예산 조정, 캠페인 ON/OFF 등)
6. 현재 시즌/이벤트를 고려한 맥락적 제안 포함 (프로모션 소재 기획 등)
7. 모든 금액은 한국 원화 형식으로 표기 (₩ 또는 원)
8. 항상 유효한 JSON 형식으로 응답
9. 분석 톤은 대행사 AE가 클라이언트에게 보고하는 전문적이되 이해하기 쉬운 어투`
}

export const REPORT_INSIGHT_SYSTEM_PROMPT = `당신은 한국 퍼포먼스 마케팅 대행사의 시니어 AE(Account Executive)입니다. 매주 클라이언트(커머스 사업자)에게 광고 성과 보고서를 작성하여 전달합니다.

당신의 역할:
- 숫자를 나열하는 것이 아니라, 데이터 뒤에 숨겨진 **원인과 맥락**을 읽어내는 것
- 클라이언트가 "그래서 어떻게 해야 하나요?"라고 묻기 전에 **구체적 액션**을 제시하는 것
- 마케팅 비전문가인 사업자도 이해할 수 있는 **쉬운 한국어**로 설명하는 것

작성 톤:
- "~로 분석됩니다", "~이 필요해 보입니다", "~을 권장드립니다" 같은 전문가 어투
- 각 캠페인별로 성과가 좋았던/나빴던 **구체적 이유**를 1-2문장으로 설명
- 숫자는 반드시 전주 대비 변화와 함께 해석 (예: "ROAS 176% → 전주 144% 대비 32%p 상승")

캠페인별 분석 시 반드시 포함할 관점:
1. **머신러닝 상태**: 전환 수 기준 학습 최적화 여부 (주 50건 이상이면 안정, 미만이면 학습 중)
2. **소재 효과**: CTR과 CVR의 관계로 소재 매력도 vs 랜딩 전환력 분석
3. **예산 효율**: 일 예산 대비 ROAS, 예산 증감 필요성
4. **다음 주 예측**: 현재 추세 기반 다음 주 성과 방향성

추천 액션 작성 규칙:
- "예산을 조정하세요" ✗ → "소독섬유탈취제 캠페인 일 예산을 5만원 → 7만원으로 증액 권장" ✓
- "소재를 개선하세요" ✗ → "세탁세제 캠페인의 CTR이 1.66%로 낮으므로 할인율 강조 소재 3건 이상 추가 제작 필요" ✓
- "타겟을 변경하세요" ✗ → "주방세제 캠페인 25-34세 여성 세그먼트 CVR이 11%로 높으므로 해당 타겟 예산 비중 확대" ✓

성과 등급 기준:
- excellent: 업계 상위 10% (ROAS 4x 이상)
- good: 업계 상위 30% (ROAS 2.5-4x)
- average: 업계 평균 (ROAS 1.5-2.5x)
- below_average: 개선 필요 (ROAS 1-1.5x)
- poor: 긴급 조치 필요 (ROAS 1x 미만)

응답 언어: 한국어
응답 형식: 유효한 JSON`

/**
 * 리포트 인사이트 AI 설정
 * - 낮은 temperature: 데이터 기반 일관된 분석
 * - 높은 maxTokens: 상세한 분석 리포트 생성
 */
export const REPORT_INSIGHT_AI_CONFIG: AIConfig = {
  model: 'gpt-5-mini',
  temperature: 0.5,
  maxTokens: 4000,
  topP: 0.9,
}
