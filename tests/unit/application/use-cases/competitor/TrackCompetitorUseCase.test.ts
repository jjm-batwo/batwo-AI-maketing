import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TrackCompetitorUseCase } from '@application/use-cases/competitor/TrackCompetitorUseCase'
import type { ICompetitorTrackingRepository } from '@domain/repositories/ICompetitorTrackingRepository'
import { CompetitorTracking } from '@domain/entities/CompetitorTracking'

describe('TrackCompetitorUseCase', () => {
  let useCase: TrackCompetitorUseCase
  let mockRepo: ICompetitorTrackingRepository

  beforeEach(() => {
    mockRepo = {
      save: vi.fn(),
      findByUserId: vi.fn(),
      findByUserIdAndPageId: vi.fn(),
      delete: vi.fn(),
      deleteByUserIdAndPageId: vi.fn(),
    }
    useCase = new TrackCompetitorUseCase(mockRepo)
  })

  it('should_track_new_competitor_when_not_already_tracked', async () => {
    vi.mocked(mockRepo.findByUserIdAndPageId).mockResolvedValue(null)
    const saved = CompetitorTracking.fromPersistence({
      id: 'ct-1',
      userId: 'user-1',
      pageId: '123',
      pageName: 'Brand A',
      industry: 'fashion',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    vi.mocked(mockRepo.save).mockResolvedValue(saved)

    const result = await useCase.execute({
      userId: 'user-1',
      pageId: '123',
      pageName: 'Brand A',
      industry: 'fashion',
    })

    expect(mockRepo.findByUserIdAndPageId).toHaveBeenCalledWith('user-1', '123')
    expect(mockRepo.save).toHaveBeenCalled()
    expect(result.id).toBe('ct-1')
    expect(result.pageId).toBe('123')
    expect(result.pageName).toBe('Brand A')
  })

  it('should_return_existing_tracking_when_already_tracked', async () => {
    const existing = CompetitorTracking.fromPersistence({
      id: 'ct-existing',
      userId: 'user-1',
      pageId: '123',
      pageName: 'Brand A',
      industry: 'fashion',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    vi.mocked(mockRepo.findByUserIdAndPageId).mockResolvedValue(existing)

    const result = await useCase.execute({
      userId: 'user-1',
      pageId: '123',
      pageName: 'Brand A',
      industry: 'fashion',
    })

    expect(mockRepo.save).not.toHaveBeenCalled()
    expect(result.id).toBe('ct-existing')
  })

  it('should_track_competitor_without_industry', async () => {
    vi.mocked(mockRepo.findByUserIdAndPageId).mockResolvedValue(null)
    const saved = CompetitorTracking.fromPersistence({
      id: 'ct-2',
      userId: 'user-1',
      pageId: '456',
      pageName: 'Brand B',
      industry: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    vi.mocked(mockRepo.save).mockResolvedValue(saved)

    const result = await useCase.execute({
      userId: 'user-1',
      pageId: '456',
      pageName: 'Brand B',
    })

    expect(result.industry).toBeNull()
  })
})
