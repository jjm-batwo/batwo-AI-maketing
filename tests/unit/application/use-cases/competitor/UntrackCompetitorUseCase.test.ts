import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UntrackCompetitorUseCase } from '@application/use-cases/competitor/UntrackCompetitorUseCase'
import type { ICompetitorTrackingRepository } from '@domain/repositories/ICompetitorTrackingRepository'

describe('UntrackCompetitorUseCase', () => {
  let useCase: UntrackCompetitorUseCase
  let mockRepo: ICompetitorTrackingRepository

  beforeEach(() => {
    mockRepo = {
      save: vi.fn(),
      findByUserId: vi.fn(),
      findByUserIdAndPageId: vi.fn(),
      delete: vi.fn(),
      deleteByUserIdAndPageId: vi.fn(),
    }
    useCase = new UntrackCompetitorUseCase(mockRepo)
  })

  it('should_untrack_competitor_by_userId_and_pageId', async () => {
    await useCase.execute({ userId: 'user-1', pageId: '123' })

    expect(mockRepo.deleteByUserIdAndPageId).toHaveBeenCalledWith('user-1', '123')
  })

  it('should_not_throw_when_tracking_does_not_exist', async () => {
    vi.mocked(mockRepo.deleteByUserIdAndPageId).mockRejectedValue(new Error('Record not found'))

    await expect(
      useCase.execute({ userId: 'user-1', pageId: 'nonexistent' })
    ).rejects.toThrow()
  })
})
