import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GetTrackedCompetitorsUseCase } from '@application/use-cases/competitor/GetTrackedCompetitorsUseCase'
import type { ICompetitorTrackingRepository } from '@domain/repositories/ICompetitorTrackingRepository'
import { CompetitorTracking } from '@domain/entities/CompetitorTracking'

describe('GetTrackedCompetitorsUseCase', () => {
  let useCase: GetTrackedCompetitorsUseCase
  let mockRepo: ICompetitorTrackingRepository

  beforeEach(() => {
    mockRepo = {
      save: vi.fn(),
      findByUserId: vi.fn(),
      findByUserIdAndPageId: vi.fn(),
      delete: vi.fn(),
      deleteByUserIdAndPageId: vi.fn(),
    }
    useCase = new GetTrackedCompetitorsUseCase(mockRepo)
  })

  it('should_return_tracked_competitors_for_user', async () => {
    const trackings = [
      CompetitorTracking.fromPersistence({
        id: 'ct-1',
        userId: 'user-1',
        pageId: '123',
        pageName: 'Brand A',
        industry: 'fashion',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      CompetitorTracking.fromPersistence({
        id: 'ct-2',
        userId: 'user-1',
        pageId: '456',
        pageName: 'Brand B',
        industry: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ]
    vi.mocked(mockRepo.findByUserId).mockResolvedValue(trackings)

    const result = await useCase.execute({ userId: 'user-1' })

    expect(mockRepo.findByUserId).toHaveBeenCalledWith('user-1')
    expect(result).toHaveLength(2)
    expect(result[0].pageId).toBe('123')
    expect(result[1].pageId).toBe('456')
  })

  it('should_return_empty_list_when_no_trackings', async () => {
    vi.mocked(mockRepo.findByUserId).mockResolvedValue([])

    const result = await useCase.execute({ userId: 'user-1' })

    expect(result).toHaveLength(0)
  })
})
