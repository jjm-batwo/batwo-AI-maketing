import { SubscriptionPlan, PLAN_CONFIGS, type PlanConfig } from '@domain/value-objects/SubscriptionPlan'

export interface PricingTier {
  plan: SubscriptionPlan
  config: PlanConfig
}

export const PRICING_TIERS: PricingTier[] = [
  { plan: SubscriptionPlan.FREE, config: PLAN_CONFIGS[SubscriptionPlan.FREE] },
  { plan: SubscriptionPlan.STARTER, config: PLAN_CONFIGS[SubscriptionPlan.STARTER] },
  { plan: SubscriptionPlan.PRO, config: PLAN_CONFIGS[SubscriptionPlan.PRO] },
  { plan: SubscriptionPlan.ENTERPRISE, config: PLAN_CONFIGS[SubscriptionPlan.ENTERPRISE] },
]

export function formatPrice(price: number): string {
  if (price === 0) return '무료'
  if (price === -1) return '문의'
  return `₩${price.toLocaleString('ko-KR')}`
}

export const FEATURE_COMPARISON: { text: string; plans: Record<SubscriptionPlan, boolean> }[] = [
  { text: '캠페인 관리', plans: { FREE: true, STARTER: true, PRO: true, ENTERPRISE: true } },
  { text: 'AI 카피 생성 (기본)', plans: { FREE: true, STARTER: true, PRO: true, ENTERPRISE: true } },
  { text: 'KPI 대시보드', plans: { FREE: true, STARTER: true, PRO: true, ENTERPRISE: true } },
  { text: '주간 보고서', plans: { FREE: true, STARTER: true, PRO: true, ENTERPRISE: true } },
  { text: '프리미엄 AI 카피', plans: { FREE: false, STARTER: true, PRO: true, ENTERPRISE: true } },
  { text: '사이언스 분석', plans: { FREE: false, STARTER: true, PRO: true, ENTERPRISE: true } },
  { text: '경쟁사 분석', plans: { FREE: false, STARTER: true, PRO: true, ENTERPRISE: true } },
  { text: 'A/B 테스트', plans: { FREE: false, STARTER: false, PRO: true, ENTERPRISE: true } },
  { text: '이상 탐지 알림', plans: { FREE: false, STARTER: false, PRO: true, ENTERPRISE: true } },
  { text: 'API 액세스', plans: { FREE: false, STARTER: false, PRO: true, ENTERPRISE: true } },
  { text: 'Slack 연동', plans: { FREE: false, STARTER: false, PRO: true, ENTERPRISE: true } },
  { text: '전담 계정 관리자', plans: { FREE: false, STARTER: false, PRO: false, ENTERPRISE: true } },
  { text: 'SLA 보장', plans: { FREE: false, STARTER: false, PRO: false, ENTERPRISE: true } },
  { text: '화이트라벨', plans: { FREE: false, STARTER: false, PRO: false, ENTERPRISE: true } },
]
