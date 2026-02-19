import { AdSet } from '../entities/AdSet'

export interface IAdSetRepository {
  save(adSet: AdSet): Promise<AdSet>
  findById(id: string): Promise<AdSet | null>
  findByCampaignId(campaignId: string): Promise<AdSet[]>
  update(adSet: AdSet): Promise<AdSet>
  delete(id: string): Promise<void>
}
