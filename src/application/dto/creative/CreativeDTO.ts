import { CreativeFormat } from '@domain/value-objects/CreativeFormat'
import { CTAType } from '@domain/value-objects/CTAType'
import { Creative, CreativeAssetData } from '@domain/entities/Creative'

export interface CreativeDTO {
  id: string
  userId: string
  name: string
  format: CreativeFormat
  primaryText?: string
  headline?: string
  description?: string
  callToAction: CTAType
  linkUrl?: string
  assets: CreativeAssetData[]
  metaCreativeId?: string
  createdAt: string
  updatedAt: string
}

export function toCreativeDTO(creative: Creative): CreativeDTO {
  return {
    id: creative.id,
    userId: creative.userId,
    name: creative.name,
    format: creative.format,
    primaryText: creative.primaryText,
    headline: creative.headline,
    description: creative.description,
    callToAction: creative.callToAction,
    linkUrl: creative.linkUrl,
    assets: creative.assets,
    metaCreativeId: creative.metaCreativeId,
    createdAt: creative.createdAt.toISOString(),
    updatedAt: creative.updatedAt.toISOString(),
  }
}
