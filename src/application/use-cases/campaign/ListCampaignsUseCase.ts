import { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'
import {
  CampaignDTO,
  CampaignListDTO,
  toCampaignDTO,
} from '@application/dto/campaign/CampaignDTO'

export interface ListCampaignsInput {
  userId: string
  status?: CampaignStatus | CampaignStatus[]
  page?: number
  limit?: number
}

export class ListCampaignsUseCase {
  constructor(private readonly campaignRepository: ICampaignRepository) {}

  async execute(input: ListCampaignsInput): Promise<CampaignListDTO> {
    const page = input.page || 1
    const limit = input.limit || 10

    const result = await this.campaignRepository.findByFilters(
      {
        userId: input.userId,
        status: input.status,
      },
      { page, limit }
    )

    return {
      data: result.data.map(toCampaignDTO),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    }
  }
}
