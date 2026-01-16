import { MetaPixel, PixelSetupMethod } from '@domain/entities/MetaPixel'

export interface MetaPixelDTO {
  id: string
  userId: string
  metaPixelId: string
  name: string
  isActive: boolean
  setupMethod: PixelSetupMethod
  createdAt: string
  updatedAt: string
}

export interface MetaPixelListDTO {
  data: MetaPixelDTO[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function toMetaPixelDTO(pixel: MetaPixel): MetaPixelDTO {
  return {
    id: pixel.id,
    userId: pixel.userId,
    metaPixelId: pixel.metaPixelId,
    name: pixel.name,
    isActive: pixel.isActive,
    setupMethod: pixel.setupMethod,
    createdAt: pixel.createdAt.toISOString(),
    updatedAt: pixel.updatedAt.toISOString(),
  }
}
