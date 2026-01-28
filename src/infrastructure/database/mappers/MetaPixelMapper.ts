import {
  MetaPixel as PrismaMetaPixel,
  PixelSetupMethod as PrismaPixelSetupMethod,
} from '@/generated/prisma'
import { MetaPixel, PixelSetupMethod } from '@domain/entities/MetaPixel'

export class MetaPixelMapper {
  static toDomain(prisma: PrismaMetaPixel): MetaPixel {
    return MetaPixel.restore({
      id: prisma.id,
      userId: prisma.userId,
      metaPixelId: prisma.metaPixelId,
      name: prisma.name,
      isActive: prisma.isActive,
      setupMethod: prisma.setupMethod as PixelSetupMethod,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    })
  }

  static toCreateInput(domain: MetaPixel) {
    const json = domain.toJSON()
    return {
      id: json.id,
      userId: json.userId,
      metaPixelId: json.metaPixelId,
      name: json.name,
      isActive: json.isActive,
      setupMethod: json.setupMethod as PrismaPixelSetupMethod,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
    }
  }

  static toUpdateInput(domain: MetaPixel) {
    const json = domain.toJSON()
    return {
      name: json.name,
      isActive: json.isActive,
      setupMethod: json.setupMethod as PrismaPixelSetupMethod,
      updatedAt: new Date(),
    }
  }
}
