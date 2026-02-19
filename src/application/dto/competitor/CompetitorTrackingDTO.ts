import type { CompetitorTracking } from '@domain/entities/CompetitorTracking'

export interface CreateCompetitorTrackingDTO {
  userId: string
  pageId: string
  pageName: string
  industry?: string
}

export interface CompetitorTrackingResponseDTO {
  id: string
  pageId: string
  pageName: string
  industry: string | null
  createdAt: string
}

export function toCompetitorTrackingDTO(tracking: CompetitorTracking): CompetitorTrackingResponseDTO {
  return {
    id: tracking.id,
    pageId: tracking.pageId,
    pageName: tracking.pageName,
    industry: tracking.industry,
    createdAt: tracking.createdAt.toISOString(),
  }
}
