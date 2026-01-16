import { MetaPixel } from '../entities/MetaPixel'
import { PixelSetupMethod } from '../entities/MetaPixel'

export interface MetaPixelFilters {
  userId?: string
  isActive?: boolean
  setupMethod?: PixelSetupMethod
}

export interface PaginationOptions {
  page: number
  limit: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface IMetaPixelRepository {
  save(pixel: MetaPixel): Promise<MetaPixel>
  findById(id: string): Promise<MetaPixel | null>
  findByMetaPixelId(metaPixelId: string): Promise<MetaPixel | null>
  findByUserId(userId: string): Promise<MetaPixel[]>
  findByFilters(
    filters: MetaPixelFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<MetaPixel>>
  update(pixel: MetaPixel): Promise<MetaPixel>
  delete(id: string): Promise<void>
  existsByMetaPixelIdAndUserId(metaPixelId: string, userId: string): Promise<boolean>
}
