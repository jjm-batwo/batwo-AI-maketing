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
