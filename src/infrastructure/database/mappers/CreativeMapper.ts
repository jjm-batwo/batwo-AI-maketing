import {
  Creative as PrismaCreative,
  CreativeFormat as PrismaCreativeFormat,
  CTAType as PrismaCTAType,
  Prisma,
} from '@/generated/prisma'
import { Creative, CreativeAssetData } from '@domain/entities/Creative'
import { CreativeFormat } from '@domain/value-objects/CreativeFormat'
import { CTAType } from '@domain/value-objects/CTAType'

type JsonValue = Prisma.JsonValue

export class CreativeMapper {
  static toDomain(prisma: PrismaCreative): Creative {
    return Creative.restore({
      id: prisma.id,
      userId: prisma.userId,
      name: prisma.name,
      format: prisma.format as CreativeFormat,
      primaryText: prisma.primaryText ?? undefined,
      headline: prisma.headline ?? undefined,
      description: prisma.description ?? undefined,
      callToAction: prisma.callToAction as CTAType,
      linkUrl: prisma.linkUrl ?? undefined,
      assets: (prisma.assets as unknown as CreativeAssetData[]) ?? [],
      metaCreativeId: prisma.metaCreativeId ?? undefined,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    })
  }

  static toCreateInput(domain: Creative) {
    const json = domain.toJSON()
    return {
      id: json.id,
      name: json.name,
      format: json.format as PrismaCreativeFormat,
      primaryText: json.primaryText ?? null,
      headline: json.headline ?? null,
      description: json.description ?? null,
      callToAction: json.callToAction as PrismaCTAType,
      linkUrl: json.linkUrl ?? null,
      assets: (json.assets as unknown as JsonValue) ?? Prisma.JsonNull,
      metaCreativeId: json.metaCreativeId ?? null,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
      user: { connect: { id: json.userId } },
    }
  }

  static toUpdateInput(domain: Creative) {
    const json = domain.toJSON()
    return {
      name: json.name,
      format: json.format as PrismaCreativeFormat,
      primaryText: json.primaryText ?? null,
      headline: json.headline ?? null,
      description: json.description ?? null,
      callToAction: json.callToAction as PrismaCTAType,
      linkUrl: json.linkUrl ?? null,
      assets: (json.assets as unknown as JsonValue) ?? Prisma.JsonNull,
      metaCreativeId: json.metaCreativeId ?? null,
      updatedAt: new Date(),
    }
  }
}
