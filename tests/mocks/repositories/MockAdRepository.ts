import { Ad } from '@domain/entities/Ad'
import { IAdRepository } from '@domain/repositories/IAdRepository'

export class MockAdRepository implements IAdRepository {
  private ads: Map<string, Ad> = new Map()

  async save(ad: Ad): Promise<Ad> {
    this.ads.set(ad.id, ad)
    return ad
  }

  async findById(id: string): Promise<Ad | null> {
    return this.ads.get(id) || null
  }

  async findByAdSetId(adSetId: string): Promise<Ad[]> {
    return Array.from(this.ads.values()).filter(
      (ad) => ad.adSetId === adSetId
    )
  }

  async update(ad: Ad): Promise<Ad> {
    this.ads.set(ad.id, ad)
    return ad
  }

  async delete(id: string): Promise<void> {
    this.ads.delete(id)
  }

  // 테스트 헬퍼
  clear(): void {
    this.ads.clear()
  }

  getAll(): Ad[] {
    return Array.from(this.ads.values())
  }
}
