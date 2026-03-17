import { IAdRepository } from '@domain/repositories/IAdRepository'
import { AdDTO, toAdDTO } from '@application/dto/ad/AdDTO'
import { AdStatus } from '@domain/value-objects/AdStatus'

export class AdNotFoundError extends Error {
  constructor(id: string) {
    super(`Ad with id "${id}" not found`)
    this.name = 'AdNotFoundError'
  }
}

export interface UpdateAdDTO {
  id: string
  name?: string
  status?: string
  creativeId?: string
}

export class UpdateAdUseCase {
  constructor(private readonly adRepository: IAdRepository) {}

  async execute(dto: UpdateAdDTO): Promise<AdDTO> {
    const ad = await this.adRepository.findById(dto.id)
    if (!ad) {
      throw new AdNotFoundError(dto.id)
    }

    let updated = ad

    if (dto.status) {
      updated = updated.changeStatus(dto.status as AdStatus)
    }

    if (dto.creativeId) {
      updated = updated.changeCreative(dto.creativeId)
    }

    const saved = await this.adRepository.update(updated)
    return toAdDTO(saved)
  }
}
