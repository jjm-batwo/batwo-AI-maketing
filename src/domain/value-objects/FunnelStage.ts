export const FUNNEL_STAGES = [
  'PageView',
  'ViewContent',
  'AddToCart',
  'InitiateCheckout',
  'Purchase',
] as const;

export type FunnelStageName = typeof FUNNEL_STAGES[number];

export interface FunnelStageData {
  stage: FunnelStageName;
  count: number;
  value: number;          // 금액 합계
  conversionRate: number; // 이전 단계 대비 전환율 (첫 단계는 100%)
  dropOffRate: number;    // 이탈률 (100 - conversionRate)
}

export interface FunnelData {
  pixelId: string;
  period: string;
  stages: FunnelStageData[];
  overallConversionRate: number; // PageView → Purchase
  totalValue: number;
}
