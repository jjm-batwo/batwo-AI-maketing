import type { ICompetitorTrackingRepository } from '@domain/repositories/ICompetitorTrackingRepository'
import { toCompetitorTrackingDTO, type CompetitorTrackingResponseDTO } from '@application/dto/competitor/CompetitorTrackingDTO'

export class GetTrackedCompetitorsUseCase {
  constructor(private readonly repository: ICompetitorTrackingRepository) {}

  async execute(params: { userId: string }): Promise<CompetitorTrackingResponseDTO[]> {
    const trackings = await this.repository.findByUserId(params.userId)
    return trackings.map(toCompetitorTrackingDTO)
  }
}
