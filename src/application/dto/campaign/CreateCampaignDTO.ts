import { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import { TargetAudience } from '@domain/entities/Campaign'
import { Currency } from '@domain/value-objects/Money'

export interface CreateCampaignDTO {
  userId: string
  name: string
  objective: CampaignObjective
  dailyBudget: number
  currency: Currency
  startDate: string
  endDate?: string
  targetAudience?: TargetAudience
  accessToken?: string
  adAccountId?: string
  syncToMeta?: boolean
  advantageConfig?: {
    advantageBudget: boolean
    advantageAudience: boolean
    advantagePlacement: boolean
  }
}
