import { MetaPixel } from '@domain/entities/MetaPixel'
import {
  IMetaPixelRepository,
  MetaPixelFilters,
  PaginationOptions,
  PaginatedResult,
} from '@domain/repositories/IMetaPixelRepository'

export class MockMetaPixelRepository implements IMetaPixelRepository {
  private pixels: Map<string, MetaPixel> = new Map()

  async save(pixel: MetaPixel): Promise<MetaPixel> {
    this.pixels.set(pixel.id, pixel)
    return pixel
  }

  async findById(id: string): Promise<MetaPixel | null> {
    return this.pixels.get(id) || null
  }

  async findByMetaPixelId(metaPixelId: string): Promise<MetaPixel | null> {
    return (
      Array.from(this.pixels.values()).find((p) => p.metaPixelId === metaPixelId) || null
    )
  }

  async findByUserId(userId: string): Promise<MetaPixel[]> {
    return Array.from(this.pixels.values()).filter((p) => p.userId === userId)
  }

  async findByFilters(
    filters: MetaPixelFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<MetaPixel>> {
    let results = Array.from(this.pixels.values())

    if (filters.userId) {
      results = results.filter((p) => p.userId === filters.userId)
    }

    if (filters.isActive !== undefined) {
      results = results.filter((p) => p.isActive === filters.isActive)
    }

    if (filters.setupMethod) {
      results = results.filter((p) => p.setupMethod === filters.setupMethod)
    }

    const page = pagination?.page || 1
    const limit = pagination?.limit || 10
    const total = results.length
    const totalPages = Math.ceil(total / limit)
    const start = (page - 1) * limit
    const data = results.slice(start, start + limit)

    return { data, total, page, limit, totalPages }
  }

  async update(pixel: MetaPixel): Promise<MetaPixel> {
    this.pixels.set(pixel.id, pixel)
    return pixel
  }

  async delete(id: string): Promise<void> {
    this.pixels.delete(id)
  }

  async existsByMetaPixelIdAndUserId(metaPixelId: string, userId: string): Promise<boolean> {
    return Array.from(this.pixels.values()).some(
      (p) => p.metaPixelId === metaPixelId && p.userId === userId
    )
  }

  // Test helpers
  clear(): void {
    this.pixels.clear()
  }

  getAll(): MetaPixel[] {
    return Array.from(this.pixels.values())
  }
}
