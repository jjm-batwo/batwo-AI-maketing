import type { ICompetitorTrackingRepository } from '@domain/repositories/ICompetitorTrackingRepository'

export class UntrackCompetitorUseCase {
  constructor(private readonly repository: ICompetitorTrackingRepository) {}

  async execute(params: { userId: string; pageId: string }): Promise<void> {
    await this.repository.deleteByUserIdAndPageId(params.userId, params.pageId)
  }
}
