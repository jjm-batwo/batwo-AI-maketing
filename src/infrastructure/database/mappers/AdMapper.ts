import {
  Ad as PrismaAd,
  AdStatus as PrismaAdStatus,
} from '@/generated/prisma'
import { Ad } from '@domain/entities/Ad'
import { AdStatus } from '@domain/value-objects/AdStatus'

export class AdMapper {
  static toDomain(prisma: PrismaAd): Ad {
    return Ad.restore({
      id: prisma.id,
      adSetId: prisma.adSetId,
      name: prisma.name,
      status: prisma.status as AdStatus,
      creativeId: prisma.creativeId,
      metaAdId: prisma.metaAdId ?? undefined,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    })
  }

  static toCreateInput(domain: Ad) {
    const json = domain.toJSON()
    return {
      id: json.id,
      name: json.name,
      status: json.status as PrismaAdStatus,
      metaAdId: json.metaAdId ?? null,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
      adSet: { connect: { id: json.adSetId } },
      creative: { connect: { id: json.creativeId } },
    }
  }

  static toUpdateInput(domain: Ad) {
    const json = domain.toJSON()
    return {
      name: json.name,
      status: json.status as PrismaAdStatus,
      metaAdId: json.metaAdId ?? null,
      creative: { connect: { id: json.creativeId } },
      updatedAt: new Date(),
    }
  }
}
