import { IAdRepository } from '@domain/repositories/IAdRepository'
import { AdDTO, toAdDTO } from '@application/dto/ad/AdDTO'

export class ListAdsUseCase {
  constructor(private readonly adRepository: IAdRepository) {}

  async execute(adSetId: string): Promise<AdDTO[]> {
    const ads = await this.adRepository.findByAdSetId(adSetId)
    return ads.map(toAdDTO)
  }
}
