import { Creative } from '../entities/Creative'

export interface ICreativeRepository {
  save(creative: Creative): Promise<Creative>
  findById(id: string): Promise<Creative | null>
  findByUserId(userId: string): Promise<Creative[]>
  update(creative: Creative): Promise<Creative>
  delete(id: string): Promise<void>
}
