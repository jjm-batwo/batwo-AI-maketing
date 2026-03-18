export const FUNNEL_STAGES = [
  'PageView',
  'ViewContent',
  'AddToCart',
  'InitiateCheckout',
  'Purchase',
] as const

export type FunnelStageName = (typeof FUNNEL_STAGES)[number]

export interface FunnelStageData {
  stage: FunnelStageName
  count: number
  value: number // 금액 합계
  conversionRate: number // 이전 단계 대비 전환율 (첫 단계는 100%)
  dropOffRate: number // 이탈률 (100 - conversionRate)
}

export interface FunnelData {
  pixelId: string
  period: string
  stages: FunnelStageData[]
  overallConversionRate: number // PageView → Purchase
  totalValue: number
}

// --- Campaign Objective-based Funnel Stage (ToFu/MoFu/BoFu) ---

import { CampaignObjective } from './CampaignObjective'

export type FunnelStage = 'tofu' | 'mofu' | 'bofu'

export const FUNNEL_STAGE_LABELS: Record<FunnelStage | 'auto', string> = {
  tofu: '인지 (ToFu)',
  mofu: '고려 (MoFu)',
  bofu: '전환 (BoFu)',
  auto: '자동 배치 (Advantage+)',
}

export const OBJECTIVE_TO_FUNNEL: Record<CampaignObjective, FunnelStage> = {
  [CampaignObjective.AWARENESS]:     'tofu',
  [CampaignObjective.TRAFFIC]:       'mofu',
  [CampaignObjective.ENGAGEMENT]:    'mofu',
  [CampaignObjective.LEADS]:         'mofu',
  [CampaignObjective.APP_PROMOTION]: 'mofu',
  [CampaignObjective.SALES]:         'bofu',
  [CampaignObjective.CONVERSIONS]:   'bofu',
}
