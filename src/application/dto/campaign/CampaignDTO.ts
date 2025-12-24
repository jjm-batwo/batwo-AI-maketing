import { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'
import { TargetAudience, Campaign } from '@domain/entities/Campaign'
import { Currency } from '@domain/value-objects/Money'

export interface CampaignDTO {
  id: string
  userId: string
  name: string
  objective: CampaignObjective
  status: CampaignStatus
  dailyBudget: number
  currency: Currency
  startDate: string
  endDate?: string
  targetAudience?: TargetAudience
  metaCampaignId?: string
  createdAt: string
  updatedAt: string
}

export interface CampaignListDTO {
  data: CampaignDTO[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function toCampaignDTO(campaign: Campaign): CampaignDTO {
  return {
    id: campaign.id,
    userId: campaign.userId,
    name: campaign.name,
    objective: campaign.objective,
    status: campaign.status,
    dailyBudget: campaign.dailyBudget.amount,
    currency: campaign.dailyBudget.currency,
    startDate: campaign.startDate.toISOString(),
    endDate: campaign.endDate?.toISOString(),
    targetAudience: campaign.targetAudience,
    metaCampaignId: campaign.metaCampaignId,
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
  }
}
