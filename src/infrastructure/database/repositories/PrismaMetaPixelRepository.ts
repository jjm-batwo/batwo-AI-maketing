import { PrismaClient, PixelSetupMethod as PrismaPixelSetupMethod } from '@/generated/prisma'
import {
  IMetaPixelRepository,
  MetaPixelFilters,
  PaginationOptions,
  PaginatedResult,
} from '@domain/repositories/IMetaPixelRepository'
import { MetaPixel } from '@domain/entities/MetaPixel'
import { MetaPixelMapper } from '../mappers/MetaPixelMapper'

export class PrismaMetaPixelRepository implements IMetaPixelRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(pixel: MetaPixel): Promise<MetaPixel> {
    const data = MetaPixelMapper.toCreateInput(pixel)

    const created = await this.prisma.metaPixel.create({
      data: {
        id: data.id,
        metaPixelId: data.metaPixelId,
        name: data.name,
        isActive: data.isActive,
        setupMethod: data.setupMethod,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        user: {
          connect: { id: data.userId },
        },
      },
    })

    return MetaPixelMapper.toDomain(created)
  }

  async findById(id: string): Promise<MetaPixel | null> {
    const pixel = await this.prisma.metaPixel.findUnique({
      where: { id },
    })

    if (!pixel) {
      return null
    }

    return MetaPixelMapper.toDomain(pixel)
  }

  async findByMetaPixelId(metaPixelId: string): Promise<MetaPixel | null> {
    const pixel = await this.prisma.metaPixel.findFirst({
      where: { metaPixelId },
    })

    if (!pixel) {
      return null
    }

    return MetaPixelMapper.toDomain(pixel)
  }

  async findByUserId(userId: string): Promise<MetaPixel[]> {
    const pixels = await this.prisma.metaPixel.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return pixels.map(MetaPixelMapper.toDomain)
  }

  async findByFilters(
    filters: MetaPixelFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<MetaPixel>> {
    const where = this.buildWhereClause(filters)

    const page = pagination?.page ?? 1
    const limit = pagination?.limit ?? 20
    const skip = (page - 1) * limit

    const [pixels, total] = await Promise.all([
      this.prisma.metaPixel.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.metaPixel.count({ where }),
    ])

    return {
      data: pixels.map(MetaPixelMapper.toDomain),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async update(pixel: MetaPixel): Promise<MetaPixel> {
    const data = MetaPixelMapper.toUpdateInput(pixel)

    const updated = await this.prisma.metaPixel.update({
      where: { id: pixel.id },
      data,
    })

    return MetaPixelMapper.toDomain(updated)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.metaPixel.delete({
      where: { id },
    })
  }

  async existsByMetaPixelIdAndUserId(metaPixelId: string, userId: string): Promise<boolean> {
    const pixel = await this.prisma.metaPixel.findFirst({
      where: {
        metaPixelId,
        userId,
      },
    })

    return pixel !== null
  }

  private buildWhereClause(filters: MetaPixelFilters) {
    const where: Record<string, unknown> = {}

    if (filters.userId) {
      where.userId = filters.userId
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    if (filters.setupMethod) {
      where.setupMethod = filters.setupMethod as PrismaPixelSetupMethod
    }

    return where
  }
}
