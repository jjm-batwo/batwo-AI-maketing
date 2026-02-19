import { AdSet } from '@domain/entities/AdSet'

export interface AdSetDTO {
  id: string
  campaignId: string
  name: string
  status: string
  dailyBudget?: number
  lifetimeBudget?: number
  currency: string
  billingEvent: string
  optimizationGoal: string
  bidStrategy: string
  targeting?: Record<string, unknown>
  placements?: Record<string, unknown>
  schedule?: Record<string, unknown>
  startDate: string
  endDate?: string
  metaAdSetId?: string
  createdAt: string
  updatedAt: string
}

export function toAdSetDTO(adSet: AdSet): AdSetDTO {
  return {
    id: adSet.id,
    campaignId: adSet.campaignId,
    name: adSet.name,
    status: adSet.status,
    dailyBudget: adSet.dailyBudget?.amount,
    lifetimeBudget: adSet.lifetimeBudget?.amount,
    currency: adSet.currency,
    billingEvent: adSet.billingEvent,
    optimizationGoal: adSet.optimizationGoal,
    bidStrategy: adSet.bidStrategy,
    targeting: adSet.targeting,
    placements: adSet.placements,
    schedule: adSet.schedule,
    startDate: adSet.startDate.toISOString(),
    endDate: adSet.endDate?.toISOString(),
    metaAdSetId: adSet.metaAdSetId,
    createdAt: adSet.createdAt.toISOString(),
    updatedAt: adSet.updatedAt.toISOString(),
  }
}
