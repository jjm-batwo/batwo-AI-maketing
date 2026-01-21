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
  4: [
    { name: '벚꽃 시즌', impact: '아웃도어, 여행, 뷰티 관심 증가' },
  ],
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
  8: [
    { name: '가을 프리시즌', impact: '가을 신상 관심, 백투스쿨' },
  ],
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
function getCurrentSeasonContext(): { month: number; events: { name: string; impact: string }[]; quarter: string } {
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
function generateBenchmarkContext(industry: Industry, aggregatedMetrics: {
  ctr: number
  cvr: number
  roas: number
}): string {
  const benchmark = INDUSTRY_BENCHMARKS[industry]
  if (!benchmark) return ''

  const ctrComparison = aggregatedMetrics.ctr >= benchmark.avgCTR ? '업계 평균 이상' : '업계 평균 미달'
  const cvrComparison = aggregatedMetrics.cvr >= benchmark.avgCVR ? '업계 평균 이상' : '업계 평균 미달'

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
  const { reportType, campaignSummaries, comparisonPeriod, industry, includeExtendedInsights, includeForecast, includeBenchmark } = input

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
  const benchmarkText = industry && includeBenchmark
    ? generateBenchmarkContext(industry, aggregatedMetrics)
    : ''

  // 확장 인사이트 요청 여부에 따른 응답 구조
  const extendedStructure = includeExtendedInsights ? `
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
  ],` : ''

  const forecastStructure = includeForecast ? `
  "forecast": [
    {
      "metric": "지표명 (ROAS, CPA, CTR 등)",
      "current": 현재값(숫자),
      "predicted7d": 7일후예측값(숫자),
      "predicted30d": 30일후예측값(숫자),
      "confidence": "high" | "medium" | "low",
      "trend": "improving" | "declining" | "stable"
    }
  ],` : ''

  const benchmarkStructure = industry && includeBenchmark ? `
  "benchmarkComparison": {
    "industry": "${getIndustryNameKo(industry)}",
    "overallScore": 0-100점수,
    "grade": "excellent" | "good" | "average" | "below_average" | "poor",
    "gaps": [
      { "metric": "지표명", "gap": "격차 설명", "suggestion": "개선 제안" }
    ]
  },` : ''

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
1. 요약은 사업자가 한눈에 성과를 파악할 수 있도록 핵심만 작성
2. keyMetrics는 중요도 순으로 3-5개 제공 (ROAS, CPA, CTR, CVR 우선)
3. 이전 기간 데이터가 있으면 변화율(change)을 정확히 계산
4. recommendations는 구체적이고 실행 가능한 형태로 작성
5. 현재 시즌/이벤트를 고려한 맥락적 제안 포함
6. 모든 금액은 한국 원화(₩) 형식으로 표기
7. 항상 유효한 JSON 형식으로 응답`
}

export const REPORT_INSIGHT_SYSTEM_PROMPT = `당신은 한국 디지털 마케팅 리포트 전문 분석가입니다. 캠페인 성과 데이터를 분석하여 사업자가 쉽게 이해하고 실행할 수 있는 인사이트를 제공합니다.

전문 분야:
1. 이커머스 및 D2C 브랜드 마케팅 성과 분석
2. Meta 광고 캠페인 최적화 전략
3. 한국 소비자 행동 패턴 및 시즌 트렌드
4. 데이터 기반 마케팅 의사결정 지원

분석 원칙:
1. **명확성**: 비전문가도 이해할 수 있는 쉬운 언어 사용
2. **실행 가능성**: 모든 권장사항은 바로 실행할 수 있는 구체적 형태
3. **맥락적 해석**: 시즌, 업종 특성을 고려한 성과 해석
4. **정량적 근거**: 수치와 비교를 통한 객관적 분석
5. **우선순위**: 가장 중요한 인사이트부터 제시

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
  model: 'gpt-4o-mini',
  temperature: 0.4,
  maxTokens: 3000,
  topP: 0.85,
}
