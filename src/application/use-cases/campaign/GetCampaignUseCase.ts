import { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import { CampaignDTO, toCampaignDTO } from '@application/dto/campaign/CampaignDTO'

export interface GetCampaignInput {
  campaignId: string
  userId: string
}

export class GetCampaignUseCase {
  constructor(private readonly campaignRepository: ICampaignRepository) {}

  async execute(input: GetCampaignInput): Promise<CampaignDTO | null> {
    const campaign = await this.campaignRepository.findById(input.campaignId)

    if (!campaign) {
      return null
    }

    // Check ownership
    if (campaign.userId !== input.userId) {
      return null
    }

    return toCampaignDTO(campaign)
  }
}
