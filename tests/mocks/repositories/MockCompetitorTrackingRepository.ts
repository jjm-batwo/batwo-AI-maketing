import { CompetitorTracking } from '@domain/entities/CompetitorTracking'
import type { ICompetitorTrackingRepository } from '@domain/repositories/ICompetitorTrackingRepository'

export class MockCompetitorTrackingRepository implements ICompetitorTrackingRepository {
  private trackings: Map<string, CompetitorTracking> = new Map()
  private idCounter = 0

  async save(tracking: CompetitorTracking): Promise<CompetitorTracking> {
    const id = tracking.id || `mock-tracking-${++this.idCounter}`
    const saved = CompetitorTracking.fromPersistence({
      ...tracking.toJSON(),
      id,
    })
    this.trackings.set(id, saved)
    return saved
  }

  async findByUserId(userId: string): Promise<CompetitorTracking[]> {
    return Array.from(this.trackings.values()).filter(
      (t) => t.userId === userId
    )
  }

  async findByUserIdAndPageId(userId: string, pageId: string): Promise<CompetitorTracking | null> {
    return (
      Array.from(this.trackings.values()).find(
        (t) => t.userId === userId && t.pageId === pageId
      ) ?? null
    )
  }

  async delete(id: string): Promise<void> {
    this.trackings.delete(id)
  }

  async deleteByUserIdAndPageId(userId: string, pageId: string): Promise<void> {
    for (const [id, tracking] of this.trackings.entries()) {
      if (tracking.userId === userId && tracking.pageId === pageId) {
        this.trackings.delete(id)
      }
    }
  }
}
