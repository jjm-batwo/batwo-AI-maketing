import { IMetaPixelRepository } from '@domain/repositories/IMetaPixelRepository'
import { PixelSetupMethod } from '@domain/entities/MetaPixel'
import {
  MetaPixelListDTO,
  toMetaPixelDTO,
} from '@application/dto/pixel/MetaPixelDTO'

export interface ListUserPixelsInput {
  userId: string
  isActive?: boolean
  setupMethod?: PixelSetupMethod
  page?: number
  limit?: number
}

export class ListUserPixelsUseCase {
  constructor(private readonly pixelRepository: IMetaPixelRepository) {}

  async execute(input: ListUserPixelsInput): Promise<MetaPixelListDTO> {
    const page = input.page || 1
    const limit = input.limit || 10

    const result = await this.pixelRepository.findByFilters(
      {
        userId: input.userId,
        isActive: input.isActive,
        setupMethod: input.setupMethod,
      },
      { page, limit }
    )

    return {
      data: result.data.map(toMetaPixelDTO),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    }
  }
}
