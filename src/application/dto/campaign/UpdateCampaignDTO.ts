import { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import { TargetAudience } from '@domain/entities/Campaign'
import { Currency } from '@domain/value-objects/Money'

export interface UpdateCampaignDTO {
  campaignId: string
  userId: string // For authorization check
  name?: string
  objective?: CampaignObjective
  dailyBudget?: number
  currency?: Currency
  startDate?: string
  endDate?: string | null // null to clear end date
  targetAudience?: TargetAudience | null // null to clear target audience
  accessToken?: string
  adAccountId?: string
  syncToMeta?: boolean
}
