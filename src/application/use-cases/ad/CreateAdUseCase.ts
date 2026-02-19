import { Ad } from '@domain/entities/Ad'
import { IAdRepository } from '@domain/repositories/IAdRepository'
import { IAdSetRepository } from '@domain/repositories/IAdSetRepository'
import { ICreativeRepository } from '@domain/repositories/ICreativeRepository'
import { CreateAdDTO } from '@application/dto/ad/CreateAdDTO'
import { AdDTO, toAdDTO } from '@application/dto/ad/AdDTO'

export class CreateAdUseCase {
  constructor(
    private readonly adRepository: IAdRepository,
    private readonly adSetRepository: IAdSetRepository,
    private readonly creativeRepository: ICreativeRepository
  ) {}

  async execute(dto: CreateAdDTO): Promise<AdDTO> {
    // AdSet 존재 확인
    const adSet = await this.adSetRepository.findById(dto.adSetId)
    if (!adSet) {
      throw new Error(`AdSet not found: ${dto.adSetId}`)
    }

    // Creative 존재 확인
    const creative = await this.creativeRepository.findById(dto.creativeId)
    if (!creative) {
      throw new Error(`Creative not found: ${dto.creativeId}`)
    }

    // Ad 생성
    const ad = Ad.create({
      adSetId: dto.adSetId,
      name: dto.name,
      creativeId: dto.creativeId,
    })

    const savedAd = await this.adRepository.save(ad)
    return toAdDTO(savedAd)
  }
}
