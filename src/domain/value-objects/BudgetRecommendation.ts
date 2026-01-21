/**
 * 예산 추천 시스템 - 업종별/규모별 기준 상수 및 타입 정의
 *
 * 핵심 기능:
 * - 업종별 예산 벤치마크
 * - 사업 규모별 배율
 * - 객단가(AOV) 기반 동적 ROAS 계산
 * - 마케팅 예산 → 일일 예산 변환
 */

// ============================================
// 타입 정의
// ============================================

/**
 * 업종 타입
 */
export type Industry =
  | 'ecommerce'      // 이커머스/쇼핑몰
  | 'food_beverage'  // F&B/음식점
  | 'beauty'         // 뷰티/화장품
  | 'fashion'        // 패션/의류
  | 'education'      // 교육/학원
  | 'service'        // 서비스업
  | 'saas'           // SaaS/소프트웨어
  | 'other'          // 기타

/**
 * 사업 규모
 */
export type BusinessScale =
  | 'individual'     // 개인사업자 (월매출 1천만 미만)
  | 'small'          // 소상공인 (월매출 1천만~5천만)
  | 'medium'         // 중소기업 (월매출 5천만~5억)
  | 'large'          // 대기업 (월매출 5억 이상)

/**
 * AOV 티어 (객단가 구간)
 */
export type AOVTier = 'low' | 'mid_low' | 'mid' | 'mid_high' | 'high'

/**
 * 예산 추천 출처
 */
export type BudgetRecommendationSource = 'industry' | 'monthly_budget' | 'existing_data'

/**
 * AOV 데이터 출처
 */
export type AOVSource = 'user_input' | 'meta_data' | 'industry_default'

// ============================================
// 인터페이스 정의
// ============================================

/**
 * 업종별 예산 벤치마크
 */
export interface IndustryBudgetBenchmark {
  industry: Industry
  label: string
  dailyBudget: {
    min: number        // 최소 일일 예산 (KRW)
    recommended: number // 권장 일일 예산 (KRW)
    max: number        // 최대 일일 예산 (KRW)
  }
  averageCPA: number   // 평균 CPA (KRW)
  defaultAOV: number   // 기본 객단가 추정치 (KRW)
  description: string
}

/**
 * 사업 규모별 배율
 */
export interface BusinessScaleMultiplier {
  scale: BusinessScale
  label: string
  multiplier: number
  monthlyRevenueRange: {
    min: number | null
    max: number | null
  }
  description: string
}

/**
 * AOV 티어 설정
 */
export interface AOVTierConfig {
  tier: AOVTier
  label: string
  range: {
    min: number
    max: number | null
  }
  targetROAS: number
  description: string
}

/**
 * 예산 범위
 */
export interface BudgetRange {
  min: number
  recommended: number
  max: number
}

/**
 * 예산 추천 입력
 */
export interface BudgetRecommendationInput {
  industry: Industry
  businessScale: BusinessScale
  monthlyMarketingBudget?: number  // 월 마케팅 예산 (직접 입력)
  averageOrderValue?: number       // 평균 객단가 (직접 입력)
  marginRate?: number              // 마진율 (선택, 기본 30%)
  existingCampaignData?: ExistingCampaignData
}

/**
 * 기존 캠페인 데이터 (Meta API에서 가져온 데이터)
 */
export interface ExistingCampaignData {
  avgDailySpend: number       // 평균 일일 지출
  avgROAS: number             // 평균 ROAS
  avgCPA: number              // 평균 CPA
  avgAOV: number              // Meta에서 계산된 평균 객단가
  totalSpend30Days: number    // 30일 총 지출
  totalRevenue30Days: number  // 30일 총 매출
  totalPurchases30Days: number // 30일 총 전환수
}

/**
 * 예산 추천 결과
 */
export interface BudgetRecommendation {
  dailyBudget: BudgetRange
  source: BudgetRecommendationSource
  testBudget: number          // 7일 테스트 예산
  targetROAS: number          // 객단가 기반 동적 계산
  targetCPA: number
  aovUsed: number             // 사용된 객단가 값
  aovSource: AOVSource        // 객단가 출처
  reasoning: string           // 추천 근거 설명
  tips: string[]
  comparison?: {              // 기존 광고주용 비교 데이터
    currentVsRecommended: string
    potentialImpact: string
  }
}

// ============================================
// 상수 정의
// ============================================

/**
 * 최소 일일 광고비 (KRW)
 */
export const MINIMUM_DAILY_BUDGET = 50000

/**
 * 기본 마진율
 */
export const DEFAULT_MARGIN_RATE = 0.3

/**
 * 테스트 기간 (일)
 */
export const TEST_PERIOD_DAYS = 7

/**
 * 업종별 예산 벤치마크
 */
export const INDUSTRY_BUDGET_BENCHMARKS: Record<Industry, IndustryBudgetBenchmark> = {
  ecommerce: {
    industry: 'ecommerce',
    label: '이커머스/쇼핑몰',
    dailyBudget: {
      min: 50000,
      recommended: 100000,
      max: 500000,
    },
    averageCPA: 15000,
    defaultAOV: 70000,
    description: '온라인 쇼핑몰, 스마트스토어, 자사몰 운영',
  },
  food_beverage: {
    industry: 'food_beverage',
    label: 'F&B/음식점',
    dailyBudget: {
      min: 50000,
      recommended: 80000,
      max: 200000,
    },
    averageCPA: 8000,
    defaultAOV: 25000,
    description: '음식점, 카페, 베이커리, 배달 서비스',
  },
  beauty: {
    industry: 'beauty',
    label: '뷰티/화장품',
    dailyBudget: {
      min: 50000,
      recommended: 100000,
      max: 300000,
    },
    averageCPA: 12000,
    defaultAOV: 50000,
    description: '화장품, 스킨케어, 뷰티 서비스',
  },
  fashion: {
    industry: 'fashion',
    label: '패션/의류',
    dailyBudget: {
      min: 50000,
      recommended: 100000,
      max: 400000,
    },
    averageCPA: 18000,
    defaultAOV: 80000,
    description: '의류, 잡화, 액세서리 판매',
  },
  education: {
    industry: 'education',
    label: '교육/학원',
    dailyBudget: {
      min: 50000,
      recommended: 80000,
      max: 200000,
    },
    averageCPA: 25000,
    defaultAOV: 200000,
    description: '학원, 온라인 강의, 교육 서비스',
  },
  service: {
    industry: 'service',
    label: '서비스업',
    dailyBudget: {
      min: 50000,
      recommended: 70000,
      max: 150000,
    },
    averageCPA: 10000,
    defaultAOV: 100000,
    description: '컨설팅, 디자인, 마케팅 등 B2B/B2C 서비스',
  },
  saas: {
    industry: 'saas',
    label: 'SaaS/소프트웨어',
    dailyBudget: {
      min: 50000,
      recommended: 150000,
      max: 500000,
    },
    averageCPA: 50000,
    defaultAOV: 300000,
    description: '소프트웨어 구독, 앱 서비스',
  },
  other: {
    industry: 'other',
    label: '기타',
    dailyBudget: {
      min: 50000,
      recommended: 70000,
      max: 200000,
    },
    averageCPA: 15000,
    defaultAOV: 50000,
    description: '기타 업종',
  },
}

/**
 * 사업 규모별 배율
 */
export const BUSINESS_SCALE_MULTIPLIERS: Record<BusinessScale, BusinessScaleMultiplier> = {
  individual: {
    scale: 'individual',
    label: '개인사업자',
    multiplier: 0.5,
    monthlyRevenueRange: {
      min: null,
      max: 10000000, // 1천만 미만
    },
    description: '월매출 1천만원 미만',
  },
  small: {
    scale: 'small',
    label: '소상공인',
    multiplier: 1.0,
    monthlyRevenueRange: {
      min: 10000000,
      max: 50000000, // 1천만~5천만
    },
    description: '월매출 1천만~5천만원',
  },
  medium: {
    scale: 'medium',
    label: '중소기업',
    multiplier: 2.0,
    monthlyRevenueRange: {
      min: 50000000,
      max: 500000000, // 5천만~5억
    },
    description: '월매출 5천만~5억원',
  },
  large: {
    scale: 'large',
    label: '대기업',
    multiplier: 5.0,
    monthlyRevenueRange: {
      min: 500000000,
      max: null, // 5억 이상
    },
    description: '월매출 5억원 이상',
  },
}

/**
 * AOV 티어별 목표 ROAS 설정
 */
export const AOV_TIER_CONFIGS: Record<AOVTier, AOVTierConfig> = {
  low: {
    tier: 'low',
    label: '저가',
    range: {
      min: 0,
      max: 30000,
    },
    targetROAS: 4.0, // 400%
    description: '객단가 ~₩30,000 - 마진이 낮아 높은 효율 필요',
  },
  mid_low: {
    tier: 'mid_low',
    label: '중저가',
    range: {
      min: 30000,
      max: 70000,
    },
    targetROAS: 3.0, // 300% (기본 목표)
    description: '객단가 ₩30,000~70,000 - 기본 목표',
  },
  mid: {
    tier: 'mid',
    label: '중가',
    range: {
      min: 70000,
      max: 150000,
    },
    targetROAS: 2.5, // 250%
    description: '객단가 ₩70,000~150,000 - 양호한 마진',
  },
  mid_high: {
    tier: 'mid_high',
    label: '중고가',
    range: {
      min: 150000,
      max: 300000,
    },
    targetROAS: 2.0, // 200%
    description: '객단가 ₩150,000~300,000 - 충분한 마진',
  },
  high: {
    tier: 'high',
    label: '고가',
    range: {
      min: 300000,
      max: null,
    },
    targetROAS: 1.5, // 150%
    description: '객단가 ₩300,000~ - 높은 마진으로 낮은 ROAS도 수익 가능',
  },
}

/**
 * 월 예산 구간별 일일 예산 계산 비율
 */
export const MONTHLY_BUDGET_RATIOS = {
  /** 150만원 이하: 최소 예산 적용 */
  tier1: {
    maxMonthly: 1500000,
    ratio: 1.0,
    dailyMin: MINIMUM_DAILY_BUDGET,
  },
  /** 150만~300만원: 전액 투입 가능 */
  tier2: {
    maxMonthly: 3000000,
    ratio: 1.0,
    note: '전액 투입 가능',
  },
  /** 300만~1000만원: 70% 투입 */
  tier3: {
    maxMonthly: 10000000,
    ratio: 0.7,
    note: '여유분 확보',
  },
  /** 1000만원 이상: 60% 투입 */
  tier4: {
    ratio: 0.6,
    note: '테스트/최적화 여유',
  },
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 객단가(AOV)에서 AOV 티어 결정
 */
export function getAOVTier(aov: number): AOVTier {
  if (aov < 30000) return 'low'
  if (aov < 70000) return 'mid_low'
  if (aov < 150000) return 'mid'
  if (aov < 300000) return 'mid_high'
  return 'high'
}

/**
 * 객단가(AOV) 기반 목표 ROAS 동적 계산
 *
 * 원리: 객단가가 낮으면 마진이 낮아 높은 ROAS 필요,
 *       객단가가 높으면 낮은 ROAS도 수익 가능
 *
 * @param aov 평균 객단가 (KRW)
 * @param marginRate 마진율 (기본 30%)
 * @returns 목표 ROAS (배수, 예: 3.0 = 300%)
 */
export function calculateTargetROAS(aov: number, marginRate: number = DEFAULT_MARGIN_RATE): number {
  // 기본 공식: 목표 ROAS = 1 / 마진율 (손익분기)
  // 수익 확보를 위해 1.5배 버퍼 적용
  const breakEvenROAS = 1 / marginRate
  const baseTargetROAS = breakEvenROAS * 1.5

  // 객단가별 최소 ROAS 적용
  const tier = getAOVTier(aov)
  const tierConfig = AOV_TIER_CONFIGS[tier]

  return Math.max(baseTargetROAS, tierConfig.targetROAS)
}

/**
 * 월 마케팅 예산 → 일일 예산 변환
 *
 * @param monthlyBudget 월 마케팅 예산 (KRW)
 * @returns 권장 일일 예산 (KRW)
 */
export function calculateDailyBudgetFromMonthly(monthlyBudget: number): number {
  // 최소 예산 적용
  if (monthlyBudget <= MONTHLY_BUDGET_RATIOS.tier1.maxMonthly) {
    return MINIMUM_DAILY_BUDGET
  }

  // 150만~300만원: 전액 ÷ 30
  if (monthlyBudget <= MONTHLY_BUDGET_RATIOS.tier2.maxMonthly) {
    return Math.max(monthlyBudget / 30, MINIMUM_DAILY_BUDGET)
  }

  // 300만~1000만원: 70% ÷ 30
  if (monthlyBudget <= MONTHLY_BUDGET_RATIOS.tier3.maxMonthly) {
    return Math.max((monthlyBudget * MONTHLY_BUDGET_RATIOS.tier3.ratio) / 30, MINIMUM_DAILY_BUDGET)
  }

  // 1000만원 이상: 60% ÷ 30
  return Math.max((monthlyBudget * MONTHLY_BUDGET_RATIOS.tier4.ratio) / 30, MINIMUM_DAILY_BUDGET)
}

/**
 * 업종 + 규모 기반 예산 범위 계산
 *
 * @param industry 업종
 * @param scale 사업 규모
 * @returns 예산 범위
 */
export function calculateBudgetRange(industry: Industry, scale: BusinessScale): BudgetRange {
  const benchmark = INDUSTRY_BUDGET_BENCHMARKS[industry]
  const scaleConfig = BUSINESS_SCALE_MULTIPLIERS[scale]

  return {
    min: Math.max(benchmark.dailyBudget.min, MINIMUM_DAILY_BUDGET),
    recommended: Math.round(benchmark.dailyBudget.recommended * scaleConfig.multiplier),
    max: Math.round(benchmark.dailyBudget.max * scaleConfig.multiplier),
  }
}

/**
 * 테스트 예산 계산 (7일 기준)
 *
 * @param dailyBudget 일일 예산
 * @returns 테스트 예산
 */
export function calculateTestBudget(dailyBudget: number): number {
  return dailyBudget * TEST_PERIOD_DAYS
}

/**
 * 목표 CPA 계산
 *
 * @param aov 평균 객단가
 * @param targetROAS 목표 ROAS
 * @returns 목표 CPA
 */
export function calculateTargetCPA(aov: number, targetROAS: number): number {
  // CPA = AOV / ROAS
  // 예: 객단가 50,000원, ROAS 3.0 → CPA = 50,000 / 3.0 = 16,667원
  return Math.round(aov / targetROAS)
}

/**
 * 업종 라벨 가져오기
 */
export function getIndustryLabel(industry: Industry): string {
  return INDUSTRY_BUDGET_BENCHMARKS[industry]?.label ?? '기타'
}

/**
 * 사업 규모 라벨 가져오기
 */
export function getBusinessScaleLabel(scale: BusinessScale): string {
  return BUSINESS_SCALE_MULTIPLIERS[scale]?.label ?? '소상공인'
}

/**
 * AOV 티어 라벨 가져오기
 */
export function getAOVTierLabel(aov: number): string {
  const tier = getAOVTier(aov)
  return AOV_TIER_CONFIGS[tier].label
}

/**
 * 모든 업종 목록 가져오기
 */
export function getAllIndustries(): Industry[] {
  return Object.keys(INDUSTRY_BUDGET_BENCHMARKS) as Industry[]
}

/**
 * 모든 사업 규모 목록 가져오기
 */
export function getAllBusinessScales(): BusinessScale[] {
  return Object.keys(BUSINESS_SCALE_MULTIPLIERS) as BusinessScale[]
}

/**
 * 금액 포맷팅 (KRW)
 */
export function formatBudget(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * ROAS 포맷팅
 */
export function formatROAS(roas: number): string {
  return `${(roas * 100).toFixed(0)}%`
}
