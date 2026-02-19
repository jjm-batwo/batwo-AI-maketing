import { Creative } from '@domain/entities/Creative'
import { ICreativeRepository } from '@domain/repositories/ICreativeRepository'
import { CreateCreativeDTO } from '@application/dto/creative/CreateCreativeDTO'
import { CreativeDTO, toCreativeDTO } from '@application/dto/creative/CreativeDTO'

export class CreateCreativeUseCase {
  constructor(
    private readonly creativeRepository: ICreativeRepository
  ) {}

  async execute(dto: CreateCreativeDTO): Promise<CreativeDTO> {
    const creative = Creative.create({
      userId: dto.userId,
      name: dto.name,
      format: dto.format,
      primaryText: dto.primaryText,
      headline: dto.headline,
      description: dto.description,
      callToAction: dto.callToAction,
      linkUrl: dto.linkUrl,
      assets: dto.assets,
    })

    const saved = await this.creativeRepository.save(creative)
    return toCreativeDTO(saved)
  }
}
