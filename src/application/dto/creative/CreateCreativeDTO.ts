import { CreativeFormat } from '@domain/value-objects/CreativeFormat'
import { CTAType } from '@domain/value-objects/CTAType'
import { CreativeAssetData } from '@domain/entities/Creative'

export interface CreateCreativeDTO {
  userId: string
  name: string
  format: CreativeFormat
  primaryText?: string
  headline?: string
  description?: string
  callToAction?: CTAType
  linkUrl?: string
  assets?: CreativeAssetData[]
}
