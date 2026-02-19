import type { ICompetitorTrackingRepository } from '@domain/repositories/ICompetitorTrackingRepository'
import type { CreateCompetitorTrackingDTO } from '@application/dto/competitor/CompetitorTrackingDTO'
import { CompetitorTracking } from '@domain/entities/CompetitorTracking'
import { toCompetitorTrackingDTO, type CompetitorTrackingResponseDTO } from '@application/dto/competitor/CompetitorTrackingDTO'

export class TrackCompetitorUseCase {
  constructor(private readonly repository: ICompetitorTrackingRepository) {}

  async execute(dto: CreateCompetitorTrackingDTO): Promise<CompetitorTrackingResponseDTO> {
    // 중복 확인
    const existing = await this.repository.findByUserIdAndPageId(dto.userId, dto.pageId)
    if (existing) {
      return toCompetitorTrackingDTO(existing)
    }

    const tracking = CompetitorTracking.create({
      userId: dto.userId,
      pageId: dto.pageId,
      pageName: dto.pageName,
      industry: dto.industry,
    })

    const saved = await this.repository.save(tracking)
    return toCompetitorTrackingDTO(saved)
  }
}
