/**
 * 구독 플랜
 * FREE: 무료 플랜 (MVP 제한 적용)
 * STARTER: 스타터 플랜
 * PRO: 프로 플랜 (무제한)
 * ENTERPRISE: 엔터프라이즈 (맞춤 가격)
 */
export enum SubscriptionPlan {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

/**
 * AI 모델 티어
 */
export type AIModelTier = 'mini' | 'standard' | 'premium'

/**
 * AI 모델 설정
 */
export interface AIModelConfig {
  /** 일반 카피 생성에 사용할 모델 */
  copyModel: string
  /** 프리미엄 카피 생성에 사용할 모델 */
  premiumCopyModel: string | null
  /** 분석/최적화에 사용할 모델 */
  analysisModel: string
}

/**
 * 플랜별 설정
 * -1은 무제한을 의미
 * price -1은 맞춤 가격을 의미
 */
export interface PlanConfig {
  label: string
  price: number // KRW, -1 = custom pricing
  campaignsPerWeek: number // -1 = unlimited
  aiCopyPerDay: number // -1 = unlimited
  aiCopyPremiumPerDay: number // -1 = unlimited, 0 = not available
  aiAnalysisPerWeek: number // -1 = unlimited
  aiSciencePerWeek: number // -1 = unlimited
  aiKPIInsightPerDay: number // -1 = unlimited
  competitorAnalysisPerWeek: number // -1 = unlimited
  teamMembers: number // max team members, -1 = unlimited
  aiModelTier: AIModelTier
  aiModelConfig: AIModelConfig
  annualPrice: number // KRW, -1 = custom, annual billing per month
  description: string
  features: string[]
  popularBadge?: boolean // show "인기" badge
}

/**
 * 플랜 계층 (숫자가 클수록 상위 플랜)
 */
export const PLAN_HIERARCHY: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.FREE]: 0,
  [SubscriptionPlan.STARTER]: 1,
  [SubscriptionPlan.PRO]: 2,
  [SubscriptionPlan.ENTERPRISE]: 3,
}

/**
 * 플랜별 상세 설정
 */
export const PLAN_CONFIGS: Record<SubscriptionPlan, PlanConfig> = {
  [SubscriptionPlan.FREE]: {
    label: '무료',
    price: 0,
    campaignsPerWeek: 3,
    aiCopyPerDay: 5,
    aiCopyPremiumPerDay: 0,
    aiAnalysisPerWeek: 3,
    aiSciencePerWeek: 0,
    aiKPIInsightPerDay: 5,
    competitorAnalysisPerWeek: 0,
    teamMembers: 1,
    aiModelTier: 'mini',
    aiModelConfig: {
      copyModel: 'gpt-4o-mini',
      premiumCopyModel: null,
      analysisModel: 'gpt-4o-mini',
    },
    annualPrice: 0,
    description: '무료로 시작하세요',
    features: [
      '캠페인 3회/주',
      'AI 카피 5회/일 (기본)',
      'AI 분석 3회/주',
      '기본 KPI 대시보드',
      '주간 보고서',
      '픽셀 1개',
      '이메일 지원',
    ],
  },
  [SubscriptionPlan.STARTER]: {
    label: '스타터',
    price: 39000,
    campaignsPerWeek: 20,
    aiCopyPerDay: 30,
    aiCopyPremiumPerDay: 5,
    aiAnalysisPerWeek: 15,
    aiSciencePerWeek: 5,
    aiKPIInsightPerDay: 10,
    competitorAnalysisPerWeek: 3,
    teamMembers: 2,
    aiModelTier: 'standard',
    aiModelConfig: {
      copyModel: 'gpt-4o-mini',
      premiumCopyModel: 'gpt-4o',
      analysisModel: 'gpt-4o-mini',
    },
    annualPrice: 29000,
    description: '성장하는 비즈니스에 적합',
    features: [
      '캠페인 20회/주',
      'AI 카피 30회/일 (기본)',
      '프리미엄 카피 5회/일',
      'AI 분석 15회/주',
      '사이언스 스코어 5회/주',
      '경쟁사 분석 3회/주',
      '고급 대시보드 + 추세',
      '주간 + 일간 보고서',
      '픽셀 3개',
      '팀 2명',
      '우선 이메일 지원',
    ],
  },
  [SubscriptionPlan.PRO]: {
    label: '프로',
    price: 99000,
    campaignsPerWeek: -1,
    aiCopyPerDay: 100,
    aiCopyPremiumPerDay: 20,
    aiAnalysisPerWeek: -1,
    aiSciencePerWeek: -1,
    aiKPIInsightPerDay: 20,
    competitorAnalysisPerWeek: -1,
    teamMembers: 5,
    aiModelTier: 'premium',
    aiModelConfig: {
      copyModel: 'gpt-4o-mini',
      premiumCopyModel: 'gpt-4o',
      analysisModel: 'gpt-4o-mini',
    },
    annualPrice: 79000,
    popularBadge: true,
    description: '전문 마케터를 위한 플랜',
    features: [
      '캠페인 무제한',
      'AI 카피 100회/일 (기본)',
      '프리미엄 카피 20회/일',
      'AI 분석 무제한',
      '사이언스 분석 전체',
      '경쟁사 분석 무제한',
      '포트폴리오 최적화',
      'A/B 테스트',
      '이상 탐지 알림',
      '전체 분석 대시보드 + 내보내기',
      '일간 + 주간 + 월간 보고서',
      '픽셀 무제한',
      '팀 5명',
      'API 액세스',
      'Slack 연동',
    ],
  },
  [SubscriptionPlan.ENTERPRISE]: {
    label: '엔터프라이즈',
    price: 199000,
    campaignsPerWeek: -1,
    aiCopyPerDay: -1,
    aiCopyPremiumPerDay: -1,
    aiAnalysisPerWeek: -1,
    aiSciencePerWeek: -1,
    aiKPIInsightPerDay: -1,
    competitorAnalysisPerWeek: -1,
    teamMembers: -1,
    aiModelTier: 'premium',
    aiModelConfig: {
      copyModel: 'gpt-4o-mini',
      premiumCopyModel: 'gpt-4o',
      analysisModel: 'gpt-4o-mini',
    },
    annualPrice: -1,
    description: '대규모 팀을 위한 맞춤 솔루션',
    features: [
      '모든 Pro 기능 포함',
      'AI 카피 무제한 (기본 + 프리미엄)',
      'AI 분석 무제한',
      '전담 계정 관리자',
      'SLA 보장 (99.9%)',
      '맞춤 통합',
      '온보딩 교육',
      '팀 무제한',
      '화이트라벨 옵션',
    ],
  },
}

// ========================================
// Helper Functions
// ========================================

/**
 * 플랜 설정 반환
 */
export function getPlanConfig(plan: SubscriptionPlan): PlanConfig {
  return PLAN_CONFIGS[plan]
}

/**
 * 플랜 레이블 반환
 */
export function getPlanLabel(plan: SubscriptionPlan): string {
  return PLAN_CONFIGS[plan].label
}

/**
 * 플랜 가격 반환 (KRW)
 */
export function getPlanPrice(plan: SubscriptionPlan): number {
  return PLAN_CONFIGS[plan].price
}

/**
 * 플랜 기능 목록 반환
 */
export function getPlanFeatures(plan: SubscriptionPlan): string[] {
  return PLAN_CONFIGS[plan].features
}

/**
 * 무료 플랜인지 확인
 */
export function isFreePlan(plan: SubscriptionPlan): boolean {
  return plan === SubscriptionPlan.FREE
}

/**
 * 유료 플랜인지 확인
 */
export function isPaidPlan(plan: SubscriptionPlan): boolean {
  return plan !== SubscriptionPlan.FREE
}

/**
 * 모든 플랜 반환
 */
export function getAllPlans(): SubscriptionPlan[] {
  return Object.values(SubscriptionPlan)
}

/**
 * 유료 플랜만 반환
 */
export function getPaidPlans(): SubscriptionPlan[] {
  return Object.values(SubscriptionPlan).filter((plan) => plan !== SubscriptionPlan.FREE)
}

/**
 * 업그레이드 가능 여부 확인
 */
export function canUpgradeTo(currentPlan: SubscriptionPlan, targetPlan: SubscriptionPlan): boolean {
  return PLAN_HIERARCHY[targetPlan] > PLAN_HIERARCHY[currentPlan]
}

/**
 * AI 모델 설정 반환
 */
export function getAIModelConfig(plan: SubscriptionPlan): AIModelConfig {
  return PLAN_CONFIGS[plan].aiModelConfig
}

/**
 * AI 모델 티어 반환
 */
export function getAIModelTier(plan: SubscriptionPlan): AIModelTier {
  return PLAN_CONFIGS[plan].aiModelTier
}

/**
 * 연간 결제 가격 반환 (KRW)
 */
export function getAnnualPrice(plan: SubscriptionPlan): number {
  return PLAN_CONFIGS[plan].annualPrice
}

/**
 * 특정 기능 사용 가능 여부 확인
 */
export function hasFeature(
  plan: SubscriptionPlan,
  feature:
    | 'premiumCopy'
    | 'science'
    | 'competitor'
    | 'portfolio'
    | 'abTest'
    | 'anomalyAlert'
    | 'api'
    | 'slack'
): boolean {
  const config = PLAN_CONFIGS[plan]
  switch (feature) {
    case 'premiumCopy':
      return config.aiCopyPremiumPerDay !== 0
    case 'science':
      return config.aiSciencePerWeek !== 0
    case 'competitor':
      return config.competitorAnalysisPerWeek !== 0
    case 'portfolio':
      return PLAN_HIERARCHY[plan] >= PLAN_HIERARCHY[SubscriptionPlan.PRO]
    case 'abTest':
      return PLAN_HIERARCHY[plan] >= PLAN_HIERARCHY[SubscriptionPlan.PRO]
    case 'anomalyAlert':
      return PLAN_HIERARCHY[plan] >= PLAN_HIERARCHY[SubscriptionPlan.PRO]
    case 'api':
      return PLAN_HIERARCHY[plan] >= PLAN_HIERARCHY[SubscriptionPlan.PRO]
    case 'slack':
      return PLAN_HIERARCHY[plan] >= PLAN_HIERARCHY[SubscriptionPlan.PRO]
    default:
      return false
  }
}
