import { PrismaClient } from '@/generated/prisma'
import { IAdRepository } from '@domain/repositories/IAdRepository'
import { Ad } from '@domain/entities/Ad'
import { AdMapper } from '../mappers/AdMapper'

export class PrismaAdRepository implements IAdRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(ad: Ad): Promise<Ad> {
    const data = AdMapper.toCreateInput(ad)

    const created = await this.prisma.ad.create({ data })
    return AdMapper.toDomain(created)
  }

  async findById(id: string): Promise<Ad | null> {
    const ad = await this.prisma.ad.findUnique({ where: { id } })
    if (!ad) return null
    return AdMapper.toDomain(ad)
  }

  async findByAdSetId(adSetId: string): Promise<Ad[]> {
    const ads = await this.prisma.ad.findMany({
      where: { adSetId },
      orderBy: { createdAt: 'desc' },
    })
    return ads.map(AdMapper.toDomain)
  }

  async update(ad: Ad): Promise<Ad> {
    const data = AdMapper.toUpdateInput(ad)
    const updated = await this.prisma.ad.update({
      where: { id: ad.id },
      data,
    })
    return AdMapper.toDomain(updated)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.ad.delete({ where: { id } })
  }
}
