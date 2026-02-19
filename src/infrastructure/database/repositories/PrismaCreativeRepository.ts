import { PrismaClient } from '@/generated/prisma'
import { ICreativeRepository } from '@domain/repositories/ICreativeRepository'
import { Creative } from '@domain/entities/Creative'
import { CreativeMapper } from '../mappers/CreativeMapper'

export class PrismaCreativeRepository implements ICreativeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(creative: Creative): Promise<Creative> {
    const data = CreativeMapper.toCreateInput(creative)
    const created = await this.prisma.creative.create({ data })
    return CreativeMapper.toDomain(created)
  }

  async findById(id: string): Promise<Creative | null> {
    const creative = await this.prisma.creative.findUnique({ where: { id } })
    if (!creative) return null
    return CreativeMapper.toDomain(creative)
  }

  async findByUserId(userId: string): Promise<Creative[]> {
    const creatives = await this.prisma.creative.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return creatives.map(CreativeMapper.toDomain)
  }

  async update(creative: Creative): Promise<Creative> {
    const data = CreativeMapper.toUpdateInput(creative)
    const updated = await this.prisma.creative.update({
      where: { id: creative.id },
      data,
    })
    return CreativeMapper.toDomain(updated)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.creative.delete({ where: { id } })
  }
}
