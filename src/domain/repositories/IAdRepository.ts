import { Ad } from '../entities/Ad'

export interface IAdRepository {
  save(ad: Ad): Promise<Ad>
  findById(id: string): Promise<Ad | null>
  findByAdSetId(adSetId: string): Promise<Ad[]>
  update(ad: Ad): Promise<Ad>
  delete(id: string): Promise<void>
}
