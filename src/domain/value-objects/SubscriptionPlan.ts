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
 * 플랜별 설정
 * -1은 무제한을 의미
 * price -1은 맞춤 가격을 의미
 */
export interface PlanConfig {
  label: string
  price: number // KRW, -1 = custom pricing
  campaignsPerWeek: number // -1 = unlimited
  aiCopyPerDay: number // -1 = unlimited
  aiAnalysisPerWeek: number // -1 = unlimited
  description: string
  features: string[]
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
    campaignsPerWeek: 5,
    aiCopyPerDay: 20,
    aiAnalysisPerWeek: 5,
    description: '무료로 시작하세요',
    features: [
      '캠페인 5회/주',
      'AI 카피 20회/일',
      'AI 분석 5회/주',
      '기본 대시보드',
      '이메일 지원',
    ],
  },
  [SubscriptionPlan.STARTER]: {
    label: '스타터',
    price: 49000,
    campaignsPerWeek: 20,
    aiCopyPerDay: 100,
    aiAnalysisPerWeek: 20,
    description: '성장하는 비즈니스에 적합',
    features: [
      '캠페인 20회/주',
      'AI 카피 100회/일',
      'AI 분석 20회/주',
      '고급 대시보드',
      '우선 이메일 지원',
      '주간 리포트',
    ],
  },
  [SubscriptionPlan.PRO]: {
    label: '프로',
    price: 149000,
    campaignsPerWeek: -1,
    aiCopyPerDay: -1,
    aiAnalysisPerWeek: -1,
    description: '전문 마케터를 위한 플랜',
    features: [
      '캠페인 무제한',
      'AI 카피 무제한',
      'AI 분석 무제한',
      '고급 분석 대시보드',
      '전용 슬랙 채널 지원',
      '일일 리포트',
      'API 접근',
    ],
  },
  [SubscriptionPlan.ENTERPRISE]: {
    label: '엔터프라이즈',
    price: -1, // custom pricing
    campaignsPerWeek: -1,
    aiCopyPerDay: -1,
    aiAnalysisPerWeek: -1,
    description: '대규모 팀을 위한 맞춤 솔루션',
    features: [
      '캠페인 무제한',
      'AI 카피 무제한',
      'AI 분석 무제한',
      '전용 계정 관리자',
      'SLA 보장',
      '맞춤 통합',
      '온보딩 교육',
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
