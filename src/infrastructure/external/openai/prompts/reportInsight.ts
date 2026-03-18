/**
 * 리포트 인사이트 프롬프트
 *
 * 한국 시장 맥락을 반영한 마케팅 리포트 인사이트 생성
 *
 * 개선 이력:
 * - v1: 기본 분석가 프롬프트
 * - v2: 시니어 AE 페르소나 + 구체적 액션 지시
 * - v3: 6개 구조적 문제 수정 (역할 분리, 환각 방지, ₩ 통일, 제로 필터링, 소재 데이터)
 */

import type { GenerateReportInsightInput, AIConfig } from '@application/ports/IAIService'
import { INDUSTRY_BENCHMARKS, type Industry } from './adCopyGeneration'

// ========================================
// 한국 마케팅 시즌 이벤트
// ========================================

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
  return { month, events: KOREAN_MARKETING_SEASONS[month] || [], quarter }
}

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

function generateBenchmarkContext(
  industry: Industry,
  aggregatedMetrics: { ctr: number; cvr: number; roas: number }
): string {
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

// ========================================
// 금액 포맷 헬퍼 (₩ 절대 사용 안 함)
// ========================================

function formatWon(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.round(amount)) + '원'
}

// ========================================
// 시스템 프롬프트 — 역할/인격/톤만 (고정 부분)
// ========================================

export const REPORT_INSIGHT_SYSTEM_PROMPT = `당신은 한국 퍼포먼스 마케팅 대행사의 시니어 AE(Account Executive)입니다.
매주 클라이언트(커머스 사업자)에게 광고 성과 보고서를 작성하여 전달합니다.

작성 원칙:
- 숫자를 나열하는 것이 아니라, 데이터 뒤에 숨겨진 원인과 맥락을 읽어내는 것
- 클라이언트가 "그래서 어떻게 해야 하나요?"라고 묻기 전에 구체적 액션을 제시하는 것
- 마케팅 비전문가인 사업자도 이해할 수 있는 쉬운 한국어로 설명하는 것

작성 톤:
- "~로 분석됩니다", "~이 필요해 보입니다", "~을 권장드립니다" 같은 전문가 어투
- 금액은 반드시 "원"을 사용 (예: 1,250,000원). 절대 다른 통화 기호 사용 금지

응답 언어: 한국어
응답 형식: 유효한 JSON`

// ========================================
// 유저 프롬프트 빌더 — 데이터 + 분석 지침 (가변 부분)
// ========================================

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

  // [Fix #6] 제로 데이터 캠페인 필터링
  const validCampaigns = campaignSummaries.filter(
    (c) => c.metrics.impressions > 0 || c.metrics.spend > 0
  )

  // 집계 메트릭 계산
  const totalMetrics = validCampaigns.reduce(
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

  // [Fix #5] 입력 데이터에서 ₩ 제거, "원"으로 통일
  const campaignDetails = validCampaigns
    .map(
      (c) => {
        const roas = c.metrics.spend > 0 ? c.metrics.revenue / c.metrics.spend : 0
        const ctr = c.metrics.impressions > 0 ? (c.metrics.clicks / c.metrics.impressions) * 100 : 0
        const cvr = c.metrics.clicks > 0 ? (c.metrics.conversions / c.metrics.clicks) * 100 : 0
        return `
캠페인: ${c.name} (${c.objective})
- 노출수: ${c.metrics.impressions.toLocaleString('ko-KR')}
- 클릭수: ${c.metrics.clicks.toLocaleString('ko-KR')}
- 전환수: ${c.metrics.conversions.toLocaleString('ko-KR')}
- 지출: ${formatWon(c.metrics.spend)}
- 매출: ${formatWon(c.metrics.revenue)}
- ROAS: ${roas.toFixed(2)}x
- CTR: ${ctr.toFixed(2)}%
- CVR: ${cvr.toFixed(2)}%`
      }
    )
    .join('\n')

  // [Fix #2] comparisonPeriod 유무에 따라 지시 분기
  const hasComparison = !!comparisonPeriod
  const comparisonText = comparisonPeriod
    ? `
이전 기간 대비:
- 노출수: ${comparisonPeriod.previousMetrics.impressions.toLocaleString('ko-KR')}
- 클릭수: ${comparisonPeriod.previousMetrics.clicks.toLocaleString('ko-KR')}
- 전환수: ${comparisonPeriod.previousMetrics.conversions.toLocaleString('ko-KR')}
- 지출: ${formatWon(comparisonPeriod.previousMetrics.spend)}
- 매출: ${formatWon(comparisonPeriod.previousMetrics.revenue)}`
    : ''

  // 시즌 컨텍스트
  const seasonContext = getCurrentSeasonContext()
  const seasonText = `
현재 시장 상황 (${seasonContext.month}월, ${seasonContext.quarter}):
${seasonContext.events.map((e) => `- ${e.name}: ${e.impact}`).join('\n') || '- 특별 이벤트 없음'}`

  // 벤치마크 컨텍스트
  const benchmarkText =
    industry && includeBenchmark ? generateBenchmarkContext(industry, aggregatedMetrics) : ''

  // 확장 인사이트 응답 구조
  const extendedStructure = includeExtendedInsights
    ? `
  "insights": [
    {
      "type": "performance" | "trend" | "comparison" | "anomaly" | "recommendation",
      "title": "인사이트 제목 (캠페인명 포함)",
      "description": "상세 설명 (2-3문장, 원인 분석 포함). 잘된 점은 type=performance/trend, 개선점은 type=anomaly/recommendation 사용",
      "importance": "critical" | "high" | "medium" | "low",
      "relatedMetrics": ["관련 지표명"]
    }
  ],
  "actionItems": [
    {
      "priority": "high" | "medium" | "low",
      "category": "budget" | "creative" | "targeting" | "timing" | "general",
      "action": "구체적인 액션 (캠페인명 + 수치 포함, 예: 'A 캠페인 일 예산 5만원에서 7만원으로 증액')",
      "expectedImpact": "예상 효과 (정량화, 예: 'ROAS 20% 개선 예상')",
      "deadline": "권장 실행 시점 (예: '다음 주 월요일')"
    }
  ],`
    : ''

  const forecastStructure = includeForecast
    ? `
  "forecast": [
    {
      "metric": "지표명",
      "current": 현재값,
      "predicted7d": 7일후예측값,
      "predicted30d": 30일후예측값,
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
    "overallScore": 0-100,
    "grade": "excellent" | "good" | "average" | "below_average" | "poor",
    "gaps": [
      { "metric": "지표명", "gap": "격차 설명", "suggestion": "개선 제안" }
    ]
  },`
      : ''

  const reportTypeKo = reportType === 'weekly' ? '주간' : reportType === 'daily' ? '일간' : '월간'

  // [Fix #2] 비교 데이터 유무에 따른 가이드라인 분기
  const summaryGuideline = hasComparison
    ? '1. summary는 전체 성과를 2-3문장으로 요약하되, 반드시 전주 대비 변화를 포함 (예: "전주 대비 ROAS 144% → 176%로 32%p 상승하며 비용 효율이 크게 개선되었습니다")'
    : '1. summary는 전체 성과를 2-3문장으로 요약하되, 현재 성과 수준을 평가 (예: "ROAS 3.80x로 양호한 성과를 보이고 있으며, CTR 2.56%로 소재 매력도가 안정적입니다")'

  const changeGuideline = hasComparison
    ? '2. keyMetrics의 change 필드에 전주 대비 변화율을 정확히 계산하여 포함'
    : '2. keyMetrics의 change 필드는 빈 문자열("")로 설정 (비교 데이터 없음)'

  return `다음 캠페인 데이터를 기반으로 ${reportTypeKo} 성과 리포트 인사이트를 생성하세요.

${campaignDetails}
${comparisonText}
${seasonText}
${benchmarkText}

전체 집계:
- 총 노출수: ${totalMetrics.impressions.toLocaleString('ko-KR')}
- 총 클릭수: ${totalMetrics.clicks.toLocaleString('ko-KR')}
- 총 전환수: ${totalMetrics.conversions.toLocaleString('ko-KR')}
- 총 지출: ${formatWon(totalMetrics.spend)}
- 총 매출: ${formatWon(totalMetrics.revenue)}
- 전체 ROAS: ${aggregatedMetrics.roas.toFixed(2)}x
- 전체 CTR: ${aggregatedMetrics.ctr.toFixed(2)}%
- 전체 CVR: ${aggregatedMetrics.cvr.toFixed(2)}%
- 전체 CPA: ${formatWon(aggregatedMetrics.cpa)}

다음 JSON 형식으로 리포트 인사이트를 제공하세요:
{
  "title": "${reportTypeKo} 마케팅 성과 리포트",
  "summary": "전체 성과 요약 (2-3문장)",
  "keyMetrics": [
    {
      "name": "지표명",
      "value": "포맷팅된 값 (예: 3.5x, 15,000원, 2.3%)",
      "change": "${hasComparison ? '전주 대비 변화율 (예: +15%, -8%)' : ''}",
      "trend": "up" | "down" | "stable"
    }
  ],
  "recommendations": [
    "캠페인명을 명시한 구체적 권장사항 (예: A 캠페인 일 예산 5만원에서 7만원으로 증액 권장)"
  ]${extendedStructure}${forecastStructure}${benchmarkStructure}
}

분석 지침:
${summaryGuideline}
${changeGuideline}
3. recommendations는 반드시 캠페인명을 명시하고 구체적 수치 포함 (예: "A 캠페인 일 예산 5만원에서 7만원으로 증액 권장")
4. insights의 type은 잘된 점=performance/trend, 개선점=anomaly/recommendation으로 분류. 각 캠페인별로 성과 원인을 1-2문장으로 분석
   - 캠페인별 분석 관점: 머신러닝 상태(주 50건 이상=안정), 소재 효과(CTR vs CVR), 예산 효율(ROAS), 다음 주 방향성
5. actionItems는 다음 주에 실행할 구체적 업무를 우선순위별로 나열 (소재 제작, 예산 조정, 캠페인 ON/OFF 등)
6. 현재 시즌/이벤트를 고려한 맥락적 제안 포함
7. 모든 금액은 "원"을 사용 (예: 1,250,000원). 다른 통화 기호 사용 금지
8. 유효한 JSON으로 응답`
}

// ========================================
// AI 설정
// ========================================

export const REPORT_INSIGHT_AI_CONFIG: AIConfig = {
  model: 'gpt-5-mini',
  temperature: 0.5,
  maxTokens: 4000,
  topP: 0.9,
}
