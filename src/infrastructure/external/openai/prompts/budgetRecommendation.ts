/**
 * 예산 추천 AI 프롬프트
 *
 * 업종별/규모별/객단가 기반 예산 추천을 위한 AI 프롬프트
 */

import type {
  Industry,
  BusinessScale,
  ExistingCampaignData,
} from '@domain/value-objects/BudgetRecommendation'

export interface BuildBudgetRecommendationPromptInput {
  industry: Industry
  businessScale: BusinessScale
  averageOrderValue?: number
  monthlyMarketingBudget?: number
  marginRate?: number
  existingData?: ExistingCampaignData
  calculatedBudget: {
    min: number
    recommended: number
    max: number
  }
  calculatedTargetROAS: number
  calculatedTargetCPA: number
}

/**
 * 예산 추천 AI 프롬프트 시스템 메시지
 */
export const BUDGET_RECOMMENDATION_SYSTEM_PROMPT = `You are a Meta Ads budget optimization expert specializing in the Korean market.
Your role is to provide personalized budget recommendations based on industry, business scale, and average order value.

## 객단가 기반 목표 ROAS 기준
- 저가 (~₩30,000): 목표 ROAS 400% 이상 (마진이 낮아 높은 효율 필요)
- 중저가 (₩30,000~70,000): 목표 ROAS 300% (기본 목표)
- 중가 (₩70,000~150,000): 목표 ROAS 250%
- 중고가 (₩150,000~300,000): 목표 ROAS 200%
- 고가 (₩300,000~): 목표 ROAS 150% (높은 마진으로 낮은 ROAS도 수익 가능)

## 업종별 평균 CPA 벤치마크 (한국 시장)
- 이커머스: ₩15,000
- F&B: ₩8,000
- 뷰티: ₩12,000
- 패션: ₩18,000
- 교육: ₩25,000
- SaaS: ₩50,000
- 서비스: ₩10,000
- 기타: ₩15,000

## 예산 추천 원칙
1. 최소 예산: ₩50,000/일 (Meta 알고리즘 학습 기간 확보)
2. 테스트 예산: 최소 7일 × 일일예산 (유의미한 데이터 수집)
3. 초기 1주일: 권장의 50%로 시작하여 데이터 수집
4. 성과 확인 후: 점진적 증액 (20% 단위)
5. ROAS 목표 미달 시: 예산 증액 전 최적화 우선
6. 객단가 정보 없을 경우: 업종별 기본값 또는 300% ROAS 적용

## 기존 광고주 분석 시 원칙
1. 현재 ROAS가 목표 대비 좋으면: 점진적 증액 권장 (10-25%)
2. 현재 ROAS가 목표 미달이면: 증액보다 최적화 우선 권장
3. 데이터 불충분 시: 보수적 접근 권장

## Output Guidelines
- Always respond in Korean
- Provide specific, actionable advice
- Base recommendations on the provided data
- Be conservative with budget increases
- Focus on sustainable growth`

/**
 * 예산 추천 사용자 프롬프트 빌더 (API 인터페이스 호환)
 */
export function buildBudgetRecommendationPrompt(
  input: BuildBudgetRecommendationPromptInput | {
    industry: Industry
    businessScale: BusinessScale
    averageOrderValue?: number
    monthlyMarketingBudget?: number
    marginRate?: number
    existingCampaignData?: ExistingCampaignData
    calculatedBudget: {
      min: number
      recommended: number
      max: number
    }
    calculatedTargetROAS: number
    calculatedTargetCPA: number
  }
): string {
  // Normalize input to BuildBudgetRecommendationPromptInput
  // Check if input has existingCampaignData property (from API) or existingData (from internal)
  const hasExistingCampaignData = 'existingCampaignData' in input

  type ApiInputType = {
    industry: Industry
    businessScale: BusinessScale
    averageOrderValue?: number
    monthlyMarketingBudget?: number
    marginRate?: number
    existingCampaignData?: ExistingCampaignData
    calculatedBudget: { min: number; recommended: number; max: number }
    calculatedTargetROAS: number
    calculatedTargetCPA: number
  }

  const normalizedInput: BuildBudgetRecommendationPromptInput = {
    industry: input.industry,
    businessScale: input.businessScale,
    averageOrderValue: input.averageOrderValue,
    monthlyMarketingBudget: input.monthlyMarketingBudget,
    marginRate: input.marginRate,
    existingData: hasExistingCampaignData
      ? (input as ApiInputType).existingCampaignData
      : (input as BuildBudgetRecommendationPromptInput).existingData,
    calculatedBudget: input.calculatedBudget,
    calculatedTargetROAS: input.calculatedTargetROAS,
    calculatedTargetCPA: input.calculatedTargetCPA,
  }

  return buildPromptInternal(normalizedInput)
}

/**
 * Internal prompt builder
 */
function buildPromptInternal(
  input: BuildBudgetRecommendationPromptInput
): string {
  const {
    industry,
    businessScale,
    averageOrderValue,
    monthlyMarketingBudget,
    marginRate,
    existingData,
    calculatedBudget,
    calculatedTargetROAS,
    calculatedTargetCPA,
  } = input

  const industryLabels: Record<Industry, string> = {
    ecommerce: '이커머스/쇼핑몰',
    food_beverage: 'F&B/음식점',
    beauty: '뷰티/화장품',
    fashion: '패션/의류',
    education: '교육/학원',
    service: '서비스업',
    saas: 'SaaS/소프트웨어',
    other: '기타',
  }

  const scaleLabels: Record<BusinessScale, string> = {
    individual: '개인사업자 (월매출 1천만 미만)',
    small: '소상공인 (월매출 1천만~5천만)',
    medium: '중소기업 (월매출 5천만~5억)',
    large: '대기업 (월매출 5억 이상)',
  }

  let prompt = `다음 조건에 맞는 맞춤형 예산 추천을 제공해주세요.

## 사업 정보
- 업종: ${industryLabels[industry]}
- 사업 규모: ${scaleLabels[businessScale]}
- 평균 객단가: ${averageOrderValue ? `₩${averageOrderValue.toLocaleString()}` : '미입력'}
- 마진율: ${marginRate ? `${(marginRate * 100).toFixed(0)}%` : '30% (기본값)'}
${monthlyMarketingBudget ? `- 월 마케팅 예산: ₩${monthlyMarketingBudget.toLocaleString()}` : ''}

## 시스템 계산 결과
- 권장 일일 예산: ₩${calculatedBudget.recommended.toLocaleString()}
- 예산 범위: ₩${calculatedBudget.min.toLocaleString()} ~ ₩${calculatedBudget.max.toLocaleString()}
- 목표 ROAS: ${(calculatedTargetROAS * 100).toFixed(0)}%
- 목표 CPA: ₩${calculatedTargetCPA.toLocaleString()}`

  if (existingData) {
    prompt += `

## 기존 광고 성과 (최근 30일)
- 평균 일일 지출: ₩${existingData.avgDailySpend.toLocaleString()}
- 평균 ROAS: ${(existingData.avgROAS * 100).toFixed(0)}%
- 평균 CPA: ₩${existingData.avgCPA.toLocaleString()}
- 평균 객단가 (Meta 계산): ₩${existingData.avgAOV.toLocaleString()}
- 총 지출: ₩${existingData.totalSpend30Days.toLocaleString()}
- 총 매출: ₩${existingData.totalRevenue30Days.toLocaleString()}
- 총 전환: ${existingData.totalPurchases30Days}건`
  }

  prompt += `

## 요청사항
다음 JSON 형식으로 맞춤형 예산 추천을 제공해주세요:

{
  "recommendedBudget": {
    "daily": number,
    "testPeriod": number,
    "reasoning": "추천 근거 (2-3문장)"
  },
  "targetMetrics": {
    "roas": number,
    "cpa": number,
    "roasReasoning": "ROAS 목표 설정 근거"
  },
  "tips": [
    "실행 가능한 팁 1",
    "실행 가능한 팁 2",
    "실행 가능한 팁 3"
  ],
  "warnings": [
    "주의사항 (있을 경우)"
  ]${existingData ? `,
  "comparison": {
    "currentVsRecommended": "현재 vs 권장 예산 비교 분석",
    "potentialImpact": "예상 효과"
  }` : ''}
}

한국어로 응답하고, 데이터에 기반한 실용적인 조언을 제공해주세요.`

  return prompt
}

/**
 * 간단한 예산 조언 프롬프트 (빠른 응답용)
 */
export function buildQuickBudgetAdvicePrompt(
  industry: Industry,
  businessScale: BusinessScale,
  currentBudget?: number
): string {
  const industryLabels: Record<Industry, string> = {
    ecommerce: '이커머스',
    food_beverage: 'F&B',
    beauty: '뷰티',
    fashion: '패션',
    education: '교육',
    service: '서비스',
    saas: 'SaaS',
    other: '기타',
  }

  return `${industryLabels[industry]} 업종의 ${businessScale === 'individual' ? '개인사업자' : businessScale === 'small' ? '소상공인' : businessScale === 'medium' ? '중소기업' : '대기업'}에게 ${currentBudget ? `현재 일일 예산 ₩${currentBudget.toLocaleString()}에서` : ''} Meta 광고 예산에 대한 한 줄 조언을 해주세요.`
}

/**
 * 예산 최적화 제안 프롬프트
 */
export function buildBudgetOptimizationPrompt(
  existingData: ExistingCampaignData,
  targetROAS: number
): string {
  const performanceRatio = existingData.avgROAS / targetROAS

  let performanceStatus: string
  if (performanceRatio >= 1.2) {
    performanceStatus = '목표 초과 달성 (우수)'
  } else if (performanceRatio >= 0.9) {
    performanceStatus = '목표 근접 달성 (양호)'
  } else if (performanceRatio >= 0.7) {
    performanceStatus = '목표 미달 (개선 필요)'
  } else {
    performanceStatus = '목표 대비 저조 (최적화 필수)'
  }

  return `현재 광고 성과를 분석하고 예산 최적화 방안을 제시해주세요.

## 현재 성과
- 평균 ROAS: ${(existingData.avgROAS * 100).toFixed(0)}%
- 목표 ROAS: ${(targetROAS * 100).toFixed(0)}%
- 달성률: ${(performanceRatio * 100).toFixed(0)}%
- 성과 상태: ${performanceStatus}
- 평균 일일 지출: ₩${existingData.avgDailySpend.toLocaleString()}
- 평균 CPA: ₩${existingData.avgCPA.toLocaleString()}
- 평균 객단가: ₩${existingData.avgAOV.toLocaleString()}

## 요청
1. 현재 성과에 대한 진단 (1-2문장)
2. 예산 조정 권장 사항 (증액/유지/감액 및 비율)
3. 예산 외 최적화 포인트 2-3가지

JSON 형식으로 응답:
{
  "diagnosis": "현재 상태 진단",
  "budgetAction": "increase" | "maintain" | "decrease",
  "budgetChangePercent": number,
  "optimizationPoints": ["포인트1", "포인트2", "포인트3"],
  "expectedImpact": "예상 효과"
}`
}
