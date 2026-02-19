import type { CompetitorTracking } from '../entities/CompetitorTracking'

export interface ICompetitorTrackingRepository {
  save(tracking: CompetitorTracking): Promise<CompetitorTracking>
  findByUserId(userId: string): Promise<CompetitorTracking[]>
  findByUserIdAndPageId(userId: string, pageId: string): Promise<CompetitorTracking | null>
  delete(id: string): Promise<void>
  deleteByUserIdAndPageId(userId: string, pageId: string): Promise<void>
}
