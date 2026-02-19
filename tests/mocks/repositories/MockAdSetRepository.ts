import { AdSet } from '@domain/entities/AdSet'
import { IAdSetRepository } from '@domain/repositories/IAdSetRepository'

export class MockAdSetRepository implements IAdSetRepository {
  private adSets: Map<string, AdSet> = new Map()

  async save(adSet: AdSet): Promise<AdSet> {
    this.adSets.set(adSet.id, adSet)
    return adSet
  }

  async findById(id: string): Promise<AdSet | null> {
    return this.adSets.get(id) || null
  }

  async findByCampaignId(campaignId: string): Promise<AdSet[]> {
    return Array.from(this.adSets.values()).filter(
      (a) => a.campaignId === campaignId
    )
  }

  async update(adSet: AdSet): Promise<AdSet> {
    this.adSets.set(adSet.id, adSet)
    return adSet
  }

  async delete(id: string): Promise<void> {
    this.adSets.delete(id)
  }

  // 테스트 헬퍼
  clear(): void {
    this.adSets.clear()
  }

  getAll(): AdSet[] {
    return Array.from(this.adSets.values())
  }
}
