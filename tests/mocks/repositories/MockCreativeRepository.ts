import { Creative } from '@domain/entities/Creative'
import { ICreativeRepository } from '@domain/repositories/ICreativeRepository'

export class MockCreativeRepository implements ICreativeRepository {
  private creatives: Map<string, Creative> = new Map()

  async save(creative: Creative): Promise<Creative> {
    this.creatives.set(creative.id, creative)
    return creative
  }

  async findById(id: string): Promise<Creative | null> {
    return this.creatives.get(id) || null
  }

  async findByUserId(userId: string): Promise<Creative[]> {
    return Array.from(this.creatives.values()).filter(
      (c) => c.userId === userId
    )
  }

  async update(creative: Creative): Promise<Creative> {
    this.creatives.set(creative.id, creative)
    return creative
  }

  async delete(id: string): Promise<void> {
    this.creatives.delete(id)
  }

  // 테스트 헬퍼
  clear(): void {
    this.creatives.clear()
  }

  getAll(): Creative[] {
    return Array.from(this.creatives.values())
  }
}
