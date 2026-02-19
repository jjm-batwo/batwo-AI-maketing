import { IAdSetRepository } from '@domain/repositories/IAdSetRepository'
import { AdSetDTO, toAdSetDTO } from '@application/dto/adset/AdSetDTO'

export class ListAdSetsUseCase {
  constructor(
    private readonly adSetRepository: IAdSetRepository
  ) {}

  async execute(campaignId: string): Promise<AdSetDTO[]> {
    const adSets = await this.adSetRepository.findByCampaignId(campaignId)
    return adSets.map(toAdSetDTO)
  }
}
