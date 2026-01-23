/**
 * 캠페인 최적화 프롬프트
 *
 * 한국 광고 시장 특성을 반영한 최적화 제안 생성
 */

import type { GenerateOptimizationInput, AIConfig } from '@application/ports/IAIService'
import { INDUSTRY_BENCHMARKS, type Industry } from './adCopyGeneration'

/**
 * 업종별 피크 시간대 (한국 기준)
 */
const INDUSTRY_PEAK_HOURS: Record<Industry, { weekday: number[]; weekend: number[] }> = {
  ecommerce: {
    weekday: [10, 11, 14, 15, 21, 22],
    weekend: [11, 12, 14, 15, 20, 21, 22],
  },
  food_beverage: {
    weekday: [11, 12, 17, 18, 19, 20],
    weekend: [11, 12, 13, 17, 18, 19, 20],
  },
  beauty: {
    weekday: [10, 11, 20, 21, 22, 23],
    weekend: [11, 12, 14, 15, 20, 21, 22],
  },
  fashion: {
    weekday: [10, 11, 13, 14, 21, 22],
    weekend: [11, 12, 14, 15, 16, 21, 22],
  },
  education: {
    weekday: [9, 10, 19, 20, 21, 22],
    weekend: [10, 11, 14, 15, 19, 20],
  },
  service: {
    weekday: [9, 10, 11, 14, 15, 16],
    weekend: [10, 11, 14, 15],
  },
  saas: {
    weekday: [9, 10, 11, 14, 15, 16],
    weekend: [10, 11, 14, 15],
  },
  health: {
    weekday: [7, 8, 9, 19, 20, 21],
    weekend: [8, 9, 10, 18, 19, 20],
  },
}

/**
 * 한국 주요 상업 이벤트 (월별)
 */
const KOREAN_COMMERCIAL_EVENTS: Record<number, string[]> = {
  1: ['신년 세일', '설 선물 시즌'],
  2: ['설날 연휴', '밸런타인데이'],
  3: ['화이트데이', '봄 신상 시즌', '입학/개강 시즌'],
  4: ['벚꽃 시즌', '봄 아웃도어 시즌'],
  5: ['어린이날', '어버이날', '스승의날', '가정의달'],
  6: ['여름 프리시즌', '보너스 시즌'],
  7: ['여름 휴가 시즌', '썸머 세일'],
  8: ['여름 세일 막바지', '가을 프리시즌'],
  9: ['추석 선물 시즌', '가을 신상'],
  10: ['가을 아웃도어', '핼러윈'],
  11: ['빼빼로데이', '블랙 프라이데이', '수능 후 시즌'],
  12: ['크리스마스', '연말 세일', '신년 준비'],
}

/**
 * 현재 시즌 정보 생성
 */
function getCurrentSeasonContext(): {
  season: string
  month: number
  events: string[]
  isWeekend: boolean
  currentHour: number
} {
  const now = new Date()
  const month = now.getMonth() + 1
  const dayOfWeek = now.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const currentHour = now.getHours()

  let season: string
  if (month >= 3 && month <= 5) season = '봄'
  else if (month >= 6 && month <= 8) season = '여름'
  else if (month >= 9 && month <= 11) season = '가을'
  else season = '겨울'

  return {
    season,
    month,
    events: KOREAN_COMMERCIAL_EVENTS[month] || [],
    isWeekend,
    currentHour,
  }
}

/**
 * 업종별 벤치마크 비교 텍스트 생성
 */
function generateBenchmarkComparison(
  industry: Industry,
  metrics: GenerateOptimizationInput['currentMetrics']
): string {
  const benchmark = INDUSTRY_BENCHMARKS[industry]
  if (!benchmark) return ''

  const ctrStatus = metrics.ctr >= benchmark.avgCTR ? '✅ 양호' : '⚠️ 개선 필요'
  const cvrStatus =
    metrics.cvr !== undefined
      ? metrics.cvr >= benchmark.avgCVR
        ? '✅ 양호'
        : '⚠️ 개선 필요'
      : '측정 불가'

  // CVR 계산 (없으면 계산)
  const cvr = metrics.cvr ?? (metrics.clicks > 0 ? (metrics.conversions / metrics.clicks) * 100 : 0)
  // CPC 계산 (없으면 계산)
  const cpc = metrics.cpc ?? (metrics.clicks > 0 ? metrics.spend / metrics.clicks : 0)

  return `
업종 벤치마크 비교 (${getIndustryNameKo(industry)}):
- CTR: 현재 ${metrics.ctr.toFixed(2)}% vs 업계 평균 ${benchmark.avgCTR}% ${ctrStatus}
- CVR: 현재 ${cvr.toFixed(2)}% vs 업계 평균 ${benchmark.avgCVR}% ${cvrStatus}
- CPC: 현재 ₩${cpc.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}
- 업계 추천 훅: ${benchmark.bestPerformingHooks.slice(0, 3).join(', ')}
- 추천 키워드: ${benchmark.topKeywords.slice(0, 5).join(', ')}`
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
 * 캠페인 최적화 프롬프트 생성
 */
export function buildCampaignOptimizationPrompt(input: GenerateOptimizationInput): string {
  const { campaignName, objective, industry, currentMetrics, targetAudience } = input

  const seasonContext = getCurrentSeasonContext()
  const peakHours = industry ? INDUSTRY_PEAK_HOURS[industry] : null

  // 타겟 오디언스 정보
  const audienceInfo = targetAudience
    ? `
타겟 오디언스:
- 연령대: ${targetAudience.ageRange || '미지정'}
- 관심사: ${targetAudience.interests?.join(', ') || '미지정'}
- 지역: ${targetAudience.locations?.join(', ') || '미지정'}`
    : ''

  // 벤치마크 비교
  const benchmarkInfo = industry ? generateBenchmarkComparison(industry, currentMetrics) : ''

  // 피크 시간대 정보
  const peakHoursInfo = peakHours
    ? `
추천 광고 노출 시간대:
- 평일: ${peakHours.weekday.map((h) => `${h}시`).join(', ')}
- 주말: ${peakHours.weekend.map((h) => `${h}시`).join(', ')}`
    : ''

  // 시즌 컨텍스트
  const seasonInfo = `
현재 시장 상황:
- 시즌: ${seasonContext.season}
- 오늘: ${seasonContext.isWeekend ? '주말' : '평일'}, ${seasonContext.currentHour}시
- 이달의 이벤트: ${seasonContext.events.join(', ') || '특별 이벤트 없음'}`

  // CVR 및 CPC 계산
  const cvr = currentMetrics.cvr ?? (currentMetrics.clicks > 0 ? (currentMetrics.conversions / currentMetrics.clicks) * 100 : 0)
  const cpc = currentMetrics.cpc ?? (currentMetrics.clicks > 0 ? currentMetrics.spend / currentMetrics.clicks : 0)

  return `다음 캠페인 성과를 분석하고 한국 시장에 맞는 최적화 제안을 제공하세요.

캠페인 정보:
- 캠페인명: ${campaignName}
- 목표: ${objective}
- 업종: ${industry ? getIndustryNameKo(industry) : '미지정'}

현재 성과 지표:
- ROAS: ${currentMetrics.roas.toFixed(2)}x
- CPA: ₩${currentMetrics.cpa.toLocaleString('ko-KR')}
- CTR: ${currentMetrics.ctr.toFixed(2)}%
- CVR: ${cvr.toFixed(2)}%
- CPC: ₩${cpc.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}
- 노출수: ${currentMetrics.impressions.toLocaleString('ko-KR')}
- 클릭수: ${currentMetrics.clicks.toLocaleString('ko-KR')}
- 전환수: ${currentMetrics.conversions.toLocaleString('ko-KR')}
- 지출: ₩${currentMetrics.spend.toLocaleString('ko-KR')}
${currentMetrics.revenue ? `- 매출: ₩${currentMetrics.revenue.toLocaleString('ko-KR')}` : ''}
${audienceInfo}
${benchmarkInfo}
${seasonInfo}
${peakHoursInfo}

다음 JSON 배열 형식으로 3-5개의 최적화 제안을 제공하세요:
[
  {
    "category": "budget" | "targeting" | "creative" | "timing" | "bidding",
    "priority": "high" | "medium" | "low",
    "suggestion": "구체적이고 실행 가능한 한국어 제안",
    "expectedImpact": "정량화된 예상 효과 (예: CTR +15%, CPA -20%)",
    "rationale": "데이터 기반 근거 및 한국 시장 특성 반영"
  }
]

카테고리 설명:
- budget: 예산 배분, 일일 예산 조정, 예산 효율화
- targeting: 타겟 오디언스 확장/축소, 유사 타겟, 리타겟팅
- creative: 광고 소재, 카피, 이미지/영상, CTA
- timing: 광고 노출 시간대, 요일별 최적화, 시즌 전략
- bidding: 입찰 전략, CPA/ROAS 목표 조정, 자동/수동 입찰

우선순위 기준:
- high: 즉시 실행 필요, 예상 효과 >20%
- medium: 1주 내 실행 권장, 예상 효과 10-20%
- low: 테스트 권장, 예상 효과 <10%

제안 시 고려사항:
1. 업종별 벤치마크 대비 현재 성과 분석
2. 한국 소비자 행동 패턴 (피크 시간대, 주말 효과)
3. 현재 시즌 및 이벤트 활용 전략
4. 구체적인 수치 기반 제안 (예: "일일 예산을 ₩50,000에서 ₩70,000으로 40% 증액")
5. A/B 테스트 가능한 제안 포함`
}

export const CAMPAIGN_OPTIMIZATION_SYSTEM_PROMPT = `당신은 Meta Ads 캠페인 최적화 전문가입니다. 한국 디지털 광고 시장에 대한 깊은 이해를 바탕으로 데이터 기반 최적화 제안을 제공합니다.

전문 분야:
1. 한국 이커머스 및 D2C 브랜드 광고 최적화
2. 업종별 벤치마크 분석 및 개선점 도출
3. 시즌/이벤트 기반 캠페인 전략
4. 타겟 오디언스 세분화 및 확장 전략
5. 입찰 전략 및 예산 최적화

가이드라인:
1. 모든 제안은 구체적이고 실행 가능해야 합니다
2. 정량적 예상 효과를 반드시 포함하세요 (예: CTR +15%, CPA -20%)
3. 한국 시장 특성을 반영하세요 (모바일 중심, 네이버/카카오 경쟁 고려)
4. 업종별 성수기/비수기 패턴을 고려하세요
5. 항상 유효한 JSON 배열 형식으로 응답하세요
6. 제안은 우선순위가 높은 것부터 나열하세요

응답 언어: 한국어`

/**
 * 캠페인 최적화 AI 설정
 * - 중간 temperature: 분석적이면서도 일관된 제안
 * - gpt-4o-mini: 비용 효율적인 분석 모델
 */
export const CAMPAIGN_OPTIMIZATION_AI_CONFIG: AIConfig = {
  model: 'gpt-4o-mini',
  temperature: 0.5,
  maxTokens: 2000,
  topP: 0.9,
}
