import { IMetaPixelRepository } from '@domain/repositories/IMetaPixelRepository'
import { MetaPixel, PixelSetupMethod } from '@domain/entities/MetaPixel'
import { MetaPixelDTO, toMetaPixelDTO } from '@application/dto/pixel/MetaPixelDTO'

export interface SelectPixelInput {
  userId: string
  metaPixelId: string
  name: string
  setupMethod?: PixelSetupMethod
}

export class SelectPixelUseCase {
  constructor(private readonly pixelRepository: IMetaPixelRepository) {}

  async execute(input: SelectPixelInput): Promise<MetaPixelDTO> {
    // Validate name
    if (!input.name || input.name.trim() === '') {
      throw new Error('Pixel name is required')
    }

    // Validate Meta Pixel ID format (15-16 digit numeric string)
    if (!this.isValidMetaPixelId(input.metaPixelId)) {
      throw new Error('Invalid Meta Pixel ID format. Must be a 15-16 digit numeric string.')
    }

    // Check for duplicates
    const existingPixel = await this.pixelRepository.existsByMetaPixelIdAndUserId(
      input.metaPixelId,
      input.userId
    )

    if (existingPixel) {
      throw new Error(`Pixel with Meta Pixel ID ${input.metaPixelId} already exists for this user`)
    }

    // Create pixel entity
    const pixel = MetaPixel.create({
      userId: input.userId,
      metaPixelId: input.metaPixelId,
      name: input.name.trim(),
      setupMethod: input.setupMethod,
    })

    // Save to repository
    const savedPixel = await this.pixelRepository.save(pixel)

    // Return DTO
    return toMetaPixelDTO(savedPixel)
  }

  private isValidMetaPixelId(metaPixelId: string): boolean {
    // Meta Pixel ID must be a 15-16 digit numeric string
    const pixelIdRegex = /^\d{15,16}$/
    return pixelIdRegex.test(metaPixelId)
  }
}
