import { AdStatus } from '@domain/value-objects/AdStatus'
import { Ad } from '@domain/entities/Ad'

export interface AdDTO {
  id: string
  adSetId: string
  name: string
  status: AdStatus
  creativeId: string
  metaAdId?: string
  createdAt: string
  updatedAt: string
}

export function toAdDTO(ad: Ad): AdDTO {
  return {
    id: ad.id,
    adSetId: ad.adSetId,
    name: ad.name,
    status: ad.status,
    creativeId: ad.creativeId,
    metaAdId: ad.metaAdId,
    createdAt: ad.createdAt.toISOString(),
    updatedAt: ad.updatedAt.toISOString(),
  }
}
